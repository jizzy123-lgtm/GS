<?php


namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MaintenanceType;

class MaintenanceTypeController extends Controller
{
    public function index()
    {
        return response()->json(MaintenanceType::all(), 200);
    }

    public function store(Request $request)
    {
        $request->validate([
            'type_name' => 'required|string|unique:maintenance_types',
            'description' => 'nullable|string',
        ]);

        $type = MaintenanceType::create([
            'type_name' => $request->type_name,
            'description' => $request->description,
            'created_by' => $request->user() ? $request->user()->id : null,
        ]);

        return response()->json($type, 201);
    }

    public function show($id)
    {
        $type = MaintenanceType::find($id);
        if (!$type) {
            return response()->json(['message' => 'Maintenance type not found'], 404);
        }

        return response()->json($type, 200);
    }

    public function update(Request $request, $id)
    {
        $type = MaintenanceType::find($id);
        if (!$type) {
            return response()->json(['message' => 'Maintenance type not found'], 404);
        }

        $request->validate(['type_name' => 'required|string|unique:maintenance_types,type_name,' . $id]);

        $type->update(['type_name' => $request->type_name]);

        return response()->json($type, 200);
    }

    public function destroy($id)
    {
        $type = MaintenanceType::find($id);
        if (!$type) {
            return response()->json(['message' => 'Maintenance type not found'], 404);
        }

        $type->delete();

        return response()->json(['message' => 'Maintenance type deleted'], 200);
    }
}
