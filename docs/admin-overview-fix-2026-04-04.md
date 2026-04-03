# Admin Overview Stats Fix

**Date:** April 4, 2026
**Scope:** Fixed Admin dashboard overview showing wrong counts in `DashboardScreen.jsx`.

## 1) Issue

The Admin overview (Total, Pending, Approved, Disapproved) was showing counts from `/pending-approvals` (user account approval requests) instead of `/maintenance-requests`. This caused the overview to only reflect how many account signups were pending rather than the actual maintenance request statistics across the system.

**Symptom:** Admin saw Total: 1, Pending: 1, Approved: 0, Disapproved: 0 — only 1 because there was 1 pending account approval, not because there was only 1 maintenance request.

## 2) Root Cause

In `fetchDashboard`, the endpoint was overridden for Admin:

```js
let ep = "/maintenance-requests";
if (roleId === ROLE_IDS.SYSTEM_ADMIN) ep = "/pending-approvals";
```

The stats block then used `r.account_status || r.status` to read status from account approval objects, which are structured differently from maintenance requests.

## 3) Fix

### File: `app/screens/DashboardScreen.jsx`

**1. Removed Admin endpoint override** — all roles now fetch from `/maintenance-requests`:

```js
// Before
let ep = "/maintenance-requests";
if (roleId === ROLE_IDS.SYSTEM_ADMIN) ep = "/pending-approvals";

// After
const ep = "/maintenance-requests";
```

**2. Merged Admin stats block into Head/Director block** — Admin now uses the same maintenance request status logic:

```js
// Before
if (roleId === ROLE_IDS.SYSTEM_ADMIN) {
  // used account_status || r.status
} else if (roleId === ROLE_IDS.CAMPUS_DIRECTOR || roleId === ROLE_IDS.HEAD) {
  // used r.status
}

// After
if (roleId === ROLE_IDS.SYSTEM_ADMIN || roleId === ROLE_IDS.CAMPUS_DIRECTOR || roleId === ROLE_IDS.HEAD) {
  // uses r.status (maintenance request status)
}
```

## 4) Behavior After Fix

- Admin overview now shows counts across all maintenance requests in the system.
- Account Approvals remain accessible via the dedicated Quick Action → `PendingApprovalsScreen`.
- Recent Requests table on Admin dashboard now also shows actual maintenance requests.
