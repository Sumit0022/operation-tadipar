import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, parseISO, addMonths, subMonths, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameMonth, isSameDay, addDays, isValid } from 'date-fns';
import { cn } from '../../utils/cn';
import { useSettingsStore } from '../../store/settings';

interface DatePickerProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  align?: 'left' | 'right' | 'center';
}

export function DatePicker({ label, value, onChange, align = 'left' }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { weekStartsOn } = useSettingsStore();

  // Safely parse initial value
  const parsedDate = value && isValid(parseISO(value)) ? parseISO(value) : new Date();
  
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(parsedDate));

  // Sync internal view if external value changes drastically (optional)
  useEffect(() => {
    if (value && isValid(parseISO(value))) {
      setCurrentMonth(startOfMonth(parseISO(value)));
    }
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

  const nextMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const selectDate = (date: Date) => {
    onChange(format(date, 'yyyy-MM-dd'));
    setIsOpen(false);
  };

  const renderCells = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn });
    const endDate = endOfWeek(monthEnd, { weekStartsOn });

    const dateFormat = 'd';
    const rows = [];
    let days = [];
    let day = startDate;
    let formattedDate = '';

    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        formattedDate = format(day, dateFormat);
        const cloneDay = day;
        
        const isSelected = value === format(cloneDay, 'yyyy-MM-dd');
        const isCurrentMonth = isSameMonth(cloneDay, monthStart);
        const isToday = isSameDay(cloneDay, new Date());

        days.push(
          <button
            key={cloneDay.toString()}
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              selectDate(cloneDay);
            }}
            className={cn(
              "h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors",
              !isCurrentMonth && "text-muted-foreground/30",
              isCurrentMonth && !isSelected && !isToday && "text-foreground hover:bg-secondary",
              isCurrentMonth && isToday && !isSelected && "text-primary bg-primary/10 font-bold",
              isSelected && "bg-primary text-primary-foreground shadow-md font-bold scale-110"
            )}
          >
            {formattedDate}
          </button>
        );
        day = addDays(day, 1);
      }
      rows.push(
        <div className="grid grid-cols-7 gap-1 mb-1" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    return rows;
  };

  const renderDays = () => {
    const dateFormat = 'EEEEEE'; // Su, Mo, Tu...
    const days = [];
    let startDate = startOfWeek(currentMonth, { weekStartsOn });

    for (let i = 0; i < 7; i++) {
      days.push(
        <div key={i} className="flex justify-center items-center h-8 w-8 text-xs font-bold text-muted-foreground uppercase">
          {format(addDays(startDate, i), dateFormat)}
        </div>
      );
    }
    return <div className="grid grid-cols-7 gap-1 mb-2">{days}</div>;
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
          <span className={cn("font-medium text-base", !value && "text-muted-foreground")}>
            {value ? format(parseISO(value), 'MMMM d, yyyy') : "Select Date"}
          </span>
          <CalendarIcon className="w-5 h-5 text-muted-foreground" />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className={cn(
                "absolute z-50 top-full mt-2 p-4 rounded-3xl glass border border-white/10 shadow-2xl w-[280px]",
                align === 'left' && "left-0",
                align === 'right' && "right-0",
                align === 'center' && "left-1/2 -translate-x-1/2"
              )}
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
                <div className="font-bold text-base">
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
              <div className="flex flex-col items-center">
                {renderDays()}
                {renderCells()}
              </div>
              
              <div className="mt-4 pt-3 border-t border-border/50 flex justify-center">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    selectDate(new Date());
                  }}
                  className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Today
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
