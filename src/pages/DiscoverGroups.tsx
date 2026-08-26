import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Search, Users, Lock, Unlock, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useGroupsStore } from '../store/groups';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import type { Group } from '../types';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function DiscoverGroups() {
  const navigate = useNavigate();
  const { joinGroup, myGroups } = useGroupsStore();
  const { user } = useAuthStore();
  
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Private join state
  const [showPrivateJoin, setShowPrivateJoin] = useState(false);
  const [privateGroupId, setPrivateGroupId] = useState('');
  const [privateInviteCode, setPrivateInviteCode] = useState('');
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    const fetchPublicGroups = async () => {
      try {
        const q = query(
          collection(db, 'groups'),
          where('isPrivate', '==', false),
          limit(20)
        );
        const snapshot = await getDocs(q);
        const groups = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
        setPublicGroups(groups);
      } catch (error) {
        console.error("Error fetching public groups:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPublicGroups();
  }, []);

  const handleJoin = async (groupId: string, inviteCode?: string) => {
    if (myGroups.some(g => g.id === groupId)) {
      navigate(`/groups/${groupId}`);
      return;
    }
    
    setJoining(true);
    try {
      await joinGroup(groupId, inviteCode);
      toast.success('Joined group successfully!');
      navigate(`/groups/${groupId}`);
    } catch (error: any) {
      toast.error(error.message || 'Failed to join group');
    } finally {
      setJoining(false);
      setShowPrivateJoin(false);
    }
  };

  const filteredGroups = publicGroups.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (g.bio && g.bio.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto w-full pb-24"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <Link to="/groups" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to My Groups
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
              <Compass className="w-10 h-10 text-primary" /> Discover Groups
            </h1>
            <p className="text-muted-foreground mt-2 text-lg font-medium">Find public study groups or join with an invite code</p>
          </div>
          <Button 
            onClick={() => setShowPrivateJoin(true)}
            variant="secondary" 
            className="flex items-center gap-2 rounded-xl h-12 px-6"
          >
            <Lock className="w-4 h-4" /> Join Private Group
          </Button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="mb-8 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search public groups by name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full glass-input rounded-2xl py-4 pl-12 pr-4 font-medium text-foreground placeholder:text-muted-foreground/50 shadow-sm"
        />
      </motion.div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      ) : filteredGroups.length === 0 ? (
        <motion.div variants={itemVariants} className="glass-panel p-12 rounded-[2.5rem] text-center">
          <Compass className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
          <h3 className="text-xl font-bold mb-2">No public groups found</h3>
          <p className="text-muted-foreground">Try a different search term or join a private group via code.</p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map(group => {
            const isMember = myGroups.some(g => g.id === group.id);
            const isFull = group.memberIds.length >= 50;

            return (
              <div key={group.id} className="glass-panel p-6 rounded-3xl relative overflow-hidden h-full flex flex-col group/card">
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-indigo-500/20 p-0.5 flex-shrink-0">
                    <div className="w-full h-full bg-card rounded-2xl flex items-center justify-center overflow-hidden">
                      {group.photoURL ? (
                        <img src={group.photoURL} alt={group.name} className="w-full h-full object-cover" />
                      ) : (
                        <Users className="w-8 h-8 text-primary" />
                      )}
                    </div>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/50 border border-border/50 text-xs font-semibold ${isFull && !isMember ? 'text-destructive' : ''}`}>
                    <Users className="w-3 h-3" />
                    <span>{group.memberIds.length}/50</span>
                  </div>
                </div>
                
                <div className="relative z-10 flex-1 mb-6">
                  <h3 className="text-xl font-bold line-clamp-1">{group.name}</h3>
                  <p className="text-muted-foreground text-sm mt-2 line-clamp-3">{group.bio || 'No description provided.'}</p>
                </div>
                
                <div className="mt-auto relative z-10">
                  {isMember ? (
                    <Link to={`/groups/${group.id}`}>
                      <Button className="w-full rounded-xl font-bold" variant="secondary">View Group</Button>
                    </Link>
                  ) : (
                    <Button 
                      className="w-full rounded-xl font-bold" 
                      onClick={() => handleJoin(group.id)}
                      disabled={isFull || joining}
                    >
                      {isFull ? 'Group Full' : 'Join Group'}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </motion.div>
      )}

      {/* Private Join Modal */}
      <AnimatePresence>
        {showPrivateJoin && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowPrivateJoin(false)}
              className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="glass-panel w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl relative z-10"
            >
              <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                <Lock className="w-6 h-6 text-amber-500" /> Join Private Group
              </h2>
              <p className="text-muted-foreground font-medium mb-6">Enter the Group ID and Invite Code provided by the owner.</p>
              
              <div className="space-y-4 mb-6">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-muted-foreground pl-1">Group ID</label>
                  <input
                    type="text"
                    value={privateGroupId}
                    onChange={e => setPrivateGroupId(e.target.value)}
                    placeholder="e.g. j1k2l3m4"
                    className="w-full glass-input rounded-2xl py-3 px-4 font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-muted-foreground pl-1">Invite Code</label>
                  <input
                    type="text"
                    value={privateInviteCode}
                    onChange={e => setPrivateInviteCode(e.target.value.toUpperCase())}
                    placeholder="e.g. AB12CD"
                    className="w-full glass-input rounded-2xl py-3 px-4 font-medium tracking-widest uppercase"
                    maxLength={6}
                  />
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => handleJoin(privateGroupId, privateInviteCode)} 
                  disabled={joining || !privateGroupId || !privateInviteCode}
                  className="flex-1 rounded-xl font-bold"
                >
                  {joining ? 'Joining...' : 'Join Group'}
                </Button>
                <Button 
                  onClick={() => setShowPrivateJoin(false)} 
                  variant="ghost"
                  className="rounded-xl font-bold"
                >
                  Cancel
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
