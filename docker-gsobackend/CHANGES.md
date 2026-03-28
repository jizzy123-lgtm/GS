# Backend API Changes & Enhancements

**Date:** March 12, 2026  
**Developer Role:** Backend Developer  

## 1. Enhancement: Variadic Role Middleware
**File Changed:** `app/Http/Middleware/RoleMiddleware.php`

### Description
Upgraded the `RoleMiddleware` to accept multiple role IDs simultaneously instead of just a single role ID. This allows routes to be protected by multiple roles (e.g., `role:1,2` for Admin and Head) while maintaining full backward compatibility with single-role routes (e.g., `role:1`).

### Code Changes
**Method:** `handle()`

**Before:**
```php
public function handle(Request $request, Closure $next, $roleId): Response
{
    // ...
    if ($user->role_id != $roleId) {
        return response()->json(['message' => 'You do not have permission to access this route.'], 403);
    }
    // ...
}
```

**After:**
```php
public function handle(Request $request, Closure $next, ...$roleIds): Response
{
    // ...
    if (!in_array($user->role_id, $roleIds)) {
        return response()->json(['message' => 'You do not have permission to access this route.'], 403);
    }
    // ...
}
```

---

## 2. Bug Fix: Active User Info Endpoint Returning Relationship Objects
**File Changed:** `app/Http/Controllers/UserController.php`

### Description
Fixed a bug in the `/api/users/reqInfo` endpoint (`UserController::getUserDetails`) where the `position_id` and `office_id` fields were returning full Eloquent relationship objects instead of integer IDs. 

This bug caused frontend forms (like the User Request Slip) to auto-fill with object data instead of valid IDs, resulting in validation errors (`The selected requesting personnel is invalid`, etc.) upon form submission.

### Code Changes
**Method:** `getUserDetails()`

**Before:**
```php
'position_id' => $user->position,
'office_id'   => $user->office,
```

**After:**
```php
'position_id' => $user->position_id,
'office_id'   => $user->office_id,
```

---

*Note: The `/addservice` route was temporarily modified during testing but has been fully reverted to its original state (`auth:sanctum` only) to align with original system design intents.*
