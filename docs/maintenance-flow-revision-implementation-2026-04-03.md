# Maintenance Flow Revision Implementation

**Date:** April 3, 2026  
**Scope:** Mobile app maintenance-request workflow alignment to backend flow.

## 1) Baseline Reference (Before Change)

Before-state documentation is preserved here:

1. [`docs/maintenance-flow-pre-revision-baseline-2026-04-03.md`](/c:/Users/ACER/GSUApp/docs/maintenance-flow-pre-revision-baseline-2026-04-03.md)

That baseline contains:

1. Previous endpoint usage.
2. Previous status semantics (`confirmed`, `completed`).
3. File hash references for rollback validation.

## 2) Implemented Workflow Alignment

Implemented flow in mobile now follows:

1. Requester submits request (`POST /maintenance-requests`).
2. Staff verifies (`PUT /maintenance-requests/{id}/verify`).
3. Head approves (`PUT /maintenance-requests/{id}/approve-head`) unless requester is head.
4. Campus Director approves (`PUT /maintenance-requests/{id}/approve-director`).
5. Staff assigns priority (`PUT /maintenance-requests/{id}/assign-priority`) which advances request to approved.
6. Staff assigns schedule (kept as separate step, per approved decision).
7. Staff marks done (`PUT /maintenance-requests/{id}/mark-done`).

Additional actions implemented/aligned:

1. Staff deny (`PUT /maintenance-requests/{id}/deny`).
2. Head/Director disapprove (`PUT /maintenance-requests/{id}/disapprove`).
3. Requester cancel (`PUT /maintenance-requests/{id}/cancel`) when pending.

## 3) Status Model Alignment

Unified maintenance statuses now used across revised screens:

1. `pending`
2. `approved`
3. `disapproved`
4. `done`
5. `cancelled`

Shared normalization source:

1. [`app/constants/maintenanceStatus.js`](/c:/Users/ACER/GSUApp/app/constants/maintenanceStatus.js)

## 4) File Changes

### Core flow behavior

1. [`app/screens/ReviewRequestsScreen.jsx`](/c:/Users/ACER/GSUApp/app/screens/ReviewRequestsScreen.jsx)
2. [`app/screens/ViewRequestStatusScreen.jsx`](/c:/Users/ACER/GSUApp/app/screens/ViewRequestStatusScreen.jsx)
3. [`app/screens/SubmitRequestScreen.jsx`](/c:/Users/ACER/GSUApp/app/screens/SubmitRequestScreen.jsx)
4. [`app/screens/AssignScheduleScreen.jsx`](/c:/Users/ACER/GSUApp/app/screens/AssignScheduleScreen.jsx)
5. [`app/screens/FeedbackScreen.jsx`](/c:/Users/ACER/GSUApp/app/screens/FeedbackScreen.jsx)

### Navigation/params support

1. [`app/(tabs)/index.tsx`](/c:/Users/ACER/GSUApp/app/(tabs)/index.tsx)
2. [`app/screens/index.tsx`](/c:/Users/ACER/GSUApp/app/screens/index.tsx)

### Lint unblock (non-flow)

1. [`app/screens/NotificationsScreen.jsx`](/c:/Users/ACER/GSUApp/app/screens/NotificationsScreen.jsx)

## 5) Key Functional Outcomes

1. Staff now has explicit verify and assign-priority actions in review flow.
2. Head/Director approval gating now reflects sequence and requester-head skip logic.
3. Requester request-status screen now supports cancel while pending.
4. Feedback list now derives from done requests in maintenance endpoint.
5. Assign schedule list now derives from approved requests.
6. Submit flow copy now reflects staff-first verification.

## 6) Validation Run

Executed:

1. `npm.cmd run lint`

Result:

1. Passed with warnings only.
2. No lint errors.

## 7) Rollback Guidance

If rollback is needed:

1. Use the pre-revision baseline doc above for exact old behavior.
2. Revert the files listed in Section 4.
3. Re-validate endpoint/status behavior against baseline Section 3/5.
