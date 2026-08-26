# Task Stopwatch & Real-Time Study System Implementation Plan

## Overview
We will introduce a highly polished, YPT-inspired study stopwatch system. The system integrates tightly with existing date/time scheduling. Users can start a timer within a 10-minute buffer of a scheduled task. The timer persists, auto-completes tasks, and broadcasts real-time presence to group members.

## User Review Required

> [!IMPORTANT]
> The realtime presence requires updating a user's `users/{uid}` document when they start/stop a timer. 
> To show live updates to group members, we will use Firebase's `onSnapshot` listener on these user documents.
> We will store actual tracked study time as a new field `actualDurationSeconds` inside the `Schedule` model.
> Do you approve this data structure?

## Open Questions

> [!TIP]
> 1. Should we limit a user to exactly ONE active timer across the whole app? (Assume yes).

## Proposed Changes

### 1. Data Models
Update `src/types/index.ts`:
- Update `Schedule` to include `actualDurationSeconds?: number`.
- Define `ActiveSession`:
  ```ts
  export interface ActiveSession {
    scheduleId: string;
    subjectId: string;
    taskTitle: string;
    startTime: number;
    accumulatedSeconds: number; // in case of pause/resume
  }
  ```
- Update `UserProfile` in `store/auth.ts` to include `activeSession?: ActiveSession | null`.

### 2. State Management (`src/store/timer.ts`)
Create a new Zustand store to manage the active timer locally:
- `activeSession: ActiveSession | null`
- `status: 'idle' | 'running' | 'paused'`
- `startTimer(schedule: Schedule)`
- `pauseTimer()`
- `resumeTimer()`
- `stopTimer(schedule: Schedule)` (calculates total elapsed, updates Schedule, removes activeSession)
- Effects: 
  - Subscribes to changes and updates `users/{uid}` in Firestore for real-time group sync.
  - Tick interval that checks if scheduled duration is met, triggering auto-complete.

### 3. Home Page Integration
Modify `src/pages/Dashboard.tsx`:
- Add a "Current Session" widget if a timer is running.
- Show live elapsed time.
- Show Today's Scheduled vs Actual Study time.

### 4. Schedule/Day View Integration
Modify `src/pages/DaySchedule.tsx` & components:
- In the task cards, if current time is within `[start - 10m, end + 10m]`, show a "Start Study" button.
- If this task is active, show the live animated Stopwatch, Pause, and Stop buttons.

### 5. Group Live View
Modify `src/pages/GroupDetails.tsx`:
- Replace the static member schedule fetching with real-time `onSnapshot` listeners on the members' `users/{uid}` documents.
- If `member.activeSession` exists, display them as "Live Now" with a pulsating green indicator and elapsed time.

### 6. Timer UI/Animations
Create a `LiveTimerWidget` component using `framer-motion`:
- Glassmorphism, smooth digits.

## Verification Plan
1. Ensure the timer can be started only within the valid 10-minute buffer window.
2. Verify that refreshing the page keeps the timer running correctly (by saving `startTime`).
3. Pause and Resume should correctly tally `accumulatedSeconds`.
4. Open a second browser with another group member and observe the "Live Now" status appear instantly.
5. Let the timer reach the scheduled duration and verify it automatically marks the task as 'Completed'.
