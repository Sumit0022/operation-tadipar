# Groups Feature Implementation Plan

The objective is to implement a comprehensive YPT-inspired Groups feature, enabling users to create, join, and manage study/productivity groups. It will allow viewing of fellow group members' active schedules and tasks, encouraging accountability.

## User Review Required

> [!IMPORTANT]
> The groups functionality will rely heavily on Firebase Firestore. To see other members' live schedules, their cloud sync data (`users/{uid}/data/sync`) will be read.

## Clarifications & Decisions

1. **Group Visibility:** When creating a group, the creator will choose if the group is **Public** (discoverable and open to join) or **Private** (requires an invite link or code).
2. **Data Sharing Scope:** Today's schedule will be shown by default on the group dashboard, but all group members will have the ability to click on a member and view their full public historical schedule/data.

## Proposed Changes

### Firestore Collections

We will add a new top-level collection: `groups`.
Each group document will contain:
- `id`: unique group ID
- `name`: string
- `bio`: string (optional)
- `photoURL`: string (optional)
- `isPrivate`: boolean (whether it requires an invite)
- `inviteCode`: string (6-digit alphanumeric)
- `ownerId`: user ID of the creator
- `memberIds`: array of user IDs (max 50)
- `createdAt`: timestamp

Users' existing data structure:
- `users/{uid}`
- `users/{uid}/data/sync`

---

### Core Logic & State Management

#### [NEW] `src/store/groups.ts`
Zustand store for handling group fetching, joining, creating, and fetching member data.
- `myGroups: Group[]`
- `fetchMyGroups()`
- `createGroup(name, bio, isPrivate)`
- `joinGroup(groupId, inviteCode?)`
- `leaveGroup(groupId)`
- `deleteGroup(groupId)`

---

### UI Components & Pages

#### [MODIFY] `src/App.tsx`
Add routes for `/groups`, `/groups/discover`, and `/groups/:id`.

#### [MODIFY] `src/components/layout/Sidebar.tsx` & `src/components/layout/BottomNav.tsx`
Add a "Groups" navigation link.

#### [NEW] `src/pages/Groups.tsx`
The main Groups dashboard showing a "My Groups" list.

#### [NEW] `src/pages/DiscoverGroups.tsx`
A search page to find public groups or join private ones via invite code.

#### [NEW] `src/pages/GroupDetails.tsx`
The dashboard for a specific group.
- **Header**: Group name, bio, settings, invite code (if member).
- **Members (YPT style)**: A list/grid of members with live "Studying X" indicators.

#### [NEW] `src/components/groups/CreateGroupModal.tsx`
Modal with:
- Group Name, Bio
- Public / Private toggle

## Verification Plan
1. Admin can create a private group.
2. User can join public groups directly, or private ones with code.
3. Group limit of 50 members enforced.
4. YPT-like schedule viewing (current task highlighted, history accessible).
