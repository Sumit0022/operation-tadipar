import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Minimize2, Maximize2 } from 'lucide-react';
import { useTimerStore } from '../../store/timer';
import { useAppStore } from '../../store';
import { Button } from '../ui/Button';

export function LiveTimerPanel() {
  const { activeSession, pauseTimer, resumeTimer, stopTimer } = useTimerStore();
  const subjects = useAppStore(state => state.subjects);
  const schedules = useAppStore(state => state.schedules);
  
  const [minimized, setMinimized] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!activeSession) return;
    
    // Initial calculation
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

  if (!activeSession) return null;

  const schedule = schedules.find(s => s.id === activeSession.scheduleId);
  const subject = subjects.find(s => s.id === activeSession.subjectId);
  if (!schedule || !subject) return null;

  const formatTime = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isRunning = activeSession.status === 'running';

  if (minimized) {
    return (
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-24 right-6 z-50 glass-panel rounded-2xl p-4 shadow-2xl border border-primary/30 flex items-center gap-4 cursor-pointer hover:bg-background/80 transition-colors"
        onClick={() => setMinimized(false)}
      >
        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
        <div>
          <p className="text-xs font-bold text-muted-foreground line-clamp-1 max-w-[120px]">{schedule.taskTitle}</p>
          <p className="font-mono font-bold text-lg">{formatTime(elapsed)}</p>
        </div>
        <Maximize2 className="w-4 h-4 text-muted-foreground ml-2" />
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
      >
        <div 
          className="absolute inset-0 opacity-20 pointer-events-none"
          style={{ backgroundColor: subject.color }}
        />
        
        <button 
          onClick={() => setMinimized(true)}
          className="absolute top-8 left-8 w-12 h-12 rounded-full glass flex items-center justify-center text-foreground hover:bg-background/50 transition-colors z-10"
        >
          <Minimize2 className="w-5 h-5" />
        </button>

        <div className="text-center z-10 w-full max-w-2xl">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-4xl mb-6 shadow-2xl relative"
            style={{ backgroundColor: subject.color }}
          >
            {isRunning && (
              <span className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 border-4 border-background rounded-full animate-pulse" />
            )}
            <span className="text-white drop-shadow-md">{subject.icon}</span>
          </motion.div>

          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-semibold text-muted-foreground mb-2"
          >
            {subject.name}
          </motion.h2>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-black mb-12 line-clamp-2 leading-tight"
          >
            {schedule.taskTitle}
          </motion.h1>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.4 }}
            className="glass-panel py-8 px-12 rounded-[3rem] inline-block mb-16 shadow-[0_0_40px_rgba(var(--primary),0.1)] relative overflow-hidden"
          >
            {isRunning && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-shimmer" />
            )}
            <p className="font-mono text-7xl md:text-8xl font-black tracking-tighter text-foreground drop-shadow-lg tabular-nums">
              {formatTime(elapsed)}
            </p>
          </motion.div>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="flex items-center justify-center gap-6"
          >
            {isRunning ? (
              <Button 
                onClick={pauseTimer} 
                className="w-20 h-20 rounded-[2rem] flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white shadow-xl hover:scale-105 transition-all"
              >
                <Pause className="w-8 h-8 fill-current" />
              </Button>
            ) : (
              <Button 
                onClick={resumeTimer} 
                className="w-20 h-20 rounded-[2rem] flex items-center justify-center bg-green-500 hover:bg-green-600 text-white shadow-xl hover:scale-105 transition-all"
              >
                <Play className="w-8 h-8 fill-current ml-1" />
              </Button>
            )}

            <Button 
              onClick={() => {
                if (confirm('Stop the timer and save your session?')) {
                  stopTimer(schedule, false);
                }
              }} 
              variant="danger"
              className="w-20 h-20 rounded-[2rem] flex items-center justify-center shadow-xl hover:scale-105 transition-all"
            >
              <Square className="w-7 h-7 fill-current" />
            </Button>
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
