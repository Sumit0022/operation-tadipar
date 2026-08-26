# Task Stopwatch & Real-Time System Tasks

## 1. Core Data Models
- [ ] Update `Schedule` in `src/types/index.ts` with `actualDurationSeconds`
- [ ] Add `ActiveSession` interface to types

## 2. Global Timer Store
- [ ] Create `src/store/timer.ts` to manage timer state (start, pause, resume, stop, tick)
- [ ] Add sync to `users/{uid}` in Firestore for real-time presence broadcast
- [ ] Auto-complete logic within tick interval

## 3. UI: Day Schedule & Timer Widget
- [ ] Update `src/pages/DaySchedule.tsx` to include Start/Pause/Resume/Stop buttons based on 10m buffer
- [ ] Create `LiveTimerWidget` showing animated countdown/up for the active task

## 4. UI: Home Page Integration
- [ ] Update `src/pages/Dashboard.tsx` to show the active session live timer
- [ ] Show today's Actual vs Scheduled study time
- [ ] Include an Attendance / Streak widget

## 5. UI: Group Details (Real-time)
- [ ] Refactor `src/pages/GroupDetails.tsx` to use `onSnapshot` for real-time member updates
- [ ] Group member cards show live timer and pulsating status
- [ ] Add Attendance/Insights view for members

## 6. Verification
- [ ] Test timer starts within window
- [ ] Test timer pause/resume and final save logic
- [ ] Test real-time sync across groups
