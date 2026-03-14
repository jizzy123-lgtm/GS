<?php

namespace App\Http\Controllers;

use App\Models\Feedback;
use App\Models\MaintenanceRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;
use App\Notifications\FeedbackSubmitted;

class FeedbackController extends Controller
{
   public function store(Request $request)
{
    $validated = $request->validate([
        'maintenance_request_id' => 'required|exists:maintenance_requests,id',
        'client_type' => 'required|string',
        'service_type' => 'required|string',
        'request_date'=> 'required|date',
        'date' => 'required|date',
        'sex' => 'required|string',
        'region' => 'nullable|string',
        'age' => 'required|integer',
        'office_visited' => 'required|string',
        'service_availed' => 'required|string',
        'cc1' => 'required|integer',
        'cc2' => 'nullable|integer',
        'cc3' => 'nullable|integer',
        'sqd0' => 'required|integer',
        'sqd1' => 'required|integer',
        'sqd2' => 'required|integer',
        'sqd3' => 'required|integer',
        'sqd4' => 'required|integer',
        'sqd5' => 'required|integer',
        'sqd6' => 'required|integer',
        'sqd7' => 'required|integer',
        'sqd8' => 'required|integer',
        'suggestions' => 'nullable|string',
        'email' => 'nullable|email',
    ]);

    // ✅ Prevent multiple feedbacks for the same request
    $existingFeedback = Feedback::where('maintenance_request_id', $validated['maintenance_request_id'])->first();

    if ($existingFeedback) {
        return response()->json([
            'message' => 'Feedback has already been submitted for this maintenance request.'
        ], 409); // 409 Conflict
    }

    $maintenance = MaintenanceRequest::find($validated['maintenance_request_id']);

    // Optional approval check
    // if (!$maintenance || $maintenance->status_id != 2) {
    //     return response()->json([
    //         'message' => 'Feedback can only be submitted for approved maintenance requests.'
    //     ], 403);
    // }

    // ✅ Mark as done
    $maintenance->status_id = 8;
    $maintenance->save();

    $validated['user_id'] = Auth::id();

    $feedback = Feedback::create($validated);

    // ✅ Notify staff & head
    $staffUsers = User::whereIn('role_id', [2, 3])
        ->whereNotNull('email')
        ->get();

    foreach ($staffUsers as $staff) {
        $staff->notify(new FeedbackSubmitted($feedback));
    }

    return response()->json([
        'message' => 'Feedback submitted successfully and staff notified.',
        'data' => $feedback
    ], 201);
}





    // Show a specific feedback
    public function show($id)
    {
        return response()->json(Feedback::findOrFail($id));
    }

    // Update feedback
    public function update(Request $request, $id)
    {
        $feedback = Feedback::findOrFail($id);
        $validated = $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comments' => 'sometimes|string',
        ]);

        $feedback->update($validated);

        return response()->json($feedback);
    }

    // Delete feedback
    public function destroy($id)
    {
        Feedback::destroy($id);
        return response()->json(['message' => 'Feedback deleted']);
    }



    public function showFeedbackDetails($id)
    {
        $feedback = Feedback::find($id);

        if (!$feedback) {
            return response()->json(['message' => 'Feedback not found.'], 404);
        }

        return response()->json([
            'client_type' => $feedback->client_type,
            'service_type' => $feedback->service_type,
            'date'=> $feedback->date,
            'sex' => $feedback->sex,
            'region' => $feedback->region,
            'age' => $feedback->age,
            'office_visited' => $feedback->office_visited,
            'service_availed' => $feedback->service_availed,

            'cc1' => $feedback->cc1,
            'cc2' => $feedback->cc2,
            'cc3' => $feedback->cc3,

            'sqd0' => $feedback->sqd0,
            'sqd1' => $feedback->sqd1,
            'sqd2' => $feedback->sqd2,
            'sqd3' => $feedback->sqd3,
            'sqd4' => $feedback->sqd4,
            'sqd5' => $feedback->sqd5,
            'sqd6' => $feedback->sqd6,
            'sqd7' => $feedback->sqd7,
            'sqd8' => $feedback->sqd8,

            'suggestions' => $feedback->suggestions,
            'email' => $feedback->email,
        ], 200);
    }

    public function index()
    {
        $feedbacks = Feedback::all();

        return response()->json([
            'message' => 'All feedbacks retrieved successfully.',
            'data' => $feedbacks
        ]);
    }

      public function getByRequest($maintenance_request_id)
    {
        $feedback = Feedback::where('maintenance_request_id', $maintenance_request_id)->first();

        if (!$feedback) {
            return response()->json(['message' => 'Feedback not found for this request.'], 404);
        }

        return response()->json($feedback);
    }


}
