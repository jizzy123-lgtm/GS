<?php

namespace App\Http\Controllers;

use App\Models\Position;
use Illuminate\Http\Request;

class PositionController extends Controller
{
    public function index() {
        return response()->json(Position::all());
    }

    public function store(Request $request) {
        $request->validate(['name' => 'required|string|unique:positions,name']);
        $position = Position::create($request->only('name'));
        return response()->json($position, 201);
    }

    public function show($id) {
        return response()->json(Position::findOrFail($id));
    }

    public function update(Request $request, $id) {
        $position = Position::findOrFail($id);
        $position->update($request->only('name'));
        return response()->json($position);
    }

    public function destroy($id) {
        Position::destroy($id);
        return response()->json(['message' => 'Position deleted.']);
    }
}

