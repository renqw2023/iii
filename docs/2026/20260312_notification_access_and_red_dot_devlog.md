# 2026-03-12 Notification Access And Red Dot Dev Log

## Goal

Improve notification usability in two ways:

- fix notification dropdown text that was leaking raw i18n keys such as `notifications.markAllRead`
- make notifications reachable outside the homepage by exposing them from the avatar menu in the sidebar

The requested interaction model was:

- avatar button shows a red dot when there are unread notifications
- opening the avatar menu shows a `Dashboard ->` secondary entry
- the dashboard flyout contains a `Notifications` entry
- unread status is also visible inside that avatar/dashboard path

## Problem Summary

Two separate issues were observed during testing.

### 1. Notification dropdown text used the wrong translation keys

The bell dropdown in `client/src/components/UI/NotificationDropdown.js` used keys such as:

- `notifications.markAllRead`
- `notifications.viewAll`
- `notifications.empty`

But the translation module is structured under:

- `notifications.actions.markAllRead`
- `notifications.actions.viewAll`
- `notifications.empty.noNotifications`

Because of that mismatch, users saw raw keys rendered in the UI instead of readable labels.

### 2. Notifications were effectively homepage-only

The bell dropdown lives in the top header, so on other internal app surfaces the user could lose a clear notification entry point.

That created a discoverability problem:

- unread notifications existed
- but there was no strong persistent path to reach them from the sidebar/avatar surface

## Files Changed

- `E:\\pm01\\client\\src\\components\\UI\\NotificationDropdown.js`
- `E:\\pm01\\client\\src\\components\\Layout\\Sidebar.js`
- `E:\\pm01\\tasks\\todo.md`
- `E:\\pm01\\tasks\\lessons.md`

## Implementation Details

### 1. Notification dropdown translation fallback repair

File:

- `E:\\pm01\\client\\src\\components\\UI\\NotificationDropdown.js`

Changes:

- added a small `text(key, fallback)` helper
- if `t(key)` returns the key itself, the component now falls back to readable copy
- corrected the dropdown to use:
  - `notifications.actions.markAllRead`
  - `notifications.actions.markAsRead`
  - `notifications.actions.delete`
  - `notifications.actions.viewAll`
  - `notifications.empty.noNotifications`

Result:

- the bell dropdown now shows real readable labels instead of raw translation keys
- the component remains resilient even if a translation key is missing in one locale

### 2. Avatar button unread red dot

File:

- `E:\\pm01\\client\\src\\components\\Layout\\Sidebar.js`

Changes:

- connected the sidebar to `useNotifications()`
- read `unreadCount` directly from the notifications context
- added a red-dot badge to the avatar trigger when `unreadCount > 0`

Result:

- unread notifications are now visible even before opening the account menu

### 3. Dashboard secondary menu in avatar popup

File:

- `E:\\pm01\\client\\src\\components\\Layout\\Sidebar.js`

Changes:

- converted the previous direct `Dashboard` link into a flyout trigger
- added a right-arrow secondary menu interaction
- added a dashboard submenu with:
  - `Overview` -> `/dashboard`
  - `Notifications` -> `/notifications`

Result:

- notifications are reachable from the avatar menu on non-home pages
- dashboard-related account navigation is grouped more clearly

### 4. Red-dot propagation inside the avatar menu

File:

- `E:\\pm01\\client\\src\\components\\Layout\\Sidebar.js`

Changes:

- added unread red-dot indicator on the top-level `Dashboard` trigger
- added unread red-dot indicator on the nested `Notifications` entry

Result:

- the user now gets a consistent unread signal:
  - on the avatar
  - inside the opened account menu
  - inside the dashboard submenu

## UX Outcome

After this change:

1. A user receives a new notification
2. The avatar shows a red dot
3. The user opens the avatar menu
4. `Dashboard` also shows a red dot and reveals a secondary arrow menu
5. The user opens the submenu and sees `Notifications` with a red dot
6. The user can navigate to `/notifications` even when the top-right bell is not the main interaction surface

## Verification

Completed:

- `node --check E:\\pm01\\client\\src\\components\\UI\\NotificationDropdown.js`
- `node --check E:\\pm01\\client\\src\\components\\Layout\\Sidebar.js`
- `npm run build` in `E:\\pm01\\client`

Build result:

- build succeeded
- existing unrelated ESLint warnings remain in:
  - `src/components/Gallery/GalleryCard.js`
  - `src/components/Layout/Sidebar.js`
  - `src/components/UI/Img2PromptPanel.js`
  - `src/pages/Seedance/SeedanceList.js`
- those warnings were pre-existing or outside the scope of this notification work

Not completed:

- browser MCP verification

Reason:

- the current session still does not expose the browser MCP server required by the project workflow instructions

## Commit In This Step

- `3e041ee` `Improve notification access in sidebar`

## Notes

- This change did not modify backend notification generation logic.
- This change focused only on notification visibility, entry points, and text correctness in the client UI.
