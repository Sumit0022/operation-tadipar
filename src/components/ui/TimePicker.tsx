import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '../../utils/cn';

interface TimePickerProps {
  label: string;
  value: string; // HH:mm (24-hour format)
  onChange: (value: string) => void;
  align?: 'left' | 'right' | 'center';
}

export function TimePicker({ label, value, onChange, align = 'left' }: TimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse initial value (HH:mm)
  const [hour24, minuteStr] = value.split(':');
  const hourNum = parseInt(hour24, 10);
  
  const initialAmPm = hourNum >= 12 ? 'PM' : 'AM';
  const initialHour12 = hourNum % 12 || 12;
  const initialMinute = parseInt(minuteStr, 10);

  const [amPm, setAmPm] = useState<'AM' | 'PM'>(initialAmPm);
  const [hour, setHour] = useState(initialHour12);
  const [minute, setMinute] = useState(initialMinute);

  const [mode, setMode] = useState<'hour' | 'minute'>('hour');

  // Sync state if value prop changes externally (e.g. editing a different schedule)
  useEffect(() => {
    const [h24, m] = value.split(':');
    const hNum = parseInt(h24, 10);
    setAmPm(hNum >= 12 ? 'PM' : 'AM');
    setHour(hNum % 12 || 12);
    setMinute(parseInt(m, 10));
  }, [value]);

  // Close when clicking outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Update parent when internal state changes
  useEffect(() => {
    let h24 = hour;
    if (amPm === 'PM' && hour !== 12) h24 += 12;
    if (amPm === 'AM' && hour === 12) h24 = 0;
    
    const formattedHour = h24.toString().padStart(2, '0');
    const formattedMinute = minute.toString().padStart(2, '0');
    
    // Only call onChange if it actually changed to prevent infinite loops
    if (`${formattedHour}:${formattedMinute}` !== value) {
      onChange(`${formattedHour}:${formattedMinute}`);
    }
  }, [hour, minute, amPm]);

  const displayHour = hour.toString().padStart(2, '0');
  const displayMinute = minute.toString().padStart(2, '0');

  // Generate clock numbers for analog face
  const renderClockFace = () => {
    const items = mode === 'hour' 
      ? Array.from({ length: 12 }, (_, i) => (i === 0 ? 12 : i))
      : Array.from({ length: 12 }, (_, i) => i * 5);

    const radius = 90;
    const center = 110;

    return (
      <div className="relative w-[220px] h-[220px] rounded-full bg-secondary/50 mx-auto flex items-center justify-center">
        {/* Center dot */}
        <div className="w-2 h-2 rounded-full bg-primary absolute z-20" />
        
        {/* Hand */}
        <motion.div 
          className="absolute w-1 rounded-full bg-primary origin-bottom z-10"
          style={{ height: radius - 20, bottom: '50%', left: 'calc(50% - 2px)' }}
          animate={{ 
            rotate: mode === 'hour' ? (hour % 12) * 30 : (minute / 5) * 30 
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        >
          <div className="w-8 h-8 rounded-full bg-primary/20 border-2 border-primary absolute -top-4 -left-[14px]" />
        </motion.div>

        {items.map((num, i) => {
          const angle = (i * 30 - 90) * (Math.PI / 180);
          const x = center + radius * Math.cos(angle) - 16;
          const y = center + radius * Math.sin(angle) - 16;
          
          const isActive = mode === 'hour' ? hour === num : minute === num;

          return (
            <button
              key={num}
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (mode === 'hour') {
                  setHour(num);
                  setTimeout(() => setMode('minute'), 300);
                } else {
                  setMinute(num);
                  setTimeout(() => setIsOpen(false), 300);
                }
              }}
              className={cn(
                "absolute w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors z-20",
                isActive ? "text-primary-foreground" : "text-foreground hover:bg-background/80"
              )}
              style={{ left: x, top: y }}
            >
              {num.toString().padStart(2, '0')}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="text-sm font-semibold text-foreground/80 pl-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-2xl glass-input px-4 py-3 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 text-left"
        >
          <span className="font-medium text-lg">
            {displayHour}:{displayMinute} {amPm}
          </span>
          <Clock className="w-5 h-5 text-muted-foreground" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "absolute z-50 bottom-full mb-2 p-4 rounded-3xl glass border border-white/10 shadow-2xl w-full min-w-[280px]",
                align === 'left' && "left-0",
                align === 'right' && "right-0",
                align === 'center' && "left-1/2 -translate-x-1/2"
              )}
            >
              {/* Header */}
              <div className="flex justify-center items-baseline gap-2 mb-6">
                <button 
                  type="button"
                  onClick={() => setMode('hour')}
                  className={cn("text-4xl font-bold transition-colors", mode === 'hour' ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                >
                  {displayHour}
                </button>
                <span className="text-4xl font-bold text-muted-foreground/50">:</span>
                <button 
                  type="button"
                  onClick={() => setMode('minute')}
                  className={cn("text-4xl font-bold transition-colors", mode === 'minute' ? "text-primary" : "text-muted-foreground hover:text-foreground")}
                >
                  {displayMinute}
                </button>
                
                <div className="flex flex-col gap-1 ml-4">
                  <button 
                    type="button"
                    onClick={() => setAmPm('AM')}
                    className={cn("text-sm font-bold px-2 py-0.5 rounded-md transition-colors", amPm === 'AM' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}
                  >
                    AM
                  </button>
                  <button 
                    type="button"
                    onClick={() => setAmPm('PM')}
                    className={cn("text-sm font-bold px-2 py-0.5 rounded-md transition-colors", amPm === 'PM' ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary")}
                  >
                    PM
                  </button>
                </div>
              </div>

              {/* Clock Face */}
              {renderClockFace()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
