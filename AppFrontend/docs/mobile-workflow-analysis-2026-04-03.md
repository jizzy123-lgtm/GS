# Mobile Workflow Analysis Report (Frontend)

**Date:** April 3, 2026  
**Scope:** React Native mobile app in this repository (`C:\Users\ACER\GSUApp`)  
**Objective:** Analyze why the mobile request flow differs from the intended system flow.

---

## 1. Intended Workflow (Expected)

Maintenance request approval flow should be:

1. Requester submits maintenance request
2. Staff receives and performs first approval/review
3. Head approves
4. Campus Director approves
5. Request returns to Staff for priority + scheduling

---

## 2. Actual Workflow in Current Mobile Frontend

Based on current frontend code, the behavior is implemented as:

1. Requester submits request
2. Head/Campus Director review path is used first
3. Staff is used mainly for schedule assignment after approved/confirmed status

This does **not** match the expected Staff-first process.

---

## 3. Key Findings

### Finding A: Request flow is implemented as Head/Director-first

- Submit flow UI explicitly says Head/Director reviews first:
  - `app/screens/SubmitRequestScreen.jsx` (step text and note)
- Submit endpoint uses:
  - `POST /maintenance-requests` (not a staff-first review endpoint)
- Approval actions are explicitly split as:
  - `PUT /maintenance-requests/{id}/approve-head`
  - `PUT /maintenance-requests/{id}/approve-director`
  - Located in `app/screens/ReviewRequestsScreen.jsx`

Impact:
- New requests can appear in a Head/Director-oriented queue before Staff-first handling.

---

### Finding B: Staff role is not implemented as first approver in mobile flow

- Staff role (`role_id === 3`) is primarily treated as scheduling role after approval:
  - `canAssign = roleId === 3 && isConfirmed`
  - `isConfirmed` allows `approved` or `confirmed`
  - `app/screens/ReviewRequestsScreen.jsx`
- Assign schedule screen fetches staff requests, but only filtered by approved/confirmed status:
  - `app/screens/AssignScheduleScreen.jsx`

Impact:
- Staff enters workflow later than expected.

---

### Finding C: Head and Campus Director identity handling is inconsistent in UI

- Registration/admin mappings define separate roles:
  - `2 = Head`, `5 = Campus Director`
  - `app/screens/SignUpScreen.jsx`, `app/screens/PendingApprovalsScreen.jsx`
- Dashboard/Profile labels are not aligned:
  - `ROLE_LABELS` only includes role IDs 1-4
  - Role 2 shown as `"Head / Director"`
  - Role 5 is missing from label map
  - `app/screens/DashboardScreen.jsx`, `app/screens/ProfileScreen.jsx`

Impact:
- Users may see mixed or misleading role identity in UI, supporting role confusion during testing.

---

### Finding D: "Head can only perform this action" is consistent with role-endpoint mismatch scenarios

- Endpoint selection logic:
  - if `roleId === 2` -> `approve-head`
  - else -> `approve-director`
  - `app/screens/ReviewRequestsScreen.jsx`

If runtime user role data is incorrect/inconsistent (or differs from backend expectation), the app can send the wrong approval endpoint, and backend will correctly reject with role-specific messages.

Impact:
- Matches observed permission error behavior during approval attempts.

---

### Finding E: Historical regression likely introduced by endpoint consolidation

Git history indicates earlier versions used role-specific queues such as:

- `/head/requests`
- `/staff/requests`
- `/requests` for requester submit flow

Current implementation heavily uses unified `/maintenance-requests` across many screens:

- `app/screens/DashboardScreen.jsx`
- `app/screens/ReviewRequestsScreen.jsx`
- `app/screens/ViewRequestStatusScreen.jsx`

Impact:
- If backend workflow logic depends on role-specific endpoints/states, this consolidation can shift routing behavior and cause the observed mismatch.

---

## 4. Evidence Summary (Files)

- `app/screens/SubmitRequestScreen.jsx`
- `app/screens/ReviewRequestsScreen.jsx`
- `app/screens/AssignScheduleScreen.jsx`
- `app/screens/DashboardScreen.jsx`
- `app/screens/ProfileScreen.jsx`
- `app/screens/SignUpScreen.jsx`
- `app/screens/PendingApprovalsScreen.jsx`
- `docs/Admin-Account-Approval-Feature.md` (contains older role-specific endpoint notes)

---

## 5. Conclusion

The mobile app frontend currently encodes a workflow that is different from the expected system process.

- Expected: **Staff -> Head -> Campus Director -> Staff scheduling**
- Current mobile behavior: **Head/Director-first approval path, then Staff scheduling**

The observed issues (request going directly to Head and role-action errors) are consistent with the current frontend routing and role-handling logic.

---

## 6. Recommended Next Step (Separate Task)

Perform a workflow alignment update between mobile and backend contract:

1. Confirm canonical backend workflow endpoints and status transitions with backend developer.
2. Update mobile role labels/mappings to consistently represent Head and Campus Director.
3. Update request queue endpoints and approval gates so Staff is first approver before Head.
4. Re-test with all 5 roles end-to-end using one shared test request.

