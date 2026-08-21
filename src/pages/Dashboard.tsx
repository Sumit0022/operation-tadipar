import { useMemo } from 'react';
import { format, parseISO, isAfter, isBefore, addDays, startOfDay } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Circle, Calendar as CalendarIcon, ArrowRight, PlayCircle, Plus } from 'lucide-react';
import { useAppStore } from '../store';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/cn';

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

export default function Dashboard() {
  const navigate = useNavigate();
  const { subjects, topics, schedules, updateSchedule } = useAppStore();
  
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');
  
  const todaySchedules = useMemo(() => {
    return schedules
      .filter(s => s.date === todayStr)
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }, [schedules, todayStr]);
  
  const completedToday = todaySchedules.filter(s => s.status === 'Completed').length;
  const totalToday = todaySchedules.length;
  const progressPercent = totalToday === 0 ? 0 : Math.round((completedToday / totalToday) * 100);
  
  const upcomingSchedules = useMemo(() => {
    const todayStart = startOfDay(today);
    const endWindow = addDays(todayStart, 7);
    
    return schedules
      .filter(s => {
        const date = parseISO(s.date);
        return isAfter(date, todayStart) && isBefore(date, endWindow) && s.date !== todayStr;
      })
      .sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return a.startTime.localeCompare(b.startTime);
      })
      .slice(0, 5);
  }, [schedules, today]);

  const toggleScheduleStatus = (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Pending' ? 'Completed' : 'Pending';
    updateSchedule(id, { status: newStatus as any });
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8"
    >
      <motion.header variants={itemVariants} className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Good {format(today, 'a') === 'AM' ? 'Morning' : 'Afternoon'}</h1>
        <p className="text-muted-foreground mt-2 text-lg">
          Here's your study overview for {format(today, 'EEEE, d MMMM')}.
        </p>
      </motion.header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column - Today's Schedule & Progress */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Progress Card */}
          <motion.div variants={itemVariants}>
            <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20 shadow-[0_8px_30px_rgba(0,122,255,0.15)] relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 relative z-10">
                <div>
                  <h2 className="text-xl font-bold">Today's Progress</h2>
                  <p className="text-muted-foreground mt-1 text-base">
                    {completedToday} of {totalToday} sessions completed
                  </p>
                </div>
                <div className="text-5xl font-extrabold text-primary tracking-tighter">
                  {progressPercent}%
                </div>
              </div>
              
              <div className="h-4 w-full bg-background/50 rounded-full overflow-hidden backdrop-blur-sm shadow-inner relative z-10">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 1, type: "spring" }}
                  className="h-full bg-primary rounded-full relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 w-full animate-[shimmer_2s_infinite]" />
                </motion.div>
              </div>
            </Card>
          </motion.div>

          {/* Today's Schedule */}
          <motion.div variants={itemVariants}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold tracking-tight">Today's Schedule</h2>
              <Button variant="ghost" onClick={() => navigate('/calendar')} className="hidden sm:flex text-primary">
                View Calendar <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
            
            {todaySchedules.length === 0 ? (
              <Card interactive className="flex flex-col items-center justify-center p-12 text-center border-dashed bg-card/40">
                <PlayCircle className="w-16 h-16 text-muted-foreground/30 mb-6" />
                <h3 className="text-xl font-semibold mb-2">No sessions today</h3>
                <p className="text-muted-foreground mb-8 text-base max-w-sm">
                  Take a break, or add a new study session to get ahead.
                </p>
                <Button onClick={() => navigate('/calendar')} size="lg">
                  <Plus className="w-5 h-5 mr-2" />
                  Add Session
                </Button>
              </Card>
            ) : (
              <motion.div variants={containerVariants} className="space-y-4">
                {todaySchedules.map(schedule => {
                  const subject = subjects.find(s => s.id === schedule.subjectId);
                  const topic = topics.find(t => t.id === schedule.topicId);
                  const isCompleted = schedule.status === 'Completed';
                  
                  return (
                    <motion.div 
                      variants={itemVariants}
                      key={schedule.id}
                      className={cn(
                        "glass rounded-[1.5rem] p-5 flex items-center gap-5 transition-all duration-300 relative overflow-hidden",
                        isCompleted ? "opacity-60 bg-muted/20" : "hover:shadow-xl hover:-translate-y-1"
                      )}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 opacity-80" style={{ backgroundColor: subject?.color || '#cbd5e1' }} />
                      
                      <button 
                        onClick={() => toggleScheduleStatus(schedule.id, schedule.status)}
                        className="flex-shrink-0 text-muted-foreground hover:text-primary transition-colors focus:outline-none ml-2"
                      >
                        {isCompleted ? (
                          <CheckCircle2 className="w-8 h-8 text-primary drop-shadow-md" />
                        ) : (
                          <Circle className="w-8 h-8 opacity-40 hover:opacity-100 transition-opacity" />
                        )}
                      </button>
                      
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                          <h4 className={cn("font-bold text-lg truncate", isCompleted && "line-through text-muted-foreground")}>
                            {subject?.name || 'Unknown'}
                          </h4>
                          {schedule.sessionType && (
                            <span className={cn(
                              "text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md font-bold",
                              schedule.sessionType === 'Revision' ? 'bg-indigo-500/10 text-indigo-500' :
                              schedule.sessionType === 'Lecture' ? 'bg-amber-500/10 text-amber-500' :
                              schedule.sessionType === 'Practice' ? 'bg-emerald-500/10 text-emerald-500' :
                              'bg-primary/10 text-primary'
                            )}>
                              {schedule.sessionType}
                            </span>
                          )}
                        </div>
                        {topic ? (
                          <div className={cn("text-xs font-bold text-foreground/70 mb-1", isCompleted && "text-muted-foreground/70")}>
                            Topic: {topic.title}
                          </div>
                        ) : null}
                        
                        {(!topic || schedule.taskTitle !== topic.title) && (
                          <p className={cn("text-base text-foreground/80 truncate", isCompleted && "text-muted-foreground")}>
                            {schedule.taskTitle}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-end justify-center flex-shrink-0 text-sm font-semibold bg-secondary/80 backdrop-blur px-4 py-3 rounded-2xl border border-border/50">
                        <span>{schedule.startTime}</span>
                        <span className="text-xs text-muted-foreground mt-0.5">{schedule.endTime}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </motion.div>
        </div>
        
        {/* Right Column - Stats & Upcoming */}
        <div className="space-y-8">
          
          {/* Quick Stats */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 gap-4">
            <Card interactive className="p-6 flex flex-col items-center justify-center text-center">
              <span className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-2">Pending</span>
              <span className="text-4xl font-extrabold">{totalToday - completedToday}</span>
            </Card>
            <Card interactive className="p-6 flex flex-col items-center justify-center text-center">
              <span className="text-muted-foreground text-sm font-bold uppercase tracking-wider mb-2">Total Hrs</span>
              <span className="text-4xl font-extrabold">
                {todaySchedules.reduce((acc, s) => {
                  const start = s.startTime.split(':').map(Number);
                  const end = s.endTime.split(':').map(Number);
                  return acc + ((end[0] + end[1]/60) - (start[0] + start[1]/60));
                }, 0).toFixed(1)}
              </span>
            </Card>
          </motion.div>
          
          {/* Upcoming */}
          <motion.div variants={itemVariants}>
            <Card className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-lg font-bold">Upcoming</h2>
              </div>
              
              {upcomingSchedules.length === 0 ? (
                <p className="text-base text-muted-foreground text-center py-6">No upcoming sessions this week.</p>
              ) : (
                <div className="space-y-5">
                  {upcomingSchedules.map(schedule => {
                    const subject = subjects.find(s => s.id === schedule.subjectId);
                    const date = parseISO(schedule.date);
                    
                    return (
                      <div key={schedule.id} className="flex gap-4 items-center cursor-pointer group" onClick={() => navigate('/calendar')}>
                        <div className="flex flex-col items-center justify-center w-14 h-14 rounded-2xl bg-secondary/80 border border-border/50 flex-shrink-0 group-hover:bg-primary/20 group-hover:text-primary group-hover:border-primary/30 transition-all duration-300 shadow-sm">
                          <span className="text-xs font-bold uppercase tracking-wider">{format(date, 'MMM')}</span>
                          <span className="text-lg font-extrabold">{format(date, 'd')}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold truncate group-hover:text-primary transition-colors flex items-center gap-2">
                            {subject?.name || 'Unknown'}
                          </h4>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">
                            {schedule.taskTitle}
                          </p>
                        </div>
                        <div className="text-sm font-semibold bg-background/50 px-2 py-1 rounded-lg">
                          {schedule.startTime}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </motion.div>
          
        </div>
      </div>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer {
          100% {
            transform: translateX(100%);
          }
        }
      `}} />
    </motion.div>
  );
}
