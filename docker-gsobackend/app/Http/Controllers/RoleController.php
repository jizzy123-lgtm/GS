<?php

namespace App\Http\Controllers;
use App\Models\Role;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    //
    // Get all roles
    public function index()
    {
        return response()->json(Role::all(), 200);
    }

    // Create a new role
    public function store(Request $request)
    {
        $validated = $request->validate([
            'role_name' => 'required|string|unique:roles,role_name|max:255',
        ]);

        $role = Role::create($validated);

        return response()->json([
            'message' => 'Role created successfully',
            'data' => $role
        ], 201);
    }

    // Get a single role
    public function show($id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json(['message' => 'Role not found'], 404);
        }

        return response()->json($role, 200);
    }

    // Update a role
    public function update(Request $request, $id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json(['message' => 'Role not found'], 404);
        }

        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name,' . $id . '|max:255',
        ]);

        $role->update($validated);

        return response()->json([
            'message' => 'Role updated successfully',
            'data' => $role
        ], 200);
    }

    // Delete a role
    public function destroy($id)
    {
        $role = Role::find($id);

        if (!$role) {
            return response()->json(['message' => 'Role not found'], 404);
        }

        $role->delete();

        return response()->json(['message' => 'Role deleted'], 200);
    }
}
