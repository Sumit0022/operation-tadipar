import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, LogOut, ArrowLeft, Trash2, Shield, Activity, BookOpen, Clock, Lock, Copy, Check } from 'lucide-react';
import { doc, getDoc, collection, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGroupsStore } from '../store/groups';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import type { Group, Schedule } from '../types';
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
  currentTask?: Schedule;
  todaySchedules: Schedule[];
}

export default function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { myGroups, leaveGroup, deleteGroup } = useGroupsStore();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<MemberData[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchGroupAndMembers = async () => {
      if (!id) return;
      try {
        // Find group locally first or fetch it
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

        // Fetch members data
        const membersData: MemberData[] = [];
        
        // Since 'in' queries are limited to 10, we chunk them if needed, but for simplicity, 
        // we'll fetch them individually since this is a prototype and max members is 50.
        // In production, we'd use chunks of 10 with 'in'.
        
        const todayStr = new Date().toLocaleDateString('en-CA');
        const now = new Date();
        const currentTimeString = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

        for (const uid of g.memberIds) {
          try {
            // Profile
            const profileSnap = await getDoc(doc(db, 'users', uid));
            const profile = profileSnap.data();
            
            // Sync Data
            const syncSnap = await getDoc(doc(db, 'users', uid, 'data', 'sync'));
            const syncData = syncSnap.data();
            
            const schedules: Schedule[] = syncData?.schedules || [];
            const todaySchedules = schedules.filter(s => s.date === todayStr);
            
            // Current task
            const currentTask = todaySchedules.find(s => 
              s.status === 'Pending' && 
              currentTimeString >= s.startTime && 
              currentTimeString <= s.endTime
            );

            membersData.push({
              uid,
              name: profile?.name || profile?.username || 'User',
              username: profile?.username || '',
              photoURL: profile?.photoURL,
              currentTask,
              todaySchedules
            });
          } catch (err) {
            console.error(`Failed to fetch member ${uid}`, err);
          }
        }
        
        setMembers(membersData);
      } catch (error) {
        console.error(error);
        toast.error("Error loading group details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchGroupAndMembers();
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
        {members.map(member => {
          const isStudying = !!member.currentTask;
          
          return (
            <div key={member.uid} className="glass-panel p-6 rounded-3xl relative overflow-hidden flex flex-col group/member">
              {isStudying && (
                <div className="absolute top-0 right-0 w-full h-1 bg-gradient-to-r from-green-400 to-emerald-500" />
              )}
              
              <div className="flex items-center gap-4 mb-4">
                <div className="relative">
                  <div className={`w-14 h-14 rounded-full p-0.5 ${isStudying ? 'bg-gradient-to-br from-green-400 to-emerald-500' : 'bg-border/50'}`}>
                    <div className="w-full h-full bg-card rounded-full flex items-center justify-center overflow-hidden border-2 border-background">
                      {member.photoURL ? (
                        <img src={member.photoURL} alt={member.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-6 h-6 text-muted-foreground/50" />
                      )}
                    </div>
                  </div>
                  {isStudying && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-card rounded-full" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg line-clamp-1">{member.name}</h3>
                  <p className="text-sm font-medium text-muted-foreground">@{member.username}</p>
                </div>
              </div>
              
              <div className="flex-1 bg-background/50 rounded-2xl p-4 border border-border/50">
                {isStudying ? (
                  <div>
                    <p className="text-xs font-bold text-green-500 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-ping" /> Currently Studying
                    </p>
                    <p className="font-bold text-foreground line-clamp-1">{member.currentTask?.taskTitle}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm font-medium text-muted-foreground">
                      <Clock className="w-4 h-4" /> 
                      {member.currentTask?.startTime} - {member.currentTask?.endTime}
                    </div>
                  </div>
                ) : (
                  <div className="h-full flex flex-col justify-center items-center text-center opacity-70">
                    <BookOpen className="w-6 h-6 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium text-muted-foreground">Not studying currently</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 flex items-center justify-between text-sm font-semibold">
                <span className="text-muted-foreground">Today's Tasks</span>
                <span className="text-foreground bg-secondary/50 px-3 py-1 rounded-full">
                  {member.todaySchedules.filter(s => s.status === 'Completed').length} / {member.todaySchedules.length}
                </span>
              </div>
            </div>
          );
        })}
      </motion.div>
    </motion.div>
  );
}
