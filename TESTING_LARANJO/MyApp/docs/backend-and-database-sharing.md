# Backend and Database Sharing

## Overview
This document describes the changes made to connect the React Native Expo app to a local Laravel backend via Tailscale for development and collaboration purposes.

## Changes Made
- Updated the `API_URL` constant in all relevant screen files from the remote production URL to the local Tailscale IP address.
- **Initial URL:** `https://manageit-test-api.coeofjrmsu.com/api` (remote)
- **First attempt:** `http://100.82.99.76:3000/api` (Tailscale IP with port 3000)
- **Final URL:** `http://100.82.99.76:8000/api` (Tailscale IP with Laravel port 8000)

## Files Modified
The following files were updated:
- `app/LoginScreen.jsx`
- `app/screens/AssignScheduleScreen.jsx`
- `app/screens/DashboardScreen.jsx`
- `app/screens/FeedbackScreen.jsx`
- `app/screens/NotificationsScreen.jsx`
- `app/screens/ProfileScreen.jsx`
- `app/screens/ReviewRequestsScreen.jsx`
- `app/screens/SignUpScreen.jsx`
- `app/screens/SubmitRequestScreen.jsx`
- `app/screens/ViewRequestStatusScreen.jsx`

## Prerequisites
- Tailscale must be installed and running on both the backend host machine and the client machine.
- Both machines must be connected to the same Tailscale tailnet.
- Laravel backend running with: `php artisan serve --host=0.0.0.0 --port=8000`
- The database (if separate) must be accessible via the Tailscale network.

## Usage
- Run the app locally: `npx expo start -c`
- Or with tunnel for remote sharing: `npx expo start --tunnel`
- API calls will now route to the local backend via Tailscale at `http://100.82.99.76:8000/api`.
- Ensure the backend developer has confirmed the Tailscale IP and port.

## Errors Encountered and Solutions

### 1. **Timeout Error (6000ms exceeded)**
**Error:** "Cannot connect to server. Check your connection."
**Cause:** API calls timing out when reaching the backend.
**Resolution:** 
- Initial assumption was port 3000 was incorrect.
- Backend developer confirmed backend was running on port 8000 with Laravel's `php artisan serve --host=0.0.0.0 --port=8000`.
- Updated all API URLs from port 3000 to port 8000.

### 2. **Tunnel Connection Error**
**Error:** `CommandError: TypeError: Cannot read properties of undefined (reading 'body')`
**Cause:** Tunnel service failure, likely ngrok/Expo tunnel service outage or network interruption.
**Solutions:**
- Restart without tunnel: `npx expo start -c` (local mode)
- Retry tunnel: `npx expo start --tunnel` (may resolve if service was temporarily down)
- Clear cache and retry: `npx expo start -c --tunnel`
- Check [https://status.ngrok.com/](https://status.ngrok.com/) for service outages

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Cannot connect to server" | Verify backend is running on `100.82.99.76:8000`. Confirm Tailscale is connected. |
| Timeout errors | Backend is slow or unresponsive. Restart the Laravel server. |
| Networking errors | Check Tailscale connection on both machines. Ping the Tailscale IP: verify connectivity. |
| Port mismatch | Confirm backend port matches API URL (currently 8000). Update all files if changed. |
| Tunnel fails | Try local mode (`npx expo start -c`) or wait and retry tunnel. Check ngrok status. |

## Reverting to Remote Backend
To switch back to the production remote backend:
1. Change the `API_URL` constant back to `"https://manageit-test-api.coeofjrmsu.com/api"` in all modified files.
2. Restart the app.

## Notes
- This setup is intended for development and testing.
- Backend must be running before the app attempts API calls.
- For production, ensure the remote backend is secure.
- If the backend port changes, update the URL in all 10 files accordingly.
- Tailscale setup: Install Tailscale, sign in, and ensure both dev machines are on the same tailnet.

## Backend .env (Group 2)
- In the Group 2 backend repository (`gsobackend`), set line 5 in `.env`:
  - `APP_URL=http://100.82.99.76:8000`
- This ensures Laravel generates URLs using the proper Group 2 Tailscale IP and port.

## Additional status check (after 404 resolved)
- `curl http://100.82.99.76:8000/api` returned 404 -> backend is reachable, route path is likely different.
- Verify route root with Group 2 by running `php artisan route:list` and choose appropriate endpoint (e.g. `/api/v1/...` or `/api/login`).
- Update `API_URL` in mobile app accordingly when route prefix is known.