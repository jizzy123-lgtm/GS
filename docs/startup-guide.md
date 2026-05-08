# GSU Gateway - Startup & Tester Onboarding Guide

This document outlines the exact steps required to boot up the application with full Push Notification support, as well as how to quickly onboard new remote testers.

---

## Part 1: Developer Startup (Server Side)

To ensure push notifications and backend API calls work perfectly for remote users, you must start up both your Backend and your Frontend.

### 1. Start the Laravel Backend
Ensure your PHP server (XAMPP/Laragon) is running. If your tester is **not** using Tailscale, you must expose your backend to the public internet using `ngrok`:
```bash
ngrok http 8000
```
*Note: If you use ngrok, make sure to update `api.js` with the new public URL before starting the frontend.*

### 2. Start the Frontend Server
Because push notifications require native Firebase code, you must boot the specialized Development Client server using a tunnel:
```bash
npx expo start --dev-client --tunnel -c
```
Once it says "Tunnel ready" and prints the QR code, look for the special `exp.direct` link sitting right beneath the QR code (e.g., `https://xxxx-manageit-8081.exp.direct`). **Save this link to give to your testers.**

---

## Part 2: New User / Tester Onboarding

If a new user wants to test the app on their physical Android phone, send them these instructions.

### Step 1: Install the Custom App
They cannot use the standard "Expo Go" app from the Play Store. They must download your custom `.apk` that contains the secure Firebase code.
1. Send them the link to your latest EAS Build (or the direct `.apk` file).
2. Have them download and tap the file to install it. *(If Android warns about "Unknown Sources", they must click 'Allow' or 'Install Anyway')*.

### Step 2: Connect to the Server
1. Open the newly installed **MyApp** (or GSU Gateway) on their Android phone.
2. In the text box on the screen that says `http://localhost:8081`, have them type in the **Tunnel Link** you grabbed during your Developer Startup (e.g., `https://xxxx-manageit-8081.exp.direct`).
3. Tap the **Connect** button below the text box.

### Step 3: Be Patient on the First Load!
**Warning your testers:** Because they are downloading the uncompressed developer code over a free tunnel, the very first load will take **2 to 4 minutes**. Tell them to keep the screen active while the green loading bar finishes.
*(Good news: They only have to wait this long once! Future edits load instantly).*

### Step 4: Log In and Test
Once the app loads, have them type in their credentials and click **Login** or **Sign Up**. 
* The exact second they successfully log in, their phone will automatically fetch their Expo Push Token and register it with your Laravel backend.
* If a new account is created, or an admin event happens, they will now successfully receive Messenger-style dropdown notifications natively on their phone!
