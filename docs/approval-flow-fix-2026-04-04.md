# Approval Flow Fix & Sequential Request Pipeline
**Date:** 2026-04-04
**Branch:** APRIL_MOBILE_FINAL
**Files Modified:** `app/screens/ReviewRequestsScreen.jsx`, `app/screens/DashboardScreen.jsx`, `app/screens/ViewRequestStatusScreen.jsx`, `app/LoginScreen.jsx`

---

## Background

The mobile app was exhibiting three separate bugs, plus one additional token bug discovered during testing:

1. **All data screens showed empty/zero on physical devices** — the Dashboard showed all zeros and "All Requests" showed "No requests found" on a real phone, while the web version worked perfectly.
2. **The Review Requests screen showed all requests to all roles simultaneously** — Staff, Head, and Campus Director all saw the same unfiltered list, bypassing the intended sequential approval pipeline.
3. **`canDisapprove` was too permissive** — Heads and Directors could disapprove requests that weren't yet at their stage.
4. **Stale auth token caused backend to reject Head approvals** — backend returned "Only Heads can perform this approval" even when logged in as Head.

---

## Bug 1 — `AbortSignal.timeout` Not Supported in React Native / Hermes

### Root Cause

Three screens used `AbortSignal.timeout(45000)` to set a fetch timeout:

```js
// Example from DashboardScreen.jsx (before fix)
const signal = AbortSignal.timeout(45000);
const res = await fetch(`${API_URL}/maintenance-requests`, { headers, signal });
```

`AbortSignal.timeout()` is a modern browser API available in Chrome and other web browsers. However, React Native's JavaScript engine (**Hermes**) on physical Android devices does not support this static method. Calling it throws:

```
TypeError: AbortSignal.timeout is not a function
```

This error was silently caught by each screen's `catch` block, which then returned empty data (zeros for the dashboard, empty arrays for the lists). Because the **Login screen** does not use `AbortSignal.timeout`, login still worked — only post-login data screens were affected.

The web version worked because Expo Web runs inside Chrome, which fully supports `AbortSignal.timeout`.

### Screens Affected

| Screen | File | Line (before fix) |
|---|---|---|
| Dashboard | `DashboardScreen.jsx` | 87 |
| All Requests / My Requests | `ViewRequestStatusScreen.jsx` | 112 |
| Review Requests | `ReviewRequestsScreen.jsx` | 123 |

### Fix Applied

Replaced `AbortSignal.timeout()` with the cross-platform `AbortController` + `setTimeout` pattern in all three screens:

```js
// Before (web only)
const signal = AbortSignal.timeout(45000);
const res = await fetch(url, { headers, signal });

// After (works on web + React Native / Hermes)
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 45000);
let res;
try {
  res = await fetch(url, { headers, signal: controller.signal });
} finally {
  clearTimeout(timeoutId);
}
```

`AbortController` is universally supported in both environments. The `finally` block ensures the timeout is always cleared regardless of success or failure.

---

## Bug 2 — Missing Sequential Approval Pipeline Filtering

### Root Cause

The Review Requests screen fetched all maintenance requests from the backend and only filtered them by **status label** (Pending, Approved, Done, etc.). It had no awareness of **where a request sits in the approval pipeline**.

This meant:
- A **Head** would see a brand-new request that Staff had not yet verified — they had no action available and the UI showed "Waiting for staff verification", causing confusion.
- A **Campus Director** would see requests that the Head had not yet approved — again with no actionable buttons.
- **Staff** would see requests they had already verified still appearing in the pending list.

### The Sequential Approval Pipeline

The system enforces a strict sequential flow:

```
[Requester submits] → [Staff verifies] → [Head approves] → [Director approves] → [Staff assigns priority] → [Staff assigns schedule] → [Done]
```

Each actor should only see requests that are **at their stage**:

| Role | Field Condition to Show | Meaning |
|---|---|---|
| **Staff** (role_id: 3) | `status_id === 1` AND `verified_by === null` | Request is new and needs verification |
| **Head** (role_id: 2) | `status_id === 1` AND `verified_by !== null` AND `approved_by_1 === null` | Staff has verified, Head has not yet approved |
| **Campus Director** (role_id: 5) | `status_id === 1` AND `approved_by_1 !== null` AND `approved_by_2 === null` | Head has approved, Director has not yet approved |

### Fix Applied

Added a `getSequentialPendingRequests()` helper function in `ReviewRequestsScreen.jsx`:

```js
const getSequentialPendingRequests = (reqs, role) => {
  const pendingReqs = reqs.filter(r => r.status === MAINTENANCE_STATUS.PENDING);
  if (role === ROLE_IDS.STAFF) {
    return pendingReqs.filter(r => !isVerifiedByStaff(r));
  }
  if (role === ROLE_IDS.HEAD) {
    return pendingReqs.filter(r => isVerifiedByStaff(r) && !isHeadApproved(r));
  }
  if (role === ROLE_IDS.CAMPUS_DIRECTOR) {
    return pendingReqs.filter(r => isHeadApproved(r) && !isDirectorApproved(r));
  }
  return pendingReqs;
};
```

This function relies on three existing helper functions that read the approval state from the request object:

- `isVerifiedByStaff(request)` — checks `verified_by`, `verifier`, `verified_at`, `date_received`, `time_received`
- `isHeadApproved(request)` — checks `approved_by_1`, `approved_by_head`, `head_approved_at`, etc.
- `isDirectorApproved(request)` — checks `approved_by_2`, `approved_by_director`, `director_approved_at`, etc.

The `filtered` computation was updated to apply this filter for the **Pending** and **All** tabs only. Non-pending tabs (Approved, Done, Disapproved, Cancelled) are unaffected and continue to show all matching requests:

```js
const roleNeedsSequentialFilter = [ROLE_IDS.STAFF, ROLE_IDS.HEAD, ROLE_IDS.CAMPUS_DIRECTOR].includes(roleId);

const filtered = (() => {
  if (filter === "All") {
    if (roleNeedsSequentialFilter) {
      const nonPending = requests.filter(r => r.status !== MAINTENANCE_STATUS.PENDING);
      return sortRequestsDescending([...getSequentialPendingRequests(requests, roleId), ...nonPending]);
    }
    return requests;
  }
  if (filter === "Pending" && roleNeedsSequentialFilter) {
    return getSequentialPendingRequests(requests, roleId);
  }
  return requests.filter(r => {
    const s = normalizeMaintenanceStatus(r.status, r.status_id);
    return s === filter.toLowerCase();
  });
})();
```

---

## Bug 3 — `canDisapprove` Was Too Permissive

### Root Cause

The DISAPPROVE button condition was:

```js
// Before (too broad)
const canDisapprove = [ROLE_IDS.HEAD, ROLE_IDS.CAMPUS_DIRECTOR].includes(roleId) && pending;
```

This allowed a Head to disapprove a request even before Staff had verified it, and allowed a Director to disapprove before the Head had acted — both out-of-order.

### Fix Applied

Tightened `canDisapprove` to mirror the same conditions as `canApprove`:

```js
// After (stage-aware)
const canDisapprove = canHeadApprove || canDirectorApprove;
```

The DISAPPROVE button now only appears when the APPROVE button would also appear — meaning the user is at the correct stage in the pipeline.

---

## Bug 4 — Stale Auth Token Causes Backend to Reject Head Approvals

### Symptom

A user logged in as Head opened a verified request (showing APPROVE and DISAPPROVE buttons correctly), pressed APPROVE, and received the backend error:

> "Only Heads can perform this approval."

The frontend was rendering the correct buttons for the Head role, but the backend was rejecting the action as if the user were not a Head.

### Root Cause

Every screen reads the auth token using this pattern:

```js
const token = await AsyncStorage.getItem("authToken") || await AsyncStorage.getItem("token");
```

`"authToken"` is checked **first**. However, the Login screen only ever saves to `"token"`:

```js
// LoginScreen.jsx — before fix
await AsyncStorage.setItem("token", data.token);   // only "token" is set
```

**`"authToken"` is never set anywhere in the codebase** — only read and removed on logout.

This means if `"authToken"` had a value from a **previous version of the app** (an older build that did save to `"authToken"`, likely with a Staff account), that stale token would silently take priority over the correct, fresh `"token"` set on the new login. The backend would receive the old Staff token and correctly reject the Head-level approval action.

The frontend showed Head buttons because the `user` object in state/AsyncStorage was correct (Head). But the **token sent in the `Authorization` header** belonged to a different (Staff) session.

### Why the Buttons Still Showed

The `canHeadApprove` condition reads `roleId` from the `user` prop, which was correctly set to Head's `role_id` during login. The UI rendering was correct. Only the API call was using the wrong token.

### Fix Applied

Login now saves the token to **both keys** so that whichever key any screen reads first always returns the current session's token:

```js
// LoginScreen.jsx — after fix
await AsyncStorage.setItem("token", data.token);
await AsyncStorage.setItem("authToken", data.token);  // ← added
await AsyncStorage.setItem("user", JSON.stringify(normalizedUser));
```

**To fully clear a stale `"authToken"`:** log out and log back in. Logout already removes both keys:

```js
// DashboardScreen.jsx — handleLogout (unchanged)
await AsyncStorage.removeItem("authToken");
await AsyncStorage.removeItem("token");
```

So after one logout → login cycle, both keys will hold the correct token going forward.

---

## Existing Approve / Disapprove Infrastructure (No Changes Needed)

The action endpoints and button rendering were already correctly implemented before this fix. For reference:

| Action | Role | Endpoint | Requires Comment |
|---|---|---|---|
| Verify | Staff | `PUT /maintenance-requests/{id}/verify` | No (auto-filled) |
| Deny | Staff | `PUT /maintenance-requests/{id}/deny` | **Yes (required modal)** |
| Approve | Head | `PUT /maintenance-requests/{id}/approve-head` | No (optional) |
| Approve | Campus Director | `PUT /maintenance-requests/{id}/approve-director` | No (optional) |
| Disapprove | Head / Director | `PUT /maintenance-requests/{id}/disapprove` | **Yes (required modal)** |
| Assign Priority | Staff | `PUT /maintenance-requests/{id}/assign-priority` | No |
| Assign Schedule | Staff | via `AssignScheduleScreen` | No |
| Mark Done | Staff | `PUT /maintenance-requests/{id}/mark-done` | No |

The deny/disapprove modal already enforces a non-empty reason before submission:

```js
disabled={!rejectReason.trim() || actionLoading}
```

---

## Summary of All Changes

| File | Change | Reason |
|---|---|---|
| `DashboardScreen.jsx` | Replaced `AbortSignal.timeout` with `AbortController` | Fix mobile data loading |
| `ViewRequestStatusScreen.jsx` | Replaced `AbortSignal.timeout` with `AbortController` | Fix mobile data loading |
| `ReviewRequestsScreen.jsx` | Replaced `AbortSignal.timeout` with `AbortController` | Fix mobile data loading |
| `ReviewRequestsScreen.jsx` | Added `getSequentialPendingRequests()` and updated `filtered` | Enforce sequential pipeline per role |
| `ReviewRequestsScreen.jsx` | Tightened `canDisapprove` to `canHeadApprove \|\| canDirectorApprove` | Prevent out-of-order disapprovals |
| `LoginScreen.jsx` | Also save token to `"authToken"` on login | Fix stale token overriding current session |
