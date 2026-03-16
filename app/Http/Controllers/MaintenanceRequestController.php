<?php

namespace App\Http\Controllers;
use App\Models\MaintenanceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Notifications\MaintenanceRequestCreated;
use Illuminate\Support\Facades\Mail;
use App\Notifications\MaintenanceVerifiedNotification;
use App\Notifications\MaintenanceRequestApproved;
use Illuminate\Support\Facades\Notification;


class MaintenanceRequestController extends Controller
{
    public function index()
    {
        return response()->json(MaintenanceRequest::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'date_requested' => 'required|date',
            'details' => 'required|string',
            'requesting_personnel' => 'required|string',
            'position' => 'required|string',
            'requesting_office' => 'required|string',
            'contact_number' => 'required|string',
            'maintenance_type_id' => 'required|int',
        ]);

        // Create a new maintenance request
        $maintenanceRequest = MaintenanceRequest::create($request->all());

        // Notify all heads and staff (role_id 2 = head, role_id 3 = staff)
        $usersToNotify = User::whereIn('role_id', [2, 3])->get();

        // Use Notification facade to send notifications in bulk
        Notification::send($usersToNotify, new MaintenanceRequestCreated(Auth::user()->full_name));

        // Return a response with the created maintenance request and a message
        return response()->json([
            'message' => 'Maintenance request created and notifications sent.',
            'data' => $maintenanceRequest
        ], 201);
    }

    public function show($id)
    {
        return response()->json(MaintenanceRequest::findOrFail($id));
    }

    // this function is for the staff's verification
    public function verify(Request $request, $id)
    {
        $request->validate([
            'date_received' => 'required|date',
            'time_received' => 'required|date_format:H:i:s',
            'priority_number' => 'required|integer|min:1',
            'remarks' => 'nullable|string',
            'verified_by' => 'required|exists:users,id', // Staff ID must exist in users table
        ]);

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        // Update only the staff's fields
        $maintenanceRequest->update([
            'date_received' => $request->date_received,
            'time_received' => $request->time_received,
            'priority_number' => $request->priority_number,
            'remarks' => $request->remarks,
            'verified_by' => $request->verified_by,
        ]);

        $requester = User::where('full_name', $maintenanceRequest->requesting_personnel)->first();
        if ($requester && $requester->email) {
            $requester->notify(new MaintenanceVerifiedNotification($maintenanceRequest));
        }

        return response()->json([
            'message' => 'Maintenance request reviewed successfully',
            'data' => $maintenanceRequest,
        ], 200);
    }

    // this function is for the approval of heads
    public function approve(Request $request, $id)
    {
        $user = Auth::user(); // Get the currently logged-in user
        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        //  Ensure only Heads (role_id = 2) can approve
        if ($user->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        //  Step 1: Assign first approver
        if (is_null($maintenanceRequest->approved_by_1)) {
            $maintenanceRequest->approved_by_1 = $user->id;
        }
        // Step 2: Assign second approver and auto-approve
        elseif (is_null($maintenanceRequest->approved_by_2)) {
            // Prevent same user from approving twice
            if ($maintenanceRequest->approved_by_1 == $user->id) {
                return response()->json(['message' => 'You have already approved this request.'], 400);
            }

            $maintenanceRequest->approved_by_2 = $user->id;
            $maintenanceRequest->status = "Approved"; // Auto-update status

            // Notify the requester by email after final approval
            $requester = User::where('full_name', $maintenanceRequest->requesting_personnel)->first();

            if ($requester && $requester->email) {
                $requester->notify(new MaintenanceRequestApproved($maintenanceRequest));
            }
        } else {
            return response()->json(['message' => 'Request is already fully approved'], 400);
        }

        $maintenanceRequest->save();

        return response()->json([
            'message' => 'Request approved successfully',
            'maintenance_request' => $maintenanceRequest
        ]);
    }

    //this function gets the data of an specific maintenance request filled up by the requester
    public function staffpov($id)
        {
            $request = MaintenanceRequest::select([
                'date_requested',
                'details',
                'requesting_personnel',
                'position',
                'requesting_office',
                'contact_number'
            ])
            ->where('id', $id)
            ->first();

        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found'], 404);
        }

        return response()->json($request);
    }


    //this function shows the used priority numbers
    public function getUsedPriorityNumbers()
    {
        $usedPriorityNumbers = MaintenanceRequest::whereNotNull('priority_number')
            ->pluck('priority_number')
            ->unique()
            ->values();

        return response()->json($usedPriorityNumbers);
    }






    public function denyRequest(Request $request, $id)
    {
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404); // Alternative to Response::HTTP_NOT_FOUND
        }

        // Check if the authenticated user is a staff member (role_id = 3)
        if (Auth::user()->role_id !== 3) {
            return response()->json(['message' => 'Unauthorized'], 403); // Alternative to Response::HTTP_FORBIDDEN
        }

        // Validate request input
        $request->validate([
            'date_received' => 'required|date',
            'time_received' => 'required|date_format:H:i:s',
            'remarks' => 'required|string|max:255',
        ]);

        // Update the request status and remarks
        $maintenanceRequest->update([
            'date_received' => $request->date_received,
            'time_received' => $request->time_received,
            'remarks' => $request->remarks,
            'status' => 'Disapproved',
        ]);

        return response()->json([
            'message' => 'Maintenance request has been disapproved.',
            'data' => $maintenanceRequest
        ], 200); // Alternative to Response::HTTP_OK
    }


    public function autosaveDateTime($id)
    {
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        // Check if the authenticated user is a staff member (role_id = 3)
        if (Auth::user()->role_id !== 3) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Only set the timestamp if it's null (first time viewing)
        if (!$maintenanceRequest->date_received && !$maintenanceRequest->time_received) {
            $maintenanceRequest->date_received = now()->toDateString();  // e.g., "2025-04-02"
            $maintenanceRequest->time_received = now()->toTimeString();  // e.g., "15:20:00" (3:20 PM)
            $maintenanceRequest->save();
        }

        return response()->json([
            'message' => 'View timestamp saved successfully (only once).',
            'data' => $maintenanceRequest
        ], 200);
    }


    //function for schedules
    public function getSchedules()
    {
        // Get the authenticated user's role
        $user = Auth::user();

        // Allow only Admin (1), Head (2), and Staff (3)
        if (!in_array($user->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Retrieve schedules with only selected fields
        $schedules = MaintenanceRequest::select('date_requested', 'details', 'requesting_office')->get();

        return response()->json([
            'message' => 'Schedules retrieved successfully.',
            'data' => $schedules
        ], 200);
    }



    public function disapprove(Request $request, $id)
    {
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        // Ensure only heads (role_id = 2) can disapprove
        if (Auth::user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        // Update request status to "Disapproved"
        $maintenanceRequest->update([
            'status' => 'Disapproved',
        ]);

        return response()->json([
            'message' => 'Maintenance request has been disapproved by ' . Auth::user()->full_name . '.',
        ], 200);
    }


    public function headpov($id)
        {
            $request = MaintenanceRequest::select([
                'date_requested',
                'details',
                'requesting_personnel',
                'position',
                'requesting_office',
                'contact_number',
                'date_received',
                'time_received',
                'priority_number',
                'verified_by',
                'approved_by_1',
                'remarks'


            ])
            ->where('id', $id)
            ->first();

        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found'], 404);
        }

        return response()->json($request);
    }


    public function updateDetails(Request $request, $id)
    {
        // Find the maintenance request
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        // Optional: Only allow update if status is still Pending
        if ($maintenanceRequest->status !== 'Pending') {
            return response()->json(['message' => 'Cannot edit a request that is already processed.'], 403);
        }

        // Validate that only 'details' is being updated
        $request->validate([
            'details' => 'required|string|max:255',
        ]);

        // Update the 'details' field
        $maintenanceRequest->details = $request->details;
        $maintenanceRequest->save();

        return response()->json([
            'message' => 'Maintenance request details updated successfully.',
            'data' => $maintenanceRequest,
        ], 200);
    }



}





