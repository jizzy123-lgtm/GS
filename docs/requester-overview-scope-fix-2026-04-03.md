# Requester Overview Scope Fix

**Date:** April 3, 2026  
**Scope:** Dashboard overview and recent requests for Requester role (`System Request`)

## Issue

Requester dashboard overview was counting from the fetched request list without enforcing ownership scope, which could show non-requester-owned data depending on backend response shape.

## Goal

For Requester role, overview counters and recent list must reflect only the logged-in requester's own requests.

## File Updated

1. `app/screens/DashboardScreen.jsx`

## What Was Implemented

### 1. Added ownership-matching helpers

1. `toNumberOrNull(value)` for safe numeric comparison.
2. `isRequestOwnedByUser(request, currentUser)` to match ownership using:
   - request/user ID fields (`requesting_personnel`, `requester_id`, `user_id`, nested `user.id`, etc.)
   - username fallback when ID fields are unavailable.

### 2. Added requester-scoped dataset

1. Built `requesterScopedReqs` from normalized requests:
   - If role is Requester -> filter by ownership.
   - Else -> use full list.

### 3. Applied scoped dataset to requester dashboard UI

1. `recentRequests` for requester now uses requester-owned requests only.
2. Requester `stats` (`total`, `pending`, `approved`, `completed`, `disapproved`) now compute from requester-owned requests only.

## Result

For `System Request` users:

1. Overview cards now represent only their own request statuses.
2. Recent requests section now shows only their own requests.

For other roles:

1. Existing behavior remains unchanged.

## Verification

Lint command used:

```bash
npm.cmd run lint -- app/screens/DashboardScreen.jsx
```

Result:

1. `0` errors
2. Existing non-blocking hook dependency warning remains (`react-hooks/exhaustive-deps`).
