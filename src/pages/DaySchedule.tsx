import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO, addDays, subDays, isValid, differenceInDays } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, CheckCircle2, Circle, Copy, Trash2, Clock, MapPin, Edit2, ArrowLeft } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import toast from 'react-hot-toast';

import { useAppStore } from '../store';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { TimePicker } from '../components/ui/TimePicker';
import { DateRangePicker } from '../components/ui/DateRangePicker';
import { cn } from '../utils/cn';
import type { Schedule } from '../types';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function DaySchedule() {
  const { date: dateParam } = useParams();
  const navigate = useNavigate();
  
  const { subjects, topics, schedules, holidays, addSchedule, updateSchedule, deleteSchedule, addHoliday, deleteHoliday } = useAppStore();
  
  // Validate and parse date
  const selectedDate = useMemo(() => {
    if (!dateParam || !isValid(parseISO(dateParam))) return new Date();
    return parseISO(dateParam);
  }, [dateParam]);
  
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  
  const dateSchedules = useMemo(() => 
    schedules.filter(s => s.date === selectedDateStr).sort((a, b) => a.startTime.localeCompare(b.startTime)),
  [schedules, selectedDateStr]);
  
  const activeHoliday = holidays.find(h => h.date === selectedDateStr);
  const activeSubjects = subjects.filter(s => s.isActive);

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
  
  const [holidayForm, setHolidayForm] = useState({ title: '', notes: '' });

  const navigateDay = (direction: 'prev' | 'next') => {
    const newDate = direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1);
    navigate(`/calendar/${format(newDate, 'yyyy-MM-dd')}`);
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
    
    let finalTaskTitle = scheduleForm.taskTitle;
    if (scheduleForm.topicId) {
      const topic = topics.find(t => t.id === scheduleForm.topicId);
      if (topic) finalTaskTitle = topic.title;
    }
    
    if (!finalTaskTitle.trim()) return toast.error('Task title or Topic is required');
    if (scheduleForm.endTime <= scheduleForm.startTime) return toast.error('End time must be after start time');
    
    const submitData = { ...scheduleForm, taskTitle: finalTaskTitle };
    
    if (editingScheduleId) {
      updateSchedule(editingScheduleId, submitData);
      toast.success('Schedule updated');
    } else {
      addSchedule({ id: uuidv4(), date: selectedDateStr, ...submitData, status: 'Pending' });
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

  const clearAllSchedules = () => {
    if (window.confirm('Are you sure you want to delete ALL study sessions for this date? This cannot be undone.')) {
      dateSchedules.forEach(schedule => deleteSchedule(schedule.id));
      toast.success('All sessions deleted');
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
    
    if (end < start) return toast.error('End date cannot be before start date');

    let currentDate = start;
    let totalCopied = 0;
    
    while (currentDate <= end) {
      const dateString = format(currentDate, 'yyyy-MM-dd');
      if (dateString !== selectedDateStr) {
        dateSchedules.forEach(schedule => {
          addSchedule({
            id: uuidv4(), date: dateString,
            subjectId: schedule.subjectId, topicId: schedule.topicId,
            sessionType: schedule.sessionType, taskTitle: schedule.taskTitle,
            notes: schedule.notes, startTime: schedule.startTime,
            endTime: schedule.endTime, status: 'Pending',
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

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6 pb-20 w-full max-w-7xl mx-auto">
      
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 glass rounded-[2.5rem] p-6 shadow-2xl">
        <Button variant="secondary" onClick={() => navigate('/calendar')} className="flex items-center self-start sm:self-auto rounded-xl">
          <ArrowLeft className="w-5 h-5 mr-2" /> Back to Calendar
        </Button>

        <div className="flex items-center gap-6">
          <Button variant="ghost" size="icon" onClick={() => navigateDay('prev')} className="rounded-full bg-muted/50 hover:bg-muted w-12 h-12">
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="text-center w-64">
            <h2 className="text-3xl font-extrabold tracking-tight">{format(selectedDate, 'EEEE')}</h2>
            <p className="text-muted-foreground font-medium text-lg mt-1">{format(selectedDate, 'd MMMM yyyy')}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => navigateDay('next')} className="rounded-full bg-muted/50 hover:bg-muted w-12 h-12">
            <ChevronRight className="w-6 h-6" />
          </Button>
        </div>

        <div className="w-[140px] hidden sm:block" /> {/* spacer for balance */}
      </div>

      {/* Main Content Area */}
      {activeHoliday ? (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center p-16 glass rounded-[2.5rem] border-2 border-destructive/20 mt-10">
          <div className="w-24 h-24 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-6 shadow-lg shadow-destructive/20">
            <MapPin className="w-12 h-12" />
          </div>
          <h4 className="font-extrabold text-4xl text-destructive tracking-tight">{activeHoliday.title}</h4>
          {activeHoliday.notes && (
            <p className="text-xl text-destructive/80 mt-4 font-medium max-w-2xl text-center">{activeHoliday.notes}</p>
          )}
          <Button variant="ghost" size="lg" onClick={removeHoliday} className="mt-10 text-destructive hover:bg-destructive/10 font-bold border-2 border-destructive/20 px-8 py-6 rounded-2xl">
            Remove Holiday
          </Button>
        </motion.div>
      ) : (
        <>
          {dateSchedules.length > 0 && (
            <motion.div variants={itemVariants} className="glass p-8 rounded-[2rem] shadow-xl">
              <div className="flex justify-between text-base mb-4">
                <span className="font-bold tracking-wide">Daily Progress</span>
                <span className="font-extrabold text-primary text-xl">
                  {Math.round((dateSchedules.filter(s => s.status === 'Completed').length / dateSchedules.length) * 100)}%
                </span>
              </div>
              <div className="h-4 w-full bg-secondary rounded-full overflow-hidden shadow-inner">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(dateSchedules.filter(s => s.status === 'Completed').length / dateSchedules.length) * 100}%` }}
                  transition={{ duration: 0.8, type: "spring" }}
                  className="h-full bg-primary rounded-full relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                </motion.div>
              </div>
            </motion.div>
          )}

          <div className="flex justify-between items-center mt-4">
            <h3 className="text-2xl font-bold">Study Sessions</h3>
            <div className="flex gap-3">
              {dateSchedules.length > 0 && (
                <>
                  <Button variant="ghost" onClick={clearAllSchedules} className="rounded-xl font-bold text-destructive hover:bg-destructive/10">
                    <Trash2 className="w-4 h-4 mr-2" /> Clear All
                  </Button>
                  <Button variant="secondary" onClick={() => setIsCopyModalOpen(true)} className="rounded-xl font-bold shadow-md">
                    <Copy className="w-4 h-4 mr-2 opacity-70" /> Copy Day
                  </Button>
                </>
              )}
              <Button onClick={() => openScheduleModal()} className="rounded-xl font-bold shadow-md shadow-primary/20">
                <Plus className="w-5 h-5 mr-1" /> Add Session
              </Button>
            </div>
          </div>

          {dateSchedules.length === 0 ? (
            <motion.div variants={itemVariants} className="flex flex-col items-center justify-center p-20 glass rounded-[3rem] mt-4 opacity-70">
              <CalendarIcon className="w-24 h-24 mb-6 text-muted-foreground/50" />
              <p className="text-3xl font-extrabold tracking-tight">Schedule is clear</p>
              <p className="text-xl mt-3 text-muted-foreground font-medium">Enjoy your day or add a new study session.</p>
              
              {!activeHoliday && (
                <Button variant="secondary" onClick={() => setIsHolidayModalOpen(true)} className="mt-8 rounded-xl font-bold">
                  Mark as Holiday
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div variants={itemVariants} className="flex flex-col gap-4 mt-4">
              <AnimatePresence>
                {dateSchedules.map(schedule => {
                  const subject = subjects.find(s => s.id === schedule.subjectId);
                  const isCompleted = schedule.status === 'Completed';
                  
                  return (
                    <motion.div 
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      whileHover={{ scale: 1.01 }}
                      key={schedule.id}
                      className={cn(
                        "p-4 md:p-5 rounded-[1.5rem] border transition-all duration-300 group relative flex flex-col md:flex-row md:items-center gap-4 shadow-lg",
                        isCompleted ? "bg-muted/30 border-border opacity-70" : "glass border-border/80 hover:shadow-xl hover:border-primary/50"
                      )}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-2 rounded-l-[1.5rem] opacity-90" style={{ backgroundColor: subject?.color || '#cbd5e1' }} />
                      
                      {/* Left: Time and Type */}
                      <div className="pl-4 md:pl-3 md:w-[200px] shrink-0 flex flex-col items-start gap-2">
                        <span className="bg-background/80 px-3 py-1.5 rounded-xl flex items-center gap-2 shadow-sm border border-border/50 text-sm font-bold text-muted-foreground">
                          <Clock className="w-4 h-4 text-primary" /> {schedule.startTime} - {schedule.endTime}
                        </span>
                        {schedule.sessionType && (
                          <span className={cn(
                            "px-3 py-1.5 rounded-xl border shadow-sm text-xs font-bold",
                            schedule.sessionType === 'Revision' ? 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20' :
                            schedule.sessionType === 'Lecture' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                            schedule.sessionType === 'Practice' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                            'bg-primary/10 text-primary border-primary/20'
                          )}>
                            {schedule.sessionType}
                          </span>
                        )}
                      </div>
                      
                      {/* Center: Details */}
                      <div className="flex-1 flex flex-col pl-4 md:pl-0">
                        <h4 className={cn("font-extrabold text-xl md:text-2xl flex items-center gap-2 mb-1 tracking-tight", isCompleted && "line-through text-muted-foreground")}>
                          {subject?.name || 'Unknown Subject'}
                        </h4>
                        
                        {schedule.topicId ? (
                          <div className="text-sm md:text-base font-semibold text-foreground/80">
                            <span className="opacity-70">Chapter:</span> {topics.filter(t => t.subjectId === schedule.subjectId).sort((a,b) => a.createdAt - b.createdAt).findIndex(t => t.id === schedule.topicId) + 1}. {topics.find(t => t.id === schedule.topicId)?.title || 'Unknown Topic'}
                          </div>
                        ) : null}
                        
                        {(!schedule.topicId || schedule.taskTitle !== topics.find(t => t.id === schedule.topicId)?.title) && (
                          <p className={cn("text-base md:text-lg font-medium text-foreground/90", schedule.topicId && "mt-1", isCompleted && "text-muted-foreground")}>
                            {schedule.taskTitle}
                          </p>
                        )}
                      </div>
                      
                      {/* Right: Actions */}
                      <div className="flex items-center gap-3 mt-4 md:mt-0 pl-4 md:pl-0 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                        <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl" onClick={() => openScheduleModal(schedule)} title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl" onClick={() => duplicateSchedule(schedule)} title="Duplicate">
                          <Copy className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-destructive hover:bg-destructive/10" onClick={() => removeSchedule(schedule.id)} title="Delete">
                          <Trash2 className="w-5 h-5" />
                        </Button>
                        
                        <div className="w-px h-8 bg-border/50 mx-2 hidden md:block" />
                        
                        <button 
                          onClick={() => toggleScheduleStatus(schedule.id, schedule.status)}
                          className="text-muted-foreground hover:text-primary transition-colors hover:scale-110 active:scale-95 ml-auto md:ml-0"
                        >
                          {isCompleted ? <CheckCircle2 className="w-9 h-9 text-primary drop-shadow-md" /> : <Circle className="w-9 h-9 opacity-40 hover:opacity-100" />}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </>
      )}

      {/* Modals */}
      <Modal isOpen={isScheduleModalOpen} onClose={() => setIsScheduleModalOpen(false)} title={editingScheduleId ? "Edit Study Session" : "Create Study Session"}>
        <form onSubmit={handleScheduleSubmit} className="space-y-5">
          <Select label="Subject *" value={scheduleForm.subjectId} onChange={(e) => setScheduleForm({ ...scheduleForm, subjectId: e.target.value, topicId: '' })} disabled={activeSubjects.length === 0}>
            <option value="" disabled>Select Subject</option>
            {activeSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </Select>

          {scheduleForm.subjectId && topics.filter(t => t.subjectId === scheduleForm.subjectId).length > 0 && (
            <div className="grid grid-cols-2 gap-5">
              <Select label="Topic / Chapter" value={scheduleForm.topicId} onChange={(e) => setScheduleForm({ ...scheduleForm, topicId: e.target.value })}>
                <option value="">No specific topic</option>
                {topics.filter(t => t.subjectId === scheduleForm.subjectId).sort((a,b) => a.createdAt - b.createdAt).map((t, index) => (
                  <option key={t.id} value={t.id}>{index + 1}. {t.title}</option>
                ))}
              </Select>
              
              <Select label="Session Type" value={scheduleForm.sessionType} onChange={(e) => setScheduleForm({ ...scheduleForm, sessionType: e.target.value as any })}>
                <option value="Lecture">Lecture / Class</option>
                <option value="Revision">Revision</option>
                <option value="Practice">Practice / MCQ</option>
                <option value="Self Study">Self Study</option>
              </Select>
            </div>
          )}
          
          {!scheduleForm.topicId && (
            <Input label="Task Title *" placeholder="What will you study?" value={scheduleForm.taskTitle} onChange={(e) => setScheduleForm({ ...scheduleForm, taskTitle: e.target.value })} autoFocus={!scheduleForm.subjectId} />
          )}
          
          <div className="grid grid-cols-2 gap-5">
            <TimePicker label="Start Time *" value={scheduleForm.startTime} onChange={(val) => setScheduleForm({ ...scheduleForm, startTime: val })} />
            <TimePicker label="End Time *" value={scheduleForm.endTime} onChange={(val) => setScheduleForm({ ...scheduleForm, endTime: val })} align="right" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Notes</label>
            <textarea className="flex w-full rounded-2xl glass-input px-4 py-3 text-sm placeholder:text-muted-foreground resize-none h-24" placeholder="Optional notes" value={scheduleForm.notes} onChange={(e) => setScheduleForm({ ...scheduleForm, notes: e.target.value })} />
          </div>
          
          <div className="flex justify-end gap-3 pt-6 border-t border-border/50">
            <Button type="button" variant="ghost" onClick={() => setIsScheduleModalOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={activeSubjects.length === 0}>{editingScheduleId ? "Save Changes" : "Add Session"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isHolidayModalOpen} onClose={() => setIsHolidayModalOpen(false)} title="Mark as Holiday">
        <form onSubmit={handleHolidaySubmit} className="space-y-5">
          <Input label="Holiday Title *" placeholder="e.g. Independence Day, Sick Leave" value={holidayForm.title} onChange={(e) => setHolidayForm({ ...holidayForm, title: e.target.value })} autoFocus />
          
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/80">Reason / Note</label>
            <textarea className="flex w-full rounded-2xl glass-input px-4 py-3 text-sm placeholder:text-muted-foreground resize-none h-24" placeholder="Optional reason" value={holidayForm.notes} onChange={(e) => setHolidayForm({ ...holidayForm, notes: e.target.value })} />
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

      <Modal isOpen={isCopyModalOpen} onClose={() => setIsCopyModalOpen(false)} title="Copy Schedule to Another Date">
        <form onSubmit={handleCopySubmit} className="space-y-6">
          <DateRangePicker label="Target Date Range *" startDate={copyTargetStartDate} endDate={copyTargetEndDate} onChange={(start, end) => { setCopyTargetStartDate(start); setCopyTargetEndDate(end); }} align="center" />
          
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
