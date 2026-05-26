# Frontend Prompt: Admin Maintenance Types CRUD

## Overview
Build a screen for the **Admin** role (role_id=1) to manage maintenance types — add new types, rename existing ones, and delete them. This is currently missing from the frontend.

## Backend API (Already Done)

All endpoints are **public** (no auth required). Authorization is handled internally by the controller — only admins can create/update/delete, but anyone can view the list.

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/api/maintenance-types` | Public | List all active types |
| `GET` | `/api/maintenance-types/{id}` | Public | Get a single type |
| `POST` | `/api/maintenance-types` | Admin only | Create new type |
| `PUT` | `/api/maintenance-types/{id}` | Admin only | Update type name |
| `DELETE` | `/api/maintenance-types/{id}` | Admin only | Soft-delete a type |

### Request/Response Examples

**GET /api/maintenance-types**
```json
[
  { "id": 1, "type_name": "Janitorial", "created_at": null, "updated_at": null, "deleted_at": null },
  { "id": 2, "type_name": "Carpentry", ... }
]
```

**POST /api/maintenance-types**
```
Body: { "type_name": "Plumbing" }
Response 201: { "message": "Maintenance type successfully added.", "data": { "id": 6, "type_name": "Plumbing" } }
Error 403: { "message": "Only Admins can add maintenance types." }
Error 422: { "message": "...", "errors": { "type_name": ["The type name has already been taken."] } }
```

**PUT /api/maintenance-types/{id}**
```
Body: { "type_name": "Plumbing Repairs" }
Response 200: { "message": "Maintenance type successfully updated.", "data": { ... } }
```

**DELETE /api/maintenance-types/{id}**
```
Response 200: { "message": "Maintenance type successfully removed." }
```

## What to Build

### 1. Admin-Only Access
- Only users with `role_id === 1` can see this screen/button
- Hide it from all other roles (staff, head, director, requester)

### 2. List View
- Fetch all types from `GET /api/maintenance-types`
- Display them in a simple list (or table/card layout)
- Each row shows: type name, an Edit button, a Delete button

### 3. Add New Type
- An "Add Type" button at the top opens a modal or inline form
- Single text input for `type_name` (required, max 255 chars)
- On submit: `POST /api/maintenance-types` with `{ "type_name": "..." }`
- On success: refresh the list

### 4. Edit Type
- Edit button on each row opens the type name in an editable input or modal
- On submit: `PUT /api/maintenance-types/{id}` with `{ "type_name": "..." }`
- On success: refresh the list

### 5. Delete Type
- Delete button on each row
- Show a confirmation dialog before deleting
- On confirm: `DELETE /api/maintenance-types/{id}`
- On success: remove from list (soft-deleted, disappears from view)

### 6. Error Handling
- Show validation errors from the API (e.g., "The type name has already been taken.")
- Show auth errors if a non-admin somehow reaches the screen
- Show loading states

## UX Notes
- Keep it simple — a modal or expandable form is fine
- The type name must be unique (enforced by backend)
- Deleted types are soft-deleted — they still exist in DB but won't appear in the list
- Backend currently has 4 active types: Janitorial, Carpentry, Electrical, Airconditioning

## Implementation Notes
- Use `useState` for `types` array, `loading`, `error`
- Use `useEffect` to fetch types on mount
- Use a text input + submit button for add/edit
- For delete confirmation, a simple `Alert.alert` (React Native) or modal works