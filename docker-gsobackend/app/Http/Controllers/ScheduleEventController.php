<?php

namespace App\Http\Controllers;

use App\Models\MaintenanceRequest;
use App\Models\Notification as SystemNotification;
use App\Models\ScheduleEvent;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ScheduleEventController extends Controller
{
    private function ensureAllowedRole($user)
    {
        if (!$user || !in_array($user->role_id, [1, 2, 3, 5], true)) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return null;
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        $unauthorized = $this->ensureAllowedRole($user);
        if ($unauthorized) {
            return $unauthorized;
        }

        $query = ScheduleEvent::with(['office', 'creator', 'maintenanceRequest']);

        if ($request->filled('maintenance_request_id')) {
            $query->where('maintenance_request_id', $request->query('maintenance_request_id'));
        }

        $events = $query
            ->orderBy('date')
            ->orderBy('time')
            ->get();

        $events->transform(function ($event) {
            $mr = $event->maintenanceRequest;
            $event->assigned_office = $event->office ? $event->office->name : null;
            $event->creator = $event->creator ? $event->creator->first_name . ' ' . $event->creator->last_name : null;
            $event->image_urls = array_values(array_filter([
                optional($mr)->image_path   ? asset('storage/' . $mr->image_path)   : null,
                optional($mr)->image_path_2 ? asset('storage/' . $mr->image_path_2) : null,
                optional($mr)->image_path_3 ? asset('storage/' . $mr->image_path_3) : null,
                optional($mr)->image_path_4 ? asset('storage/' . $mr->image_path_4) : null,
            ]));
            return $event;
        });

        return response()->json([
            'message' => 'Schedule events retrieved successfully.',
            'data' => $events,
        ], 200);
    }

    public function store(Request $request)
    {
        $user = Auth::user();
        $unauthorized = $this->ensureAllowedRole($user);
        if ($unauthorized) {
            return $unauthorized;
        }

        if ($user->role_id !== 3) {
            return response()->json(['message' => 'Only staff can schedule maintenance requests.'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'required|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'maintenance_request_id' => 'nullable|exists:maintenance_requests,id',
            'assigned_office_id' => 'nullable|exists:offices,id',
        ]);

        $maintenanceRequest = null;
        $assignedOfficeId = $validated['assigned_office_id'] ?? null;

        if ($request->filled('maintenance_request_id')) {
            $maintenanceRequest = MaintenanceRequest::find($validated['maintenance_request_id']);
            
            if (is_null($maintenanceRequest->approved_by_2)) {
                return response()->json(['message' => 'This request must be approved by the Campus Director before scheduling.'], 400);
            }
            if (is_null($maintenanceRequest->verified_by)) {
                return response()->json(['message' => 'This request must be verified by staff before scheduling.'], 400);
            }
            $assignedOfficeId = $maintenanceRequest->requesting_office;
        }

        // Fallback for general events if no office provided
        if (!$assignedOfficeId) {
             // You might want a default office or allow null if the schema allows
             // For now, let's assume office is required by schema, so let's use the staff's office or a default.
             // Looking at migration: $table->foreignId('assigned_office_id')->constrained('offices'); -> It IS required.
             $assignedOfficeId = 1; // Defaulting to 1 for general events
        }

        $event = ScheduleEvent::create([
            'title' => $validated['title'],
            'date' => $validated['date'],
            'time' => $validated['time'],
            'location' => $validated['location'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'assigned_office_id' => $assignedOfficeId,
            'created_by' => $user->id,
            'maintenance_request_id' => $maintenanceRequest ? $maintenanceRequest->id : null,
        ]);

        if ($maintenanceRequest) {
            $maintenanceRequest->update([
                'status_id' => 1, // 1 = Scheduled
                'scheduled_date' => $validated['date'],
                'scheduled_time' => $validated['time'],
                'assigned_staff' => $user->id,
            ]);

            SystemNotification::create([
                'user_id' => $maintenanceRequest->requesting_personnel,
                'type' => 'maintenance_request_scheduled',
                'message' => 'Your maintenance request has been scheduled for ' . $event->date . ' at ' . $event->time . '.',
                'reference_id' => $maintenanceRequest->id,
                'is_read' => false,
            ]);
        }

        return response()->json([
            'message' => 'Schedule event created successfully.',
            'data' => $event->load(['office', 'creator']),
        ], 201);
    }

    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $unauthorized = $this->ensureAllowedRole($user);
        if ($unauthorized) {
            return $unauthorized;
        }

        $event = ScheduleEvent::find($id);
        if (!$event) {
            return response()->json(['message' => 'Schedule event not found.'], 404);
        }

        if ($user->role_id !== 1 && $event->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'date' => 'required|date',
            'time' => 'required|date_format:H:i',
            'location' => 'nullable|string|max:255',
            'notes' => 'nullable|string|max:1000',
            'assigned_office_id' => 'required|exists:offices,id',
        ]);

        $assignedOfficeId = $validated['assigned_office_id'];
        if ($event->maintenance_request_id) {
            $maintenanceRequest = MaintenanceRequest::find($event->maintenance_request_id);
            if ($maintenanceRequest && $maintenanceRequest->requesting_office) {
                $assignedOfficeId = $maintenanceRequest->requesting_office;
            }
        }

        $event->update([
            'title' => $validated['title'],
            'date' => $validated['date'],
            'time' => $validated['time'],
            'location' => $validated['location'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'assigned_office_id' => $assignedOfficeId,
        ]);

        return response()->json([
            'message' => 'Schedule event updated successfully.',
            'data' => $event->load(['office', 'creator']),
        ], 200);
    }

    public function destroy($id)
    {
        $user = Auth::user();
        $unauthorized = $this->ensureAllowedRole($user);
        if ($unauthorized) {
            return $unauthorized;
        }

        $event = ScheduleEvent::find($id);
        if (!$event) {
            return response()->json(['message' => 'Schedule event not found.'], 404);
        }

        if ($user->role_id !== 1 && $event->created_by !== $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $event->delete();

        return response()->json(['message' => 'Schedule event deleted successfully.'], 200);
    }
}
