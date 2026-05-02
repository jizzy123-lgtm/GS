# Maintenance Flow Pre-Revision Baseline

**Date:** April 3, 2026  
**Purpose:** Safety baseline before the major Maintenance Request Approval Flow revision.

## 1. Revision Size Assessment

This is a **large** revision because it changes:

1. Core multi-role workflow sequence (Requester, Staff, Head, Director).
2. Endpoint contract usage across multiple screens.
3. Status ID semantics and UI filters/labels.
4. Action availability by role and lifecycle stage.

## 2. Approved Decisions (Before Implementation)

1. Keep current schedule flow available for now (`assign-schedule`) as a separate post-approval step.
2. Feedback should be allowed only at final done state (to be aligned in revision).
3. Cancelled requests should be visible to all roles.

## 3. Current Mobile Flow Snapshot (As-Is)

### 3.1 Requester Submit

1. Endpoint: `POST /maintenance-requests`
2. Screen: `SubmitRequestScreen`
3. Current payload includes:
   - `date_requested`
   - `details`
   - `requesting_personnel`
   - `position_id`
   - `requesting_office`
   - `contact_number`
   - `maintenance_type_id`
   - `location` (extra client field)

Code snapshot:

```jsx
const res = await fetch(`${API_URL}/maintenance-requests`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify(payload),
});
```

### 3.2 Review Requests (Head/Director/Staff shared screen)

1. Data source: `GET /maintenance-requests`
2. Approve endpoints:
   - Head -> `PUT /maintenance-requests/{id}/approve-head`
   - Director -> `PUT /maintenance-requests/{id}/approve-director`
3. Disapprove endpoint:
   - `PUT /maintenance-requests/{id}/disapprove`
4. Staff currently has no `verify` or `assign-priority` action in this screen.

Code snapshot:

```jsx
let endpoint = `/maintenance-requests/${id}/disapprove`;
if (action === "approve") {
  if (roleId === ROLE_IDS.HEAD) {
    endpoint = `/maintenance-requests/${id}/approve-head`;
  } else if (roleId === ROLE_IDS.CAMPUS_DIRECTOR) {
    endpoint = `/maintenance-requests/${id}/approve-director`;
  }
}
```

### 3.3 Staff Scheduling (Current)

1. Fetch queue: `GET /staff/requests`
2. Submit schedule: `POST /requests/{id}/assign-schedule`
3. This is currently used when status is `approved`/`confirmed`.

Code snapshot:

```jsx
const res = await fetch(`${API_URL}/requests/${selectedRequest.id}/assign-schedule`, {
  method: "POST",
  headers: { "Content-Type": "application/json", Accept: "application/json", Authorization: `Bearer ${token}` },
  body: JSON.stringify({ scheduled_date, scheduled_time, assigned_staff, priority, notes }),
});
```

### 3.4 View Request Status

1. Data source: `GET /maintenance-requests`
2. Supports `requestScope` title mode (`All Requests` / `My Requests`).
3. No requester cancel action currently implemented.

### 3.5 Feedback

1. Fetches from `GET /requests`
2. Allows feedback when request status is `completed` and no feedback exists.

### 3.6 Notifications

1. Uses `GET /notifications`
2. Read actions:
   - `POST /notifications/read-all`
   - `POST /notifications/{id}/read`

## 4. Current Status Mapping in Mobile Code (Important)

Current status map used in key screens:

1. `1 -> pending`
2. `2 -> approved`
3. `3 -> disapproved`
4. `4 -> confirmed`
5. `5 -> completed`

This mapping exists in:

1. `app/screens/DashboardScreen.jsx`
2. `app/screens/ReviewRequestsScreen.jsx`
3. `app/screens/ViewRequestStatusScreen.jsx`

## 5. Endpoints Currently Used by Maintenance Flow Screens

1. `POST /maintenance-requests`
2. `GET /maintenance-requests`
3. `PUT /maintenance-requests/{id}/approve-head`
4. `PUT /maintenance-requests/{id}/approve-director`
5. `PUT /maintenance-requests/{id}/disapprove`
6. `GET /staff/requests`
7. `POST /requests/{id}/assign-schedule`
8. `GET /requests` (Feedback source)
9. `POST /feedback`

Not yet implemented in mobile (but required by new backend flow):

1. `PUT /maintenance-requests/{id}/verify`
2. `PUT /maintenance-requests/{id}/assign-priority`
3. `GET /generate-priority-number/{maintenanceTypeId}`
4. `PUT /maintenance-requests/{id}/deny`
5. `PUT /maintenance-requests/{id}/cancel`
6. `PUT /maintenance-requests/{id}/mark-done`

## 6. Key Pre-Revision File Hashes (SHA-256)

Use these to verify exact baseline content before/after rollback.

1. `app/screens/SubmitRequestScreen.jsx`  
   `324D5211E2C38932AE2E897403D0081CF63C52415A8119B67C8374C25880B54A`
2. `app/screens/ReviewRequestsScreen.jsx`  
   `6404322839642AB06A45B90DB034729EEFEDF4600B012751A330D9B673DAB373`
3. `app/screens/AssignScheduleScreen.jsx`  
   `C0D584A905CEC339079012A26462EA64CEE64AEBB1CE4B599F7EAABCF0212F1F`
4. `app/screens/ViewRequestStatusScreen.jsx`  
   `6AFB979F27B72D6D0A5508D70C4D20A92C9607B54B72DF7B6A85BCF7B931B990`
5. `app/screens/DashboardScreen.jsx`  
   `09AE7B4FCD3BED3697C2B84A33536ACA5634EDCA24F0A65694B2A04D5A5086F8`
6. `app/screens/FeedbackScreen.jsx`  
   `5EAF3F439DCA1EA763B3087273F195E0F3768DB4DFB2871822407D171C5B899C`
7. `app/screens/NotificationsScreen.jsx`  
   `3F49ECCCBABFC89ABEA03430637FDCD767C3D6298C2E97F34CC90FDB612A2E65`
8. `app/screens/PendingApprovalsScreen.jsx`  
   `DCA12627A79734FCAC3D4574B286FEBFD21F00BE3F298E930F4E218B98D5282E`
9. `app/screens/index.tsx`  
   `D1F47E60B72F0216F6420B90952BFC82741C7678CCFA8B04FB86B08683ACFEBF`
10. `app/(tabs)/index.tsx`  
    `163BFC9014554AAEC8B8C6007839EE52C36ADA1546B22F6142B128F0BB2C61F6`
11. `app/constants/roles.js`  
    `FB54BD6CECC3A3757C1CE58CEFEC5B60E9084C4D8C2301D0B0A2F940E3115AE9`

## 7. Rollback Guidance

If rollback is needed after revision work:

1. Restore endpoint usage per Section 3 and Section 5.
2. Restore current status map per Section 4.
3. Restore action gating in `ReviewRequestsScreen` (Head/Director approve-disapprove, Staff assign-schedule path).
4. Verify restored files match Section 6 hashes.

## 8. Recommended Safety Step

Before starting implementation, create a checkpoint commit or branch so rollback is one command.
