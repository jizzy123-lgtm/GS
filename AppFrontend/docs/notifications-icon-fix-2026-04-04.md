# Notifications Icon Fix

**Date:** April 4, 2026
**Scope:** Fixed broken notification icons in `NotificationsScreen.jsx`.

## 1) Issues Fixed

### Issue 1 — Corrupted Emoji Characters

The `ICONS` constant and empty-state/modal icons were stored as raw emoji strings. The file had been saved with incorrect encoding (UTF-8 bytes read as Latin-1), causing characters like `🔔` to render as `dŸ""` in the app.

**Before:**
```js
const ICONS = { approved: "âœ…", disapproved: "âŒ", completed: "ðŸŽ‰", ... default: "ðŸ""" };
```

### Issue 2 — Director and Request Notifications Showing Wrong Icon

The `getIcon` function matched notification type strings against keyword keys in `ICONS`. Director notifications (type strings containing `"approved"`) were showing `checkmark-circle` and Request notifications (type strings containing `"pending"`) were showing `time`, while Admin/Staff/Head notifications fell through to the default bell — causing visual inconsistency.

## 2) Changes Made

### File: `app/screens/NotificationsScreen.jsx`

**1. Replaced emoji strings with `Ionicons` (from `@expo/vector-icons`)**

Font-based vector icons cannot be corrupted by file encoding issues.

| Old emoji | Ionicons name | Type |
|-----------|--------------|------|
| ✅ | `checkmark-circle` | approved |
| ❌ | `close-circle` | disapproved |
| 🎉 | `ribbon` | completed |
| ⏳ | `time` | pending |
| 💬 | `chatbubble` | feedback |
| 📅 | `calendar` | schedule |
| 🔔 | `notifications` | default |
| 🔕 | `notifications-off` | empty state |

**2. Added `director` and `request` entries at the top of `ICONS`**

Both map to `"notifications"` (bell) and are placed before `approved`/`pending` so they match first, ensuring Director and Request notifications display the same icon as Admin, Staff, and Head.

```js
const ICONS = {
  director: "notifications",
  request: "notifications",
  approved: "checkmark-circle",
  ...
};
```

## 3) Why Vector Icons

`@expo/vector-icons` (already a project dependency at `^15.0.3`) renders icons from a font file — not Unicode code points in source strings — so encoding, copy-paste, or editor issues cannot corrupt them.

## 4) Validation

- Lint: 0 errors, 0 new warnings introduced.
- All icon render sites updated: card list, empty state, modal.
