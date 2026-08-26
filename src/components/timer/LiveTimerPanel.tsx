import { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Minimize2, Maximize2, Expand, Shrink, BookOpen, Clock } from 'lucide-react';
import { useTimerStore } from '../../store/timer';
import { useAppStore } from '../../store';
import { Button } from '../ui/Button';

/* ─── SVG Study Scene ─────────────────────────────────────────────── */
function StudyIllustration({ isRunning, color }: { isRunning: boolean; color: string }) {
  return (
    <svg viewBox="0 0 360 300" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[320px] mx-auto select-none" aria-hidden="true">
      {/* ── Desk Surface ── */}
      <motion.path d="M40 220 H320 Q325 220 325 225 V228 Q325 232 320 232 H40 Q35 232 35 228 V225 Q35 220 40 220Z"
        fill="currentColor" className="text-amber-800/25 dark:text-amber-600/15"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.7, ease: 'easeOut' }}
      />
      {/* Desk legs */}
      <rect x="70" y="232" width="6" height="45" rx="3" fill="currentColor" className="text-amber-900/15 dark:text-amber-700/10" />
      <rect x="284" y="232" width="6" height="45" rx="3" fill="currentColor" className="text-amber-900/15 dark:text-amber-700/10" />

      {/* ── Book Stack (left) ── */}
      <motion.g initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }}>
        <rect x="55" y="203" width="52" height="8" rx="2" fill={color} opacity="0.5" />
        <rect x="53" y="195" width="56" height="8" rx="2" fill={color} opacity="0.35" />
        <rect x="57" y="187" width="48" height="8" rx="2" fill={color} opacity="0.22" />
      </motion.g>

      {/* ── Open Notebook (center of desk) ── */}
      <motion.g initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}>
        {/* Left page */}
        <path d="M150 218 Q150 208 160 206 L188 206 L188 218 Z" fill="currentColor" className="text-foreground/8" />
        {/* Right page */}
        <path d="M188 218 L188 206 L216 206 Q226 208 226 218 Z" fill="currentColor" className="text-foreground/6" />
        {/* Spine line */}
        <line x1="188" y1="205" x2="188" y2="218" stroke="currentColor" className="text-foreground/10" strokeWidth="0.8" />
        {/* Page lines left */}
        <line x1="158" y1="210" x2="183" y2="210" stroke="currentColor" className="text-foreground/5" strokeWidth="1" />
        <line x1="158" y1="214" x2="180" y2="214" stroke="currentColor" className="text-foreground/4" strokeWidth="1" />
        {/* Page lines right */}
        <line x1="193" y1="210" x2="218" y2="210" stroke="currentColor" className="text-foreground/5" strokeWidth="1" />
        <line x1="193" y1="214" x2="215" y2="214" stroke="currentColor" className="text-foreground/4" strokeWidth="1" />
      </motion.g>

      {/* ── Pen ── */}
      <motion.g initial={{ opacity: 0, rotate: -20 }} animate={{ opacity: 1, rotate: 0 }} transition={{ delay: 0.7 }}>
        <line x1="235" y1="218" x2="255" y2="196" stroke={color} strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
        <circle cx="256" cy="195" r="1.5" fill={color} opacity="0.5" />
      </motion.g>

      {/* ── Cup ── */}
      <motion.g initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.65 }}>
        <path d="M270 200 L272 218 L290 218 L292 200 Z" fill="currentColor" className="text-muted-foreground/12" rx="2" />
        <rect x="269" y="198" width="24" height="4" rx="2" fill="currentColor" className="text-muted-foreground/15" />
        {/* Handle */}
        <path d="M292 204 Q300 204 300 210 Q300 216 292 216" stroke="currentColor" className="text-muted-foreground/10" strokeWidth="2" fill="none" />
        {/* Steam */}
        <motion.path d="M278 195 Q280 189 278 183" stroke="currentColor" className="text-muted-foreground/10" strokeWidth="1.2" fill="none" strokeLinecap="round"
          animate={isRunning ? { opacity: [0.06, 0.15, 0.06], y: [0, -2, 0] } : { opacity: 0.05 }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path d="M283 194 Q285 187 283 181" stroke="currentColor" className="text-muted-foreground/10" strokeWidth="1.2" fill="none" strokeLinecap="round"
          animate={isRunning ? { opacity: [0.04, 0.12, 0.04], y: [0, -3, 0] } : { opacity: 0.04 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        />
      </motion.g>

      {/* ── Student Silhouette ── */}
      <motion.g initial={{ y: 25, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', damping: 18 }}>
        {/* Head */}
        <motion.ellipse cx="188" cy="118" rx="20" ry="22" fill={color} opacity="0.22"
          animate={isRunning ? { cy: [118, 116, 118] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Hair */}
        <motion.path d="M168 114 Q168 95 188 90 Q208 95 208 114" fill={color} opacity="0.3"
          animate={isRunning ? { d: ["M168 114 Q168 95 188 90 Q208 95 208 114", "M168 112 Q168 93 188 88 Q208 93 208 112", "M168 114 Q168 95 188 90 Q208 95 208 114"] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Neck */}
        <motion.rect x="183" y="138" width="10" height="8" rx="5" fill={color} opacity="0.18"
          animate={isRunning ? { y: [138, 136, 138] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Torso - smooth curved shape */}
        <motion.path d="M160 160 Q162 148 188 145 Q214 148 216 160 L218 205 Q218 212 210 212 L166 212 Q158 212 158 205 Z"
          fill={color} opacity="0.16"
          animate={isRunning ? {
            d: ["M160 160 Q162 148 188 145 Q214 148 216 160 L218 205 Q218 212 210 212 L166 212 Q158 212 158 205 Z",
                "M160 158 Q162 146 188 143 Q214 146 216 158 L218 205 Q218 212 210 212 L166 212 Q158 212 158 205 Z",
                "M160 160 Q162 148 188 145 Q214 148 216 160 L218 205 Q218 212 210 212 L166 212 Q158 212 158 205 Z"]
          } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Left arm - reaching to notebook */}
        <motion.path d="M163 165 Q148 180 152 200 Q154 210 160 215" stroke={color} strokeWidth="5" fill="none" opacity="0.15" strokeLinecap="round"
          animate={isRunning ? { d: ["M163 165 Q148 180 152 200 Q154 210 160 215", "M163 163 Q146 178 150 200 Q152 210 158 215", "M163 165 Q148 180 152 200 Q154 210 160 215"] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Right arm - writing/reading */}
        <motion.path d="M213 165 Q228 178 225 200 Q223 210 218 215" stroke={color} strokeWidth="5" fill="none" opacity="0.15" strokeLinecap="round"
          animate={isRunning ? { d: ["M213 165 Q228 178 225 200 Q223 210 218 215", "M213 163 Q230 176 227 200 Q225 210 220 215", "M213 165 Q228 178 225 200 Q223 210 218 215"] } : {}}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.g>

      {/* ── Subtle floating particles when studying ── */}
      {isRunning && [...Array(4)].map((_, i) => (
        <motion.circle key={i}
          cx={130 + i * 40} cy={80 + (i % 2) * 20} r="1.5"
          fill={color} opacity={0.1}
          animate={{ cy: [80 + (i % 2) * 20, 65 + (i % 2) * 20, 80 + (i % 2) * 20], opacity: [0.04, 0.14, 0.04] }}
          transition={{ duration: 5 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
        />
      ))}
    </svg>
  );
}

/* ─── Circular Progress ───────────────────────────────────────────── */
function ProgressRing({ progress, size, strokeWidth, color, isRunning }: {
  progress: number; size: number; strokeWidth: number; color: string; isRunning: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - progress * circumference;

  return (
    <svg width={size} height={size} className="absolute inset-0 -rotate-90">
      {/* Track */}
      <circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
        stroke="currentColor" className="text-border/30" fill="none"
      />
      {/* Progress */}
      <motion.circle cx={size / 2} cy={size / 2} r={radius} strokeWidth={strokeWidth}
        stroke={color} fill="none" strokeLinecap="round"
        style={{ strokeDasharray: circumference, strokeDashoffset: offset }}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
      {/* Glow dot at progress tip */}
      {isRunning && progress > 0.01 && (
        <motion.circle
          cx={size / 2 + radius * Math.cos(2 * Math.PI * progress - Math.PI / 2)}
          cy={size / 2 + radius * Math.sin(2 * Math.PI * progress - Math.PI / 2)}
          r={strokeWidth / 2 + 2}
          fill={color}
          opacity={0.6}
          animate={{ opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </svg>
  );
}

/* ─── Main Component ──────────────────────────────────────────────── */
export function LiveTimerPanel() {
  const { activeSession, pauseTimer, resumeTimer, stopTimer } = useTimerStore();
  const subjects = useAppStore(state => state.subjects);
  const schedules = useAppStore(state => state.schedules);

  const [minimized, setMinimized] = useState(false);
  const [pipWindow, setPipWindow] = useState<Window | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showStopConfirm, setShowStopConfirm] = useState(false);

  useEffect(() => {
    if (!activeSession) return;
    const calc = () => {
      let current = activeSession.accumulatedSeconds;
      if (activeSession.status === 'running') {
        current += Math.floor((Date.now() - activeSession.startTime) / 1000);
      }
      setElapsed(current);
    };
    calc();
    const interval = setInterval(calc, 1000);
    return () => clearInterval(interval);
  }, [activeSession]);

  // When activeSession becomes null, clean up PiP and minimized state
  useEffect(() => {
    if (!activeSession) {
      if (pipWindow) {
        try { pipWindow.close(); } catch {}
        setPipWindow(null);
      }
      setMinimized(false);
      setShowStopConfirm(false);
    }
  }, [activeSession, pipWindow]);

  const isRunning = activeSession?.status === 'running';

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Derive schedule/subject — needed for rendering
  const schedule = activeSession ? schedules.find(s => s.id === activeSession.scheduleId) : null;
  const subject = activeSession ? subjects.find(s => s.id === activeSession.subjectId) : null;

  // Calculate scheduled duration
  const scheduledDurationSeconds = useMemo(() => {
    if (!schedule) return 0;
    try {
      const [sh, sm] = schedule.startTime.split(':').map(Number);
      const [eh, em] = schedule.endTime.split(':').map(Number);
      let dur = ((eh * 60 + em) - (sh * 60 + sm)) * 60;
      if (dur <= 0) dur += 24 * 60 * 60; // handle overnight
      return dur;
    } catch {
      return 0;
    }
  }, [schedule]);

  const progress = scheduledDurationSeconds > 0 ? Math.min(elapsed / scheduledDurationSeconds, 1) : 0;

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatDuration = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
  };

  const toggleMinimize = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }

    if ('documentPictureInPicture' in window) {
      try {
        const dpip = (window as any).documentPictureInPicture;
        const pip = await dpip.requestWindow({ width: 340, height: 80 });

        [...document.styleSheets].forEach((sheet) => {
          try {
            if (sheet.href) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = sheet.href;
              pip.document.head.appendChild(link);
            } else {
              const cssRules = [...sheet.cssRules].map(rule => rule.cssText).join('');
              const style = document.createElement('style');
              style.textContent = cssRules;
              pip.document.head.appendChild(style);
            }
          } catch {
            if (sheet.href) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = sheet.href;
              pip.document.head.appendChild(link);
            }
          }
        });

        if (document.documentElement.classList.contains('dark')) {
          pip.document.documentElement.classList.add('dark');
        }

        pip.document.body.style.cssText = 'margin:0;padding:0;overflow:hidden;';

        pip.addEventListener('pagehide', () => {
          setMinimized(false);
          setPipWindow(null);
        });

        setPipWindow(pip);
        setMinimized(true);
        return;
      } catch (err) {
        console.error('Document PiP failed', err);
      }
    }

    setMinimized(true);
  };

  const maximizeFromPip = () => {
    if (pipWindow) {
      pipWindow.close();
    } else {
      setMinimized(false);
    }
  };

  // ─── Nothing active → render nothing ──────────────────────────
  if (!activeSession || !schedule || !subject) return null;

  /* ─── PiP View ────────────────────────────────────────────────── */
  const PiPView = () => (
    <div
      className="w-screen h-screen bg-background flex items-center justify-center cursor-pointer relative overflow-hidden group"
      onClick={maximizeFromPip}
    >
      <p className="font-mono text-5xl font-black tabular-nums tracking-tighter text-foreground z-10">
        {formatTime(elapsed)}
      </p>
      <div className="absolute bottom-0 left-0 w-full h-1.5 bg-border/20">
        <div className="h-full transition-all duration-1000 ease-linear rounded-r-full" style={{ width: `${progress * 100}%`, backgroundColor: subject.color }} />
      </div>
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
        <Maximize2 className="w-6 h-6 text-white" />
      </div>
    </div>
  );

  /* ─── In-Browser Widget ───────────────────────────────────────── */
  const InBrowserWidget = () => (
    <div
      className="glass-panel w-full rounded-2xl p-4 flex items-center justify-between border border-primary/20 bg-background/95 shadow-2xl"
      onClick={() => { if (!isDragging) maximizeFromPip(); }}
    >
      <div className="flex items-center gap-3 pointer-events-none">
        <div className="w-3 h-3 rounded-full animate-pulse flex-shrink-0 shadow-[0_0_8px] shadow-green-500/60" style={{ backgroundColor: '#22c55e' }} />
        <div>
          <p className="text-xs font-bold text-muted-foreground line-clamp-1 max-w-[150px]">{schedule.taskTitle}</p>
          <p className="font-mono font-bold text-lg leading-tight tabular-nums">{formatTime(elapsed)}</p>
        </div>
      </div>
      <div className="p-2 pointer-events-none text-primary">
        <Maximize2 className="w-4 h-4" />
      </div>
    </div>
  );

  /* ─── Minimized State ─────────────────────────────────────────── */
  if (minimized) {
    if (pipWindow) {
      return createPortal(<PiPView />, pipWindow.document.body);
    }
    return (
      <motion.div
        drag dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-24 right-6 z-50 w-[280px] cursor-grab active:cursor-grabbing"
      >
        <InBrowserWidget />
      </motion.div>
    );
  }

  /* ─── Full Screen Timer ───────────────────────────────────────── */
  return (
    <AnimatePresence>
      <motion.div
        key="timer-fullscreen"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100] bg-background overflow-hidden flex flex-col"
      >
        {/* Warm ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-[0.04]" style={{ backgroundColor: subject.color }} />
          <motion.div
            className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full blur-[120px] opacity-[0.06]"
            style={{ backgroundColor: subject.color }}
            animate={isRunning ? { scale: [1, 1.1, 1], opacity: [0.04, 0.08, 0.04] } : {}}
            transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full blur-[100px] opacity-[0.04]"
            style={{ backgroundColor: subject.color }}
            animate={isRunning ? { scale: [1, 1.15, 1], opacity: [0.03, 0.06, 0.03] } : {}}
            transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
          />
        </div>

        {/* Top Controls */}
        <div className="relative z-10 flex items-center justify-between p-6">
          <div className="flex gap-3">
            <button
              onClick={toggleMinimize}
              className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Minimize"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 rounded-xl glass-panel flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <Shrink className="w-4 h-4" /> : <Expand className="w-4 h-4" />}
            </button>
          </div>

          {/* Status pill */}
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-full glass-panel"
            animate={isRunning ? { boxShadow: ['0 0 0px rgba(34,197,94,0)', '0 0 20px rgba(34,197,94,0.15)', '0 0 0px rgba(34,197,94,0)'] } : {}}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className="text-sm font-semibold text-muted-foreground">
              {isRunning ? 'Studying' : 'Paused'}
            </span>
          </motion.div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-6 md:gap-16 px-6 pb-6 relative z-10 overflow-y-auto">
          {/* Left: Study Illustration */}
          <motion.div
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', damping: 20 }}
            className="hidden md:flex flex-col items-center justify-center flex-shrink-0"
          >
            <StudyIllustration isRunning={!!isRunning} color={subject.color} />
          </motion.div>

          {/* Right: Timer + Info + Controls */}
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: 'spring', damping: 20 }}
            className="flex flex-col items-center text-center max-w-lg w-full"
          >
            {/* Subject + Task */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mb-8"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm shadow-md" style={{ backgroundColor: subject.color }}>
                  <span className="text-white">{subject.icon}</span>
                </div>
                <span className="text-lg font-semibold text-muted-foreground">{subject.name}</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-black leading-tight">{schedule.taskTitle}</h1>
            </motion.div>

            {/* Circular Timer */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4, type: 'spring', damping: 15 }}
              className="relative w-[280px] h-[280px] md:w-[320px] md:h-[320px] flex items-center justify-center mb-8"
            >
              <ProgressRing
                progress={progress}
                size={320}
                strokeWidth={8}
                color={subject.color}
                isRunning={!!isRunning}
              />
              <div className="flex flex-col items-center">
                <p className="font-mono text-6xl md:text-7xl font-black tabular-nums tracking-tighter text-foreground leading-none">
                  {formatTime(elapsed)}
                </p>
                <div className="flex items-center gap-1.5 mt-3 text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  <span className="text-sm font-medium">
                    {schedule.startTime} – {schedule.endTime} · {formatDuration(scheduledDurationSeconds)}
                  </span>
                </div>
                {scheduledDurationSeconds > 0 && (
                  <p className="text-xs font-semibold mt-1.5" style={{ color: subject.color }}>
                    {Math.round(progress * 100)}% complete
                  </p>
                )}
              </div>
            </motion.div>

            {/* Session Type + Priority */}
            <motion.div
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3 mb-8"
            >
              {schedule.sessionType && (
                <span className="px-3 py-1 rounded-full text-xs font-semibold glass-panel" style={{ color: subject.color }}>
                  <BookOpen className="w-3 h-3 inline mr-1" />
                  {schedule.sessionType}
                </span>
              )}
              {schedule.priority && (
                <span className={`px-3 py-1 rounded-full text-xs font-semibold glass-panel ${
                  schedule.priority === 'High' ? 'text-red-500' :
                  schedule.priority === 'Medium' ? 'text-amber-500' : 'text-green-500'
                }`}>
                  {schedule.priority} Priority
                </span>
              )}
            </motion.div>

            {/* Controls */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="flex items-center justify-center gap-5"
            >
              {isRunning ? (
                <button
                  onClick={pauseTimer}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
                  style={{ backgroundColor: '#f59e0b' }}
                >
                  <Pause className="w-7 h-7 fill-current" />
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="w-16 h-16 rounded-2xl flex items-center justify-center text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
                  style={{ backgroundColor: '#22c55e' }}
                >
                  <Play className="w-7 h-7 fill-current ml-0.5" />
                </button>
              )}

              <button
                onClick={() => setShowStopConfirm(true)}
                className="w-16 h-16 rounded-2xl flex items-center justify-center bg-red-500 hover:bg-red-600 text-white shadow-lg hover:scale-105 active:scale-95 transition-all"
              >
                <Square className="w-6 h-6 fill-current" />
              </button>
            </motion.div>
          </motion.div>
        </div>

        {/* Stop Confirmation Modal */}
        <AnimatePresence>
          {showStopConfirm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-6"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass-panel w-full max-w-sm rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl"
              >
                <div className="w-14 h-14 rounded-2xl bg-red-500/15 flex items-center justify-center mb-5">
                  <Square className="w-7 h-7 text-red-500 fill-current" />
                </div>
                <h3 className="text-xl font-bold mb-1.5">End Study Session?</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  You've studied for <span className="font-semibold text-foreground">{formatTime(elapsed)}</span>. Save and finish this session?
                </p>
                <div className="flex w-full gap-3">
                  <Button
                    variant="ghost"
                    className="flex-1 h-11 rounded-xl"
                    onClick={() => setShowStopConfirm(false)}
                  >
                    Continue
                  </Button>
                  <Button
                    variant="danger"
                    className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => {
                      setShowStopConfirm(false);
                      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
                      stopTimer(schedule, false);
                    }}
                  >
                    Stop & Save
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
}
