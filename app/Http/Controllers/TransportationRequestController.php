<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TransportationRequest;
use Illuminate\Validation\ValidationException;

class TransportationRequestController extends Controller
{
    // Get all transportation requests
    public function index()
    {
        return response()->json(TransportationRequest::all());
    }

    // Store a new transportation request
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'request_id' => 'required|exists:requests,id',
                'driver_name' => 'required|string',
                'contact_number' => 'required|string',
                'purpose' => 'required|string',
                'destination' => 'required|string',
                'departure_time' => 'required',
                'arrival_time' => 'required',
                'departure_date' => 'required|date',
                'arrival_date' => 'required|date',
                'requested_by' => 'required|string',
                'control_no' => 'required|string|unique:transportation_requests,control_no',
            ]);

            $newRequest = TransportationRequest::create($validated);
            return response()->json($newRequest, 201);
        } catch (ValidationException $e) {
            return response()->json(['errors' => $e->errors()], 422);
        }
    }

    // Show a single transportation request
    public function show($id)
    {
        return response()->json(TransportationRequest::findOrFail($id));
    }

    // Update a transportation request
    public function update(Request $request, $id)
    {
        $existingRequest = TransportationRequest::findOrFail($id);
        $existingRequest->update($request->all());
        return response()->json($existingRequest);
    }

    // Delete a transportation request
    public function destroy($id)
    {
        TransportationRequest::destroy($id);
        return response()->json(['message' => 'Transportation Request deleted']);
    }
}
