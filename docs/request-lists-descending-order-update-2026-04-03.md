# Request Lists Descending Order Update

**Date:** April 3, 2026  
**Scope:** Request list ordering for status/review screens

## Objective

Ensure both request list screens always display newest items first (descending order).

## Included Fixes

1. `All Requests` must be descending.
2. `Review Requests` must be descending.

## 1) All Requests Descending

### File Updated

1. `app/screens/ViewRequestStatusScreen.jsx`

### What Changed

1. Added a reusable sorter:
   - `sortRequestsDescending(list)`
2. Applied sorting before setting screen state:
   - `setRequests(sortRequestsDescending(normalizedRequests))`

### Sorting Logic

1. Primary key: newest date first using:
   - `created_at`, fallback `date_requested`, fallback `updated_at`
2. Secondary key (tie-breaker): `id` descending

## 2) Review Requests Descending

### File Updated

1. `app/screens/ReviewRequestsScreen.jsx`

### What Changed

1. Added a reusable sorter:
   - `sortRequestsDescending(list)`
2. Applied sorting before setting screen state:
   - `setRequests(sortRequestsDescending(normalizedRequests))`

### Sorting Logic

1. Primary key: newest date first using:
   - `created_at`, fallback `date_requested`, fallback `updated_at`
2. Secondary key (tie-breaker): `id` descending

## Result

1. `ViewRequestStatus` request list now consistently shows newest entries first.
2. `ReviewRequests` list now consistently shows newest entries first.
3. Ordering is no longer dependent on backend response order.

## Verification

Lint commands used:

```bash
npm.cmd run lint -- app/screens/ViewRequestStatusScreen.jsx
npm.cmd run lint -- app/screens/ReviewRequestsScreen.jsx
```

Result:

1. `0` errors on both files
2. Existing non-blocking hook dependency warnings remain (`react-hooks/exhaustive-deps`)
