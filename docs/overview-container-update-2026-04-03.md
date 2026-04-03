# Overview Container Update Documentation

**Date:** April 3, 2026  
**Updated File:** `app/screens/DashboardScreen.jsx`

## Scope
Document the new Overview KPI containers added/adjusted in the dashboard.

## Summary of New Containers

1. Added a dedicated `Disapproved` container in the Overview section.
2. Kept `Done` container for non-admin roles only.
3. For admin, replaced the old `Rejected` display behavior with the new `Disapproved` container.

## Behavior by Role

### System Admin (`role_id = 1`)

Overview now shows:

1. `Total`
2. `Pending`
3. `Approved`
4. `Disapproved`

Notes:

1. `Done` is not shown for admin.
2. `Disapproved` is the admin-facing status container for account disapprovals.

### Non-Admin Roles (`Head`, `Staff`, `Requester`, `Campus Director`)

Overview now shows:

1. `Total`
2. `Pending`
3. `Approved`
4. `Disapproved`
5. `Done`

## Data/Count Logic Added

`stats.disapproved` is now computed in all role branches:

1. Admin branch:
   - Uses `(account_status || status) === "disapproved"`
2. Non-admin branches:
   - Uses `status === "disapproved"`

Fallback stats object in error handling now includes:

1. `disapproved: 0`

## Navigation Behavior

The new `Disapproved` KPI container is clickable and routes to:

1. `onNavigate("ViewRequestStatus", { filter: "Disapproved" })`

## UI Impact

1. Admin Overview no longer uses a separate `Rejected` KPI card.
2. Disapproved status is now consistently visible as its own container.
3. Non-admin users still retain the `Done` container.

## Verification

Lint executed for updated dashboard file:

```bash
npm.cmd run lint -- app/screens/DashboardScreen.jsx
```

Result:

1. `0` errors
2. Existing hook dependency warning remains (`react-hooks/exhaustive-deps`)
