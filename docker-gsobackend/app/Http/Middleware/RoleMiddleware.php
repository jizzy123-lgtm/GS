<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next, ...$roleIds): Response
    {
        // Ensure the user is authenticated
        if (!Auth::check()) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Get the authenticated user
        $user = Auth::user();

        // Check if the authenticated user's role matches any of the allowed role IDs
        if (!in_array($user->role_id, $roleIds)) {
            return response()->json(['message' => 'You do not have permission to access this route.'], 403);
        }

        // Continue with the request
        return $next($request);
    }
}



