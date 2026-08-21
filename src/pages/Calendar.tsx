import { useState, useMemo } from 'react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameMonth, isSameDay, isToday,
  parseISO, addDays, differenceInDays
} from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, CheckCircle2, Circle, Copy, Trash2, Clock, MapPin, Edit2 } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';
import { useAppStore } from '../store';
import { useSettingsStore } from '../store/settings';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { TimePicker } from '../components/ui/TimePicker';
import { DatePicker } from '../components/ui/DatePicker';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { cn } from '../utils/cn';
import type { Schedule } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Calendar() {
  const { subjects, topics, schedules, holidays, addSchedule, updateSchedule, deleteSchedule, addHoliday, deleteHoliday } = useAppStore();
  const { weekStartsOn } = useSettingsStore();
  
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Modals
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [copyTargetStartDate, setCopyTargetStartDate] = useState('');
  const [copyTargetEndDate, setCopyTargetEndDate] = useState('');
  
  // Form State
  const [editingScheduleId, setEditingScheduleId] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    subjectId: '',
    topicId: '',
    sessionType: 'Lecture' as any,
    taskTitle: '',
    notes: '',
    startTime: '09:00',
    endTime: '10:30',
  });
  
  const [holidayForm, setHolidayForm] = useState({
    title: '',
    notes: '',
  });

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

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const dateSchedules = useMemo(() => schedules.filter(s => s.date === selectedDateStr).sort((a, b) => a.startTime.localeCompare(b.startTime)), [schedules, selectedDateStr]);
  const activeHoliday = holidays.find(h => h.date === selectedDateStr);
  const activeSubjects = subjects.filter(s => s.isActive);

  const handlePrevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
  const handleNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const handleToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  const openScheduleModal = (schedule?: Schedule) => {
    if (schedule) {
      setScheduleForm({
        subjectId: schedule.subjectId,
        topicId: schedule.topicId || '',
        sessionType: schedule.sessionType || 'Lecture',
        taskTitle: schedule.taskTitle,
        notes: schedule.notes || '',
        startTime: schedule.startTime,
        endTime: schedule.endTime,
      });
      setEditingScheduleId(schedule.id);
    } else {
      setScheduleForm({
        subjectId: activeSubjects.length > 0 ? activeSubjects[0].id : '',
        topicId: '',
        sessionType: 'Lecture',
        taskTitle: '',
        notes: '',
        startTime: '09:00',
        endTime: '10:30',
      });
      setEditingScheduleId(null);
    }
    setIsScheduleModalOpen(true);
  };
  
  const handleScheduleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleForm.subjectId) return toast.error('Subject is required');
    
    // Determine the task title based on topic selection
    let finalTaskTitle = scheduleForm.taskTitle;
    if (scheduleForm.topicId) {
      const topic = topics.find(t => t.id === scheduleForm.topicId);
      if (topic) finalTaskTitle = topic.title;
    }
    
    if (!finalTaskTitle.trim()) return toast.error('Task title or Topic is required');
    if (scheduleForm.endTime <= scheduleForm.startTime) return toast.error('End time must be after start time');
    
    const submitData = {
      ...scheduleForm,
      taskTitle: finalTaskTitle
    };
    
    if (editingScheduleId) {
      updateSchedule(editingScheduleId, submitData);
      toast.success('Schedule updated');
    } else {
      addSchedule({
        id: uuidv4(),
        date: selectedDateStr,
        ...submitData,
        status: 'Pending',
      });
      toast.success('Session added');
    }
    setIsScheduleModalOpen(false);
  };
  
  const toggleScheduleStatus = (id: string, currentStatus: string) => {
    updateSchedule(id, { status: currentStatus === 'Pending' ? 'Completed' : 'Pending' as any });
  };
  
  const duplicateSchedule = (schedule: Schedule) => {
    openScheduleModal(schedule);
    setEditingScheduleId(null);
  };

  const removeSchedule = (id: string) => {
    if (window.confirm('Delete this study session?')) {
      deleteSchedule(id);
      toast.success('Session deleted');
    }
  };

  const handleHolidaySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holidayForm.title.trim()) return toast.error('Holiday title is required');
    if (activeHoliday) deleteHoliday(activeHoliday.id);
    addHoliday({ id: uuidv4(), date: selectedDateStr, ...holidayForm });
    toast.success('Holiday marked');
    setIsHolidayModalOpen(false);
  };

  const removeHoliday = () => {
    if (activeHoliday && window.confirm('Remove this holiday?')) {
      deleteHoliday(activeHoliday.id);
      toast.success('Holiday removed');
    }
  };

  const handleCopySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!copyTargetStartDate) return toast.error('Please select a target date');
    
    const start = parseISO(copyTargetStartDate);
    const end = copyTargetEndDate ? parseISO(copyTargetEndDate) : start;
    
    if (end < start) {
      return toast.error('End date cannot be before start date');
    }

    let currentDate = start;
    let totalCopied = 0;
    
    while (currentDate <= end) {
      const dateString = format(currentDate, 'yyyy-MM-dd');
      
      // Skip if trying to copy onto the exact same source date
      if (dateString !== selectedDateStr) {
        dateSchedules.forEach(schedule => {
          addSchedule({
            id: uuidv4(),
            date: dateString,
            subjectId: schedule.subjectId,
            topicId: schedule.topicId,
            sessionType: schedule.sessionType,
            taskTitle: schedule.taskTitle,
            notes: schedule.notes,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            status: 'Pending',
          });
          totalCopied++;
        });
      }
      
      currentDate = addDays(currentDate, 1);
    }
    
    toast.success(`Copied ${totalCopied} session(s) across ${differenceInDays(end, start) + 1} day(s)`);
    setIsCopyModalOpen(false);
    setCopyTargetStartDate('');
    setCopyTargetEndDate('');
  };

  const renderCalendarDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd');
    const isSelected = isSameDay(day, selectedDate);
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isTodayDate = isToday(day);
    
    const daySchedules = schedules.filter(s => s.date === dateStr);
    const dayHoliday = holidays.find(h => h.date === dateStr);
    const completedCount = daySchedules.filter(s => s.status === 'Completed').length;
    const isAllCompleted = daySchedules.length > 0 && completedCount === daySchedules.length;
    
    return (
      <div 
        key={day.toString()}
        onClick={() => setSelectedDate(day)}
        className={cn(
          "min-h-[90px] p-2 border-r border-b border-border/40 cursor-pointer transition-all duration-300 relative group",
          !isCurrentMonth && "bg-muted/10 text-muted-foreground",
          isSelected && "bg-primary/10 shadow-[inset_0_0_0_2px_rgba(0,122,255,0.5)] dark:shadow-[inset_0_0_0_2px_rgba(10,132,255,0.5)] z-10",
          isTodayDate && !isSelected && "bg-accent/20",
          dayHoliday && "bg-destructive/10"
        )}
      >
        <div className="flex justify-between items-start">
          <span className={cn(
            "text-sm font-semibold w-8 h-8 flex items-center justify-center rounded-full transition-colors",
            isTodayDate && "bg-primary text-primary-foreground shadow-md",
            isSelected && !isTodayDate && "text-primary bg-primary/10"
          )}>
            {format(day, 'd')}
          </span>
          {isAllCompleted && (
            <CheckCircle2 className="w-4 h-4 text-green-500" />
          )}
        </div>
        
        <div className="mt-2 space-y-1">
          {dayHoliday && (
            <div className="text-[10px] bg-destructive text-destructive-foreground px-1.5 py-0.5 rounded-md truncate font-bold shadow-sm">
              {dayHoliday.title}
            </div>
          )}
          {!dayHoliday && daySchedules.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {daySchedules.slice(0, 4).map(s => {
                const sub = subjects.find(sub => sub.id === s.subjectId);
                return (
                  <div 
                    key={s.id} 
                    className="w-2.5 h-2.5 rounded-full shadow-sm"
                    style={{ backgroundColor: sub?.color || '#cbd5e1' }}
                    title={s.taskTitle}
                  />
                );
              })}
              {daySchedules.length > 4 && (
                <span className="text-[10px] text-muted-foreground font-semibold leading-none">+{daySchedules.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-8rem)]"
    >
      {/* Main Calendar View */}
      <motion.div variants={itemVariants} className="flex-1 flex flex-col glass rounded-[2.5rem] overflow-hidden shadow-2xl">
        {/* Calendar Header */}
        <div className="p-5 md:p-8 flex items-center justify-between border-b border-border/50 bg-card/60 backdrop-blur-md z-20">
          <div className="flex items-center gap-6">
            <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button variant="secondary" size="sm" onClick={handleToday} className="hidden sm:flex font-semibold">
              Today
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handlePrevMonth} className="rounded-full bg-muted/50">
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleNextMonth} className="rounded-full bg-muted/50">
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
        
        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto flex flex-col bg-card/30">
          <div className="grid grid-cols-7 border-b border-border/50 bg-muted/40">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
              .map((d, i) => {
                const dayIndex = (i + weekStartsOn) % 7;
                const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
                return (
                  <div key={d} className="py-3 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    {days[dayIndex]}
                  </div>
                );
              })}
          </div>
          <div className="grid grid-cols-7 flex-1 border-l border-border/50">
            {daysInMonth.map(renderCalendarDay)}
          </div>
        </div>
      </motion.div>

      {/* Date Detail View (Right Sidebar) */}
      <motion.div variants={itemVariants} className="w-full lg:w-96 flex flex-col gap-6 flex-shrink-0">
        <Card className="flex flex-col h-full bg-card/80 backdrop-blur-3xl shadow-2xl rounded-[2.5rem] p-8 border border-white/20 dark:border-white/10">
          <div className="mb-8">
            <h3 className="text-3xl font-extrabold tracking-tight">
              {format(selectedDate, 'EEEE')}
            </h3>
            <p className="text-muted-foreground text-lg mt-1 font-medium">
              {format(selectedDate, 'd MMMM yyyy')}
            </p>
          </div>

          {activeHoliday ? (
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-destructive/10 rounded-[2rem] border border-destructive/20 mb-6 shadow-inner"
            >
              <div className="w-16 h-16 bg-destructive/20 text-destructive rounded-3xl flex items-center justify-center mb-4 shadow-lg">
                <MapPin className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-xl text-destructive">{activeHoliday.title}</h4>
              {activeHoliday.notes && (
                <p className="text-sm text-destructive/80 mt-2 font-medium">{activeHoliday.notes}</p>
              )}
              <Button variant="ghost" size="sm" onClick={removeHoliday} className="mt-6 text-destructive hover:bg-destructive/20 font-bold">
                Remove Holiday
              </Button>
            </motion.div>
          ) : (
            <>
              {/* Progress */}
              {dateSchedules.length > 0 && (
                <div className="mb-8">
                  <div className="flex justify-between text-sm mb-3">
                    <span className="font-bold tracking-wide">Today's Progress</span>
                    <span className="font-extrabold text-primary">
                      {Math.round((dateSchedules.filter(s => s.status === 'Completed').length / dateSchedules.length) * 100)}%
                    </span>
                  </div>
                  <div className="h-3 w-full bg-secondary rounded-full overflow-hidden shadow-inner">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${(dateSchedules.filter(s => s.status === 'Completed').length / dateSchedules.length) * 100}%` }}
                      transition={{ duration: 0.8, type: "spring" }}
                      className="h-full bg-primary rounded-full relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                    </motion.div>
                  </div>
                </div>
              )}

              {/* Schedules List */}
              <div className="flex-1 overflow-y-auto space-y-4 -mx-2 px-2 pb-4">
                {dateSchedules.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 opacity-60">
                    <CalendarIcon className="w-12 h-12 mb-4" />
                    <p className="text-lg font-semibold">Schedule clear</p>
                    <p className="text-sm mt-1">Enjoy your day or add a session.</p>
                  </div>
                ) : (
                  <AnimatePresence>
                    {dateSchedules.map(schedule => {
                      const subject = subjects.find(s => s.id === schedule.subjectId);
                      const isCompleted = schedule.status === 'Completed';
                      
                      return (
                        <motion.div 
                          layout
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9 }}
                          whileHover={{ scale: 1.02 }}
                          key={schedule.id}
                          className={cn(
                            "p-4 rounded-[1.5rem] border transition-all duration-300 group relative",
                            isCompleted ? "bg-muted/30 border-border opacity-70" : "bg-card border-border/80 shadow-md hover:shadow-xl hover:border-primary/40"
                          )}
                        >
                          <div 
                            className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-[1.5rem] opacity-80"
                            style={{ backgroundColor: subject?.color || '#cbd5e1' }}
                          />
                          <div className="pl-3">
                            <div className="flex justify-between items-start mb-2">
                              <div className="text-xs font-bold text-muted-foreground flex flex-wrap items-center gap-1.5">
                                <span className="bg-background/50 px-2 py-1 rounded-lg flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {schedule.startTime} - {schedule.endTime}
                                </span>
                                {schedule.sessionType && (
                                  <span className={cn(
                                    "px-2 py-1 rounded-lg border",
                                    schedule.sessionType === 'Revision' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                                    schedule.sessionType === 'Lecture' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                    schedule.sessionType === 'Practice' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                    'bg-primary/10 text-primary border-primary/20'
                                  )}>
                                    {schedule.sessionType}
                                  </span>
                                )}
                              </div>
                              <button 
                                onClick={() => toggleScheduleStatus(schedule.id, schedule.status)}
                                className="text-muted-foreground hover:text-primary transition-colors ml-2"
                              >
                                {isCompleted ? <CheckCircle2 className="w-6 h-6 text-primary drop-shadow-sm" /> : <Circle className="w-6 h-6 opacity-50" />}
                              </button>
                            </div>
                            
                            <h4 className={cn("font-extrabold text-base flex items-center gap-2", isCompleted && "line-through text-muted-foreground")}>
                              {subject?.name || 'Unknown Subject'}
                            </h4>
                            
                            {schedule.topicId ? (
                              <div className="text-sm font-semibold text-foreground/80 mt-1">
                                Topic: {topics.filter(t => t.subjectId === schedule.subjectId).sort((a,b) => a.createdAt - b.createdAt).findIndex(t => t.id === schedule.topicId) + 1}. {topics.find(t => t.id === schedule.topicId)?.title || 'Unknown Topic'}
                              </div>
                            ) : null}
                            
                            {(!schedule.topicId || schedule.taskTitle !== topics.find(t => t.id === schedule.topicId)?.title) && (
                              <p className={cn("text-sm mt-1 font-medium", isCompleted && "text-muted-foreground")}>
                                {schedule.taskTitle}
                              </p>
                            )}
                            
                            <div className="flex items-center gap-1.5 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="secondary" size="sm" className="h-7 text-xs px-2.5 rounded-lg" onClick={() => openScheduleModal(schedule)}>
                                <Edit2 className="w-3 h-3 mr-1.5" /> Edit
                              </Button>
                              <Button variant="secondary" size="sm" className="h-7 text-xs px-2.5 rounded-lg" onClick={() => duplicateSchedule(schedule)}>
                                <Copy className="w-3 h-3 mr-1.5" /> Dup
                              </Button>
                              <Button variant="ghost" size="sm" className="h-7 text-xs px-2.5 rounded-lg text-destructive hover:bg-destructive/10 ml-auto" onClick={() => removeSchedule(schedule.id)}>
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                )}
              </div>
            </>
          )}

          <div className="mt-6 space-y-3 pt-6 border-t border-border/50">
            <Button size="lg" className="w-full shadow-lg" onClick={() => openScheduleModal()}>
              <Plus className="w-5 h-5 mr-2" />
              Add Session
            </Button>
            {dateSchedules.length > 0 && (
              <Button variant="secondary" size="lg" className="w-full" onClick={() => setIsCopyModalOpen(true)}>
                <Copy className="w-5 h-5 mr-2 opacity-70" />
                Copy Day's Schedule
              </Button>
            )}
            {!activeHoliday && (
              <Button variant="ghost" size="lg" className="w-full text-muted-foreground hover:text-destructive font-semibold" onClick={() => setIsHolidayModalOpen(true)}>
                Mark as Holiday
              </Button>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Modals */}
      <Modal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        title={editingScheduleId ? "Edit Study Session" : "Create Study Session"}
      >
        <form onSubmit={handleScheduleSubmit} className="space-y-5">
          <Select
            label="Subject *"
            value={scheduleForm.subjectId}
            onChange={(e) => setScheduleForm({ ...scheduleForm, subjectId: e.target.value, topicId: '' })}
            disabled={activeSubjects.length === 0}
          >
            <option value="" disabled>Select Subject</option>
            {activeSubjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>

          {scheduleForm.subjectId && topics.filter(t => t.subjectId === scheduleForm.subjectId).length > 0 && (
            <div className="grid grid-cols-2 gap-5">
              <Select
                label="Topic / Chapter"
                value={scheduleForm.topicId}
                onChange={(e) => setScheduleForm({ ...scheduleForm, topicId: e.target.value })}
              >
                <option value="">No specific topic</option>
                {topics.filter(t => t.subjectId === scheduleForm.subjectId).sort((a,b) => a.createdAt - b.createdAt).map((t, index) => (
                  <option key={t.id} value={t.id}>{index + 1}. {t.title}</option>
                ))}
              </Select>
              
              <Select
                label="Session Type"
                value={scheduleForm.sessionType}
                onChange={(e) => setScheduleForm({ ...scheduleForm, sessionType: e.target.value as any })}
              >
                <option value="Lecture">Lecture / Class</option>
                <option value="Revision">Revision</option>
                <option value="Practice">Practice / MCQ</option>
                <option value="Self Study">Self Study</option>
              </Select>
            </div>
          )}
          
          {!scheduleForm.topicId && (
            <Input
              label="Task Title *"
              placeholder="What will you study?"
              value={scheduleForm.taskTitle}
              onChange={(e) => setScheduleForm({ ...scheduleForm, taskTitle: e.target.value })}
              autoFocus={!scheduleForm.subjectId}
            />
          )}
          
          <div className="grid grid-cols-2 gap-5">
            <TimePicker
              label="Start Time *"
              value={scheduleForm.startTime}
              onChange={(val) => setScheduleForm({ ...scheduleForm, startTime: val })}
            />
            <TimePicker
              label="End Time *"
              value={scheduleForm.endTime}
              onChange={(val) => setScheduleForm({ ...scheduleForm, endTime: val })}
              align="right"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Notes</label>
            <textarea
              className="flex w-full rounded-2xl glass-input px-4 py-3 text-sm placeholder:text-muted-foreground resize-none h-24"
              placeholder="Optional notes"
              value={scheduleForm.notes}
              onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })}
            />
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={activeSubjects.length === 0}>
              {editingScheduleId ? "Save Changes" : "Add Session"}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        title="Mark as Holiday"
      >
        <form onSubmit={handleHolidaySubmit} className="space-y-5">
          <Input
            label="Holiday Title *"
            placeholder="e.g. Independence Day, Sick Leave"
            value={holidayForm.title}
            onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })}
            autoFocus
          />
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Reason / Note</label>
            <textarea
              className="flex w-full rounded-2xl glass-input px-4 py-3 text-sm placeholder:text-muted-foreground resize-none h-24"
              placeholder="Optional reason"
              value={holidayForm.notes}
              onChange={(e) => setHolidayForm({ ...holidayForm, notes: e.target.value })}
            />
          </div>
          
          {dateSchedules.length > 0 && (
            <div className="p-4 bg-destructive/10 text-destructive rounded-2xl text-sm border border-destructive/20 font-medium">
              <strong>Warning:</strong> This date has {dateSchedules.length} study session(s). Marking it as a holiday will keep them visually but emphasize the holiday state.
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={() => setIsHolidayModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="danger">Mark Holiday</Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        title="Copy Schedule to Another Date"
      >
        <form onSubmit={handleCopySubmit} className="space-y-6">
          <DateRangePicker
            label="Target Date Range *"
            startDate={copyTargetStartDate}
            endDate={copyTargetEndDate}
            onChange={(start, end) => {
              setCopyTargetStartDate(start);
              setCopyTargetEndDate(end);
            }}
            align="center"
          />
          
          <div className="bg-secondary/50 p-4 rounded-xl text-sm border border-border/50 font-medium leading-relaxed">
            This will duplicate all <strong>{dateSchedules.length}</strong> session(s) from <strong>{format(selectedDate, 'd MMM yyyy')}</strong> to every date in the selected range.
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={() => setIsCopyModalOpen(false)}>Cancel</Button>
            <Button type="submit">Copy Schedule</Button>
          </div>
        </form>
      </Modal>
    </motion.div>
  );
}
