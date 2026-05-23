# Role ID Handling Analysis Report (Frontend)

**Date:** April 3, 2026  
**Scope:** React Native mobile frontend in `C:\Users\ACER\GSUApp`

## 1. Target Role Mapping (Requested)

The app should consistently map and display:

1. `role_id = 1` -> `System Admin`
2. `role_id = 2` -> `Head`
3. `role_id = 3` -> `Staff`
4. `role_id = 4` -> `Requester`
5. `role_id = 5` -> `Campus Director`

## 2. Current Implementation Findings

### Finding A: Display labels are inconsistent and incomplete

Current shared-like mappings are duplicated and not aligned with your target labels:

1. `app/screens/DashboardScreen.jsx` uses:
   - `1: "Administrator"`
   - `2: "Head / Director"`
   - `3: "GSO Staff"`
   - `4: "Requester"`
   - `5` is missing, so Campus Director falls back to `"User"`
2. `app/screens/ProfileScreen.jsx` uses the same mapping pattern and same omissions.

Impact:

1. Head and Campus Director are merged in display (`Head / Director`).
2. Campus Director can appear as generic `User`.
3. Labels do not match the requested naming (`System Admin`, `Staff`, `Head`, `Campus Director`).

### Finding B: Role labels differ by screen

`app/screens/PendingApprovalsScreen.jsx` contains a separate hard-coded roles list:

1. `1: "Admin"`
2. `2: "Head"`
3. `3: "Staff"`
4. `4: "Requester"`
5. `5: "Campus Director"`

Impact:

1. Same `role_id` can show different labels depending on screen.
2. Frontend behaves as if multiple role dictionaries exist.

### Finding C: Action endpoint selection can mis-handle role identity

In `app/screens/ReviewRequestsScreen.jsx`, approve endpoint logic is:

1. Head (`roleId === 2`) -> `/approve-head`
2. Else -> `/approve-director`

Impact:

1. Any non-Head value defaults to Director endpoint in that branch.
2. If `role_id` is malformed or unexpected, app can hit wrong endpoint.
3. This matches role-action errors like "Head can only perform this action."

### Finding D: No centralized `role_id` normalization

`role_id` is read from login user data and compared directly across screens, but there is no global normalization step to enforce number type.

Impact:

1. Strict comparisons like `roleId === 2` are fragile if backend sends `"2"` as string.
2. Behavior can fail even when identity is logically correct.

### Finding E: Role text in workflow messaging is still mixed

`app/screens/SubmitRequestScreen.jsx` still uses mixed copy:

1. `Head/Director reviews your request`
2. `Head / Campus Director`

Impact:

1. UI language still suggests merged roles instead of clear separate roles.

## 3. Role ID Handling Assessment

Current state is **partially correct but inconsistent**:

1. Numeric role IDs are referenced in multiple screens.
2. Head (`2`) and Campus Director (`5`) are separated in some logic but merged in some labels.
3. Labeling is not canonical across the app.
4. No single source of truth exists for role IDs + role names + role checks.

## 4. Recommended Fix Model (Canonical)

### 4.1 Define one source of truth

Create one constants module used by all screens, for example:

```ts
export const ROLE_ID = {
  SYSTEM_ADMIN: 1,
  HEAD: 2,
  STAFF: 3,
  REQUESTER: 4,
  CAMPUS_DIRECTOR: 5,
} as const;

export const ROLE_LABEL = {
  1: "System Admin",
  2: "Head",
  3: "Staff",
  4: "Requester",
  5: "Campus Director",
} as const;
```

### 4.2 Normalize `role_id` at login/session boundary

When receiving `data.user` from `/login`, enforce:

1. `role_id` is numeric (`Number(data.user.role_id)`).
2. Store normalized user object in AsyncStorage and in app state.

### 4.3 Replace default-to-director branching

For approval routes, avoid generic fallback. Use explicit role checks:

1. Head -> head endpoint
2. Campus Director -> director endpoint
3. Any other role -> block action / show unauthorized UI

### 4.4 Use canonical labels everywhere

Apply `ROLE_LABEL[role_id]` consistently in:

1. Dashboard role pill
2. Profile role display
3. Pending Approvals role display
4. Any role badge or role chip

### 4.5 Keep backend-provided role names optional

If backend returns `role_name`, use it only as fallback or validation aid, not as the primary role dictionary for app logic.

## 5. High-Risk Areas To Fix First

1. `app/screens/DashboardScreen.jsx` role label mapping and missing `role_id=5` label.
2. `app/screens/ProfileScreen.jsx` role label mapping and missing `role_id=5` label.
3. `app/screens/ReviewRequestsScreen.jsx` approve endpoint branching.
4. Login/session user normalization in `app/LoginScreen.jsx`.

## 6. Evidence References

1. `app/screens/DashboardScreen.jsx` (`ROLE_LABELS`, role checks, quick actions).
2. `app/screens/ProfileScreen.jsx` (`ROLE_LABELS` and profile role display).
3. `app/screens/ReviewRequestsScreen.jsx` (`roleId` checks and approve endpoint selection).
4. `app/screens/PendingApprovalsScreen.jsx` local `ROLES` mapping.
5. `app/screens/SubmitRequestScreen.jsx` mixed Head/Director copy.
6. `app/LoginScreen.jsx` user object persistence without role normalization.

