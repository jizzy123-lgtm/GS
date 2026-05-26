# Frontend–Backend Connectivity Diagnosis Report

**Date:** May 16, 2026
**Reported By:** Backend Developer (userAlet22)
**Status:** Partially Resolved — CORS fix applied; network setup instructions issued to frontend team
**Severity:** High — Frontend developers completely unable to log in or use the API

---

## 1. Problem Statement

The frontend development team was unable to use the backend API. They were stuck on the
login screen and could not authenticate at all. The backend was being served via:

```
php artisan serve --host=0.0.0.0 --port=8000
```

The frontend team was configured to hit the backend at the Tailscale IP:

```
http://100.82.99.76:8000/api
```

---

## 2. System Environment

| Component | Detail |
|---|---|
| Backend framework | Laravel (PHP) |
| Backend server | `php artisan serve --host=0.0.0.0 --port=8000` |
| Backend Tailscale IP | `100.82.99.76` |
| Backend local IP (Wi-Fi) | `10.145.26.80` |
| Database | Local MySQL via XAMPP on port `3307` (`DB_HOST=127.0.0.1`) |
| Frontend framework | React Native / Expo (mobile app) |
| Frontend auth method | Bearer token (stored in `AsyncStorage`, sent via `Authorization: Bearer <token>`) |
| Frontend device type | **Physical phone** (iOS/Android), not a web browser |
| Frontend dev server | `http://localhost:8081` (Expo Metro bundler) |
| OS | Windows (backend machine) |

---

## 3. Investigation Scope

The following areas were scanned as part of the diagnosis:

- `.env` configuration (APP_URL, DB_HOST, SANCTUM, SESSION, CORS-related settings)
- `config/cors.php` — CORS policy
- `config/sanctum.php` — Stateful domain list
- `config/session.php` — Session driver and cookie settings
- `app/Http/Kernel.php` — Global and group middleware stack
- `app/Http/Middleware/` — All middleware files
- `routes/api.php` — All registered API routes
- `config/app.php` — App environment, debug mode, APP_URL
- Windows Firewall rules for port `8000` and `php.exe`
- Active network interfaces and Tailscale status
- `storage/logs/laravel.log` — Laravel error and activity logs
- Recent git commits (week of May 12–16, 2026)

---

## 4. Findings

### 4.1 CORS Misconfiguration (Backend Bug — Fixed)

**File:** `config/cors.php`

**Problem:**
The CORS configuration had an illegal combination:

```php
// BEFORE (broken)
'allowed_origins'      => ['*'],   // wildcard
'supports_credentials' => true,    // credentials mode
```

The [CORS specification (RFC 6454 + Fetch Standard)](https://fetch.spec.whatwg.org/#cors-protocol-and-credentials) explicitly prohibits combining a wildcard `*` origin with `Access-Control-Allow-Credentials: true`. When this combination is present, **all browsers block the request** before it reaches the server.

**Effect (web browsers/Expo Web):**
Any request from a browser-based client (including Expo Web) would trigger a preflight OPTIONS
request. The server would respond with both `Access-Control-Allow-Origin: *` and
`Access-Control-Allow-Credentials: true`, causing the browser to silently block the actual
request. The login page would appear frozen with no visible error to the end user.

**Effect (native mobile app):**
React Native on a physical device does NOT enforce browser CORS. However, the misconfiguration
is still a latent bug that would break any web-based clients (Postman Web, Expo Web, browser
testing, future web frontend) and was corrected proactively.

**Fix Applied:**

```php
// AFTER (fixed)
'supports_credentials' => false, // Must be false when allowed_origins is '*'.
                                  // Bearer token auth does NOT require credentials=true.
                                  // Only SPA cookie-based auth needs this set to true.
```

**Why `false` is correct:**
The frontend uses **Bearer token authentication**, not SPA session cookies. Bearer tokens are
attached manually in the `Authorization` header — they do not use browser cookie mechanisms.
Therefore, `supports_credentials` is not needed and must be `false` to remain compatible with
a wildcard allowed origin.

**Config cache cleared after fix:**
```
php artisan config:clear
```

---

### 4.2 Root Cause — Tailscale Network Isolation (Environment Issue)

**This is the primary reason the native mobile app cannot reach the backend.**

**How Tailscale works:**
Tailscale creates a **private, encrypted peer-to-peer VPN mesh network**. The IP address
`100.82.99.76` is a **Tailscale-assigned virtual IP** — it is NOT a public internet IP and it
is NOT accessible over a regular Wi-Fi or mobile data connection.

The Tailscale IP `100.x.x.x` range is only routable **between devices that are:**
1. Installed with the Tailscale client
2. Logged into the **same Tailscale account / tailnet**
3. Currently connected (VPN active)

**The problem:**
The frontend developers' phones did not have Tailscale installed or configured. From the
perspective of their devices, the IP `100.82.99.76` simply **does not exist** — it is not
reachable via the internet or local Wi-Fi. Every API call would time out silently, making the
app appear stuck on the login screen.

**Evidence:**
- Laravel logs had no entries after May 2, 2026 — confirming zero incoming requests from
  frontend devices were received by the backend server
- `php artisan serve` was verified as running with `netstat`, showing `0.0.0.0:8000 LISTENING`
- All firewall rules were confirmed open (PHP and port 8000 both set to Allow, Any-to-Any)
- The only conclusion was that requests never reached the machine at the network layer

---

### 4.3 Sanctum Stateful Domains (Minor — Not the Active Cause)

**File:** `config/sanctum.php`

The runtime stateful domains list was:
```
["localhost","localhost:3000","127.0.0.1","127.0.0.1:8000","::1","100.82.99.76:8000"]
```

The frontend developers' Tailscale IPs are not listed here. This would affect **SPA session
cookie authentication only**. Since the frontend uses Bearer tokens, this is not the active
cause of the failure — but it is a known gap if auth mode ever changes.

---

### 4.4 Git Commit — May 13, 2026 (Reviewed, Not a Direct Cause)

**Commit:** `501e09dd` — `feat: update backend application`

This commit (pushed Tuesday, May 13, 2026) introduced:
- `GoogleAuthController.php` — Google OAuth token verification and registration
- `ForgotPasswordController.php` — Password reset via email
- New migrations: `make_email_unique_in_users_table`, `add_google_fields_to_users_table`,
  `add_soft_deletes_to_maintenance_types_table`
- New routes for `/api/auth/google/verify`, `/api/auth/google/register`,
  `/api/auth/check-username`, `/api/forgot-password`, `/api/reset-password`

**Assessment:** None of these changes broke existing login functionality. The standard
`/api/login` route was untouched. The new migrations add nullable columns and constraints that
do not affect existing login records. This commit was not the cause of the frontend issue.

---

## 5. Windows Firewall Status

| Rule | Direction | Action | Scope |
|---|---|---|---|
| `php.exe` | Inbound | **Allow** | Any → Any |
| `php.exe` | Inbound | **Allow** | Any → Any |
| `port8000` | Inbound (TCP) | **Allow** | Port 8000 |

**Conclusion:** Windows Firewall is NOT blocking the backend. Firewall is fully open for PHP
and port 8000 from any remote address.

---

## 6. Network Interface Map (Backend Machine)

| IP Address | Interface |
|---|---|
| `127.0.0.1` | Loopback |
| `10.145.26.80` | Wi-Fi (local network) |
| `100.82.99.76` | **Tailscale** (virtual VPN IP) |
| `169.254.x.x` | Link-local (auto-config, not routable) |

---

## 7. Resolution Steps

### 7.1 Backend Fix (Completed ✅)

**File changed:** `config/cors.php`

```diff
- 'supports_credentials' => true,
+ 'supports_credentials' => false, // Bearer token auth; wildcard origin requires false
```

Then ran:
```bash
php artisan config:clear
```

No server restart required — `config:clear` is sufficient for development mode.

---

### 7.2 Frontend Team Action Required

The frontend developers must complete the following steps to connect to the backend:

**Step 1: Install Tailscale on all development devices**

- iOS: [App Store — Tailscale](https://apps.apple.com/app/tailscale/id1470499037)
- Android: [Play Store — Tailscale](https://play.google.com/store/apps/details?id=com.tailscale.ipn.android)
- Windows/Mac (if testing on emulator): [tailscale.com/download](https://tailscale.com/download)

**Step 2: Join the shared Tailscale network**

The backend developer must either:
- Share the Tailscale account credentials, OR
- Send an invite link via the [Tailscale Admin Console](https://login.tailscale.com/admin)

All team devices must be in the **same tailnet** (Tailscale network).

**Step 3: Enable Tailscale VPN on the device**

Open the Tailscale app and toggle the connection ON before launching the mobile app.

**Step 4: Verify connectivity**

Open a browser on the device and navigate to:
```
http://100.82.99.76:8000/api/test
```

Expected response:
```json
{"message": "API is working!"}
```

If this works, the login endpoint will also work.

---

### 7.3 Backend — Ensure Server Is Running

Before each development session, start the backend with:

```bash
php artisan serve --host=0.0.0.0 --port=8000
```

> ⚠️ **Important:** The `--host=0.0.0.0` flag is mandatory. Without it, the server only
> listens on `127.0.0.1` (localhost) and is **not accessible** from any other device,
> including Tailscale peers.

---

## 8. Login Flow (For Reference)

The following is the confirmed login flow between the mobile app and backend:

```
[Mobile App]
    │
    ├─ POST http://100.82.99.76:8000/api/login
    │   Body: { username, password, latitude, longitude }
    │   Headers: { Accept: "application/json" }
    │
[Laravel Backend — routes/api.php]
    │
    ├─ Route::post('/login', [UserController::class, 'login'])  ← no auth middleware
    │
[UserController@login]
    │
    ├─ Validates credentials
    ├─ Checks status_id (1=Pending, 3=Disapproved → returns 403)
    ├─ Creates Sanctum token: $user->createToken('authToken')->plainTextToken
    ├─ Optionally logs login location (if tracking is enabled)
    │
    └─ Returns: { token: "...", user: {...} }   ← HTTP 200

[Mobile App]
    │
    ├─ Extracts data.token
    ├─ Saves to AsyncStorage
    └─ Attaches to all future requests:
       Headers: { Authorization: "Bearer <token>", Accept: "application/json" }
```

---

## 9. Known Remaining Gaps (Not Blocking, but Noted)

| # | Gap | File | Notes |
|---|---|---|---|
| 1 | Sanctum stateful domains missing frontend IPs | `config/sanctum.php` | Only relevant for SPA/cookie auth — not Bearer token mode. No action needed unless auth mode changes. |
| 2 | `SESSION_DOMAIN` is null | `.env` | Fine for token auth. Would need updating for cross-domain SPA cookie auth. |
| 3 | `SANCTUM_STATEFUL_DOMAINS` not set in `.env` | `.env` | Defaulting to localhost variants. Acceptable for current Bearer token setup. |

---

## 10. Lessons Learned

1. **CORS `supports_credentials: true` requires explicit origins, never `*`.** These two
   settings are mutually exclusive by the browser security specification. This is a common
   mistake in Laravel setups.

2. **Tailscale IPs are private VPN IPs, not public IPs.** All team members who need to
   access a Tailscale-hosted backend must have Tailscale installed and be joined to the
   same tailnet. This must be communicated during project onboarding.

3. **"Stuck on login screen" does not always mean a code bug.** Network-layer failures
   (unreachable host, Tailscale not connected) silently present as login failures in mobile
   apps. Always verify raw network connectivity first (e.g., ping or browser test) before
   debugging application code.

4. **Check Laravel logs early.** The absence of any log entries from the expected time period
   is a strong signal that requests are not reaching the server at all — pointing to network
   or firewall issues rather than application bugs.

---

*Document created: 2026-05-16 by backend developer (userAlet22)*
*Last updated: 2026-05-16*
