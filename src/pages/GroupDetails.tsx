import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, LogOut, ArrowLeft, Trash2, Shield, Activity, BookOpen, Lock, Copy, Check, CalendarDays } from 'lucide-react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGroupsStore } from '../store/groups';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import type { Group, Schedule, ActiveSession } from '../types';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

interface MemberData {
  uid: string;
  name: string;
  username: string;
  photoURL?: string;
  activeSession?: ActiveSession | null;
  attendanceCount: number;
}

export default function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { myGroups, leaveGroup, deleteGroup } = useGroupsStore();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Record<string, MemberData>>({});
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    // Tick to update live elapsed time for active members
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!id) return;
    const unsubscribers: (() => void)[] = [];

    const fetchGroupAndMembers = async () => {
      try {
        let g = myGroups.find(g => g.id === id);
        if (!g) {
          const gSnap = await getDoc(doc(db, 'groups', id));
          if (gSnap.exists()) {
            g = { id: gSnap.id, ...gSnap.data() } as Group;
          }
        }
        
        if (!g) {
          toast.error("Group not found");
          navigate('/groups');
          return;
        }
        
        setGroup(g);

        // Set up real-time listener for each member
        for (const uid of g.memberIds) {
          const unsub = onSnapshot(doc(db, 'users', uid), async (profileSnap) => {
            if (profileSnap.exists()) {
              const profile = profileSnap.data();
              
              // We fetch their sync data once to calculate attendance, it doesn't need to be strictly real-time
              let attendanceCount = 0;
              try {
                const syncSnap = await getDoc(doc(db, 'users', uid, 'data', 'sync'));
                if (syncSnap.exists()) {
                  const syncData = syncSnap.data();
                  const schedules: Schedule[] = syncData.schedules || [];
                  const uniqueDays = new Set(schedules.filter(s => s.status === 'Completed').map(s => s.date));
                  attendanceCount = uniqueDays.size;
                }
              } catch (e) { }

              setMembers(prev => ({
                ...prev,
                [uid]: {
                  uid,
                  name: profile.name || profile.username || 'User',
                  username: profile.username || '',
                  photoURL: profile.photoURL,
                  activeSession: profile.activeSession,
                  attendanceCount
                }
              }));
            }
          });
          unsubscribers.push(unsub);
        }
        
        setLoading(false);
      } catch (error) {
        console.error(error);
        toast.error("Error loading group details");
        setLoading(false);
      }
    };
    
    fetchGroupAndMembers();
    
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [id, myGroups, navigate]);

  const handleLeave = async () => {
    if (!id || !group) return;
    if (confirm('Are you sure you want to leave this group?')) {
      setLeaving(true);
      try {
        if (group.ownerId === user?.uid && group.memberIds.length > 1) {
          toast.error("Please transfer ownership or delete the group since you are the owner.");
          setLeaving(false);
          return;
        }
        
        if (group.ownerId === user?.uid && group.memberIds.length === 1) {
           await deleteGroup(id);
           toast.success('Group deleted.');
        } else {
           await leaveGroup(id);
           toast.success('Left group successfully.');
        }
        navigate('/groups');
      } catch (err: any) {
        toast.error(err.message || "Failed to leave");
      } finally {
        setLeaving(false);
      }
    }
  };

  const handleCopyInvite = () => {
    if (group?.inviteCode) {
      navigator.clipboard.writeText(group.inviteCode);
      setCopied(true);
      toast.success("Invite code copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading || !group) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
      </div>
    );
  }

  const isAdmin = user?.uid === group.ownerId;
  const isMember = user && group.memberIds.includes(user.uid);
  
  const memberList = Object.values(members).sort((a, b) => {
    // Active members first
    if (a.activeSession && !b.activeSession) return -1;
    if (!a.activeSession && b.activeSession) return 1;
    return a.name.localeCompare(b.name);
  });

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto w-full pb-24"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <Link to="/groups" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Groups
        </Link>
        <div className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group/card">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="w-32 h-32 rounded-[2rem] bg-gradient-to-br from-primary/20 to-indigo-500/20 p-1 flex-shrink-0 shadow-lg">
              <div className="w-full h-full bg-card rounded-[1.8rem] flex items-center justify-center overflow-hidden">
                {group.photoURL ? (
                  <img src={group.photoURL} alt={group.name} className="w-full h-full object-cover" />
                ) : (
                  <Users className="w-12 h-12 text-primary" />
                )}
              </div>
            </div>
            
            <div className="flex-1 text-center md:text-left w-full">
              <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-4">
                <div>
                  <h1 className="text-3xl font-black tracking-tight flex items-center gap-2 justify-center md:justify-start">
                    {group.name}
                    {group.isPrivate && <Lock className="w-5 h-5 text-amber-500" />}
                  </h1>
                  <p className="text-muted-foreground mt-2 font-medium max-w-xl">{group.bio || 'No description provided.'}</p>
                </div>
                
                {isMember && (
                  <Button 
                    variant="danger" 
                    onClick={handleLeave} 
                    disabled={leaving}
                    className="rounded-xl flex items-center gap-2"
                  >
                    {isAdmin && group.memberIds.length === 1 ? <Trash2 className="w-4 h-4" /> : <LogOut className="w-4 h-4" />}
                    {isAdmin && group.memberIds.length === 1 ? 'Delete Group' : 'Leave Group'}
                  </Button>
                )}
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-6">
                <div className="px-4 py-2 rounded-xl bg-background/50 border border-border/50 flex items-center gap-2 text-sm font-bold">
                  <Users className="w-4 h-4 text-primary" /> {group.memberIds.length}/50 Members
                </div>
                {isAdmin && (
                  <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-sm font-bold text-primary">
                    <Shield className="w-4 h-4" /> Admin
                  </div>
                )}
              </div>
              
              {group.isPrivate && isMember && (
                <div className="mt-4 flex items-center gap-3 justify-center md:justify-start bg-secondary/30 p-3 rounded-2xl w-fit border border-border/50">
                  <span className="text-sm font-semibold text-muted-foreground">Invite Code:</span>
                  <span className="font-mono font-bold tracking-widest text-primary">{group.inviteCode}</span>
                  <button 
                    onClick={handleCopyInvite}
                    className="w-8 h-8 rounded-full bg-background/50 flex items-center justify-center hover:bg-background text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Activity className="w-6 h-6 text-primary" /> Member Activity
        </h2>
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground bg-secondary/30 px-3 py-1.5 rounded-full border border-border/50">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Live Now
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {memberList.map(member => {
          const isStudying = !!member.activeSession;
          
          let elapsedStr = '';
          if (isStudying && member.activeSession) {
            let current = member.activeSession.accumulatedSeconds;
            if (member.activeSession.status === 'running') {
              current += Math.floor((now - member.activeSession.startTime) / 1000);
            }
            const h = Math.floor(current / 3600);
            const m = Math.floor((current % 3600) / 60);
            const s = current % 60;
            elapsedStr = `${h > 0 ? h + 'h ' : ''}${m}m ${s}s`;
          }

          return (
            <div key={member.uid} className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col group/member">
              {isStudying && (
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500 animate-pulse" />
              )}
              
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className={`w-14 h-14 rounded-full p-0.5 ${isStudying ? 'bg-gradient-to-br from-green-400 to-emerald-500 animate-pulse' : 'bg-border/50'}`}>
                    <div className="w-full h-full bg-card rounded-full flex items-center justify-center overflow-hidden border-2 border-background">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-muted-foreground/50" />
                      )}
                    </div>
                  </div>
                  {isStudying && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full animate-ping" />
                  )}
                  {isStudying && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-lg truncate flex items-center gap-2">
                    {member.name}
                    {member.uid === group.ownerId && (
                      <Shield className="w-4 h-4 text-primary" />
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">@{member.username}</p>
                </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-end">
                {isStudying ? (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 mt-2">
                    <div className="flex items-center gap-2 text-green-500 text-xs font-bold uppercase tracking-wider mb-2">
                      <Activity className="w-4 h-4" />
                      Studying Now
                    </div>
                    <div className="font-semibold text-foreground line-clamp-1">{member.activeSession!.taskTitle}</div>
                    <div className="text-2xl font-black text-green-500 mt-2 font-mono">{elapsedStr}</div>
                  </div>
                ) : (
                  <div className="bg-secondary/30 rounded-2xl p-4 mt-2 h-full flex flex-col items-center justify-center text-center">
                    <BookOpen className="w-6 h-6 text-muted-foreground/50 mb-2" />
                    <p className="text-sm text-muted-foreground font-medium">Currently inactive</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-border/50 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-primary" />
                <span className="text-sm font-semibold text-muted-foreground">{member.attendanceCount} study days</span>
              </div>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
