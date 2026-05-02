<?php


namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\MaintenanceType;

class MaintenanceTypeController extends Controller
{
    public function index()
    {
        $user = auth()->user();

        if ($user->role === 'head') {
            // Head sees global types + their own added types
            $types = MaintenanceType::where(function($query) use ($user) {
                $query->whereNull('created_by')
                    ->orWhere('created_by', $user->id);
            })->get();
        } else {
            // Staff, Requester, Campus Director sees global types ONLY
            $types = MaintenanceType::whereNull('created_by')->get();
        }

        return response()->json($types, 200);
    }

    public function store(Request $request)
    {
        $user = auth()->user();

        // Only head can add maintenance types
        if ($user->role !== 'head') {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $request->validate(['type_name' => 'required|string|unique:maintenance_types']);

        $type = MaintenanceType::create([
            'type_name'  => $request->type_name,
            'created_by' => $user->id, // tag it to the head
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
