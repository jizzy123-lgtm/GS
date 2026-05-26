# GSU Gateway - Mobile App Setup Guide

> This guide is intended for **developers and new team members** who need to set up and run the GSU Gateway mobile application locally.

**Branch:** APRIL_MOBILE_FINAL
**Platform:** Android, iOS, Web (React Native + Expo)

---

## Prerequisites

Make sure the following are installed on your machine:

| Tool | Version | Purpose |
|---|---|---|
| Node.js | v18 or higher | JavaScript runtime |
| npm | v9 or higher | Package manager |
| Expo CLI | Latest | Run the mobile app |
| Git | Latest | Clone the repository |

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/jizzy123-lgtm/GS.git
cd GS
git checkout APRIL_MOBILE_FINAL
```

---

## Step 2: Install Dependencies

```bash
npm install
```

---

## Step 3: Configure the Backend URL

1. Open `api.js` in the root directory
2. Replace `<SERVER_IP>` with the actual backend server IP (via Tailscale or ngrok)

```js
const BASE_URL = 'http://<SERVER_IP>:8000/api';
```

> **Note:** The backend is hosted on a team member's local machine and shared via Tailscale VPN. Contact the backend team for the current server IP.

---

## Step 4: Start the App

```bash
npx expo start
```

Then choose your platform:
- Press `a` — Android emulator
- Press `w` — Web browser
- Scan QR code — Expo Go on physical device

---

## Step 5: Build APK (Optional)

To generate a distributable APK for Android:

```bash
eas build --platform android --profile preview
```

---

## Test Credentials

| Role | Username | Password |
|---|---|---|
| Admin | admin123 | password123 |
| Staff | staff | password123 |
| Head | head | password123 |
| Director | director | password123 |

---

## API Documentation

- [View on Postman](https://documenter.getpostman.com/view/54234949/2sBXqFPP2G)
- [Postman Collection](./GSU%20GATEWAY%20API.postman_collection.json) — import in Postman for local testing

---

## Troubleshooting

| Issue | Solution |
|---|---|
| Cannot connect to backend | Check Tailscale connection or ask backend team for current IP |
| Push notifications not working | Must use Expo Dev Client build, not Expo Go |
| Dependencies error | Delete `node_modules` folder and run `npm install` again |