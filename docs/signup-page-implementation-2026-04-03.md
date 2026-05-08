# Signup Page Implementation Report

**Date:** April 3, 2026  
**File Updated:** `app/screens/SignUpScreen.jsx`

## Scope
Implemented the requested signup behavior updates while keeping the existing password rules unchanged.

## Before Change (Code Snapshot)

### 1. Static work data (not from API)
```jsx
const OFFICES = [
  { id: 1, label: "College of Engineering" },
  { id: 2, label: "College of Maritime Education" },
  { id: 3, label: "College of Nursing and Allied Health Sciences" },
  { id: 4, label: "School of Midwifery" },
  { id: 5, label: "College of Teacher Education" },
  { id: 6, label: "College of Business Administration" },
  { id: 7, label: "College of Computer Studies" },
  { id: 8, label: "College of Liberal Arts Mathematics and Sciences" },
  { id: 9, label: "General Service Office" },
];

const POSITIONS = [
  { id: 1, label: "Faculty" },
  { id: 2, label: "Staff" },
];

const ROLES = [
  { id: 1, label: "Admin" },
  { id: 2, label: "Head" },
  { id: 3, label: "Staff" },
  { id: 4, label: "Requester" },
  { id: 5, label: "Campus Director" },
];
```

### 2. Email was required and contact had no strict format check
```jsx
if (!form.email.trim()) { setError("Email address is required."); return; }
if (!form.contact_number.trim()) { setError("Contact number is required."); return; }
```

### 3. Role was always selectable (no College-of lock logic)
```jsx
<DropdownField
  label="Select Role"
  value={ROLES.find(r => r.id === form.role_id)?.label || ""}
  options={ROLES.map(r => r.label)}
  onSelect={v => set("role_id", ROLES.find(r => r.label === v)?.id)}
/>
```

### 4. Register payload was sent as raw `form`
```jsx
body: JSON.stringify(form)
```

### 5. Backend error rendering showed only the first validation message
```jsx
const first = Object.values(data.errors)[0];
setError(Array.isArray(first) ? first[0] : first);
```

## Changes Implemented

1. Added dynamic data loading from `GET /common-datas`.
2. Mapped:
   - `data.roles` -> `{ id, role_name }`
   - `data.positions` -> `{ id, name }`
   - `data.offices` -> `{ id, name }`
3. Added office-dependent role behavior:
   - If office name starts with `"College of"`:
     - Role auto-set to `role_id = 4` (Requester)
     - Role dropdown is disabled
     - Role options are restricted to Requester
4. Kept position independent from role filtering.
5. Updated validation:
   - `email` is optional
   - `contact_number` required and validated with `^09\\d{9}$`
6. Kept password logic unchanged (minimum 8 chars + number + special char).
7. Updated register payload mapping to backend schema:
   - sends `middle_name` from the middle-initial field
   - keeps optional fields omitted when blank (`middle_name`, `suffix`, `email`)
8. Improved backend error display:
   - `Object.values(data.errors).flat().join('\n')`
9. Added common-data loading UX:
   - loading indicator
   - retry button when `/common-datas` fails
   - submit button disabled while options are loading

## Current Behavior After Change

1. Signup form options are API-driven from `/common-datas`.
2. College offices automatically enforce Requester role.
3. Non-college offices allow active roles from backend response.
4. Email can be left empty.
5. Contact number must be `09` + 9 digits.
6. Register payload now matches the required key names.
7. Backend validation errors are shown in a readable multi-line format.

## Verification

Ran:
```bash
npm.cmd run lint -- app/screens/SignUpScreen.jsx
```

Result: Passed (no errors).

## Implementation Notes

1. Active role detection supports common backend patterns: `is_active`, `active`, or `status`.
2. College check uses exact prefix match: `office.name.startsWith("College of")`.
3. When switching from a college office to a non-college office, auto-forced Requester role is reset to blank so user can choose an appropriate role.
