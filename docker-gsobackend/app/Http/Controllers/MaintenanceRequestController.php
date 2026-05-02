<?php

namespace App\Http\Controllers;
use App\Services\SmsService;
use App\Models\MaintenanceRequest;
use App\Models\Notification as SystemNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\MaintenanceType;
use App\Notifications\MaintenanceRequestCreated;
use App\Notifications\MaintenanceRequestCreatedNotifyStaff;
use App\Notifications\MaintenanceVerifiedNotification;
use App\Notifications\MaintenanceRequestApproved;
use Illuminate\Support\Facades\Notification;
use App\Notifications\RequestVerifiedByStaff;
use App\Notifications\RequestApprovedByHead;
use App\Notifications\RequestApprovedByCampusDirector;
use App\Notifications\AssignPriorityToRequest;
use App\Notifications\RequestAssignedPriority;
use App\Notifications\RequestApprovedByHeadNotifyStaff;
use App\Notifications\RequestApprovedByDirectorNotifyStaff;
use App\Notifications\RequestFullyApproved;
use App\Notifications\RequestFullyApprovedNotifyStaff;
use App\Notifications\MaintenanceRequestDisapproved;
use App\Notifications\MaintenanceRequestDisapprovedNotifyStaff;
use Carbon\Carbon;
use App\Models\Comment;

class MaintenanceRequestController extends Controller
{
    public function index()
    {
        return response()->json(MaintenanceRequest::all());
    }

    public function store(Request $request)
    {
        if ($request->contact_number) {
            $raw = $request->contact_number;
            $raw = preg_replace('/^\+63/', '', $raw);
            $raw = preg_replace('/^63(?=9)/', '0', $raw);
            $raw = ltrim($raw, '+');
            if (!str_starts_with($raw, '0')) {
                $raw = '0' . $raw;
            }
            $request->merge(['contact_number' => $raw]);
        }

        $request->validate([
            'date_requested'      => ['required', 'string', 'date_format:Y-m-d'],
            'details'             => 'required|string',
            'position_id'         => 'required|exists:positions,id',
            'requesting_office'   => 'required|exists:offices,id',
            'contact_number'      => [
                'required',
                'string',
                'size:11',
                'regex:/^09[0-9]{9}$/',
            ],
            'maintenance_type_id' => 'required|exists:maintenance_types,id',
        ]);

        // ✅ Block if there's ANY active/ongoing request
        $hasActiveRequest = MaintenanceRequest::where('requesting_personnel', Auth::id())
            ->whereNotIn('status_id', [4, 5, 6]) // 4=denied, 5=done, 6=cancelled
            ->exists();

        if ($hasActiveRequest) {
            return response()->json([
                'message' => 'You already have an ongoing maintenance request. You can only submit a new one after your current request is completed and feedback has been submitted.'
            ], 403);
        }

        // ✅ Block if completed (status 5) but feedback not yet submitted
        $pendingFeedback = MaintenanceRequest::where('requesting_personnel', Auth::id())
            ->where('status_id', 5)
            ->whereDoesntHave('feedback')
            ->exists();

        if ($pendingFeedback) {
            return response()->json([
                'message' => 'You cannot submit a new maintenance request until you have submitted feedback for your completed request.'
            ], 403);
        }

        $maintenanceRequest = MaintenanceRequest::create([
            'date_requested'       => $request->date_requested,
            'details'              => $request->details,
            'requesting_personnel' => Auth::id(),
            'position_id'          => $request->position_id,
            'requesting_office'    => $request->requesting_office,
            'contact_number'       => '+63' . substr($request->contact_number, 1),
            'maintenance_type_id'  => $request->maintenance_type_id,
            'status_id'            => 1,
        ]);

        $requester = User::find($maintenanceRequest->requesting_personnel);
        $requesterName = $requester->last_name . ', ' . $requester->first_name;

        // ✅ Email — Requester
        if ($requester && $requester->email) {
            $requester->notify(new MaintenanceRequestCreated());
        }

        // ✅ SMS — Requester
        if ($requester && $requester->contact_number) {
            SmsService::send(
                $requester->contact_number,
                "Your maintenance request has been submitted. Request ID: {$maintenanceRequest->id}"
            );
        }

        // ✅ System Notification — Requester
        SystemNotification::create([
            'user_id'      => $maintenanceRequest->requesting_personnel,
            'type'         => 'maintenance_request_created',
            'message'      => 'Your maintenance request has been successfully submitted. Please wait for it to be reviewed.',
            'is_read'      => false,
            'reference_id' => $maintenanceRequest->id,
        ]);

        // ✅ Email + System Notification — Staff
        $staffUsers = User::where('role_id', 3)->get();
        foreach ($staffUsers as $staff) {
            $staff->notify(new MaintenanceRequestCreatedNotifyStaff($maintenanceRequest, $requesterName));

            SystemNotification::create([
                'user_id'      => $staff->id,
                'type'         => 'maintenance_request_created',
                'message'      => 'A new maintenance request was submitted by ' . $requesterName,
                'is_read'      => false,
                'reference_id' => $maintenanceRequest->id,
            ]);
        }

        return response()->json([
            'message' => 'Maintenance request created and notifications sent.',
            'data'    => $maintenanceRequest
        ], 201);
    }

    public function show($id)
    {
        return response()->json(MaintenanceRequest::findOrFail($id));
    }

    //Function to verify request
    public function verify(Request $request, $id)
    {
        $request->validate([
            'date_received'  => 'required|date',
            'time_received'  => 'required|date_format:H:i:s',
            'priority_number'=> 'nullable|string',
            'remarks'        => 'nullable|string',
            'comment'        => 'nullable|string|max:500'
        ]);

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        $maintenanceRequest->update([
            'date_received'  => $request->date_received,
            'time_received'  => $request->time_received,
            'priority_number'=> $request->priority_number,
            'remarks'        => $request->remarks,
            'verified_by'    => Auth::id(),
            'status_id'      => 3,
        ]);

        if ($request->filled('comment')) {
            Comment::create([
                'comment'    => $request->comment,
                'request_id' => $maintenanceRequest->id,
                'user_id'    => Auth::id(),
                'role_id'    => Auth::user()->role_id,
                'date'       => Carbon::now()->toDateString(),
                'time'       => Carbon::now()->toTimeString(),
            ]);
        }

        $requester = User::where('id', $maintenanceRequest->requesting_personnel)->first();
        //notify requester in emial
        if ($requester && $requester->email) {
            $requester->notify(new MaintenanceVerifiedNotification($maintenanceRequest, $requester));
        }
        //notify in sms
        if ($requester && $requester->contact_number) {
            SmsService::send(
                $requester->contact_number,
                "Your maintenance request has been VERIFIED by staff."
            );
        }
       //system notif by to requester
        SystemNotification::create([
            'user_id'      => $maintenanceRequest->requesting_personnel,
            'type'         => 'maintenance_verified',
            'message'      => 'Your maintenance request has been verified by staff.',
            'is_read'      => false,
            'reference_id' => $maintenanceRequest->id,
        ]);

        SystemNotification::create([
            'user_id'      => Auth::id(),
            'type'         => 'maintenance_request_verified_by_you',
            'message'      => 'You have successfully verified a maintenance request.',
            'is_read'      => false,
            'reference_id' => $maintenanceRequest->id,
        ]);

        $heads = User::where('role_id', 2)->get();
        foreach ($heads as $head) {
            $head->notify(new RequestVerifiedByStaff($maintenanceRequest));

            SystemNotification::create([
                'user_id'      => $head->id,
                'type'         => 'maintenance_request_verified',
                'message'      => 'A maintenance request was verified by the staff.',
                'is_read'      => false,
                'reference_id' => $maintenanceRequest->id,
            ]);
        }

        return response()->json([
            'message' => 'Maintenance request reviewed successfully',
            'data'    => $maintenanceRequest,
        ], 200);
    }

    public function approveByHead(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role_id != 2) {
            return response()->json(['message' => 'Only Heads can perform this approval.'], 403);
        }

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        if (!is_null($maintenanceRequest->approved_by_1)) {
            return response()->json(['message' => 'Already approved by a Head.'], 400);
        }

        $request->validate([
            'comment' => 'nullable|string|max:500'
        ]);

        if ($request->filled('comment')) {
            Comment::create([
                'comment'    => $request->comment,
                'request_id' => $maintenanceRequest->id,
                'user_id'    => Auth::user()->id,
                'role_id'    => Auth::user()->role_id,
                'date'       => Carbon::now()->toDateString(),
                'time'       => Carbon::now()->toTimeString(),
            ]);
        }

        $maintenanceRequest->approved_by_1 = $user->id;
        $maintenanceRequest->status_id = 8;
        $maintenanceRequest->save();
        
        //head system notif
        SystemNotification::create([
            'user_id'      => $user->id,
            'type'         => 'maintenance_request_approval_confirmed',
            'message'      => 'A maintenance request has been approved and recorded under your authorization.',
            'is_read'      => false,
            'reference_id' => $maintenanceRequest->id,
        ]);

        $requester = User::where('id', $maintenanceRequest->requesting_personnel)->first();

        //condition where requester gets notified if approved by head notified in email
        if ($requester && $requester->email) {
            $requester->notify(new RequestApprovedByHead($maintenanceRequest));
        }
        //for sms notif
        if ($requester && $requester->contact_number) {
            SmsService::send(
                $requester->contact_number,
                "Your maintenance request has been APPROVED by the Head of GSO."
            );
        }
        
        //requester system notif
        SystemNotification::create([
            'user_id'      => $maintenanceRequest->requesting_personnel,
            'type'         => 'maintenance_request_approved_by_head',
            'message'      => 'Your maintenance request has been approved by the Head of GSO.',
            'is_read'      => false,
            'reference_id' => $maintenanceRequest->id,
        ]);
        
        //this use to notify staff if the head approved request
        $staffUsers = User::where('role_id', 3)->get();
        foreach ($staffUsers as $staff) {
            $staff->notify(new RequestApprovedByHeadNotifyStaff($maintenanceRequest));

            SystemNotification::create([
                'user_id'      => $staff->id,
                'type'         => 'maintenance_request_approved_by_head',
                'message'      => 'A maintenance request has been approved by the Head of GSO.',
                'is_read'      => false,
                'reference_id' => $maintenanceRequest->id,
            ]);
        }
        //notify also the staff
        $campusDirectors = User::where('role_id', 5)->get();
        foreach ($campusDirectors as $director) {
            $director->notify(new RequestApprovedByHeadNotifyStaff($maintenanceRequest));

            SystemNotification::create([
                'user_id'      => $director->id,
                'type'         => 'maintenance_request_approved_by_head',
                'message'      => 'A maintenance request was approved by the Head of GSO.',
                'is_read'      => false,
                'reference_id' => $maintenanceRequest->id,
            ]);
        }

        return response()->json([
            'message'             => 'Approved by Head successfully.',
            'maintenance_request' => $maintenanceRequest
        ]);
    }

    public function approveByDirector(Request $request, $id)
    {
        $user = Auth::user();

        if ($user->role_id != 5) {
            return response()->json(['message' => 'Only the Campus Director can perform this approval.'], 403);
        }

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        if (is_null($maintenanceRequest->approved_by_1)) {
            return response()->json(['message' => 'This request must first be approved by a Head.'], 400);
        }

        if (!is_null($maintenanceRequest->approved_by_2)) {
            return response()->json(['message' => 'Already approved by the Campus Director.'], 400);
        }

        $request->validate([
            'comment' => 'nullable|string|max:500'
        ]);

        if ($request->filled('comment')) {
            Comment::create([
                'comment'    => $request->comment,
                'request_id' => $maintenanceRequest->id,
                'user_id'    => Auth::user()->id,
                'role_id'    => Auth::user()->role_id,
                'date'       => Carbon::now()->toDateString(),
                'time'       => Carbon::now()->toTimeString(),
            ]);
        }

        $maintenanceRequest->approved_by_2 = $user->id;
        $maintenanceRequest->status_id = 9;
        $maintenanceRequest->save();

        //system notifaction of the campus director when itself approved the request
        SystemNotification::create([
            'user_id'      => $user->id,
            'type'         => 'maintenance_request_approval_confirmed',
            'message'      => 'A maintenance request has been approved and recorded under your authorization.',
            'is_read'      => false,
            'reference_id' => $maintenanceRequest->id,
        ]);

        $requester = User::where('id', $maintenanceRequest->requesting_personnel)->first();
        $requesterName = $requester->last_name . ', ' . $requester->first_name;

        //notiify requester
        if ($requester && $requester->email) {
            $requester->notify(new RequestApprovedByCampusDirector($maintenanceRequest));
        }
        //sms notifacation ,that notify requester
        if ($requester && $requester->contact_number) {
            SmsService::send(
                $requester->contact_number,
                "Your request is FULLY APPROVED by the Campus Director. Please wait for scheduling."
            );
        }
        //requester system notif or in app notif

        SystemNotification::create([
            'user_id'      => $maintenanceRequest->requesting_personnel,
            'type'         => 'maintenance_request_approved_by_campus_director',
            'message'      => 'Your maintenance request has been approved by the Campus Director, please wait for your priority number.',
            'is_read'      => false,
            'reference_id' => $maintenanceRequest->id,
        ]);

        // staff get notify by campus director
        $staffMembers = User::where('role_id', 3)->get();
        foreach ($staffMembers as $staff) {
            $staff->notify(new RequestApprovedByDirectorNotifyStaff($maintenanceRequest, $requesterName));

            SystemNotification::create([
                'user_id'      => $staff->id,
                'type'         => 'maintenance_request_approved_by_campus_director',
                'message'      => 'A maintenance request by ' . $requesterName . ' was approved by the Campus Director, please assign a priority number.',
                'is_read'      => false,
                'reference_id' => $maintenanceRequest->id,
            ]);
        }

        return response()->json([
            'message'             => 'Approved by Campus Director successfully. Request is now fully approved.',
            'maintenance_request' => $maintenanceRequest
        ]);
    }

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
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        if (Auth::user()->role_id !== 3) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'date_received' => 'required|date',
            'time_received' => 'required|date_format:H:i:s',
            'comment'       => 'required|string|max:1000',
        ]);

        $maintenanceRequest->update([
            'date_received'  => $request->date_received,
            'time_received'  => $request->time_received,
            'status_id'      => 4,
            'priority_number'=> null,
        ]);

        Comment::create([
            'comment'    => $request->comment,
            'request_id' => $maintenanceRequest->id,
            'user_id'    => Auth::user()->id,
            'role_id'    => Auth::user()->role_id,
            'date'       => Carbon::now()->toDateString(),
            'time'       => Carbon::now()->toTimeString(),
        ]);

        $requester = User::find($maintenanceRequest->requesting_personnel);
        $deniedByName = Auth::user()->first_name . ' ' . Auth::user()->last_name;

        //the requester gets notified when the staf decline the request
        if ($requester && $requester->email) {
            $requester->notify(new MaintenanceRequestDisapproved($deniedByName, 'Staff'));
        }

        if ($requester && $requester->contact_number) {
            SmsService::send(
                $requester->contact_number,
                "Your maintenance request was DENIED by {$deniedByName}. Please check the system for details."
            );
        }

        SystemNotification::create([
            'user_id'      => $maintenanceRequest->requesting_personnel,
            'type'         => 'maintenance_request_denied',
            'message'      => 'Your maintenance request was denied by ' . $deniedByName . '.',
            'is_read'      => false,
            'reference_id' => $maintenanceRequest->id,
        ]);
        
        //notify the staff itself
        SystemNotification::create([
            'user_id'      => Auth::user()->id,
            'type'         => 'maintenance_request_denial_confirmed',
            'message'      => 'A maintenance request has been denied and recorded under your authorization.',
            'is_read'      => false,
            'reference_id' => $maintenanceRequest->id,
        ]);

        return response()->json([
            'message' => 'Maintenance request has been denied.',
            'data'    => $maintenanceRequest
        ], 200);
    }

    public function autosaveDateTime($id)
    {
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        if (Auth::user()->role_id !== 3) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (!$maintenanceRequest->date_received && !$maintenanceRequest->time_received) {
            $maintenanceRequest->date_received = now()->toDateString();
            $maintenanceRequest->time_received = now()->toTimeString();
            $maintenanceRequest->save();
        }

        return response()->json([
            'message' => 'View timestamp saved successfully (only once).',
            'data'    => $maintenanceRequest
        ], 200);
    }

    public function getSchedules()
    {
        $user = Auth::user();

        if (!in_array($user->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $schedules = MaintenanceRequest::with('office')
            ->whereNotNull('approved_by_2')
            ->get()
            ->map(function ($request) {
                return [
                    'id'                => $request->id,
                    'date_requested'    => $request->date_requested,
                    'details'           => $request->details,
                    'requesting_office' => optional($request->office)->name,
                ];
            });

        return response()->json([
            'message' => 'Schedules retrieved successfully.',
            'data'    => $schedules
        ], 200);
    }

    public function disapprove(Request $request, $id)
    {
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        $authUser = Auth::user();
        if (!in_array($authUser->role_id, [2, 5])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        $maintenanceRequest->update([
            'status_id'       => 4,
            'priority_number' => null,
        ]);

        Comment::create([
            'comment'    => $request->comment,
            'request_id' => $maintenanceRequest->id,
            'user_id'    => $authUser->id,
            'role_id'    => $authUser->role_id,
            'date'       => Carbon::now()->toDateString(),
            'time'       => Carbon::now()->toTimeString(),
        ]);

        SystemNotification::create([
            'user_id'      => $authUser->id,
            'type'         => 'maintenance_request_disapproval_confirmed',
            'message'      => 'A maintenance request has been disapproved and recorded under your authorization.',
            'is_read'      => false,
            'reference_id' => $maintenanceRequest->id,
        ]);

        $requester = User::find($maintenanceRequest->requesting_personnel);
        $disapprovedByName = $authUser->first_name . ' ' . $authUser->last_name;

        //this use to identify who disapprove request, either maintenance request or registration request
        if ($authUser->role_id == 2) {
            $roleLabel = 'Head of GSO';
        } elseif ($authUser->role_id == 5) {
            $roleLabel = 'Campus Director';
        } else {
            $roleLabel = 'Administrator';
        }

        // notify the requester or the user
        if ($requester && $requester->email) {
            $requester->notify(new MaintenanceRequestDisapproved($disapprovedByName, $roleLabel));
        }

        if ($requester && $requester->contact_number) {
            SmsService::send(
                $requester->contact_number,
                "Your maintenance request was disapproved by {$disapprovedByName}. Please check the system for details."
            );
        }

        SystemNotification::create([
            'user_id'      => $maintenanceRequest->requesting_personnel,
            'type'         => 'maintenance_request_disapproved',
            'message'      => 'Your maintenance request was disapproved by ' . $disapprovedByName,
            'is_read'      => false,
            'reference_id' => $maintenanceRequest->id,
        ]);

        //notify the staff
        $staffUsers = User::where('role_id', 3)->get();
        foreach ($staffUsers as $staff) {
            $staff->notify(new MaintenanceRequestDisapprovedNotifyStaff($disapprovedByName, $roleLabel));

            SystemNotification::create([
                'user_id'      => $staff->id,
                'type'         => $authUser->role_id == 2
                                    ? 'maintenance_request_disapproved_by_Head'
                                    : 'maintenance_request_disapproved_by_Campus_director',
                'message'      => 'A maintenance request was disapproved by the ' . $roleLabel . '.',
                'is_read'      => false,
                'reference_id' => $maintenanceRequest->id,
            ]);
        }

        return response()->json([
            'message' => 'Maintenance request has been disapproved.',
        ], 200);
    }

    public function updateDetails(Request $request, $id)
    {
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        if ($maintenanceRequest->requesting_personnel !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($maintenanceRequest->status_id !== 1) {
            return response()->json(['message' => 'Cannot edit a request that is already processed.'], 403);
        }

        $request->validate([
            'details' => 'required|string|max:255',
        ]);

        $maintenanceRequest->details = $request->details;
        $maintenanceRequest->save();

        return response()->json([
            'message' => 'Maintenance request details updated successfully.',
            'data'    => $maintenanceRequest,
        ], 200);
    }

    //no notification is used or did not use notifacation to notify requester
    public function cancelRequest($id)
    {
        $request = MaintenanceRequest::find($id);

        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        if ($request->requesting_personnel !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if ($request->status_id !== 1) {
            return response()->json(['message' => 'Only pending requests can be canceled.'], 400);
        }

        $request->status_id = 6;
        $request->save();

        return response()->json(['message' => 'Maintenance request canceled successfully.']);
    }
    
    //use to git list of request by there status 
    public function indexWithDetails()
    {
        $requests = MaintenanceRequest::with([
            'requester',
            'position',
            'office',
            'status',
            'verifier',
            'approver1',
            'approver2',
            'maintenanceType',
            'comments.user',
            'comments.role'
        ])->paginate(20);

        $data = $requests->getCollection()->map(function ($request) {
            $requester = optional($request->requester);
            $fullName = trim(
                ($requester->last_name ? $requester->last_name . ', ' : '') .
                ($requester->first_name ?? '') . ' ' .
                ($requester->middle_name ?? '') . ' ' .
                ($requester->suffix ?? '')
            );

            return [
                'request_id'           => $request->id,
                'date_requested'       => $request->date_requested,
                'details'              => $request->details,
                'requester_id'         => $request->requesting_personnel,
                'requesting_personnel' => $fullName,
                'position'             => optional($request->position)->name,
                'requesting_office'    => optional($request->office)->name,
                'contact_number'       => $request->contact_number,
                'status'               => optional($request->status)->name,
                'status_id'            => $request->status_id,
                'date_received'        => $request->date_received,
                'time_received'        => $request->time_received,
                'priority_number'      => $request->priority_number,
                'verified_by'          => optional($request->verifier)->last_name,
                'approved_by_1'        => optional($request->approver1)->last_name,
                'approved_by_2'        => optional($request->approver2)->last_name,
                'maintenance_type'     => optional($request->maintenanceType)->type_name,
                'created_at'           => $request->created_at,
                'updated_at'           => $request->updated_at,
                'comments'             => $request->comments->map(function ($comment) {
                    return [
                        'id'      => $comment->id,
                        'comment' => $comment->comment,
                        'user'    => optional($comment->user)->first_name . ' ' . optional($comment->user)->last_name,
                        'role'    => optional($comment->role)->role_name,
                        'date'    => $comment->date,
                        'time'    => $comment->time,
                    ];
                }),
            ];
        });

        return response()->json([
            'data'         => $data,
            'current_page' => $requests->currentPage(),
            'last_page'    => $requests->lastPage(),
            'total'        => $requests->total(),
        ]);
    }

    public function approvedByHeadRequests()
    {
        $requests = MaintenanceRequest::with([
            'requester', 'position', 'office', 'status',
            'verifier', 'approver1', 'maintenanceType',
            'comments.user', 'comments.role'
        ])
        ->where('requesting_personnel', Auth::id())
        ->where('status_id', MaintenanceRequest::STATUS_HEAD_OK)
        ->get();

        return response()->json($this->formatRequests($requests));
    }

    public function approvedByDirectorRequests()
    {
        $requests = MaintenanceRequest::with([
            'requester', 'position', 'office', 'status',
            'verifier', 'approver1', 'approver2', 'maintenanceType',
            'comments.user', 'comments.role'
        ])
        ->where('requesting_personnel', Auth::id())
        ->where('status_id', MaintenanceRequest::STATUS_DIRECTOR_OK)
        ->get();

        return response()->json($this->formatRequests($requests));
    }

    public function forPriorityNumber()
    {
        if (!in_array(Auth::user()->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $requests = MaintenanceRequest::with(['maintenanceType'])
            ->whereNotNull('approved_by_2')
            ->whereNull('priority_number')
            ->get();

        $data = $requests->map(function ($request) {
            return [
                'request_id'       => $request->id,
                'maintenance_type' => optional($request->maintenanceType)->type_name,
                'date_received'    => $request->date_received,
                'time_received'    => $request->time_received,
            ];
        });

        return response()->json($data);
    }

    public function assignPriority(Request $request, $id)
    {
        $request->validate([
            'priority_number' => 'required|string',
        ]);

        $alreadyUsed = MaintenanceRequest::where('priority_number', $request->priority_number)
            ->where('id', '!=', $id)
            ->exists();

        if ($alreadyUsed) {
            return response()->json(['message' => 'This priority number is already assigned to another request.'], 409);
        }

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        $maintenanceRequest->priority_number = $request->priority_number;
        $maintenanceRequest->status_id = 10;
        $maintenanceRequest->save();

        $requester = User::find($maintenanceRequest->requesting_personnel);

        if ($requester && $requester->email) {
            $requester->notify(new RequestAssignedPriority($maintenanceRequest));
        }

        if ($requester && $requester->contact_number) {
            SmsService::send(
                $requester->contact_number,
                "Your maintenance request has been assigned priority number: {$maintenanceRequest->priority_number}. Please wait for scheduling."
            );
        }

        SystemNotification::create([
            'user_id'      => $maintenanceRequest->requesting_personnel,
            'type'         => 'maintenance_request_completely_approved',
            'message'      => 'Your request completed the approval process and has a priority number now!, please wait for the service.',
            'is_read'      => false,
            'reference_id' => $maintenanceRequest->id,
        ]);

        return response()->json([
            'message' => 'Priority number assigned successfully.',
            'data'    => $maintenanceRequest,
        ]);
    }

    public function markAsDone($id)
    {
        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        if (Auth::user()->role_id !== 3) {
            return response()->json(['message' => 'Unauthorized. Only staff can mark a request as done.'], 403);
        }

        if ($maintenanceRequest->status_id === 5) {
            return response()->json(['message' => 'Already marked as done.'], 400);
        }

        if ($maintenanceRequest->status_id !== 10) {
            return response()->json(['message' => 'Request must be fully approved before it can be marked as done.'], 400);
        }

        $maintenanceRequest->update([
            'status_id' => 5,
        ]);

        SystemNotification::create([
            'user_id'      => $maintenanceRequest->requesting_personnel,
            'type'         => 'maintenance_request_done',
            'message'      => 'Your maintenance request has been marked as done. Please submit your feedback.',
            'is_read'      => false,
            'reference_id' => $maintenanceRequest->id,
        ]);

        return response()->json([
            'message' => 'Request marked as done successfully.',
            'data'    => $maintenanceRequest,
        ], 200);
    }

    public function generatePriorityNumber($maintenanceTypeId)
    {
        $maintenanceType = MaintenanceType::find($maintenanceTypeId);

        if (!$maintenanceType) {
            return response()->json(['message' => 'Maintenance type not found.'], 404);
        }

        $priorityNumber = null;

        \DB::transaction(function () use ($maintenanceType, &$priorityNumber) {
            $firstLetter = strtoupper(substr($maintenanceType->type_name, 0, 1));
            $year        = now()->format('y');
            $month       = now()->format('n');

            $count = MaintenanceRequest::lockForUpdate()
                ->where('maintenance_type_id', $maintenanceType->id)
                ->whereYear('created_at', now()->year)
                ->whereMonth('created_at', now()->month)
                ->whereNotNull('approved_by_2')
                ->whereNotNull('priority_number')
                ->count();

            $priorityNumber = "{$firstLetter}-{$year}-{$month}-" . ($count + 1);
        });

        return response()->json(['priority_number' => $priorityNumber], 200);
    }

    public function getRequestDate($id)
    {
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        return response()->json([
            'request_date' => $maintenanceRequest->date_requested
        ], 200);
    }


    public function staffpov($id)
    {
        if (Auth::user()->role_id !== 3) {
            return response()->json(['message' => 'Unauthorized. Staff only.'], 403);
        }

        $request = MaintenanceRequest::with([
            'requester', 'position', 'office', 'status',
            'verifier', 'approver1', 'approver2', 'maintenanceType',
            'comments.user', 'comments.role'
        ])->find($id);

        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found'], 404);
        }

        $requester = optional($request->requester);
        $fullName = trim(
            ($requester->last_name ? $requester->last_name . ', ' : '') .
            ($requester->first_name ?? '') . ' ' .
            ($requester->middle_name ?? '') . ' ' .
            ($requester->suffix ?? '')
        );

        return response()->json([
            'request_id'           => $request->id,
            'date_requested'       => $request->date_requested,
            'details'              => $request->details,
            'requester_id'         => $request->requesting_personnel,
            'requesting_personnel' => $fullName,
            'position'             => optional($request->position)->name,
            'requesting_office'    => optional($request->office)->name,
            'contact_number'       => $request->contact_number,
            'status'               => optional($request->status)->name,
            'maintenance_type'     => optional($request->maintenanceType)->type_name,
            'maintenance_type_id'  => $request->maintenance_type_id,
            'date_received'        => $request->date_received,
            'time_received'        => $request->time_received,
            'remarks'              => $request->remarks,
            'verified_by'          => optional($request->verifier)->last_name,
            'approved_by_1'        => optional($request->approver1)->last_name,
            'approved_by_2'        => optional($request->approver2)->last_name,
            'created_at'           => $request->created_at,
            'updated_at'           => $request->updated_at,
            'comments'             => $request->comments->map(fn($c) => [
                'id'      => $c->id,
                'comment' => $c->comment,
                'user'    => optional($c->user)->first_name . ' ' . optional($c->user)->last_name,
                'role'    => optional($c->role)->role_name,
                'date'    => $c->date,
                'time'    => $c->time,
            ]),
        ]);
    }

    public function headpov($id)
    {
        if (Auth::user()->role_id !== 2) {
            return response()->json(['message' => 'Unauthorized. Head only.'], 403);
        }

        $request = MaintenanceRequest::with([
            'requester', 'position', 'office', 'status',
            'verifier', 'approver1', 'maintenanceType',
            'comments.user', 'comments.role'
        ])->find($id);

        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found'], 404);
        }

        $requester = optional($request->requester);
        $fullName = trim(
            ($requester->last_name ? $requester->last_name . ', ' : '') .
            ($requester->first_name ?? '') . ' ' .
            ($requester->middle_name ?? '') . ' ' .
            ($requester->suffix ?? '')
        );

        return response()->json([
            'request_id'           => $request->id,
            'date_requested'       => $request->date_requested,
            'details'              => $request->details,
            'requester_id'         => $request->requesting_personnel,
            'requesting_personnel' => $fullName,
            'position'             => optional($request->position)->name,
            'requesting_office'    => optional($request->office)->name,
            'contact_number'       => $request->contact_number,
            'status'               => optional($request->status)->name,
            'maintenance_type'     => optional($request->maintenanceType)->type_name,
            'maintenance_type_id'  => $request->maintenance_type_id,
            'date_received'        => $request->date_received,
            'time_received'        => $request->time_received,
            'priority_number'      => $request->priority_number,
            'remarks'              => $request->remarks,
            'verified_by'          => optional($request->verifier)->last_name,
            'approved_by_1'        => optional($request->approver1)->last_name,
            'created_at'           => $request->created_at,
            'updated_at'           => $request->updated_at,
            'comments'             => $request->comments->map(fn($c) => [
                'id'      => $c->id,
                'comment' => $c->comment,
                'user'    => optional($c->user)->first_name . ' ' . optional($c->user)->last_name,
                'role'    => optional($c->role)->role_name,
                'date'    => $c->date,
                'time'    => $c->time,
            ]),
        ]);
    }

    public function directorpov($id)
    {
        if (Auth::user()->role_id !== 5) {
            return response()->json(['message' => 'Unauthorized. Campus Director only.'], 403);
        }

        $request = MaintenanceRequest::with([
            'requester', 'position', 'office', 'status',
            'verifier', 'approver1', 'approver2', 'maintenanceType',
            'comments.user', 'comments.role'
        ])->find($id);

        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found'], 404);
        }

        $requester = optional($request->requester);
        $fullName = trim(
            ($requester->last_name ? $requester->last_name . ', ' : '') .
            ($requester->first_name ?? '') . ' ' .
            ($requester->middle_name ?? '') . ' ' .
            ($requester->suffix ?? '')
        );

        return response()->json([
            'request_id'           => $request->id,
            'date_requested'       => $request->date_requested,
            'details'              => $request->details,
            'requester_id'         => $request->requesting_personnel,
            'requesting_personnel' => $fullName,
            'position'             => optional($request->position)->name,
            'requesting_office'    => optional($request->office)->name,
            'contact_number'       => $request->contact_number,
            'status'               => optional($request->status)->name,
            'maintenance_type'     => optional($request->maintenanceType)->type_name,
            'maintenance_type_id'  => $request->maintenance_type_id,
            'date_received'        => $request->date_received,
            'time_received'        => $request->time_received,
            'priority_number'      => $request->priority_number,
            'remarks'              => $request->remarks,
            'verified_by'          => optional($request->verifier)->last_name,
            'approved_by_1'        => optional($request->approver1)->last_name,
            'approved_by_2'        => optional($request->approver2)->last_name,
            'created_at'           => $request->created_at,
            'updated_at'           => $request->updated_at,
            'comments'             => $request->comments->map(fn($c) => [
                'id'      => $c->id,
                'comment' => $c->comment,
                'user'    => optional($c->user)->first_name . ' ' . optional($c->user)->last_name,
                'role'    => optional($c->role)->role_name,
                'date'    => $c->date,
                'time'    => $c->time,
            ]),
        ]);
    }

    private function formatRequests($requests)
    {
        return $requests->map(function ($request) {
            $requester = optional($request->requester);
            $fullName = trim(
                ($requester->last_name ? $requester->last_name . ', ' : '') .
                ($requester->first_name ?? '') . ' ' .
                ($requester->middle_name ?? '') . ' ' .
                ($requester->suffix ?? '')
            );

            return [
                'request_id'           => $request->id,
                'date_requested'       => $request->date_requested,
                'details'              => $request->details,
                'requester_id'         => $request->requesting_personnel,
                'requesting_personnel' => $fullName,
                'position'             => optional($request->position)->name,
                'requesting_office'    => optional($request->office)->name,
                'contact_number'       => $request->contact_number,
                'status'               => optional($request->status)->name,
                'status_id'            => $request->status_id,
                'date_received'        => $request->date_received,
                'time_received'        => $request->time_received,
                'priority_number'      => $request->priority_number,
                'verified_by'          => optional($request->verifier)->last_name,
                'approved_by_1'        => optional($request->approver1)->last_name,
                'approved_by_2'        => optional($request->approver2)->last_name,
                'maintenance_type'     => optional($request->maintenanceType)->type_name,
                'maintenance_type_id'  => $request->maintenance_type_id,
                'created_at'           => $request->created_at,
                'updated_at'           => $request->updated_at,
                'comments'             => $request->comments->map(fn($c) => [
                    'id'      => $c->id,
                    'comment' => $c->comment,
                    'user'    => optional($c->user)->first_name . ' ' . optional($c->user)->last_name,
                    'role'    => optional($c->role)->role_name,
                    'date'    => $c->date,
                    'time'    => $c->time,
                ]),
            ];
        });
    }

    public function getRequestsByStatus(Request $request)
    {
        $user = Auth::user();
        $statusId = $request->query('status_id');
        

        if (!in_array($user->role_id, [1, 2, 3, 5])) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $query = MaintenanceRequest::with([
            'requester', 'position', 'office', 'status',
            'verifier', 'approver1', 'approver2', 'maintenanceType',
            'comments.user', 'comments.role'
        ]);

    if ($statusId) {
            $query->where('status_id', $statusId);
        }

        $requests = $query->paginate(20);

        $data = $requests->getCollection()->map(function ($req) {
            $requester = optional($req->requester);
            $fullName = trim(
                ($requester->last_name ? $requester->last_name . ', ' : '') .
                ($requester->first_name ?? '') . ' ' .
                ($requester->middle_name ?? '') . ' ' .
                ($requester->suffix ?? '')
            );

            return [
                'request_id'           => $req->id,
                'date_requested'       => $req->date_requested,
                'details'              => $req->details,
                'requester_id'         => $req->requesting_personnel,
                'requesting_personnel' => $fullName,
                'position'             => optional($req->position)->name,
                'requesting_office'    => optional($req->office)->name,
                'contact_number'       => $req->contact_number,
                'status'               => optional($req->status)->name,
                'status_id'            => $req->status_id,
                'date_received'        => $req->date_received,
                'time_received'        => $req->time_received,
                'priority_number'      => $req->priority_number,
                'verified_by'          => optional($req->verifier)->last_name,
                'approved_by_1'        => optional($req->approver1)->last_name,
                'approved_by_2'        => optional($req->approver2)->last_name,
                'maintenance_type'     => optional($req->maintenanceType)->type_name,
                'maintenance_type_id'  => $req->maintenance_type_id,
                'created_at'           => $req->created_at,
                'updated_at'           => $req->updated_at,
                'comments'             => $req->comments->map(fn($c) => [
                    'id'      => $c->id,
                    'comment' => $c->comment,
                    'user'    => optional($c->user)->first_name . ' ' . optional($c->user)->last_name,
                    'role'    => optional($c->role)->role_name,
                    'date'    => $c->date,
                    'time'    => $c->time,
                ]),
            ];
        });

        return response()->json([
            'data'         => $data,
            'current_page' => $requests->currentPage(),
            'last_page'    => $requests->lastPage(),
            'total'        => $requests->total(),
        ]);
    }
}