# Admin Quick Action Label Update

**Date:** April 3, 2026  
**Scope:** Dashboard quick actions and target screen title for System Admin

## Change Summary

Updated the admin quick action label:

1. Before: `Pending Approvals`
2. After: `Account Approvals`

## Reason

The new label is clearer and better matches the actual function of reviewing user account approval requests.

## File Updated

1. `app/screens/DashboardScreen.jsx`
2. `app/screens/PendingApprovalsScreen.jsx`

## Functional Impact

1. Navigation behavior is unchanged.
2. The action still routes to `PendingApprovals` screen.
3. Admin quick action label now shows `Account Approvals`.
4. Target screen header now also shows `Account Approvals` (instead of `Pending Approvals`).

## Verification

Lint run:

```bash
npm.cmd run lint -- app/screens/DashboardScreen.jsx
npm.cmd run lint -- app/screens/PendingApprovalsScreen.jsx
```

Result:

1. `0` errors
2. Existing non-blocking hook dependency warning remains.
