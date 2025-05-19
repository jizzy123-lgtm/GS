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
            'last_name'       => 'required|string',
            'first_name'      => 'required|string',
            'middle_name'  => 'nullable|string|max:1',
            'suffix'          => 'nullable|string|max:10',
            'username'        => 'required|string|unique:users,username',
            'email'           => 'nullable|email|unique:users,email',
            'position_id'     => 'required|exists:positions,id',
            'office_id'       => 'required|exists:offices,id',
            'contact_number'  => 'required|string',
            'password'        => 'required|string|min:6',
            'role_id'         => 'required|exists:roles,id'
        ]);

        $user = User::create([
            'last_name'       => $request->last_name,
            'first_name'      => $request->first_name,
            'middle_name'  => $request->middle_name,
            'suffix'          => $request->suffix,
            'username'        => $request->username,
            'email'           => $request->email,
            'position_id'     => $request->position_id,
            'office_id'       => $request->office_id,
            'contact_number'  => $request->contact_number,
            'password'        => Hash::make($request->password),
            'role_id'         => $request->role_id,
            'status_id'       => 1, // Assuming 1 = Pending in status table
        ]);

        // Notify Admins and Staffs (role_id = 1 for Admin, 3 for Staff)
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

        // Check account status via status_id
        if ($user->status_id == 1) { // 1 = Pending
            return response()->json(['message' => 'Your account is still pending approval.'], 403);
        }

        if ($user->status_id == 3) { // 3 = Disapproved
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
            'status_id' => 'required|exists:statuses,id',
        ]);

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        // Only allow admin to approve (role_id = 1)
        $authUser = Auth::user();
        if ($request->status_id == 2 && $authUser->role_id !== 1) {
            return response()->json(['message' => 'Only admins can approve accounts.'], 403);
        }

        $user->status_id = $request->status_id;
        $user->save();

        // Send email notification only if approved
        if ($user->status_id == 2 && $user->email) {
            $user->notify(new AccountApproved());
        }

        return response()->json(['message' => 'User status updated successfully.']);
    }

    public function getPendingApprovals()
    {
        // Ensure only admins can access this
        $admin = Auth::user();

        if (!$admin || $admin->role_id !== 1) {
            return response()->json(['message' => 'Only admins can view pending approvals.'], 403);
        }

        // Retrieve users who are pending approval (status_id = 1 assumed for 'Pending')
        $pendingUsers = User::where('status_id', 1)
                            ->select('id', 'last_name','first_name', 'middle_name', 'suffix', 'username', 'office_id', 'position_id', 'contact_number', 'email', 'role_id', 'status_id', 'created_at')
                            ->orderBy('created_at', 'desc')
                            ->get();

        if ($pendingUsers->isEmpty()) {
            return response()->json(['message' => 'No pending approvals found.'], 200);
        }

        return response()->json($pendingUsers, 200);
    }

    //for display of data only
    public function getUsPass(){
        $Users = Auth::user()
                            ->select('id', 'last_name','first_name', 'middle_name', 'suffix', 'username', 'password')
                            ->orderBy('created_at', 'desc')
                            ->get();

        if ($Users->isEmpty()) {
            return response()->json(['message' => 'Empty.'], 200);
        }

        return response()->json($Users, 200);

    }


    //for getting the fullname
    public function getFullName($id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        return response()->json([
            'message' => 'User retrieved successfully.',
            'last_name' => $user->last_name,
            'first_name'=> $user->first_name,
            'middle_name'=> $user->middle_name,
            'suffix'=> $user->suffix
        ], 200);
    }


    //for display of data only
    public function getAuthenticatedUserInfo()
    {
        $user = Auth::user(); // Get user from token

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'message' => 'User retrieved successfully.',
            'user_id' => $user->id,   // Return user ID
            'last_name' => $user->last_name,
            'first_name'=> $user->first_name,
            'middle_name'=> $user->middle_name,
            'suffix'=> $user->suffix
        ], 200);
    }


    //for display and retrieving of user details only
    public function getUserDetails()
    {
        // Get the authenticated user
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'user_id' => $user->id,
            'last_name' => $user->last_name,
            'first_name'=> $user->first_name,
            'middle_name'=> $user->middle_name,
            'suffix'=> $user->suffix,
            'position_id' => $user->position,
            'office_id' => $user->office, // Adjust based on your DB column name
            'contact_number' => $user->contact_number
        ], 200);
    }

    //get the user's role
    public function getUserDetailRole()
    {
        // Get the authenticated user
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'user_id' => $user->id,
            'last_name' => $user->last_name,
            'first_name'=> $user->first_name,
            'middle_name'=> $user->middle_name,
            'suffix'=> $user->suffix,
            'position_id' => $user->position_id,
            'office_id' => $user->office_id, // Adjust based on your DB column name
            'contact_number' => $user->contact_number,
            'role_id' => $user->role_id
        ], 200);
    }


    //another for display purpose
    public function getUserInfo()
    {
        // Get the authenticated user
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        return response()->json([
            'last_name' => $user->last_name,
            'first_name'=> $user->first_name,
            'middle_name'=> $user->middle_name,
            'suffix'=> $user->suffix,
            'position_id' => $user->position_id,
            'office_id' => $user->office_id, // Adjust based on your DB column name
            'contact_number' => $user->contact_number,
            'email' => $user->email,
            'username' => $user->username
        ], 200);
    }

    //allows editing of account
    public function updateProfile(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'last_name' => 'sometimes|string|max:255',
            'first_name' => 'sometimes|string|max:255',
            'middle_name' => 'sometimes|string|max:255',
            'suffix' => 'sometimes|string|max:50|nullable',
            'contact_number' => 'sometimes|string|max:20',
            'position_id' => 'sometimes|exists:positions,id',
            'office_id' => 'sometimes|exists:offices,id',
            'email' => 'sometimes|email|max:255',
            'username' => 'sometimes|string|max:255|unique:users,username,' . $user->id,
            'password' => 'sometimes|string|min:6|confirmed',
        ]);

        $user->update($request->only([
            'last_name',
            'first_name',
            'middle_name',
            'suffix',
            'contact_number',
            'position_id',
            'office_id',
            'email',
            'username',
        ]));

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

