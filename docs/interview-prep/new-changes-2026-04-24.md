# New Changes Documentation
**Branch:** APRIL_MOBILE_FINAL
**Pull Date:** 2026-04-24
**Commits pulled:**
- `af2a58c` — fix: re-apply scheduling fixes after merge conflict resolution
- `8e85d58` — docs: update README with project info and API documentation link
- `683f058` — docs: add Postman collection export

---

## Files Changed

| File | Type of Change |
|---|---|
| `app/screens/AssignScheduleScreen.jsx` | Major logic update |
| `README.md` | Rewritten with project info |
| `docs/GSU GATEWAY API.postman_collection.json` | New file added |

---

## 1. AssignScheduleScreen.jsx — What Changed

### A. Pull-to-Refresh added
The request list can now be refreshed by pulling down the screen.

**Before:** No refresh. Staff had to go back and reopen the screen to reload.

**After:** `RefreshControl` added to the `ScrollView`. Pulling down re-fetches the approved request list.

---

### B. Calendar date format fixed
**Before:** Used `toISOString()` to build the date string — this caused a timezone bug where the date could shift one day back (e.g. April 24 becomes April 23) because `toISOString()` always converts to UTC.

**After:** Date is built manually using `pad()`:
```js
const pad = n => String(n).padStart(2, "0");
const dateStr = `${year}-${pad(month + 1)}-${pad(d)}`;
```
This always produces the correct local date (e.g. `2026-04-24`).

---

### C. API endpoint changed for fetching requests
**Before:** Only called `GET /maintenance-requests`

**After:** Tries the richer endpoint first, falls back if it fails:
```
GET /maintenance-requests/list-with-details  ← tries this first
GET /maintenance-requests                    ← fallback if above fails
```
This gives more details per request (like `requesting_office`) without breaking if the endpoint doesn't exist yet.

---

### D. Filter now includes director-approved pending requests
**Before:** Only showed requests with status exactly `approved`.

**After:** Also shows requests that are still `pending` BUT the director has already approved them (detected by checking fields like `approved_by_director`, `director_approved_at`, etc.). This fixes the case where a request was director-approved but the backend hadn't changed the status to `approved` yet.

```
Shows if: status === "approved"
OR: status === "pending" AND director has approved it
Hides if: scheduled_date is set (already scheduled)
Hides if: status === "done"
```

---

### E. Auto priority assignment added
**Before:** Staff had to manually go to Review Requests → assign priority → come back to assign schedule.

**After:** If the request still needs a priority number (`needsPriority: true`), the app automatically:
1. Calls `GET /generate-priority-number/{typeId}` to get a system-generated number
2. If that fails, generates a fallback: `M-{year}-{requestId}`
3. Calls `PUT /maintenance-requests/{id}/assign-priority` silently
4. Then proceeds to assign the schedule

Staff no longer needs a separate step for priority.

---

### F. Schedule endpoint changed
**Before:** Posted to `POST /schedule-events` with this payload:
```json
{
  "maintenance_request_id": 1,
  "title": "Maintenance Schedule",
  "date": "2026-04-24",
  "time": "09:00",
  "notes": ""
}
```

**After:** Posts to `POST /maintenance-requests/{id}/assign-schedule` with:
```json
{
  "scheduled_date": "2026-04-24",
  "scheduled_time": "09:00",
  "assigned_staff": 3,
  "scheduled_notes": ""
}
```
This matches the actual backend route. Also sends the logged-in staff's user ID as `assigned_staff`.

---

### G. Title field removed from validation
**Before:** Title was a required field — submitting without it showed an error.

**After:** Title validation removed. The title input may still show in UI but is no longer required to submit.

---

## 2. README.md — What Changed

Completely rewritten from the default Expo template to a proper project README.

**Now includes:**
- Project name: **GSU Gateway**
- Description: maintenance request app for JRMSU General Services Office
- Tech stack table (React Native, Laravel, FCM, EAS, Tailscale)
- User roles table (Requester, Staff, Head, Campus Director, Admin)
- Link to full API documentation on Postman
- Team members list

---

## 3. GSU GATEWAY API.postman_collection.json — New File

A full Postman collection was added to `docs/`. It contains all backend API endpoints used by the mobile app.

**View online:** `https://documenter.getpostman.com/view/54234949/2sBXqFPP2G`

**Includes endpoints for:**
- Authentication (login, register, logout)
- Maintenance requests (list, create, verify, approve, disapprove, assign priority, assign schedule, mark done)
- Notifications
- User management
- Common data (offices, positions, roles)

---

## Summary of Impact

| Area | Impact |
|---|---|
| Date bug fix | Schedules now save the correct date — no more off-by-one-day errors |
| Auto priority | Staff workflow is now 1 step instead of 2 — assign schedule also handles priority |
| Endpoint fix | Connects to the correct backend route (`assign-schedule` not `schedule-events`) |
| Director-pending filter | More requests correctly show up in the assign schedule list |
| Pull to refresh | Staff can refresh without leaving the screen |
