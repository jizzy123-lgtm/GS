<?php

namespace App\Http\Controllers;

use App\Models\Office;
use Illuminate\Http\Request;

class OfficeController extends Controller
{
    public function index() {
        return response()->json(Office::all());
    }

    public function store(Request $request) {
        $request->validate(['name' => 'required|string|unique:offices,name']);
        $office = Office::create($request->only('name'));
        return response()->json($office, 201);
    }

    public function show($id) {
        return response()->json(Office::findOrFail($id));
    }

    public function update(Request $request, $id) {
        $office = Office::findOrFail($id);
        $office->update($request->only('name'));
        return response()->json($office);
    }

    public function destroy($id) {
        Office::destroy($id);
        return response()->json(['message' => 'Office deleted.']);
    }
}

