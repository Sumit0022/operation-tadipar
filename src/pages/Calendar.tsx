import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useAppStore } from '../store';
import { useSettingsStore } from '../store/settings';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Calendar() {
  const navigate = useNavigate();
  const { subjects, schedules, holidays } = useAppStore();
  const { weekStartsOn } = useSettingsStore();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const daysInMonth = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    const startDate = new Date(start);
    const dayOfWeek = startDate.getDay();
    const diff = (dayOfWeek < weekStartsOn ? 7 : 0) + dayOfWeek - weekStartsOn;
    startDate.setDate(startDate.getDate() - diff);
    
    const endDate = new Date(end);
    const endDayOfWeek = endDate.getDay();
    const endDiff = (6 - endDayOfWeek + weekStartsOn) % 7;
    endDate.setDate(endDate.getDate() + endDiff);
    
    return eachDayOfInterval({ start: startDate, end: endDate });
  }, [currentMonth, weekStartsOn]);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => setCurrentMonth(new Date());

  const renderCalendarDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isTodayDate = isToday(day);
    
    const daySchedules = schedules.filter(s => s.date === dateStr);
    const dayHoliday = holidays.find(h => h.date === dateStr);
    const completedCount = daySchedules.filter(s => s.status === 'Completed').length;
    const isAllCompleted = daySchedules.length > 0 && completedCount === daySchedules.length;
    
    return (
      <div 
        key={day.toString()}
        onClick={() => navigate(`/calendar/${dateStr}`)}
        className={cn(
          "relative p-2 border-r border-b border-border/40 cursor-pointer transition-all duration-300 flex flex-col h-full overflow-hidden group hover:bg-primary/5",
          !isCurrentMonth && "bg-muted/10 text-muted-foreground",
          isTodayDate && "bg-accent/20",
          dayHoliday && "bg-destructive/10"
        )}
      >
        <div className="flex justify-between items-start">
          <span className={cn(
            "text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full transition-colors",
            isTodayDate && "bg-primary text-primary-foreground shadow-md"
          )}>
            {format(day, 'd')}
          </span>
          {isAllCompleted && (
            <CheckCircle2 className="w-4 h-4 text-green-500 mt-1" />
          )}
        </div>
        
        <div className="mt-1 flex-1 overflow-hidden flex flex-col gap-1">
          {dayHoliday && (
            <div className="text-[10px] sm:text-xs bg-destructive/90 text-destructive-foreground px-1.5 py-0.5 rounded-md truncate font-bold shadow-sm">
              {dayHoliday.title}
            </div>
          )}
          {!dayHoliday && daySchedules.length > 0 && (
            <div className="flex flex-col gap-1 mt-1">
              {daySchedules.slice(0, 3).map(s => {
                const sub = subjects.find(sub => sub.id === s.subjectId);
                return (
                  <div 
                    key={s.id} 
                    className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md text-[10px] sm:text-xs font-medium truncate"
                    style={{ backgroundColor: sub ? `${sub.color}20` : '#cbd5e120', color: sub?.color || '#cbd5e1' }}
                    title={s.taskTitle}
                  >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: sub?.color || '#cbd5e1' }} />
                    <span className="truncate">{s.taskTitle}</span>
                  </div>
                );
              })}
              {daySchedules.length > 3 && (
                <span className="text-[10px] text-muted-foreground font-semibold px-1">+ {daySchedules.length - 3} more</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const totalWeeks = daysInMonth.length / 7;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col h-[calc(100vh-6rem)] w-full max-w-7xl mx-auto"
    >
      <motion.div variants={itemVariants} className="flex-1 flex flex-col glass rounded-[2.5rem] overflow-hidden shadow-2xl w-full h-full">
        {/* Calendar Header */}
        <div className="p-4 md:p-6 flex items-center justify-between border-b border-border/50 bg-card/60 backdrop-blur-md z-20 shrink-0">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button variant="secondary" size="sm" onClick={handleToday} className="hidden sm:flex font-semibold">
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="rounded-full bg-muted/50 hover:bg-muted">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="rounded-full bg-muted/50 hover:bg-muted">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Calendar Grid Container */}
        <div className="flex-1 flex flex-col bg-card/30 overflow-hidden">
          {/* Days of week header */}
          <div className="grid grid-cols-7 border-b border-border/50 bg-muted/40 shrink-0">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
              .map((d, i) => {
                const dayIndex = (i + weekStartsOn) % 7;
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return (
                  <div key={d} className="py-2.5 text-center text-[10px] md:text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {days[dayIndex]}
                  </div>
                );
              })}
          </div>
          
          {/* Calendar Cells (Uses grid rows to perfectly stretch and fill the remaining height) */}
          <div 
            className="grid grid-cols-7 flex-1 border-l border-border/50"
            style={{ gridTemplateRows: `repeat(${totalWeeks}, minmax(0, 1fr))` }}
          >
            {daysInMonth.map(renderCalendarDay)}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
