# GSU Gateway — User Manual

**Application:** GSU Gateway Mobile App
**Version:** 1.0
**Platform:** Android, iOS
**Prepared by:** Nice Mia Lagas — Documentation Specialist
**Organization:** Jose Rizal Memorial State University — College of Engineering

---

## Table of Contents

1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
   - [Register an Account](#register-an-account)
   - [Log In](#log-in)
3. [Requester Guide](#requester-guide)
4. [Staff Guide](#staff-guide)
5. [Head Guide](#head-guide)
6. [Campus Director Guide](#campus-director-guide)
7. [Admin Guide](#admin-guide)
8. [Notifications](#notifications)
9. [Profile Management](#profile-management)
10. [Troubleshooting](#troubleshooting)

---

## 1. Introduction

**GSU Gateway** is a mobile application developed for the General Services Office (GSO) of Jose Rizal Memorial State University (JRMSU). It manages the complete lifecycle of facility and equipment maintenance requests — from submission through approval, scheduling, and completion.

### User Roles

| Role | Description |
|---|---|
| **Requester** | Submits maintenance requests |
| **Staff** | Verifies requests and assigns schedules |
| **Head** | Reviews and approves or disapproves requests |
| **Campus Director** | Provides final approval authority |
| **Admin** | Manages user accounts |

---

## 2. Getting Started

### Register an Account

1. Open the GSU Gateway app.
2. On the Login screen, tap **Register**.

> *[Screenshot: Login Screen]*

3. Fill in your full name, email, password, and select your role.
4. Tap **Submit**.

> *[Screenshot: Register Screen]*

5. A confirmation message will appear: **"Registration Submitted. Please wait for admin approval."**

> *[Screenshot: Registration Submitted Confirmation]*

> **Note:** Your account must be approved by an Admin before you can log in. You will receive a push notification once your account is activated.

---

### Log In

1. Enter your registered email and password.
2. Tap **Login**.
3. You will be redirected to your role-specific dashboard.

> *[Screenshot: Login Screen]*

---

## 3. Requester Guide

As a **Requester**, you can submit maintenance requests for facilities or equipment.

### View Your Dashboard

After logging in, your dashboard shows:
- Overview of your submitted requests
- Status of each request (Pending, Approved, Rejected, Done)

> *[Screenshot: Requester Dashboard]*

### Submit a New Request

1. From your dashboard, tap **New Request**.
2. Fill in the request form:
   - **Title** — brief description of the issue
   - **Location** — where the issue is located
   - **Description** — detailed explanation of the problem
   - **Priority** — Low, Medium, or High
3. Tap **Submit**.

> *[Screenshot: New Request Form]*

4. A confirmation screen will appear: **"Request Submitted Successfully."**

> *[Screenshot: Request Submitted Confirmation]*

### Track Your Request

- Your submitted request will appear in your dashboard with a **Pending** status.
- Status updates as staff and approvers act on your request.
- You will receive push notifications at each status change.

---

## 4. Staff Guide

As **Staff**, your role is to verify incoming maintenance requests and assign schedules after approval.

### View Your Dashboard

Your dashboard displays:
- Incoming requests assigned for verification
- Requests pending schedule assignment

> *[Screenshot: Staff Dashboard]*

### Verify a Request

1. From the dashboard, tap a request to open its details.
2. Review the request information.
3. Tap **Verify** to forward the request for approval, or **Deny** to reject it.

> *[Screenshot: Staff Request Details — Verify/Deny]*

### Assign a Schedule

Once a request is approved by the Head and Campus Director:

1. Open the approved request.
2. Tap **Assign Schedule**.
3. Select the date and time for the maintenance work.
4. Tap **Confirm**.

> *[Screenshot: Assign Schedule Screen]*

5. A confirmation will appear: **"Schedule Assigned Successfully."**

> *[Screenshot: Schedule Assigned Confirmation]*

---

## 5. Head Guide

As the **Head**, you review verified requests and decide to approve or disapprove them.

### View Your Dashboard

Your dashboard shows:
- Requests pending your review
- History of approved and disapproved requests

> *[Screenshot: Head Dashboard]*

### Approve or Disapprove a Request

1. Tap a request to view its details.
2. Review the submitted information.
3. Tap **Approve** to forward it to the Campus Director, or **Disapprove** to reject it.

> *[Screenshot: Head Request Details — Approve/Disapprove]*

---

## 6. Campus Director Guide

As the **Campus Director**, you provide the final approval for maintenance requests.

### View Your Dashboard

Your dashboard shows requests forwarded by the Head, pending your final decision.

> *[Screenshot: Campus Director Dashboard]*

### Final Approval

1. Tap a request to view its full details.
2. Tap **Approve** to authorize the maintenance work, or **Disapprove** to reject it.

> *[Screenshot: Director Request Details]*

---

## 7. Admin Guide

As the **Admin**, you manage all user accounts on the platform.

### View the Admin Dashboard

Your dashboard provides an overview of all system activity and account management options.

> *[Screenshot: Admin Dashboard]*

### Approve New Accounts

1. Go to **Account Approvals**.
2. Review pending registrations.
3. Tap **Approve** to activate an account, or **Reject** to deny access.

> *[Screenshot: Account Approvals Screen]*

---

## 8. Notifications

GSU Gateway sends push notifications to keep you updated at every stage of a request.

| Event | Who Gets Notified |
|---|---|
| New request submitted | Staff |
| Request verified | Head |
| Request approved by Head | Campus Director |
| Request fully approved | Staff (to assign schedule) |
| Schedule assigned | Requester |
| Request marked Done | Requester |
| Account approved | New user |

> **Note:** Notifications require the Expo Dev Client build. They do not work in Expo Go.

---

## 9. Profile Management

You can update your profile information within the app.

1. Tap the **Profile** icon from any screen.
2. Edit your name, email, or password as needed.
3. Tap **Save** to apply changes.

---

## 10. Troubleshooting

| Issue | Solution |
|---|---|
| Cannot log in after registering | Wait for Admin approval. You will receive a notification when your account is activated. |
| Request stuck at Pending | Contact your Staff member to verify the request. |
| Not receiving notifications | Make sure notifications are enabled in your phone settings. Expo Dev Client build required. |
| App not connecting to server | Check your internet connection. The backend requires Tailscale (dev) or a live server connection. |
| Forgot password | Contact your Admin to reset your account credentials. |

---

*GSU Gateway — General Services Office, Jose Rizal Memorial State University*
*Documentation maintained by Nice Mia Lagas*