# All Requests Scope Fix Documentation

**Date:** April 3, 2026  
**Scope:** Quick Actions navigation for `All Requests` and `My Requests`

## Issue

For Staff, Head, and Campus Director, tapping `All Requests` opened the request-status screen titled/treated as `My Requests`.

## Root Cause

`ViewRequestStatusScreen` was reused for both entry points, but no scope parameter was passed to distinguish:

1. `My Requests`
2. `All Requests`

The screen title was hardcoded to `My Requests`.

## Fix Implemented

### 1. Added request scope parameter from Dashboard quick actions

In `app/screens/DashboardScreen.jsx`:

1. Requester `My Requests` now navigates with:
   - `onNavigate("ViewRequestStatus", { requestScope: "my" })`
2. Head/Director `All Requests` now navigates with:
   - `onNavigate("ViewRequestStatus", { requestScope: "all" })`
3. Staff `All Requests` now navigates with:
   - `onNavigate("ViewRequestStatus", { requestScope: "all" })`

### 2. Passed `requestScope` through screen router

Updated:

1. `app/(tabs)/index.tsx`
2. `app/screens/index.tsx`

Both now pass:

```tsx
requestScope={screenParams.requestScope}
```

### 3. Made ViewRequestStatus title mode-aware

In `app/screens/ViewRequestStatusScreen.jsx`:

1. Added `requestScope` prop handling.
2. Added `normalizeRequestScope(value)` helper.
3. Screen title now resolves dynamically:
   - `All Requests` when scope is `all`
   - `My Requests` when scope is `my`
4. Default behavior:
   - Requester defaults to `my`
   - Non-requester defaults to `all`

## Result

1. Staff `All Requests` shows `All Requests`.
2. Head `All Requests` shows `All Requests`.
3. Campus Director `All Requests` shows `All Requests`.
4. Requester `My Requests` still shows `My Requests`.

## Files Updated

1. `app/screens/DashboardScreen.jsx`
2. `app/screens/ViewRequestStatusScreen.jsx`
3. `app/(tabs)/index.tsx`
4. `app/screens/index.tsx`

## Verification

Lint command:

```bash
npm.cmd run lint -- app/screens/DashboardScreen.jsx app/screens/ViewRequestStatusScreen.jsx app/(tabs)/index.tsx app/screens/index.tsx
```

Result:

1. `0` errors
2. Existing hook dependency warnings remain (`react-hooks/exhaustive-deps`)
