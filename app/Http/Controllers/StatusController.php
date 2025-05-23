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
        $request->validate(['name' => 'required|string|unique:statuses,name']);
        $status = Status::create($request->only('name'));
        return response()->json($status, 201);
    }

    public function show($id) {
        return response()->json(Status::findOrFail($id));
    }

    public function update(Request $request, $id) {
        $status = Status::findOrFail($id);
        $status->update($request->only('name'));
        return response()->json($status);
    }

    public function destroy($id) {
        Status::destroy($id);
        return response()->json(['message' => 'Status deleted.']);
    }


    public function accountStatuses()
    {

        $statuses = Status::whereIn('id', [1, 2, 3])->get();

        return response()->json([
            'statuses' => $statuses
        ]);
    }
}
