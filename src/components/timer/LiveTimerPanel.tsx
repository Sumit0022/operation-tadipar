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
    <svg viewBox="0 0 400 320" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[340px] mx-auto select-none">
      {/* Desk */}
      <motion.rect x="60" y="230" width="280" height="12" rx="6" fill="currentColor" className="text-amber-800/40 dark:text-amber-700/30"
        initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <motion.rect x="90" y="242" width="8" height="50" rx="4" fill="currentColor" className="text-amber-900/30 dark:text-amber-800/20"
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
      />
      <motion.rect x="302" y="242" width="8" height="50" rx="4" fill="currentColor" className="text-amber-900/30 dark:text-amber-800/20"
        initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{ duration: 0.6, delay: 0.3 }}
      />

      {/* Stack of Books (left side) */}
      <motion.g initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4, duration: 0.6 }}>
        <rect x="80" y="206" width="60" height="10" rx="2" fill={color} opacity="0.7" />
        <rect x="78" y="196" width="64" height="10" rx="2" fill={color} opacity="0.5" />
        <rect x="82" y="186" width="56" height="10" rx="2" fill={color} opacity="0.35" />
      </motion.g>

      {/* Open Book (center) */}
      <motion.g initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5, duration: 0.6 }}>
        {/* Book spine */}
        <ellipse cx="220" cy="224" rx="60" ry="4" fill="currentColor" className="text-muted-foreground/10" />
        {/* Left page */}
        <motion.path d="M220 210 Q190 205 160 215 L160 228 Q190 218 220 223 Z" fill="currentColor" className="text-foreground/10"
          animate={isRunning ? { d: ["M220 210 Q190 205 160 215 L160 228 Q190 218 220 223 Z", "M220 210 Q190 203 160 213 L160 226 Q190 216 220 223 Z", "M220 210 Q190 205 160 215 L160 228 Q190 218 220 223 Z"] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Right page */}
        <motion.path d="M220 210 Q250 205 280 215 L280 228 Q250 218 220 223 Z" fill="currentColor" className="text-foreground/10"
          animate={isRunning ? { d: ["M220 210 Q250 205 280 215 L280 228 Q250 218 220 223 Z", "M220 210 Q250 207 280 217 L280 230 Q250 220 220 223 Z", "M220 210 Q250 205 280 215 L280 228 Q250 218 220 223 Z"] } : {}}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        />
        {/* Page lines */}
        <line x1="175" y1="218" x2="210" y2="215" stroke="currentColor" className="text-foreground/5" strokeWidth="1.5" />
        <line x1="175" y1="222" x2="210" y2="219" stroke="currentColor" className="text-foreground/5" strokeWidth="1.5" />
        <line x1="230" y1="215" x2="265" y2="218" stroke="currentColor" className="text-foreground/5" strokeWidth="1.5" />
        <line x1="230" y1="219" x2="265" y2="222" stroke="currentColor" className="text-foreground/5" strokeWidth="1.5" />
      </motion.g>

      {/* Pen */}
      <motion.g initial={{ rotate: -30, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} transition={{ delay: 0.7, duration: 0.5 }}>
        <line x1="290" y1="228" x2="320" y2="198" stroke={color} strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <circle cx="321" cy="197" r="2" fill={color} opacity="0.8" />
      </motion.g>

      {/* Coffee Cup / Chai (right side) */}
      <motion.g initial={{ y: 15, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6, duration: 0.5 }}>
        <rect x="300" y="202" width="22" height="28" rx="4" fill="currentColor" className="text-muted-foreground/15" />
        <rect x="300" y="202" width="22" height="6" rx="3" fill="currentColor" className="text-muted-foreground/20" />
        {/* Handle */}
        <path d="M322 210 Q330 210 330 218 Q330 226 322 226" stroke="currentColor" className="text-muted-foreground/15" strokeWidth="2.5" fill="none" />
        {/* Steam */}
        <motion.path d="M308 198 Q310 192 308 186" stroke="currentColor" className="text-muted-foreground/15" strokeWidth="1.5" fill="none" strokeLinecap="round"
          animate={isRunning ? { d: ["M308 198 Q310 192 308 186", "M308 198 Q306 191 308 184", "M308 198 Q310 192 308 186"], opacity: [0.15, 0.25, 0.15] } : { opacity: 0.1 }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.path d="M314 198 Q316 191 314 184" stroke="currentColor" className="text-muted-foreground/15" strokeWidth="1.5" fill="none" strokeLinecap="round"
          animate={isRunning ? { d: ["M314 198 Q316 191 314 184", "M314 198 Q312 190 314 182", "M314 198 Q316 191 314 184"], opacity: [0.1, 0.2, 0.1] } : { opacity: 0.08 }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        />
      </motion.g>

      {/* Student figure (center, sitting at desk) */}
      <motion.g initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2, type: 'spring', damping: 15 }}>
        {/* Body / Torso */}
        <motion.path d="M200 160 Q200 180 190 210 L250 210 Q240 180 240 160 Z" fill={color} opacity="0.25"
          animate={isRunning ? { d: ["M200 160 Q200 180 190 210 L250 210 Q240 180 240 160 Z", "M200 158 Q200 178 190 210 L250 210 Q240 178 240 158 Z", "M200 160 Q200 180 190 210 L250 210 Q240 180 240 160 Z"] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Shoulders */}
        <motion.path d="M185 165 Q200 155 220 150 Q240 155 255 165" stroke={color} strokeWidth="3" fill="none" opacity="0.3"
          animate={isRunning ? { d: ["M185 165 Q200 155 220 150 Q240 155 255 165", "M185 163 Q200 153 220 148 Q240 153 255 163", "M185 165 Q200 155 220 150 Q240 155 255 165"] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Head */}
        <motion.circle cx="220" cy="130" r="25" fill={color} opacity="0.3"
          animate={isRunning ? { cy: [130, 128, 130] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Hair */}
        <motion.path d="M195 125 Q195 105 220 100 Q245 105 245 125" fill={color} opacity="0.4"
          animate={isRunning ? { d: ["M195 125 Q195 105 220 100 Q245 105 245 125", "M195 123 Q195 103 220 98 Q245 103 245 123", "M195 125 Q195 105 220 100 Q245 105 245 125"] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Left arm (resting on book) */}
        <motion.path d="M195 175 Q180 190 185 215" stroke={color} strokeWidth="4" fill="none" opacity="0.25" strokeLinecap="round"
          animate={isRunning ? { d: ["M195 175 Q180 190 185 215", "M195 173 Q178 190 183 215", "M195 175 Q180 190 185 215"] } : {}}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Right arm (writing/reading) */}
        <motion.path d="M245 175 Q260 190 255 215" stroke={color} strokeWidth="4" fill="none" opacity="0.25" strokeLinecap="round"
          animate={isRunning ? { d: ["M245 175 Q260 190 255 215", "M245 173 Q262 188 257 215", "M245 175 Q260 190 255 215"] } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
      </motion.g>

      {/* Subtle Ambient Particles (only when running) */}
      {isRunning && (
        <g>
          {[...Array(5)].map((_, i) => (
            <motion.circle key={i}
              cx={120 + i * 50}
              cy={100 + (i % 3) * 30}
              r="1.5"
              fill={color}
              opacity={0.15}
              animate={{ cy: [100 + (i % 3) * 30, 80 + (i % 3) * 30, 100 + (i % 3) * 30], opacity: [0.05, 0.2, 0.05] }}
              transition={{ duration: 4 + i * 0.5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
            />
          ))}
        </g>
      )}
    </svg>
  );
}

/* ─── Circular Progress Ring ──────────────────────────────────────── */
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

  const isRunning = activeSession?.status === 'running';

  useEffect(() => {
    const handleFullscreenChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (!activeSession) return null;

  const schedule = schedules.find(s => s.id === activeSession.scheduleId);
  const subject = subjects.find(s => s.id === activeSession.subjectId);
  if (!schedule || !subject) return null;

  // Calculate scheduled duration from start/end time
  const scheduledDurationSeconds = useMemo(() => {
    const [sh, sm] = schedule.startTime.split(':').map(Number);
    const [eh, em] = schedule.endTime.split(':').map(Number);
    return ((eh * 60 + em) - (sh * 60 + sm)) * 60;
  }, [schedule.startTime, schedule.endTime]);

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
        const pip = await dpip.requestWindow({ width: 340, height: 120 });

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

  /* ─── PiP View ────────────────────────────────────────────────── */
  const PiPView = () => (
    <div
      className="w-screen h-screen bg-background flex items-center cursor-pointer relative overflow-hidden group"
      onClick={maximizeFromPip}
    >
      <div className="absolute inset-0 opacity-5 pointer-events-none" style={{ backgroundColor: subject.color }} />

      {/* Progress bar at bottom */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-border/20">
        <div className="h-full transition-all duration-1000 ease-linear rounded-r-full" style={{ width: `${progress * 100}%`, backgroundColor: subject.color }} />
      </div>

      <div className="flex items-center gap-4 px-5 w-full z-10">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-md" style={{ backgroundColor: subject.color }}>
          <span className="text-white">{subject.icon}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-muted-foreground truncate">{subject.name} · {schedule.taskTitle}</p>
          <p className="font-mono text-3xl font-black tabular-nums tracking-tighter text-foreground">{formatTime(elapsed)}</p>
        </div>
        <div className="flex items-center gap-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
          <Maximize2 className="w-5 h-5" />
        </div>
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
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

        {/* Main Content — Two Column on Desktop, Stacked on Mobile */}
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
