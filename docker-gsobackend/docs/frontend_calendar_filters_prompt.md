# Frontend Prompt: Review Requests — Dropdown Filters

## Overview
Implement status and maintenance type dropdown filters on the **Review Requests** screen (where head, director, and staff review/approve/disapprove maintenance requests) to allow sorting/filtering of the displayed list.

## Backend API Changes (Already Done)

### `GET /api/maintenance-requests` — Public endpoint (no auth required)
Now accepts two optional query parameters:

| Parameter | Type | Values | Description |
|-----------|------|--------|-------------|
| `status` | string | `pending`, `approved`, `scheduled`, `done`, `disapproved`, `cancelled` | Filter by request status |
| `maintenance_type_id` | integer | ID of maintenance type (e.g. 1, 2, 3, 4) | Filter by maintenance category |

**Behavior:**
- When both params omitted: returns ALL maintenance requests (same as before), newest first.
- Combined: `?status=done&maintenance_type_id=1` returns done requests of type Airconditioning.
- Invalid status values return HTTP 400.
- `pending`/`approved` are role-aware on the backend (handles staff/head/director differently), but the frontend just passes the string values.

### `GET /api/maintenance-types` — Public endpoint
Returns all available maintenance types (id + name). No auth required. Use this to populate the maintenance type dropdown dynamically.

## What to Build

### 1. Status Dropdown
- Options: All, Pending, Approved, Scheduled, Done, Disapproved, Cancelled
- "All" = no `status` param sent
- Place inside a horizontal filter bar near the top of the Review Requests screen

### 2. Maintenance Type Dropdown
- Options: "All Types" + each type fetched from `GET /api/maintenance-types`
- "All Types" = no `maintenance_type_id` param sent
- Fetch types once on screen mount and cache them

### 3. Data Fetching
When either dropdown changes, re-fetch `GET /api/maintenance-requests` with the selected params and update the list below.

### 4. Display
- Show the filtered list of maintenance requests below the filter row
- Each item should show: description, status, maintenance type, location (if available), date created
- Keep existing request card layout; filters just narrow which requests appear

### 5. UX Notes
- Dropdowns should be dropdown pickers (not text inputs)
- Both can be active simultaneously (AND filter)
- Selecting a new value immediately triggers a re-fetch (no submit button)
- Show loading indicator while fetching
- Show empty state if no results match

## Example API Calls
```
GET /api/maintenance-requests?status=done
GET /api/maintenance-requests?maintenance_type_id=3
GET /api/maintenance-requests?status=done&maintenance_type_id=1
GET /api/maintenance-types
```

## Example Response (maintenance-requests)
Returns an array of MaintenanceRequest objects — fields include: `id`, `description`, `status_id`, `maintenance_type_id`, `location`, `created_at`, etc.

## Implementation Notes
- Use `useState` for `selectedStatus` and `selectedMaintenanceType`
- Use `useEffect` depending on both state values to trigger fetch
- Debounce is not needed (no text input)
- Keep the fetched maintenance types in a state variable or context