<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceRequest;
use App\Models\Notification as SystemNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Models\MaintenanceType;
use App\Notifications\MaintenanceRequestCreated;
use App\Notifications\MaintenanceRequestApproved;
use Illuminate\Support\Facades\Notification;
use App\Notifications\RequestApprovedByHead;
use App\Notifications\AssignPriorityToRequest;
use App\Notifications\RequestAssignedPriority;
use Carbon\Carbon;
use App\Models\Comment;

class MaintenanceRequestController extends Controller
{
    // ─── Helpers ────────────────────────────────────────────────────────────

    /**
     * Reusable full-name formatter.
     */
    private function formatFullName($user): string
    {
        $u = optional($user);
        return trim(
            ($u->last_name ? $u->last_name . ', ' : '') .
            ($u->first_name ?? '') . ' ' .
            ($u->middle_name ?? '') . ' ' .
            ($u->suffix ?? '')
        );
    }

    /**
     * Reusable comment creator.
     */
    private function createComment(string $comment, int $requestId, int $userId, int $roleId): void
    {
        Comment::create([
            'comment'    => $comment,
            'request_id' => $requestId,
            'user_id'    => $userId,
            'role_id'    => $roleId,
            'date'       => Carbon::now()->toDateString(),
            'time'       => Carbon::now()->toTimeString(),
        ]);
    }

    /**
     * Reusable system notification creator.
     */
    private function createNotification(int $userId, string $type, string $message, int $referenceId): void
    {
        SystemNotification::create([
            'user_id'      => $userId,
            'type'         => $type,
            'message'      => $message,
            'reference_id' => $referenceId,
            'is_read'      => false,
        ]);
    }

    // ─── Index ───────────────────────────────────────────────────────────────

    public function index(Request $request)
    {
        $query = MaintenanceRequest::with([
            'requester', 'position', 'office',
            'status', 'verifier', 'approver1',
            'approver2', 'maintenanceType'
        ]);

        if ($request->query('status')) {
            $query->whereHas('status', function ($q) use ($request) {
                $q->where('name', $request->query('status'));
            });
        }

        $requests = $query->get()->map(function ($req) {
            return [
                'request_id'           => $req->id,
                'date_requested'       => $req->date_requested,
                'details'              => $req->details,
                'requesting_personnel' => $this->formatFullName($req->requester),
                'requesting_office'    => optional($req->office)->name,
                'contact_number'       => $req->contact_number,
                'status'               => optional($req->status)->name,
                'maintenance_type'     => optional($req->maintenanceType)->type_name,
                'priority_number'      => $req->priority_number,
                'verified_by'          => optional($req->verifier)->last_name,
                'approved_by_1'        => optional($req->approver1)->last_name,
                'approved_by_2'        => optional($req->approver2)->last_name,
                'created_at'           => $req->created_at,
                'updated_at'           => $req->updated_at,
            ];
        });

        return response()->json($requests);
    }

    // ─── Store ───────────────────────────────────────────────────────────────

    public function store(Request $request)
    {
        $request->validate([
            'date_requested'       => 'required|date',
            'details'              => 'required|string',
            'requesting_personnel' => 'required|exists:users,id',
            'position_id'          => 'required|exists:positions,id',
            'requesting_office'    => 'required|exists:offices,id',
            'contact_number'       => 'required|string',
            'maintenance_type_id'  => 'required|exists:maintenance_types,id',
        ]);

        $maintenanceRequest = MaintenanceRequest::create([
            'date_requested'       => $request->date_requested,
            'details'              => $request->details,
            'requesting_personnel' => $request->requesting_personnel,
            'position_id'          => $request->position_id,
            'requesting_office'    => $request->requesting_office,
            'contact_number'       => $request->contact_number,
            'maintenance_type_id'  => $request->maintenance_type_id,
            'status_id'            => 1, // Pending
        ]);

        // Notify heads (role_id = 2)
        $usersToNotify = User::where('role_id', 2)->get();
        Notification::send($usersToNotify, new MaintenanceRequestCreated(Auth::user()->last_name));

        // System notification for staff (role_id = 3)
        $staffUsers = User::where('role_id', 3)->get();
        foreach ($staffUsers as $staff) {
            $this->createNotification(
                $staff->id,
                'maintenance_request_created',
                'A new maintenance request was submitted by ' . Auth::user()->last_name . ', ' . Auth::user()->first_name,
                $maintenanceRequest->id
            );
        }

        return response()->json([
            'message' => 'Maintenance request created and notifications sent.',
            'data'    => $maintenanceRequest
        ], 201);
    }

    // ─── Show ────────────────────────────────────────────────────────────────

    public function show($id)
    {
        return response()->json(MaintenanceRequest::findOrFail($id));
    }

    // ─── Staff: Verify ───────────────────────────────────────────────────────

    public function verify(Request $request, $id)
    {
        $request->validate([
            'date_received'  => 'required|date',
            'time_received'  => 'required|date_format:H:i:s',
            'priority_number'=> 'nullable|string',
            'remarks'        => 'nullable|string',
            'verified_by'    => 'required|exists:users,id',
            'comment'        => 'nullable|string|max:500',
        ]);

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        $maintenanceRequest->update([
            'date_received'   => $request->date_received,
            'time_received'   => $request->time_received,
            'priority_number' => $request->priority_number,
            'remarks'         => $request->remarks,
            'verified_by'     => $request->verified_by,
        ]);

        if ($request->filled('comment')) {
            $this->createComment(
                $request->comment,
                $maintenanceRequest->id,
                $request->verified_by,
                Auth::user()->role_id
            );
        }

        // Notify requester
        $this->createNotification(
            $maintenanceRequest->requesting_personnel,
            'maintenance_verified',
            'Your maintenance request has been verified by staff.',
            $maintenanceRequest->id
        );

        // Notify all heads
        User::where('role_id', 2)->get()->each(function ($user) use ($maintenanceRequest) {
            $this->createNotification(
                $user->id,
                'maintenance_request_verified',
                'A maintenance request was verified by the staff.',
                $maintenanceRequest->id
            );
        });

        return response()->json([
            'message' => 'Maintenance request reviewed successfully.',
            'data'    => $maintenanceRequest,
        ]);
    }

    // ─── Head: Approve ───────────────────────────────────────────────────────

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

        $request->validate([
            'comment' => 'nullable|string|max:500',
        ]);

        if ($request->filled('comment')) {
            $this->createComment($request->comment, $maintenanceRequest->id, $user->id, $user->role_id);
        }

        $maintenanceRequest->approved_by_1 = $user->id;
        $maintenanceRequest->save();

        // Notify campus directors (role_id = 5)
        $campusDirectors = User::where('role_id', 5)->where('status_id', 2)->get();
        foreach ($campusDirectors as $director) {
            $director->notify(new RequestApprovedByHead($maintenanceRequest));
        }

        $this->createNotification(
            $maintenanceRequest->requesting_personnel,
            'maintenance_request_approved_by_head',
            'Your maintenance request has been approved by the head of GSO.',
            $maintenanceRequest->id
        );

        User::where('role_id', 5)->get()->each(function ($director) use ($maintenanceRequest) {
            $this->createNotification(
                $director->id,
                'maintenance_request_approved_by_head',
                'A maintenance request was approved by the head GSO.',
                $maintenanceRequest->id
            );
        });

        return response()->json([
            'message'             => 'Approved by Head successfully.',
            'maintenance_request' => $maintenanceRequest
        ]);
    }

    // ─── Campus Director: Approve ─────────────────────────────────────────────

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

        $request->validate([
            'comment' => 'nullable|string|max:500',
        ]);

        if ($request->filled('comment')) {
            $this->createComment($request->comment, $maintenanceRequest->id, $user->id, $user->role_id);
        }

        $maintenanceRequest->approved_by_2 = $user->id;

        // ✅ FIX: Both approvers are now set — mark as Approved (status_id = 2)
        $maintenanceRequest->status_id = 2;

        $maintenanceRequest->save();

        // Notify staff to assign priority number
        $staffMembers = User::where('role_id', 3)->where('status_id', 2)->get();
        foreach ($staffMembers as $staff) {
            $staff->notify(new AssignPriorityToRequest($maintenanceRequest));
        }

        $this->createNotification(
            $maintenanceRequest->requesting_personnel,
            'maintenance_request_approved_by_campus_director',
            'Your maintenance request has been approved by the campus director, please wait for your priority number.',
            $maintenanceRequest->id
        );

        User::where('role_id', 3)->get()->each(function ($staff) use ($maintenanceRequest) {
            $this->createNotification(
                $staff->id,
                'maintenance_request_approved_by_campus_director',
                'A maintenance request was approved by the campus director, please assign a priority number.',
                $maintenanceRequest->id
            );
        });

        return response()->json([
            'message'             => 'Approved by Campus Director successfully. Request is now fully approved.',
            'maintenance_request' => $maintenanceRequest
        ]);
    }

    // ─── Staff/Head: Deny / Disapprove ────────────────────────────────────────

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
            'status_id'      => 3, // Disapproved
            'priority_number'=> null,
        ]);

        $this->createComment($request->comment, $maintenanceRequest->id, Auth::id(), Auth::user()->role_id);

        $this->createNotification(
            $maintenanceRequest->requesting_personnel,
            'maintenance_request_denied',
            'Your maintenance request was denied by ' . Auth::user()->first_name . ' ' . Auth::user()->last_name,
            $maintenanceRequest->id
        );

        return response()->json([
            'message' => 'Maintenance request has been denied.',
            'data'    => $maintenanceRequest
        ]);
    }

    public function disapprove(Request $request, $id)
    {
        $maintenanceRequest = MaintenanceRequest::find($id);

        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        $request->validate([
            'comment' => 'required|string|max:1000',
        ]);

        $maintenanceRequest->update([
            'status_id'      => 3, // Disapproved
            'priority_number'=> null,

            // ✅ FIX: Clear approvers so the request doesn't stay partially approved
            'approved_by_1'  => null,
            'approved_by_2'  => null,
        ]);

        $this->createComment($request->comment, $maintenanceRequest->id, Auth::id(), Auth::user()->role_id);

        $this->createNotification(
            $maintenanceRequest->requesting_personnel,
            'maintenance_request_disapproved',
            'Your maintenance request was disapproved by ' . Auth::user()->first_name . ' ' . Auth::user()->last_name,
            $maintenanceRequest->id
        );

        return response()->json(['message' => 'Maintenance request has been disapproved.']);
    }

    // ─── POV Endpoints ───────────────────────────────────────────────────────

    private function buildDetailResponse($request): array
    {
        return [
            'request_id'           => $request->id,
            'date_requested'       => $request->date_requested,
            'details'              => $request->details,
            'requester_id'         => $request->requesting_personnel,
            'requesting_personnel' => $this->formatFullName($request->requester),
            'position'             => optional($request->position)->name,
            'requesting_office'    => optional($request->office)->name,
            'contact_number'       => $request->contact_number,
            'status'               => optional($request->status)->name,
            'date_received'        => $request->date_received,
            'time_received'        => $request->time_received,
            'priority_number'      => $request->priority_number,
            'remarks'              => $request->remarks,
            'verified_by'          => optional($request->verifier)->last_name,
            'approved_by_1'        => optional($request->approver1)->last_name,
            'approved_by_2'        => optional($request->approver2)->last_name,
            'maintenance_type'     => optional($request->maintenanceType)->type_name,
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
    }

    public function staffpov($id)
    {
        $request = MaintenanceRequest::with([
            'requester', 'position', 'office', 'status',
            'verifier', 'approver1', 'approver2',
            'maintenanceType', 'comments.user', 'comments.role'
        ])->find($id);

        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found'], 404);
        }

        return response()->json($this->buildDetailResponse($request));
    }

    public function headpov($id)
    {
        $request = MaintenanceRequest::with([
            'requester', 'position', 'office', 'status',
            'verifier', 'approver1',
            'maintenanceType', 'comments.user', 'comments.role'
        ])->find($id);

        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found'], 404);
        }

        return response()->json($this->buildDetailResponse($request));
    }

    public function directorpov($id)
    {
        $request = MaintenanceRequest::with([
            'requester', 'position', 'office', 'status',
            'verifier', 'approver1', 'approver2',
            'maintenanceType', 'comments.user', 'comments.role'
        ])->find($id);

        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found'], 404);
        }

        return response()->json($this->buildDetailResponse($request));
    }

    // ─── Status Changes ──────────────────────────────────────────────────────

    public function markAsUrgent(Request $request, $id)
    {
        if (!Auth::user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $maintenanceRequest = MaintenanceRequest::find($id);
        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        $request->validate(['comment' => 'required|string|max:1000']);

        $this->createComment($request->comment, $maintenanceRequest->id, Auth::id(), Auth::user()->role_id);

        $maintenanceRequest->status_id = 6;
        $maintenanceRequest->save();

        $this->createNotification(
            $maintenanceRequest->requesting_personnel,
            'maintenance_request_urgent',
            'Your maintenance request was marked as urgent.',
            $maintenanceRequest->id
        );

        return response()->json(['message' => 'Maintenance request marked as urgent.', 'data' => $maintenanceRequest]);
    }

    public function markAsOnHold(Request $request, $id)
    {
        if (!Auth::user()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $maintenanceRequest = MaintenanceRequest::find($id);
        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        $request->validate(['comment' => 'required|string|max:1000']);

        $this->createComment($request->comment, $maintenanceRequest->id, Auth::id(), Auth::user()->role_id);

        $maintenanceRequest->status_id = 7;
        $maintenanceRequest->save();

        $this->createNotification(
            $maintenanceRequest->requesting_personnel,
            'maintenance_request_onhold',
            'Your maintenance request was marked as on hold.',
            $maintenanceRequest->id
        );

        return response()->json(['message' => 'Maintenance request marked as on hold.', 'data' => $maintenanceRequest]);
    }

    public function markAsDone($id)
    {
        $request = MaintenanceRequest::find($id);
        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        $request->status_id = 4;
        $request->save();

        $this->createNotification(
            $request->requesting_personnel,
            'maintenance_request_done',
            'Your maintenance request has been successfully completed. Kindly share your feedback to help us improve our service.',
            $request->id
        );

        return response()->json(['message' => 'Maintenance request marked as done.', 'data' => $request]);
    }

    public function cancelRequest($id)
    {
        $request = MaintenanceRequest::find($id);
        if (!$request) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        if ($request->status_id != 1) {
            return response()->json(['message' => 'Only pending requests can be canceled.'], 400);
        }

        $request->status_id = 5;
        $request->save();

        return response()->json(['message' => 'Maintenance request canceled successfully.']);
    }

    // ─── Priority Number ─────────────────────────────────────────────────────

    public function assignPriority(Request $request, $id)
    {
        $request->validate(['priority_number' => 'required|string']);

        $maintenanceRequest = MaintenanceRequest::findOrFail($id);

        // ✅ Guard: both approvers must be set before assigning priority
        if (is_null($maintenanceRequest->approved_by_1) || is_null($maintenanceRequest->approved_by_2)) {
            return response()->json(['message' => 'Request must be fully approved before assigning a priority number.'], 400);
        }

        $maintenanceRequest->priority_number = $request->priority_number;
        $maintenanceRequest->save();

        $requester = User::find($maintenanceRequest->requesting_personnel);
        if ($requester && $requester->email) {
            $requester->notify(new RequestAssignedPriority($maintenanceRequest));
        }

        $this->createNotification(
            $maintenanceRequest->requesting_personnel,
            'maintenance_request_completely_approved',
            'Your request has been fully approved and a priority number has been assigned. Please wait for the service.',
            $maintenanceRequest->id
        );

        return response()->json([
            'message' => 'Priority number assigned successfully.',
            'data'    => $maintenanceRequest,
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

    public function generatePriorityNumber($maintenanceTypeId)
    {
        $maintenanceType = MaintenanceType::find($maintenanceTypeId);
        if (!$maintenanceType) {
            return response()->json(['message' => 'Maintenance type not found.'], 404);
        }

        $firstLetter = strtoupper(substr($maintenanceType->type_name, 0, 1));
        $year        = now()->format('y');
        $month       = now()->format('n');

        $count = MaintenanceRequest::where('maintenance_type_id', $maintenanceType->id)
            ->whereYear('created_at', now()->year)
            ->whereMonth('created_at', now()->month)
            ->whereNotNull('approved_by_2')
            ->whereNotNull('priority_number')
            ->count();

        $priorityNumber = "{$firstLetter}-{$year}-{$month}-" . ($count + 1);

        return response()->json(['priority_number' => $priorityNumber]);
    }

    // ─── Misc ────────────────────────────────────────────────────────────────

    public function updateDetails(Request $request, $id)
    {
        $maintenanceRequest = MaintenanceRequest::find($id);
        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        if ($maintenanceRequest->status_id !== 1) {
            return response()->json(['message' => 'Cannot edit a request that is already processed.'], 403);
        }

        $request->validate(['details' => 'required|string|max:255']);

        $maintenanceRequest->details = $request->details;
        $maintenanceRequest->save();

        return response()->json([
            'message' => 'Maintenance request details updated successfully.',
            'data'    => $maintenanceRequest,
        ]);
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
            'message' => 'View timestamp saved successfully.',
            'data'    => $maintenanceRequest
        ]);
    }

    public function getSchedules()
    {
        $user = Auth::user();
        if (!in_array($user->role_id, [1, 2, 3])) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $schedules = MaintenanceRequest::select('date_requested', 'details', 'requesting_office')->get();

        return response()->json(['message' => 'Schedules retrieved successfully.', 'data' => $schedules]);
    }

    public function indexWithDetails()
    {
        $requests = MaintenanceRequest::with([
            'requester', 'position', 'office', 'status',
            'verifier', 'approver1', 'approver2',
            'maintenanceType', 'comments.user', 'comments.role'
        ])->get();

        $data = $requests->map(function ($request) {
            return array_merge($this->buildDetailResponse($request), [
                'status_id'    => $request->status_id,
                'requester_id' => $request->requesting_personnel,
            ]);
        });

        return response()->json($data);
    }

    public function forPriorityNumber()
    {
        $requests = MaintenanceRequest::with(['maintenanceType'])->get();

        $data = $requests->map(fn($r) => [
            'request_id'      => $r->id,
            'maintenance_type'=> optional($r->maintenanceType)->type_name,
            'date_received'   => $r->date_received,
            'time_received'   => $r->time_received,
        ]);

        return response()->json($data);
    }

    public function getRequestDate($id)
    {
        $maintenanceRequest = MaintenanceRequest::find($id);
        if (!$maintenanceRequest) {
            return response()->json(['message' => 'Maintenance request not found.'], 404);
        }

        return response()->json(['request_date' => $maintenanceRequest->date_requested]);
    }

    public function indexPublic()
    {
        return response()->json([
            'message' => 'API is reachable via Tailscale!',
            'data'    => MaintenanceRequest::all()
        ]);
    }
}