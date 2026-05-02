<?php
namespace App\Http\Controllers;

use App\Models\MaintenanceType;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

use Illuminate\Http\Request;
use App\Models\Role;
use App\Models\Office;
use App\Models\Status;
use App\Models\Position;
use Illuminate\Http\JsonResponse;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;
use App\Notifications\NewUserRegistered;
use App\Notifications\AccountApproved;
use App\Notifications\AccountRejected;
use App\Models\Notification as SystemNotification;


class UserController extends Controller
{
    // Register a new user
    public function register(Request $request)
    {
        try {
            if ($request->contact_number) {
                $raw = $request->contact_number;
                $raw = preg_replace('/^\+63/', '', $raw);   // remove +63
                $raw = preg_replace('/^63(?=9)/', '0', $raw); // replace 639... with 09...
                $raw = ltrim($raw, '+');
                if (!str_starts_with($raw, '0')) {
                    $raw = '0' . $raw;
                }
                $request->merge(['contact_number' => $raw]);
            }

            $request->validate([
                'last_name'  => ['required', 'string', 'regex:/^[a-zA-Z]+([\'\-][a-zA-Z]+)*$/'],
                'first_name' => ['required', 'string', 'regex:/^[a-zA-Z]+([\'\-][a-zA-Z]+)*$/'],
                'middle_name'           => ['nullable', 'string', 'regex:/^[a-zA-Z]$/', 'max:1'],
                'suffix'                => 'nullable|string|max:10',
                'username'              => 'required|string|unique:users,username',
                'email' => [
                                            'required',
                                            'string',
                                            'email:rfc',
                                            'max:255',
                                            'unique:users,email',
                                        ],
                'position_id'           => 'required|exists:positions,id',
                'office_id'             => 'required|exists:offices,id',
                'contact_number'        => [
                                            'required',
                                            'string',
                                            'regex:/^09[0-9]{9}$/',
                                            'size:11',
                                        ],
                'password'              => [
                                            'required', 'string', 'min:8', 'max:30',
                                            'regex:/[a-z]/', 'regex:/[A-Z]/',
                                            'regex:/[0-9]/', 'regex:/[@$~!%*_#?&]/',
                                            'confirmed',
                                        ],
                'password_confirmation' => 'required',
                'role_id'               => 'required|exists:roles,id',
            ], [
                'last_name.required'             => 'Last name is required.',
                'last_name.regex'                => 'Last name must contain letters only (hyphens or apostrophes allowed).',
                'first_name.required'            => 'First name is required.',
                'first_name.regex'               => 'First name must contain letters only (hyphens or apostrophes allowed).',
                'middle_name.regex'              => 'Middle name must be a single letter.',
                'username.required'              => 'Username is required.',
                'username.unique'                => 'That username is already taken. Please choose another.',
                'email.email'                    => 'Blank email pls fill up.',
                'position_id.required'           => 'Position is required.',
                'position_id.exists'             => 'Selected position is invalid.',
                'office_id.required'             => 'Office is required.',
                'office_id.exists'               => 'Selected office is invalid.',
                'contact_number.required'        => 'Contact number is required.',
                'contact_number.regex'           => 'Contact number must be 11 digits and start with 09.',
                'role_id.required'               => 'Role is required.',
                'role_id.exists'                 => 'Selected role is invalid.',
                'password.required'              => 'Password is required.',
                'password.min'                   => 'Password must be at least 8 characters.',
                'password.max'                   => 'Password cannot exceed 30 characters.',
                'password.confirmed'             => 'Password confirmation does not match.',
                'password.regex'                 => 'Password must include uppercase, lowercase, number, and special character.',
                'password_confirmation.required' => 'Please confirm your password.',
            ]);

            $user = User::create([
                'last_name'      => $request->last_name,
                'first_name'     => $request->first_name,
                'middle_name'    => $request->middle_name,
                'suffix'         => $request->suffix,
                'username'       => $request->username,
                'email'             => $request->email ?: null,
                'position_id'    => $request->position_id,
                'office_id'      => $request->office_id,
                'contact_number' => '+63' . substr($request->contact_number, 1),
                'password'       => Hash::make($request->password),
                'role_id'        => $request->role_id,
                'account_status_id' => 1,
            ]);

            dispatch(function () use ($user) {
                try {
                    $adminUsers = User::where('role_id', 1)->get();
                    foreach ($adminUsers as $admin) {
                        if ($admin->email) {
                            $admin->notify(new NewUserRegistered($user));
                        }
                    }
                } catch (\Throwable $e) {
                    \Log::error('Notification error: ' . $e->getMessage());
                }
            })->afterResponse();

            $adminUsers = User::where('role_id', 1)->get();
            foreach ($adminUsers as $admin) {
                SystemNotification::create([
                    'user_id'  => $admin->id,
                    'type'     => 'account_request_created',
                    'message'  => $user->first_name . ' ' . $user->last_name . ' registered an account and is waiting for approval.',
                    'is_read'  => false,
                ]);
            }

            return response()->json(['message' => 'User registered successfully.'], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            \Log::error('Registration error: ' . $e->getMessage());
            return response()->json(['message' => 'Registration failed. Please try again.'], 500);
        }
    }


    // Login using username
    
    public function login(Request $request)
    {
        try {
            $request->validate([
                'username' => 'required|string',
                'password' => 'required|string',
            ], [
                'username.required' => 'Username is required.',
                'password.required' => 'Password is required.',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 400);
        }

        $user = User::where('username', $request->username)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json(['message' => 'Invalid credentials'], 401);
        }

        if ($user->account_status_id == 1) {
            return response()->json(['message' => 'Your account is still pending approval.'], 403);
        }
        if ($user->account_status_id == 3) {
            return response()->json(['message' => 'Your account was disapproved. Contact admin.'], 403);
        }

        $token = $user->createToken('authToken')->plainTextToken;

        // ✅ Return only safe fields — never expose password
        return response()->json([
            'token' => $token,
            'user'  => [
                'user_id'           => $user->id,
                'first_name'        => $user->first_name,
                'last_name'         => $user->last_name,
                'middle_name'       => $user->middle_name,
                'suffix'            => $user->suffix,
                'username'          => $user->username,
                'email'             => $user->email,
                'role_id'           => $user->role_id,
                'office_id'         => $user->office_id,
                'position_id'       => $user->position_id,
                'contact_number'    => $user->contact_number,
                'account_status_id' => $user->account_status_id,
                'profile_picture'   => $user->profile_picture
                    ? asset('storage/' . $user->profile_picture)
                    : null,
            ],
        ], 200);
    }


    public function logout(Request $request)
    {
        // ✅ Only revokes the current token
        $request->user()->currentAccessToken()->delete();
        return response()->json(['message' => 'Logged out successfully.'], 200);
    }



    public function updateAccountStatus(Request $request, $id)
    {
        // ✅ validate against account_statuses table, not statuses
        $request->validate([
            'account_status_id' => 'required|exists:account_statuses,id',
        ]);

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $authUser = Auth::user();
        if ($authUser->role_id !== 1) {
            return response()->json(['message' => 'Only admins can approve accounts.'], 403);

        }

        // ✅ Block if already approved or rejected — status is final
        if ($user->account_status_id !== 1) {
            return response()->json([
                'message' => 'This account has already been processed and cannot be changed.'
            ], 409);
        }

        try {
            // ✅ save account_status_id, not status_id
            $user->account_status_id = $request->account_status_id;
            $user->save();
        } catch (\Exception $e) {
            \Log::error('Status update error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update account status.'], 500);
        }

        // ✅ check account_status_id == 2, not status_id
        if ($user->account_status_id == 2) {
            if ($user->email) {
                $user->notify(new AccountApproved());
            }
            SystemNotification::create([
                'user_id' => $user->id,
                'type'    => 'account_approved',
                'message' => 'Your account has been approved. You can now log in.',
                'is_read' => false,
            ]);
            return response()->json(['message' => 'User status approved successfully.']);
        }

        return response()->json(['message' => 'User status updated.']);
    }

    public function rejectAccountStatus(Request $request, $id)
    {
        // ✅ validate against account_statuses table
        $request->validate([
            'account_status_id' => 'required|exists:account_statuses,id',
        ]);

        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'User not found'], 404);
        }

        $authUser = Auth::user();
        if ($authUser->role_id !== 1) {
            return response()->json(['message' => 'Only admins can disapprove accounts.'], 403);
        }

        // ✅ Block if already approved or rejected — status is final
        if ($user->account_status_id !== 1) {
            return response()->json([
                'message' => 'This account has already been processed and cannot be changed.'
            ], 409);
        }

        try {
            // ✅ save account_status_id, not status_id
            $user->account_status_id = $request->account_status_id;
            $user->save();
        } catch (\Exception $e) {
            \Log::error('Status update error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update account status.'], 500);
        }

        // ✅ use == (comparison) not = (assignment)
        if ($user->account_status_id == 3) {
            if ($user->email) {
                $user->notify(new AccountRejected());
            }
            SystemNotification::create([
                'user_id' => $user->id,
                'type'    => 'account_rejected',
                'message' => 'Your account registration has been disapproved. Contact admin for more info.',
                'is_read' => false,
            ]);
            return response()->json(['message' => 'User registration disapproved successfully.']);
        }

        return response()->json(['message' => 'User status updated.']);
    }

    public function getPendingApprovals()
    {
        // Ensure only admins can access this
        $admin = Auth::user();

        if (!$admin || $admin->role_id !== 1) {
            return response()->json(['message' => 'Only admins can view pending approvals.'], 403);
        }

        // Retrieve users who are pending approval (status_id = 1 assumed for 'Pending')
        $pendingUsers = User::where('account_status_id', 1)
                            ->select('id', 'last_name','first_name', 'middle_name', 'suffix', 'username', 'office_id', 'position_id', 'contact_number', 'email', 'role_id', 'status_id', 'created_at')
                            ->orderBy('created_at', 'desc')
                            ->get();

        return response()->json($pendingUsers, 200);
    }

    //for display of data only 
    public function getUsPass(){
        $Users = User::select('id', 'last_name', 'first_name', 'middle_name', 'suffix', 'username')
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
            'contact_number' => $user->contact_number,
            'profile_picture' => $user->profile_picture 
                ? asset('storage/' . $user->profile_picture) 
                : null,

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
            'role_id' => $user->role_id,
            'profile_picture' => $user->profile_picture 
                ? asset('storage/' . $user->profile_picture) 
                : null,
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
            'username' => $user->username,
            'profile_picture' => $user->profile_picture 
                ? asset('storage/' . $user->profile_picture) 
                : null,
        ], 200);
    }

    
    public function updateProfile(Request $request)
    {
        $user = User::find(Auth::id());

        try {
            

            //  Normalize contact_number BEFORE validation
            if ($request->contact_number) {
                $raw = $request->contact_number;
                $raw = preg_replace('/^\+63/', '', $raw);
                $raw = preg_replace('/^63(?=9)/', '0', $raw);
                $raw = ltrim($raw, '+');
                if (!str_starts_with($raw, '0')) {
                    $raw = '0' . $raw;
                }
                $request->merge(['contact_number' => $raw]);
            }

            // ✅ Normalize empty email to null
            if ($request->has('email') && trim($request->email) === '') {
                $request->merge(['email' => null]);
            }

            if ($request->hasFile('profile_picture')) {
                $file = $request->file('profile_picture');
                if (is_array($file) || !($file instanceof \Illuminate\Http\UploadedFile)) {
                    return response()->json([
                        'message' => 'Validation failed.',
                        'errors'  => ['profile_picture' => ['Only one profile picture is allowed.']],
                    ], 422);
                }
            }


            $request->validate([
                'first_name'  => [
                    'sometimes',
                    'string',
                    'min:1',
                    'max:255',
                    'regex:/^[a-zA-Z]+([\'\-][a-zA-Z]+)*$/',
                ],
                'last_name'   => [
                    'sometimes',
                    'string',
                    'min:1',
                    'max:255',
                    'regex:/^[a-zA-Z]+([\'\-][a-zA-Z]+)*$/',
                ],
                'middle_name' => [
                    'nullable',
                    'string',
                    'regex:/^[a-zA-Z]$/',
                    'max:1',
                ],
                'suffix'      => 'nullable|string|max:50',
                'contact_number' => [
                    'sometimes',
                    'nullable',
                    'string',
                    'size:11',
                    'regex:/^09[0-9]{9}$/',
                ],
                'email'    => 'sometimes|nullable|email:rfc|max:255|unique:users,email,' . $user->id,
                'username' => 'sometimes|string|min:1|max:255|unique:users,username,' . $user->id,
                'password' => [
                    'nullable',
                    'sometimes',
                    'string',
                    'min:8',
                    'max:30',
                    'regex:/[a-z]/',
                    'regex:/[A-Z]/',
                    'regex:/[0-9]/',
                    'regex:/[@$~!%*_#?&]/',
                    'confirmed',
                ],
                'password_confirmation' => 'nullable|sometimes|string',
                'profile_picture' => [
                    'nullable',
                    'sometimes',
                    'file',
                    'image',
                    'mimes:jpg,jpeg,png,webp,gif',
                    'max:5120',
                ],
            ], [
                'first_name.regex'      => 'First name must contain letters only (hyphens and apostrophes allowed).',
                'first_name.min'        => 'First name cannot be empty.',
                'last_name.regex'       => 'Last name must contain letters only (hyphens and apostrophes allowed).',
                'last_name.min'         => 'Last name cannot be empty.',
                'middle_name.regex'     => 'Middle name must be a single letter only.',
                'middle_name.max'       => 'Middle name must be 1 character only.',
                'username.min'          => 'Username cannot be empty.',
                'contact_number.size'   => 'Contact number must be exactly 11 digits.',
                'contact_number.regex'  => 'Contact number must start with 09 and contain numbers only.',
                'email.email'           => 'Please enter a valid email address.',
                'email.unique'          => 'That email is already registered.',
                'password.confirmed'    => 'Password confirmation does not match.',
                'password.min'          => 'Password must be at least 8 characters.',
                'password.max'          => 'Password cannot exceed 30 characters.',
                'password.regex'        => 'Password must include uppercase, lowercase, number, and special character.',
                'profile_picture.image' => 'Profile picture must be a valid image.',
                'profile_picture.mimes' => 'Profile picture must be jpg, jpeg, png, webp, or gif.',
                'profile_picture.max'   => 'Profile picture must not exceed 5MB.',
            ]);

            //handle single file upload for profile picture
            
            if ($request->hasFile('profile_picture')) {
                $file = $request->file('profile_picture'); // already verified as single UploadedFile above

                if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
                    Storage::disk('public')->delete($user->profile_picture);
                }

                $path = $file->store('profile_pictures', 'public');
                $user->profile_picture = $path;
            }


            // ✅ Update individual fields
            if ($request->filled('first_name'))  $user->first_name  = $request->first_name;
            if ($request->filled('last_name'))   $user->last_name   = $request->last_name;
            if ($request->has('middle_name'))    $user->middle_name = $request->middle_name;
            if ($request->has('suffix'))         $user->suffix      = $request->suffix;

            if ($request->filled('contact_number')) {
                $user->contact_number = '+63' . substr($request->contact_number, 1);
            }

            if ($request->filled('email'))    $user->email    = $request->email ?: null;
            if ($request->filled('username')) $user->username = $request->username;

            if ($request->filled('password')) {
                $user->password = Hash::make($request->password);
            }

            $user->save();

            return response()->json([
                'message' => 'Profile updated successfully.',
                'user'    => [
                    'user_id'         => $user->id,
                    'first_name'      => $user->first_name,
                    'last_name'       => $user->last_name,
                    'middle_name'     => $user->middle_name,
                    'suffix'          => $user->suffix,
                    'username'        => $user->username,
                    'email'           => $user->email,
                    'contact_number'  => $user->contact_number,
                    'office_id'       => $user->office_id,
                    'position_id'     => $user->position_id,
                    'role_id'         => $user->role_id,
                    'profile_picture' => $user->profile_picture
                        ? asset('storage/' . $user->profile_picture)
                        : null,
                ],
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 400);
        } catch (\Exception $e) {
            \Log::error('updateProfile error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to update profile. Please try again.'], 500);
        }
    }



    public function commonDatas(): JsonResponse
    {
        return response()->json([
            'roles' => Role::all(),
            'offices' => Office::all(),
            'statuses' => Status::all(),
            'positions' => Position::all(),
            'maintenance_types'=>MaintenanceType::all(),
        ]);
    }


     public function usersList()
    {
        $requests = User::with([
            'position',
            'office',
            'status',
            'role'

        ])->get();

        $data = $requests->map(function ($request) {
            return [
                'user_id' => $request->id,
                'last_name'=> $request->last_name,
                'first_name'=> $request->first_name,
                'middle_name'=> $request->middle_name,
                'suffix'=> $request->suffix,
                'position_id'=>$request->position_id,
                'position' => optional($request->position)->name,
                'role_id'=>$request->role_id,
                'role'=>optional($request->role)->role_name,
                'office_id'=>$request->office_id,
                'office' => optional($request->office)->name,
                'account_status_id' => $request->account_status_id,
                'account_status'    => optional($request->accountStatus)->name,
                'contact_number' => $request->contact_number,
                'email' => $request->email,
                'username' => $request->username,
                'profile_picture' => $request->profile_picture
                    ? asset('storage/' . $request->profile_picture)
                    : null,
                'created_at' => $request->created_at,
                'updated_at'=> $request->updated_at,
            ];
        });

        return response()->json($data);
    }

    public function userDetails(Request $request)
    {
        $user = Auth::user();

        if (!$user) {
            return response()->json(['message' => 'Unauthorized'], 401);
        }

        // Eager load relationships if needed
        $user->load([
            'position',
            'office',
            'status',
            'role'
        ]);

        // Map user details
        $data = [
            'user_id' => $user->id,
            'full_name' => trim($user->first_name . ' ' . $user->middle_name . ' ' . $user->last_name . ' ' . $user->suffix),
            'last_name' => $user->last_name,
            'first_name' => $user->first_name,
            'middle_name' => $user->middle_name,
            'suffix' => $user->suffix,
            'position_id' => $user->position_id,
            'position' => optional($user->position)->name,
            'role_id' => $user->role_id,
            'role' => optional($user->role)->role_name,
            'office_id' => $user->office_id,
            'office' => optional($user->office)->name,
            'account_status_id' => $user->account_status_id,
            'account_status' => optional($user->accountStatus)->name,
            'contact_number' => $user->contact_number,
            'email' => $user->email,
            'username' => $user->username,
            'profile_picture' => $user->profile_picture  // ✅ ADD THIS
                ? asset('storage/' . $user->profile_picture)
                : null,
            'created_at' => $user->created_at,
            'updated_at' => $user->updated_at,
        ];

        return response()->json($data, 200);
    }
    
    public function uploadProfilePicture(Request $request)
    {
        $user = User::find(Auth::id());

        // ✅ Check FIRST — before validation touches the file
        $file = $request->file('profile_picture');
        if (is_array($file) || ($file !== null && !($file instanceof \Illuminate\Http\UploadedFile))) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => ['profile_picture' => ['Only one profile picture is allowed.']],
            ], 422);
        }

        try {
            $request->validate([
                'profile_picture' => 'required|image|mimes:jpg,jpeg,png,webp,gif|max:5120',
            ], [
                'profile_picture.required' => 'Please select an image to upload.',
                'profile_picture.image'    => 'The file must be a valid image.',
                'profile_picture.mimes'    => 'Image must be jpg, jpeg, png, webp, or gif.',
                'profile_picture.max'      => 'Image must not exceed 5MB.',
            ]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 422);
        }

        if ($user->profile_picture && Storage::disk('public')->exists($user->profile_picture)) {
            Storage::disk('public')->delete($user->profile_picture);
        }

        $path = $file->store('profile_pictures', 'public');
        $user->profile_picture = $path;
        $user->save();

        return response()->json([
            'message'         => 'Profile picture updated successfully.',
            'profile_picture' => asset('storage/' . $path),
        ], 200);
    }

    public function removeProfilePicture()
    {
        // AFTER — fresh instance from DB, not cached
        $user = User::find(Auth::id());

        if ($user->profile_picture) {
            \Storage::disk('public')->delete($user->profile_picture);
            $user->profile_picture = null;
            $user->save();
        }

        return response()->json(['message' => 'Profile picture removed.']);
    }

    public function destroy($id) {
        $user = User::find($id);
        
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }
        
        try {
            $user->delete();
            return response()->json(['message' => 'User deleted successfully.'], 200);
        } catch (\Exception $e) {
            \Log::error('Delete user error: ' . $e->getMessage());
            return response()->json(['message' => 'Failed to delete user.'], 500);
        }
    }


}



