# Midterm 1-on-1 Interview Prep
**Project:** GSU Gateway — General Service Maintenance Request Mobile App
**Role:** Mobile Frontend Developer (React Native / Expo)

---

## 1. Show Your Work — What Did YOU Build?

I built the entire **mobile frontend** of the GSU Gateway system using React Native and Expo. The app is used by four types of users: Requesters, Staff, Head, and Campus Director.

**Screens I built and own:**

| Screen | What it does |
|---|---|
| `LoginScreen` | User login, stores auth token |
| `SignUpScreen` | Registration form with office/position fetched from backend |
| `DashboardScreen` | Role-based home screen with KPIs and quick actions |
| `ReviewRequestsScreen` | Staff/Head/Director views requests, verifies, approves, assigns priority |
| `AssignScheduleScreen` | Staff assigns a schedule date and time to approved requests |
| `PendingApprovalsScreen` | System Admin approves or rejects user accounts |
| `NotificationsScreen` | Shows push notifications with read/unread state |
| `ViewRequestStatusScreen` | Requester tracks their own request status |
| `SubmitRequestScreen` | Requester submits a new maintenance request |
| `ProfileScreen` | View and edit user profile |

---

## 2. Explain Your Work — What It Does, How It Works, Why

### Maintenance Request Workflow (Most Important Feature)
The app enforces a **sequential approval workflow**:

```
Requester submits → Staff verifies → Head approves → Director approves
→ Staff assigns priority → Status becomes Approved
→ Staff assigns schedule → Request auto-marked as Done
```

**How I implemented it on the frontend:**
- `ReviewRequestsScreen` checks which step the request is at using fields like `verified_by`, `approved_by_head`, `approved_by_director`
- Based on the logged-in user's role, it shows only the action button that is valid at that step (VERIFY, APPROVE, DISAPPROVE, ASSIGN PRIORITY)
- After the Campus Director approves, Staff sees an "Assign Priority" button
- After priority is assigned and status becomes `approved`, Staff sees "Assign Schedule"
- After schedule is saved, the app automatically calls `mark-done` so the request moves to Done

### Calendar Picker (Custom Built)
The original library `@react-native-community/datetimepicker` requires native modules not available in Expo Go. I replaced it with a **pure JavaScript calendar modal** that:
- Builds calendar cells dynamically from the selected month
- Grays out and disables past dates
- Supports month navigation (prev/next)
- No native dependencies needed

### Dynamic Office/Position Names
During sign-up, users pick their office (e.g. "College of Engineering"). The admin screen used to show the wrong office name because I had a hardcoded list with IDs that didn't match the backend's actual IDs.

**Fix:** I changed `PendingApprovalsScreen` to fetch offices and positions from `GET /common-datas` — the same endpoint used during sign-up — so the IDs always match.

### Push Notifications
- On login, the app registers the device and sends the Expo Push Token to `POST /users/push-token`
- The Laravel backend stores the token per user
- When events happen (request approved, new request submitted), the backend sends a push via Expo's notification service
- The app receives it and shows it in the Notifications screen
- Web is excluded using `Platform.OS === 'web'` check since web doesn't support Expo push tokens

---

## 3. Why/What If Questions — What Can Break?

**Q: What if the backend is down?**
Every fetch is wrapped in try/catch. The screen shows empty state or an error message. The app does not crash.

**Q: What if the push token registration fails?**
The function returns `null` silently. The user can still log in and use the app — they just won't receive push notifications until next login.

**Q: What if a request has an unknown status string from the backend?**
`normalizeMaintenanceStatus()` in `maintenanceStatus.js` maps known strings and status IDs. Unknown values fall back to `"pending"` so nothing breaks.

**Q: What if the office IDs in the backend change?**
Since we fetch from `/common-datas` dynamically, the IDs are always up to date. No hardcoded values to break.

**Q: What if `POST /schedule-events` or `mark-done` fails?**
The schedule assignment shows an error message. The mark-done call is fire-and-forget after schedule success — if it fails, the request stays in Approved status but the schedule is still saved.

**Q: What if two users are on different WiFi networks?**
The Expo tunnel (`--tunnel`) is used. We switched from ngrok (which kept failing with "remote gone away") to cloudflared for a stable HTTPS tunnel. Backend API still runs on Tailscale VPN at `100.82.99.76:8000`.

---

## 4. Know Your Role — My Specific Contributions

- I did **not** build the Laravel backend (routes, controllers, database)
- I **did** build every screen, component, and navigation logic in the mobile app
- I **did** handle all role-based UI logic (what each role can see and do)
- I **did** debug connection errors, native module errors, and API mismatches
- I **did** implement the custom calendar, sequential approval tracker, and auto mark-done flow
- I **did** set up Firebase/FCM integration, EAS build config, and push notification registration

---

## 5. One Improvement I Would Make

**Deep-link notifications** — right now, tapping a notification opens a popup but does not navigate to the specific request. I would add navigation so that:
- Staff tapping a notification goes directly to `ReviewRequestsScreen` with that request already opened
- Requesters tapping a notification goes directly to `ViewRequestStatus` showing their request

This requires:
1. Passing `onNavigate` and `user` props to `NotificationsScreen`
2. Reading `notification.data.request_id` to know which request to open
3. Updating `ReviewRequestsScreen` to auto-open a request if a `requestId` param is passed

This would make the notification system fully useful instead of just informational.

---

---

## 6. Possible Interview Questions & Answers

### General Understanding

**Q: What is the purpose of your mobile app?**
The GSU Gateway app allows university employees to submit maintenance requests (electrical, janitorial, aircon, etc.) and tracks them through a sequential approval process — from Staff verification, to Head and Director approval, then schedule assignment by Staff.

**Q: What tech stack did you use for the frontend?**
React Native with Expo SDK 54, using Expo Router for navigation structure. State management is done with React `useState` and `useEffect` hooks. AsyncStorage is used to persist the auth token. The UI is built with React Native's built-in components (no third-party UI library).

**Q: How does your app communicate with the backend?**
Using the native `fetch()` API. Every request includes an `Authorization: Bearer {token}` header. The base URL is stored in `api.js` pointing to the Laravel backend at `100.82.99.76:8000/api`.

**Q: How do you handle user roles in the frontend?**
Each user has a `role_id` stored in their profile. After login, the role is normalized using `normalizeRoleId()` from `roles.js`. The Dashboard, ReviewRequests, and other screens check this role to show or hide buttons and sections. Example: only Staff sees the VERIFY button, only Head/Director see APPROVE.

---

### Role-Based Logic

**Q: How does the sequential approval workflow work in the frontend?**
Each request goes through steps. I check which step it's at using fields returned by the backend:
- `verified_by` → Staff already verified it
- `approved_by_head` → Head already approved it
- `approved_by_director` → Director already approved it

Based on what's filled in and the current user's role, I show only the correct action button.

**Q: What happens if a Staff tries to approve a request that the Head should approve?**
The `doAction()` function checks `roleId` before calling any endpoint. If it doesn't match the required role, it sets an error message like "Only Head or Campus Director can approve requests." and returns early — no API call is made.

**Q: Can a Staff deny a request after they already verified it?**
No — I fixed this. `canDeny = isStaff && pending && !verified`. Once the request is verified, the DENY button is hidden. Before verification, both VERIFY and DENY are shown.

**Q: Why does Staff see requests they verified but can't act on anymore?**
I fixed the list filter so Staff can see ALL requests in the "All" tab — including ones waiting for Head or Director approval. This lets them track progress. The "Pending" tab shows only the ones they still need to act on.

---

### Screens & Features

**Q: Walk me through what happens when a Staff assigns a schedule.**
1. Staff opens Assign Schedule screen
2. Sees a list of `approved` requests that don't have a schedule yet
3. Selects a request, picks a date from the calendar, selects a time slot, adds a title and optional notes
4. Presses ASSIGN SCHEDULE
5. App sends `POST /schedule-events` with the data
6. If successful, app immediately calls `PUT /maintenance-requests/{id}/mark-done`
7. Request moves to Done status automatically — no extra step needed

**Q: Why did you build a custom calendar instead of using a library?**
The standard library `@react-native-community/datetimepicker` requires native modules that are not included in Expo Go. Since our app uses a custom development build, this could be added — but I chose a pure JavaScript calendar instead because it has zero native dependencies, works on all platforms (Android, iOS, Web), and is fully controllable in styling and behavior.

**Q: How does the calendar know which dates are in the past?**
In `buildCalendarCells()`, for each day I create a `Date` object and compare it to today's date (with hours set to 0 to ignore time). If `cellDate < today`, the cell is marked `past: true`. Past cells are grayed out, disabled, and cannot be tapped.

**Q: How does the office name fix work?**
Before: `PendingApprovalsScreen` had a hardcoded array of offices with IDs 1-9 that didn't match the backend's actual IDs. So a user who selected "College of Engineering" (backend ID 5) would show as "College of Nursing" (hardcoded ID 3).

After: The screen now fetches from `GET /common-datas` — the same endpoint used during sign-up — and maps office IDs dynamically. The IDs always match because they come from the same source.

**Q: How do you display the approval progress tracker in the request card?**
I built a small `ApprovalStep` component that shows a dot (filled green = done, empty = pending) and a label. Three dots connected by lines: Verified → Head → Director. Each dot's state is determined by checking the presence of specific fields in the request object.

---

### Push Notifications

**Q: How does the push notification system work end-to-end?**
1. On login, the app calls `registerForPushNotificationsAsync()`
2. It gets an Expo Push Token from the device
3. Sends it to `POST /users/push-token` so the backend stores it
4. When something happens (request approved, etc.), Laravel sends a notification to Expo's push service using that token
5. Expo delivers it to the Android device via Firebase Cloud Messaging (FCM)
6. The app shows it in the notification tray
7. Inside the app, `GET /notifications` fetches the notification list

**Q: Why does push notification registration skip on web?**
Expo Push Tokens only work on physical Android/iOS devices. On web, calling `getExpoPushTokenAsync()` throws an error about `vapidPublicKey`. I added `if (Platform.OS === 'web') return null;` at the start of the function to skip registration entirely on web.

**Q: What is Firebase Cloud Messaging and why do you need it?**
FCM is Google's service for delivering push notifications to Android devices. Expo uses it under the hood. We needed to connect our Expo project to Firebase by adding `google-services.json` and uploading a Firebase private key to Expo's credentials dashboard. Without this, Expo cannot send notifications to Android.

---

### Errors & Debugging

**Q: What was the hardest bug you fixed?**
The office name mismatch. A user would register with "College of Engineering" but the admin would see "College of Nursing." It looked like a backend bug at first. After reading both the sign-up screen and admin screen code, I found the root cause: the admin screen had a hardcoded office list with IDs that didn't match what the backend actually returns. The fix was simple — fetch from the same API endpoint both screens use.

**Q: What does `normalizeMaintenanceStatus()` do and why do you need it?**
The backend might send a request status as a string like `"approved"` or as a number like `2`. Different endpoints might also use different words — `"confirmed"` and `"in_progress"` both mean approved. `normalizeMaintenanceStatus()` handles all these cases and always returns a consistent value like `"pending"`, `"approved"`, or `"done"`. This prevents UI bugs from backend inconsistencies.

**Q: How do you handle network errors in the app?**
Every `fetch()` call is inside a `try/catch` block. If the server is unreachable, the catch block sets an error message state that is displayed to the user (e.g. "Cannot connect to server."). Loading states are always reset in the `finally` block so the UI never gets stuck on a spinner.

**Q: What is the ngrok/tunnel issue and how did you handle it?**
ngrok is used to expose the Expo Metro bundler over the internet so testers on different networks can scan the QR code. The free ngrok tier kept throwing "remote gone away" errors. The fix is to add an ngrok auth token using `ngrok config add-authtoken`, which authenticates the session and prevents the tunnel from being rejected.

---

### What If / Edge Cases

**Q: What if a user's role is not recognized?**
`normalizeRoleId()` converts the value to a number. If it's not a valid number, it returns `null`. Screens that check role IDs will not match any known role, so no action buttons appear — the user sees a read-only view. This is safe behavior.

**Q: What if the `mark-done` API call fails after schedule is saved?**
The schedule is already saved in the database. The `mark-done` failure only means the status stays `approved` instead of `done`. The user sees the success screen regardless. The request can still be found and manually handled. This is an acceptable trade-off since both calls can't be atomic without backend transaction support.

**Q: What if two staff members try to assign a schedule to the same request at the same time?**
The frontend doesn't handle this — it would be a race condition handled by the backend (e.g. database unique constraints or locking). On the frontend, whichever call finishes first wins. The second person would get an error message from the backend.

---

## Quick Reference — Key Files

| File | Purpose |
|---|---|
| `app/screens/index.tsx` | Navigation controller — manages which screen is shown |
| `app/screens/ReviewRequestsScreen.jsx` | Core workflow screen for Staff/Head/Director |
| `app/screens/AssignScheduleScreen.jsx` | Schedule assignment with custom JS calendar |
| `app/screens/PendingApprovalsScreen.jsx` | Admin account approval with dynamic office names |
| `app/constants/maintenanceStatus.js` | Status normalization (string + ID → standard status) |
| `app/constants/roles.js` | Role ID constants and label mapping |
| `hooks/usePushNotifications.js` | Expo push token registration |
| `api.js` | Base API URL (Tailscale backend) |
