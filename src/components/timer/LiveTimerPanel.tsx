import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, Square, Minimize2, Maximize2, Expand, Shrink } from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';
import { useTimerStore } from '../../store/timer';
import { useAppStore } from '../../store';
import { Button } from '../ui/Button';

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
  const lottieRef = useRef<Player>(null);

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

  const isRunning = activeSession?.status === 'running';

  // Control Lottie playback based on timer status
  useEffect(() => {
    if (isRunning) {
      lottieRef.current?.play();
    } else {
      lottieRef.current?.pause();
    }
  }, [isRunning, minimized]);

  // Listen for fullscreen changes from browser (ESC key)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await document.documentElement.requestFullscreen().catch(err => console.error(err));
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen().catch(err => console.error(err));
      setIsFullscreen(false);
    }
  };

  const toggleMinimize = async () => {
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(console.error);
      setIsFullscreen(false);
    }
    
    // Attempt Document Picture-in-Picture API for OS-level floating widget
    if ('documentPictureInPicture' in window) {
      try {
        const dpip = (window as any).documentPictureInPicture;
        const pip = await dpip.requestWindow({
          width: 320,
          height: 100,
        });
        
        // Copy stylesheets for styling
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
          } catch (e) {
            if (sheet.href) {
              const link = document.createElement('link');
              link.rel = 'stylesheet';
              link.href = sheet.href;
              pip.document.head.appendChild(link);
            }
          }
        });
        
        // Copy dark mode class
        if (document.documentElement.classList.contains('dark')) {
          pip.document.documentElement.classList.add('dark');
        }
        
        pip.document.body.className = "bg-background text-foreground overflow-hidden flex items-center justify-center m-0 p-0 h-full";
        
        pip.addEventListener("pagehide", () => {
           setMinimized(false);
           setPipWindow(null);
        });

        setPipWindow(pip);
        setMinimized(true);
        return;
      } catch (err) {
        console.error("Document PiP failed, falling back to in-browser floating", err);
      }
    }
    
    // Fallback: in-browser minimize
    setMinimized(true);
  };

  const maximizeFromPip = () => {
    if (pipWindow) {
      pipWindow.close(); // Triggers pagehide event which unminimizes
    } else {
      setMinimized(false);
    }
  };

  const MinimizedView = () => (
    <div 
      className="glass-panel w-full h-full rounded-none md:rounded-2xl p-4 flex items-center justify-between border-primary/30 bg-background/80 transition-colors cursor-pointer"
      onClick={() => {
        if (!isDragging) maximizeFromPip();
      }}
    >
      <div className="flex items-center gap-4 pointer-events-none">
        <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse flex-shrink-0" />
        <div>
          <p className="text-xs font-bold text-muted-foreground line-clamp-1 max-w-[150px]">{schedule.taskTitle}</p>
          <p className="font-mono font-bold text-lg">{formatTime(elapsed)}</p>
        </div>
      </div>
      <div className="p-2 hover:bg-primary/20 rounded-full transition-colors ml-2 pointer-events-none">
        <Maximize2 className="w-4 h-4 text-primary" />
      </div>
    </div>
  );

  if (minimized) {
    if (pipWindow) {
      // OS-Level Picture-in-Picture Widget! Shows up on other tabs and Windows desktop.
      return createPortal(<MinimizedView />, pipWindow.document.body);
    }

    // Fallback: In-Browser Draggable Widget
    return (
      <motion.div 
        drag
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDragEnd={() => setTimeout(() => setIsDragging(false), 100)}
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="fixed bottom-24 right-6 z-50 w-72 shadow-2xl rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing border-2 border-primary/20"
      >
        <MinimizedView />
      </motion.div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 overflow-hidden"
      >
        <div 
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{ backgroundColor: subject.color }}
        />

        {/* 3D Animated Avatar Layer */}
        <div className="absolute inset-0 flex flex-col items-center justify-center opacity-30 pointer-events-none mix-blend-screen scale-[1.5] md:scale-125">
           <Player
              ref={lottieRef}
              src="https://assets3.lottiefiles.com/packages/lf20_w51pcehl.json"
              loop
              autoplay={isRunning}
              className="w-full max-w-[800px] opacity-80"
            />
        </div>
        
        <div className="absolute top-8 left-8 flex gap-4 z-10">
          <button 
            onClick={toggleMinimize}
            className="w-12 h-12 rounded-full glass flex items-center justify-center text-foreground hover:bg-background/50 transition-colors shadow-lg"
            title="Minimize (Picture-in-Picture)"
          >
            <Minimize2 className="w-5 h-5" />
          </button>
          
          <button 
            onClick={toggleFullscreen}
            className="w-12 h-12 rounded-full glass flex items-center justify-center text-foreground hover:bg-background/50 transition-colors shadow-lg"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Shrink className="w-5 h-5" /> : <Expand className="w-5 h-5" />}
          </button>
        </div>

        <div className="text-center z-10 w-full max-w-2xl mt-12 relative">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.1 }}
            className="w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-3xl mb-6 shadow-2xl relative"
            style={{ backgroundColor: subject.color }}
          >
            {isRunning && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-green-500 border-4 border-background rounded-full animate-pulse" />
            )}
            <span className="text-white drop-shadow-md">{subject.icon}</span>
          </motion.div>

          <motion.h2 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-2xl font-bold text-muted-foreground mb-2 tracking-wide"
          >
            {subject.name}
          </motion.h2>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-6xl font-black mb-12 line-clamp-2 leading-tight drop-shadow-md"
          >
            {schedule.taskTitle}
          </motion.h1>

          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", delay: 0.4 }}
            className="glass-panel py-8 px-12 rounded-[3rem] inline-block mb-16 shadow-[0_0_50px_rgba(var(--primary),0.15)] relative overflow-hidden backdrop-blur-2xl bg-background/40 border-primary/20 border-2"
          >
            {isRunning && (
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent animate-[shimmer_2s_infinite]" />
            )}
            <p className="font-mono text-7xl md:text-[7rem] font-black tracking-tighter text-foreground drop-shadow-2xl tabular-nums leading-none">
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
                className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:scale-105 transition-all"
              >
                <Pause className="w-10 h-10 fill-current" />
              </Button>
            ) : (
              <Button 
                onClick={resumeTimer} 
                className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center bg-green-500 hover:bg-green-600 text-white shadow-[0_0_30px_rgba(34,197,94,0.3)] hover:scale-105 transition-all"
              >
                <Play className="w-10 h-10 fill-current ml-2" />
              </Button>
            )}

            <Button 
              onClick={() => setShowStopConfirm(true)} 
              variant="danger"
              className="w-24 h-24 rounded-[2.5rem] flex items-center justify-center shadow-[0_0_30px_rgba(239,68,68,0.3)] hover:scale-105 transition-all"
            >
              <Square className="w-8 h-8 fill-current" />
            </Button>
          </motion.div>
        </div>

        {/* Custom Confirmation Dialog */}
        <AnimatePresence>
          {showStopConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="glass-panel w-full max-w-sm rounded-[2rem] p-8 flex flex-col items-center text-center shadow-2xl border border-white/10"
              >
                <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mb-6">
                  <Square className="w-8 h-8 text-red-500 fill-current" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Stop Session?</h3>
                <p className="text-muted-foreground mb-8">Are you sure you want to stop the timer and save this session?</p>
                <div className="flex w-full gap-4">
                  <Button 
                    variant="ghost" 
                    className="flex-1 h-12 rounded-xl"
                    onClick={() => setShowStopConfirm(false)}
                  >
                    Cancel
                  </Button>
                  <Button 
                    variant="danger" 
                    className="flex-1 h-12 rounded-xl bg-red-500 hover:bg-red-600 text-white"
                    onClick={() => {
                      setShowStopConfirm(false);
                      if (document.fullscreenElement) document.exitFullscreen().catch(()=>{});
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

