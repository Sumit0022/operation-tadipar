import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { useAuthStore } from './store/auth';
import { useTimerStore } from './store/timer';
import { useAppStore } from './store';

import Auth from './pages/Auth';
import Profile from './pages/Profile';
import Dashboard from './pages/Dashboard';
import Calendar from './pages/Calendar';
import DaySchedule from './pages/DaySchedule';
import Subjects from './pages/Subjects';
import SubjectDetails from './pages/SubjectDetails';
import Settings from './pages/Settings';

import Groups from './pages/Groups';
import DiscoverGroups from './pages/DiscoverGroups';
import GroupDetails from './pages/GroupDetails';

const getDurationSeconds = (start: string, end: string) => {
  const [sH, sM] = start.split(':').map(Number);
  const [eH, eM] = end.split(':').map(Number);
  let startT = sH * 60 + sM;
  let endT = eH * 60 + eM;
  if (endT < startT) endT += 24 * 60;
  return (endT - startT) * 60;
};

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuthStore();
  const location = useLocation();

  useEffect(() => {
    // Global interval to check auto-completion
    const interval = setInterval(() => {
      const session = useTimerStore.getState().activeSession;
      if (session && session.status === 'running') {
        const schedule = useAppStore.getState().schedules.find(s => s.id === session.scheduleId);
        if (schedule) {
          const currentElapsed = Math.floor((Date.now() - session.startTime) / 1000) + session.accumulatedSeconds;
          const targetDuration = getDurationSeconds(schedule.startTime, schedule.endTime);
          
          if (currentElapsed >= targetDuration) {
            useTimerStore.getState().stopTimer(schedule, true);
          }
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-[100dvh] w-full flex flex-col items-center justify-center bg-background gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Initializing cloud sync...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/auth" element={<Auth />} />
        
        <Route path="/" element={
          <ProtectedRoute>
            <AppShell />
          </ProtectedRoute>
        }>
          <Route index element={<Dashboard />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="calendar" element={<Calendar />} />
          <Route path="calendar/:date" element={<DaySchedule />} />
          <Route path="subjects" element={<Subjects />} />
          <Route path="subjects/:id" element={<SubjectDetails />} />
          <Route path="settings" element={<Settings />} />
          <Route path="profile" element={<Profile />} />
          
          <Route path="groups" element={<Groups />} />
          <Route path="groups/discover" element={<DiscoverGroups />} />
          <Route path="groups/:id" element={<GroupDetails />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
