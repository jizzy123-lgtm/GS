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
            'requesting_personnel' => 'required|exists:users,id',
            'position_id' => 'required|exists:positions,id',
            'requesting_office' => 'required|exists:offices,id',
            'contact_number' => 'required|string',
            'maintenance_type_id' => 'required|exists:maintenance_types,id',
        ]);


        $maintenanceRequest = MaintenanceRequest::create([
            'date_requested' => $request->date_requested,
            'details' => $request->details,
            'requesting_personnel' => $request->requesting_personnel,
            'position_id' => $request->position_id,
            'requesting_office' => $request->requesting_office, // corrected key
            'contact_number' => $request->contact_number,
            'maintenance_type_id' => $request->maintenance_type_id,
            'status_id' => 1, // Assuming 1 = Pending
        ]);

        // Create a new maintenance request
        //$maintenanceRequest = MaintenanceRequest::create($request->all());

        // Notify all heads and staff (role_id 2 = head, role_id 3 = staff)
        $usersToNotify = User::whereIn('role_id', [2, 3])->get();

        // Use Notification facade to send notifications in bulk
        Notification::send($usersToNotify, new MaintenanceRequestCreated(Auth::user()->full_name));

    //     $recipients = User::whereIn('role_id', [2, 3])->get();

    // foreach ($recipients as $recipient) {
    //     Notification::create([
    //         'user_id' => $recipient->id,
    //         'type' => 'maintenance_request',
    //         'message' => Auth::user()->full_name . ' submitted a maintenance request!',
    //     ]);
    // }

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
            'priority_number' => 'nullable|string',
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

        $requester = User::where('id', $maintenanceRequest->requesting_personnel)->first();
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
            $maintenanceRequest->status = 2; // Auto-update status

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

    public function approveByHead(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role_id !== 2) {
            return response()->json(['message' => 'Only Heads can perform this approval.'], 403);
        }

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        if (!is_null($maintenanceRequest->approved_by_1)) {
            return response()->json(['message' => 'Already approved by a Head.'], 400);
        }

        $maintenanceRequest->approved_by_1 = $user->id;
        $maintenanceRequest->save();

        return response()->json([
            'message' => 'Approved by Head successfully.',
            'maintenance_request' => $maintenanceRequest
        ]);
    }



    public function approveByDirector(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role_id !== 5) {
            return response()->json(['message' => 'Only the Campus Director can perform this approval.'], 403);
        }

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        if (is_null($maintenanceRequest->approved_by_1)) {
            return response()->json(['message' => 'This request must first be approved by a Head.'], 400);
        }

        if (!is_null($maintenanceRequest->approved_by_2)) {
            return response()->json(['message' => 'Already approved by the Campus Director.'], 400);
        }

        $maintenanceRequest->approved_by_2 = $user->id;
        $maintenanceRequest->status = 2; // Approved status ID
        $maintenanceRequest->save();

        // Notify requester
        $requester = User::find($maintenanceRequest->requesting_personnel);
        if ($requester && $requester->email) {
            $requester->notify(new MaintenanceRequestApproved($maintenanceRequest));
        }

        return response()->json([
            'message' => 'Approved by Campus Director successfully. Request is now fully approved.',
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
                'position_id',
                'requesting_office',
                'contact_number',
                'status_id',
                'maintenance_type_id'
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





    //staff denies the maintenance request
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
            'status_id' => 3, //3 means dissaproved
        ]);

        return response()->json([
            'message' => 'Maintenance request has been disapproved.',
            'data' => $maintenanceRequest
        ], 200); // Alternative to Response::HTTP_OK
    }

    //autosaves the date and time in the request
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


    //head dissapproves the request
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
            'status_id' => 3,
        ]);

        return response()->json([
            'message' => 'Maintenance request has been disapproved by ' . Auth::user()->full_name . '.',
        ], 200);
    }

    //for display of data purposes only
    public function headpov($id)
        {
            $request = MaintenanceRequest::select([
                'date_requested',
                'details',
                'requesting_personnel',
                'position_id',
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



    //allows editing of the maintenance request
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





