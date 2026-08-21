import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, 
  startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isValid, 
  isWithinInterval, isBefore 
} from 'date-fns';
import { cn } from '../../utils/cn';
import { useSettingsStore } from '../../store/settings';

interface DateRangePickerProps {
  label: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  align?: 'left' | 'right' | 'center';
}

export function DateRangePicker({ label, startDate, endDate, onChange, align = 'center' }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { weekStartsOn } = useSettingsStore();

  const [currentMonth, setCurrentMonth] = useState(
    startDate && isValid(parseISO(startDate)) ? startOfMonth(parseISO(startDate)) : startOfMonth(new Date())
  );
  
  // Selection state
  const [selectionStep, setSelectionStep] = useState<'start' | 'end'>('start');
  const [hoverDate, setHoverDate] = useState<Date | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (!startDate) {
        setSelectionStep('start');
      } else if (startDate && !endDate) {
        setSelectionStep('end');
      } else {
        // If both exist, reopening starts a fresh selection
        setSelectionStep('start');
      }
    }
  }, [isOpen]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const handleDateClick = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    
    if (selectionStep === 'start') {
      onChange(dateStr, ''); // Reset end date when picking a new start date
      setSelectionStep('end');
    } else {
      // If selected end is before start, swap them
      const startObj = parseISO(startDate);
      if (isBefore(date, startObj)) {
        onChange(dateStr, startDate);
      } else {
        onChange(startDate, dateStr);
      }
      setIsOpen(false); // Close after completing range
    }
  };

  const nextMonth = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const getDisplayValue = () => {
    if (!startDate && !endDate) return "Select Date Range";
    const startStr = startDate ? format(parseISO(startDate), 'd MMM yyyy') : '...';
    const endStr = endDate ? format(parseISO(endDate), 'd MMM yyyy') : '...';
    
    if (startDate && !endDate) return `${startStr}  →  Select End`;
    if (startDate && endDate && startDate === endDate) return startStr;
    return `${startStr}  →  ${endStr}`;
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const gridStart = startOfWeek(monthStart, { weekStartsOn });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn });

    const rows = [];
    let days = [];
    let day = gridStart;

    const parsedStart = startDate && isValid(parseISO(startDate)) ? parseISO(startDate) : null;
    const parsedEnd = endDate && isValid(parseISO(endDate)) ? parseISO(endDate) : null;

    while (day <= gridEnd) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = day;
        const isCurrentMonth = isSameMonth(cloneDay, monthStart);
        const isTodayDate = isSameDay(cloneDay, new Date());
        
        let isSelectedStart = parsedStart && isSameDay(cloneDay, parsedStart);
        let isSelectedEnd = parsedEnd && isSameDay(cloneDay, parsedEnd);
        
        // Highlight logic
        let inRange = false;
        if (parsedStart && parsedEnd) {
          inRange = isWithinInterval(cloneDay, { start: parsedStart, end: parsedEnd });
        } else if (parsedStart && hoverDate && selectionStep === 'end') {
          // Hover highlighting
          const hoverStart = isBefore(hoverDate, parsedStart) ? hoverDate : parsedStart;
          const hoverEnd = isBefore(hoverDate, parsedStart) ? parsedStart : hoverDate;
          inRange = isWithinInterval(cloneDay, { start: hoverStart, end: hoverEnd });
          
          if (isSameDay(cloneDay, hoverDate)) {
            isSelectedEnd = true;
          }
        }

        const isBothEndpoints = isSelectedStart && isSelectedEnd;
        
        days.push(
          <div 
            key={cloneDay.toString()} 
            className={cn(
              "relative h-10 w-full flex items-center justify-center transition-colors",
              inRange && !isSelectedStart && !isSelectedEnd && "bg-primary/15",
              inRange && isSelectedStart && !isBothEndpoints && "bg-primary/15 rounded-l-full",
              inRange && isSelectedEnd && !isBothEndpoints && "bg-primary/15 rounded-r-full"
            )}
            onMouseEnter={() => setHoverDate(cloneDay)}
          >
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault(); e.stopPropagation();
                handleDateClick(cloneDay);
              }}
              className={cn(
                "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-all z-10",
                !isCurrentMonth && "text-muted-foreground/30",
                isCurrentMonth && !inRange && !isTodayDate && "text-foreground hover:bg-secondary",
                isTodayDate && !inRange && !isSelectedStart && !isSelectedEnd && "text-primary bg-primary/10 font-bold",
                (isSelectedStart || isSelectedEnd) && "bg-primary text-primary-foreground shadow-md font-bold scale-110",
                inRange && !isSelectedStart && !isSelectedEnd && "text-foreground font-semibold"
              )}
            >
              {format(cloneDay, 'd')}
            </button>
          </div>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-y-1 w-full" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  const renderDays = () => {
    const days = [];
    let startDateWeek = startOfWeek(currentMonth, { weekStartsOn });
    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="flex justify-center items-center h-8 w-full text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
          {format(addDays(startDateWeek, i), 'EEEEEE')}
        </div>
      );
    }
    return <div className="grid grid-cols-7 w-full mb-2">{days}</div>;
  };

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="text-sm font-semibold text-foreground/80 pl-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex w-full items-center justify-between rounded-2xl glass-input px-4 py-3.5 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 text-left"
        >
          <span className={cn("font-medium text-base", (!startDate && !endDate) && "text-muted-foreground")}>
            {getDisplayValue()}
          </span>
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "absolute z-50 bottom-full mb-2 p-5 rounded-3xl glass border border-white/10 shadow-2xl w-[320px]",
                align === 'left' && "left-0",
                align === 'right' && "right-0",
                align === 'center' && "left-1/2 -translate-x-1/2"
              )}
              onMouseLeave={() => setHoverDate(null)}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-4 px-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div className="font-bold text-base tracking-wide">
                  {format(currentMonth, 'MMMM yyyy')}
                </div>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              {/* Grid */}
              <div className="flex flex-col items-center w-full">
                {renderDays()}
                <div className="w-full">
                  {renderCells()}
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-border/50 flex justify-between items-center text-xs text-muted-foreground font-medium">
                {selectionStep === 'start' ? "Select start date" : "Select end date"}
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    onChange('', '');
                    setSelectionStep('start');
                  }}
                  className="text-primary hover:text-primary/80 transition-colors font-semibold"
                >
                  Clear
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
