# Frontend Prompt: "Submitted By" Now Includes Full Name

## What Changed

The `GET /api/maintenance-requests` endpoint now returns a `submitted_by` object on every request in the list. This is the name and ID of the person who submitted the form.

## Before
```json
{
  "id": 94,
  "requesting_personnel": 85,
  ...
}
```
The frontend read `requesting_personnel` (just a user ID) and showed "null" or nothing for the submitter's name.

## After
```json
{
  "id": 94,
  "requesting_personnel": 85,
  "submitted_by": {
    "id": 85,
    "first_name": "Mc Laurence",
    "last_name": "Butuan"
  },
  ...
}
```

## What You Need to Do

On the **Review Requests** screen (the list view), wherever you display "Submitted by:" or the requester name, change the logic:

**Current (broken):**
```jsx
<Text>{item.requesting_personnel}</Text>       // shows "85" or null
```

**Fixed:**
```jsx
<Text>{item.submitted_by?.first_name} {item.submitted_by?.last_name}</Text>
// Shows: "Mc Laurence Butuan"
```

## Also Show the ID if Needed

The `submitted_by.id` is also available for display or internal use:
```jsx
<Text>ID: {item.submitted_by?.id}</Text>
```

## Backward Compatibility

The old `requesting_personnel` field (raw user ID) is still present. You can safely switch to the new `submitted_by` object without breaking anything else.