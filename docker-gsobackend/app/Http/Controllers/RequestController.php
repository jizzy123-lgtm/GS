<?php
namespace App\Http\Controllers;

use App\Models\Request;
use App\Models\User;
use Illuminate\Http\Request as HttpRequest;
use App\Notifications\RequestNotification;

class RequestController extends Controller
{
    public function index()
    {
        return Request::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'request_type' => 'required|string',
            'date_requested' => 'required|date',
            'status' => 'required|string'
        ]);

        $newRequest = Request::create($validated);

        // Send notification to Approver (role = 'approver')
        $approvers = User::where('role', 'approver')->get();
        foreach ($approvers as $approver) {
            $approver->notify(new RequestNotification($newRequest, "A new request has been submitted."));
        }

        return response()->json($newRequest, 201);
    }

    public function show($id)
    {
        return Request::findOrFail($id);
    }

    public function update(HttpRequest $request, $id)
    {
        $validated = $request->validate([
            'request_type' => 'sometimes|string',
            'date_requested' => 'sometimes|date',
            'status' => 'sometimes|string'
        ]);

        $req = Request::findOrFail($id);
        $req->update($validated);

        return $req;
    }

    public function destroy($id)
    {
        return Request::destroy($id);
    }

    public function approve($id)
    {
        $req = Request::findOrFail($id);
        $req->status = 'Approved';
        $req->save();

        return response()->json(['message' => 'Request approved']);
    }
}
