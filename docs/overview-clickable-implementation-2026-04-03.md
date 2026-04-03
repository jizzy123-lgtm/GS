# Overview Section Change Documentation

**Date:** April 3, 2026  
**Scope:** Overview cards in dashboard (`Total`, `Pending`, `Approved`)

## Objective
Make the first three Overview cards clickable and route users to the request list with the correct pre-selected filter.

## Files Updated
1. `app/screens/DashboardScreen.jsx`
2. `app/screens/ViewRequestStatusScreen.jsx`
3. `app/(tabs)/index.tsx`
4. `app/screens/index.tsx`

## Before Change
1. `Total`, `Pending`, and `Approved` were display-only KPI cards.
2. Tapping these cards had no action.
3. `ViewRequestStatusScreen` always started with `"All"` filter when opened.
4. Navigation did not pass a filter parameter to `ViewRequestStatusScreen`.

## Implemented Changes

### 1. Made Overview KPI cards clickable
In `app/screens/DashboardScreen.jsx`, the first three KPI cards now pass `onPress` handlers:

1. `Total` -> `onNavigate("ViewRequestStatus", { filter: "All" })`
2. `Pending` -> `onNavigate("ViewRequestStatus", { filter: "Pending" })`
3. `Approved` -> `onNavigate("ViewRequestStatus", { filter: "Approved" })`

### 2. Updated KPI component to support press behavior
In `app/screens/DashboardScreen.jsx`, `KPI` now accepts `onPress`.

1. If `onPress` exists, the card renders as `TouchableOpacity`.
2. If `onPress` is missing, it renders as a normal `View`.

This keeps existing non-clickable cards working as before.

### 3. Added initial filter support in request status screen
In `app/screens/ViewRequestStatusScreen.jsx`:

1. Added `initialFilter` prop to the screen signature.
2. Added `normalizeFilter(value)` helper:
   - matches filter values case-insensitively
   - falls back to `"All"` for invalid/missing input
3. `activeFilter` state now initializes from `initialFilter`.
4. Added `useEffect` to update `activeFilter` whenever `initialFilter` changes.

### 4. Passed filter through navigation container
In both navigation container files:

1. `app/(tabs)/index.tsx`
2. `app/screens/index.tsx`

`ViewRequestStatusScreen` now receives:

```tsx
initialFilter={screenParams.filter}
```

This connects dashboard card taps to the filter chips in `ViewRequestStatus`.

### 5. Minor cleanup in dashboard error handler
In `app/screens/DashboardScreen.jsx`, catch variable changed from `e` to `_e` in one block to avoid unused-variable lint noise.

## Behavior After Change
1. Tapping `Total` opens request status with `All` selected.
2. Tapping `Pending` opens request status with `Pending` selected.
3. Tapping `Approved` opens request status with `Approved` selected.
4. Other overview card behavior remains unchanged.

## Verification
Lint command used:

```bash
npm.cmd run lint -- app/screens/DashboardScreen.jsx app/screens/ViewRequestStatusScreen.jsx app/(tabs)/index.tsx app/screens/index.tsx
```

Result:
1. `0` errors
2. `2` existing warnings (`react-hooks/exhaustive-deps`) unrelated to this feature behavior

## Notes
1. The fourth overview card (`Done`/`Rejected`) is still non-clickable by design in this change set.
2. Filter options available in `ViewRequestStatusScreen` remain: `All`, `Pending`, `Approved`, `Confirmed`, `Completed`, `Disapproved`.
