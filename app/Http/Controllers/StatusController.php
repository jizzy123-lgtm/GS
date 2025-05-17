<?php

namespace App\Http\Controllers;

use App\Models\Status;
use Illuminate\Http\Request;

class StatusController extends Controller
{
    public function index() {
        return response()->json(Status::all());
    }

    public function store(Request $request) {
        $request->validate(['label' => 'required|string|unique:statuses,label']);
        $status = Status::create($request->only('label'));
        return response()->json($status, 201);
    }

    public function show($id) {
        return response()->json(Status::findOrFail($id));
    }

    public function update(Request $request, $id) {
        $status = Status::findOrFail($id);
        $status->update($request->only('label'));
        return response()->json($status);
    }

    public function destroy($id) {
        Status::destroy($id);
        return response()->json(['message' => 'Status deleted.']);
    }
}
