# Admin Account Approval Feature

**Date:** April 3, 2026
**Affects:** `PendingApprovalsScreen.jsx` (new), `DashboardScreen.jsx`, `app/screens/index.tsx`

---

## Overview

Added a new screen for the **Admin role (role_id = 1)** to view, approve, and reject user account registration requests submitted through the Sign Up screen. Previously, the admin had no way to manage pending accounts in the mobile app.

---

## New File

### `app/screens/PendingApprovalsScreen.jsx`

A screen with two views:

**List View**
- Filter tabs: All / Pending / Approved / Disapproved
- Each card shows: avatar initials, full name, email, registration date, status chip
- Pull-to-refresh supported

**Detail View**
- Avatar + full name + email header
- **User Information:** Username, Email, Contact Number
- **Work Information:** Office, Position, Role
- Status badge + registration date at the bottom
- **Approve** and **Reject** buttons (only visible when account is Pending)
- On action: shows success message → auto-returns to list after 1.5 seconds

---

## Modified Files

### `app/screens/DashboardScreen.jsx`

**Before — fetch endpoint (lines 36–53):**
```js
// role 1=Admin and role 4=Requester use /requests
// role 2=Head uses /head/requests
// role 3=Staff uses /staff/requests
let ep = "/requests";
if (roleId === 2) ep = "/head/requests";
else if (roleId === 3) ep = "/staff/requests";
const res = await fetch(`${API_URL}${ep}`, { headers });
const data = await res.json();
const reqs = Array.isArray(data) ? data : data.data || [];
setRecentRequests(reqs.slice(0, 4));
setStats({
  total: reqs.length,
  pending: reqs.filter(r => r.status?.toLowerCase() === "pending").length,
  approved: reqs.filter(r => r.status?.toLowerCase() === "approved").length,
  completed: reqs.filter(r => r.status?.toLowerCase() === "completed").length,
});
```

**After — fetch endpoint:**
```js
// role 1=Admin uses /pending-approvals (user account requests)
// role 2=Head uses /head/requests
// role 3=Staff uses /staff/requests
// role 4=Requester uses /maintenance-requests
let ep = "/maintenance-requests";
if (roleId === 1) ep = "/pending-approvals";
else if (roleId === 2) ep = "/head/requests";
else if (roleId === 3) ep = "/staff/requests";
const res = await fetch(`${API_URL}${ep}`, { headers });
const data = await res.json();
const reqs = Array.isArray(data) ? data : data.data || [];
setRecentRequests(reqs.slice(0, 4));
if (roleId === 1) {
  setStats({
    total: reqs.length,
    pending: reqs.filter(r => (r.account_status || r.status)?.toLowerCase() === "pending").length,
    approved: reqs.filter(r => (r.account_status || r.status)?.toLowerCase() === "approved").length,
    completed: reqs.filter(r => (r.account_status || r.status)?.toLowerCase() === "disapproved").length,
  });
} else {
  setStats({
    total: reqs.length,
    pending: reqs.filter(r => r.status?.toLowerCase() === "pending").length,
    approved: reqs.filter(r => r.status?.toLowerCase() === "approved").length,
    completed: reqs.filter(r => r.status?.toLowerCase() === "completed").length,
  });
}
```

**Before — admin quick actions:**
```js
if (roleId === 1) return [
  { label: "All Requests", onPress: () => onNavigate("ViewRequestStatus") },
  { label: "Review Requests", onPress: () => onNavigate("ReviewRequests") },
  ...common,
];
```

**After — admin quick actions:**
```js
if (roleId === 1) return [
  { label: "Pending Approvals", onPress: () => onNavigate("PendingApprovals") },
  ...common,
];
```

---

### `app/(tabs)/index.tsx` (Active Navigation)

This is the primary navigation file used in the production environment.

**Before — imports and Screen type:**
```tsx
import ReviewRequestsScreen from '../screens/ReviewRequestsScreen'; 
// Missing PendingApprovalsScreen

type Screen =
  | 'Login' | 'SignUp' | 'Dashboard' | 'SubmitRequest'
  | 'ViewRequestStatus' | 'Feedback' | 'Notifications'
  | 'ReviewRequests' | 'Profile' | 'AssignSchedule';
```

**After — imports and Screen type:**
```tsx
import PendingApprovalsScreen from '../screens/PendingApprovalsScreen';
import ReviewRequestsScreen from '../screens/ReviewRequestsScreen';

type Screen =
  | 'Login' | 'SignUp' | 'Dashboard' | 'SubmitRequest'
  | 'ViewRequestStatus' | 'Feedback' | 'Notifications'
  | 'ReviewRequests' | 'PendingApprovals' | 'Profile' | 'AssignSchedule';
```

**After — added render block:**
```tsx
if (screen === 'PendingApprovals') {
  return <PendingApprovalsScreen user={user} onBack={() => navigate('Dashboard')} />;
}
```

---

### `app/screens/index.tsx` (Duplicate Navigation)

Updated for consistency as it matches the logic of the `(tabs)` file but was not the one causing the black screen.

---

## API Endpoints Used

| Action | Method | Endpoint | Body |
|---|---|---|---|
| Fetch all accounts | GET | `/api/pending-approvals` | - |
| Approve account | PUT | `/api/users/{id}/updateAccountStatus` | `{"status_id": 2}` |
| Reject account | PUT | `/api/users/{id}/dissaproveAccountStatus` | `{"status_id": 3, "rejection_reason": "..."}` |

---

## Troubleshooting & Final Fixes

During implementation, Two major issues were identified and resolved:

### 1. The "Black Screen" Issue
Occurred because the app's navigation was being driven by `app/(tabs)/index.tsx`, but the initial update was only applied to `app/screens/index.tsx`. 
**Fix:** Synchronized the routes in `app/(tabs)/index.tsx`.

### 2. Missing Work Info & Validation Errors
- **The "status id field is required" error:** Occurred because the PUT requests to approve/reject accounts were sending an empty body.
  - **Fix:** Added `{"status_id": 2}` for approvals and `{"status_id": 3}` for rejections.
- **Missing Office/Position/Role labels:** The API returns numeric IDs (e.g., `office_id: 1`).
  - **Fix:** Implemented mapping constants (`OFFICES`, `POSITIONS`, `ROLES`) in `PendingApprovalsScreen.jsx` to translate these IDs into human-readable labels matching the registration screen.

---

## Notes

- The screen handles both `account_status` and `status` field names from the backend response.
- Approve/Reject buttons are hidden for already-approved or disapproved accounts.
- Notifications for new account registrations depend on the backend creating notification records for the admin when a user registers.
