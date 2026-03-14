<?php
namespace App\Http\Controllers;
use Illuminate\Support\Facades\Auth;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Notifications\NewUserRegistered;
use App\Notifications\AccountApproved;


class UserController extends Controller
{
    // Register a new user
    public function register(Request $request)
    {
        $request->validate([
            'full_name' => 'required|string',
            'username' => 'required|string|unique:users,username',
            'email' => 'nullable|email',
            'position' => 'required|string',
            'office' => 'required|string',
            'contact_number' => 'required|string',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,id' // Must be a valid role ID
        ]);

        $user = User::create([
            'full_name' => $request->full_name,
            'username' => $request->username,
            'email' => $request->email,
            'position' => $request->position,
            'office' => $request->office,
            'contact_number' => $request->contact_number,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id
        ]);

        // Notify admins and staff
        $adminsAndStaffs = User::whereIn('role_id', [1, 3])->get();

        foreach ($adminsAndStaffs as $notifiableUser) {
            if ($notifiableUser->email) {
                $notifiableUser->notify(new NewUserRegistered($user));
            }
        }

        return response()->json(['message' => 'User registered successfully'], 201);
    }



    // Login using username
    public function login(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string'
        ]);

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if ($user->account_status === 'Pending') {
            return response()->json(['message' => 'Your account is still pending approval.'], 403);
        }

        if ($user->account_status === 'Disapproved') {
            return response()->json(['message' => 'Your account was disapproved. Contact admin.'], 403);
        }

        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json(['token' => $token, 'user' => $user], 200);




    }






    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Logged out'], 200);
    }

    public function userDetails(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }
        return response()->json($request->user(), 200);
    }


    public function updateAccountStatus(Request $request, $id)
    {
        $request->validate([
            'account_status' => 'required|in:Pending,Disapproved,Approved'
        ]);

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Temporarily allow any user to approve accounts (FOR TESTING ONLY)
        $user->account_status = $request->account_status;
        $user->save();
        //notify through email
        if ($user->account_status === 'Approved' && $user->email) {
            $user->notify(new AccountApproved());
        }
    }

    public function getPendingApprovals()
    {
        // Ensure only admins can access this
        // $admin = Auth::user();

        // if (!$admin || $admin->role_id !== 1) {
        //     return response()->json(['message' => 'Only admins can view pending approvals.'], 403);
        // }

        // Retrieve users who are pending approval
        $pendingUsers = User::where('account_status', 'Pending')
                            ->select('id', 'full_name', 'username', 'office', 'position', 'contact_number', 'email', 'role_id', 'account_status', 'created_at')
                            ->orderBy('created_at', 'desc')
                            ->get();

        if ($pendingUsers->isEmpty()) {
            return response()->json(['message' => 'No pending approvals found.'], 200);
        }

        return response()->json($pendingUsers, 200);
    }

    public function getUsPass(){
        $pendingUsers = User::where('account_status', 'Approved')
                            ->select('id', 'full_name', 'username', 'password')
                            ->orderBy('created_at', 'desc')
                            ->get();

        if ($pendingUsers->isEmpty()) {
            return response()->json(['message' => 'No pending approvals found.'], 200);
        }

        return response()->json($pendingUsers, 200);

    }

    public function getFullName($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json([
            'message' => 'User retrieved successfully.',
            'full_name' => $user->full_name, // Assuming "name" stores the full name
        ], 200);
    }



    public function getAuthenticatedUserInfo()
    {
        $user = Auth::user(); // Get user from token

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'message' => 'User retrieved successfully.',
            'user_id' => $user->id,   // Return user ID
            'full_name' => $user->full_name // Assuming "name" stores the full name
        ], 200);
    }



    public function getUserDetails()
    {
        // Get the authenticated user
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'user_id' => $user->id,
            'full_name' => $user->full_name, // Ensure this field exists in your users table
            'position' => $user->position,
            'office' => $user->office, // Adjust based on your DB column name
            'contact_number' => $user->contact_number
        ], 200);
    }

    public function getUserDetailRole()
    {
        // Get the authenticated user
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'user_id' => $user->id,
            'full_name' => $user->full_name, // Ensure this field exists in your users table
            'position' => $user->position,
            'office' => $user->office, // Adjust based on your DB column name
            'contact_number' => $user->contact_number,
            'role_id' => $user->role_id
        ], 200);
    }



    public function getUserInfo()
    {
        // Get the authenticated user
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'full_name' => $user->full_name, // Ensure this field exists in your users table
            'position' => $user->position,
            'office' => $user->office, // Adjust based on your DB column name
            'contact_number' => $user->contact_number,
            'email' => $user->email,
            'username' => $user->username
        ], 200);
    }


    public function updateProfile(Request $request)
    {
        $user = Auth::user(); // Get the currently logged-in user

        $request->validate([
            'full_name' => 'sometimes|string|max:255',
            'contact_number' => 'sometimes|string|max:20',
            'position' => 'sometimes|string|max:255',
            'office' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'username' => 'sometimes|string|max:255|unique:users,username,' . $user->id,
            'password' => 'sometimes|string|min:6|confirmed', // Add password (confirmed)
        ]);

        // Update basic info
        $user->update($request->only([
            'full_name',
            'contact_number',
            'position',
            'office',
            'email',
            'username',
        ]));

        // Update password if provided
        if ($request->filled('password')) {
            $user->update([
                'password' => Hash::make($request->password),
            ]);
        }

        return response()->json([
            'message' => 'Profile updated successfully.',
            'user' => $user,
        ], 200);
    }


}

