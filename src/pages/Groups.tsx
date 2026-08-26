import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Plus, Compass, Lock, Unlock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGroupsStore } from '../store/groups';
import { Button } from '../components/ui/Button';
import CreateGroupModal from '../components/groups/CreateGroupModal';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Groups() {
  const { myGroups, loading, fetchMyGroups } = useGroupsStore();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    fetchMyGroups();
  }, []);

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-5xl mx-auto w-full pb-24"
    >
      <motion.div variants={itemVariants} className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
            <Users className="w-10 h-10 text-primary" /> My Groups
          </h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Collaborate and stay accountable</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <Button 
            onClick={() => setIsCreateModalOpen(true)} 
            className="flex-1 md:flex-none flex items-center justify-center gap-2 rounded-xl h-12 px-6 shadow-[0_0_20px_rgba(var(--primary),0.2)]"
          >
            <Plus className="w-5 h-5" /> Create Group
          </Button>
          <Link to="/groups/discover" className="flex-1 md:flex-none">
            <Button variant="secondary" className="w-full flex items-center justify-center gap-2 rounded-xl h-12 px-6">
              <Compass className="w-5 h-5" /> Discover
            </Button>
          </Link>
        </div>
      </motion.div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-10 h-10 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        </div>
      ) : myGroups.length === 0 ? (
        <motion.div variants={itemVariants} className="glass-panel p-12 rounded-[2.5rem] text-center flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Users className="w-12 h-12 text-primary" />
          </div>
          <h3 className="text-2xl font-bold mb-2">No Groups Yet</h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-8 font-medium">
            Join a study group to stay accountable, or create your own to invite friends.
          </p>
          <Link to="/groups/discover">
            <Button size="lg" className="rounded-xl px-8 h-14 font-bold shadow-lg">
              Explore Groups
            </Button>
          </Link>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {myGroups.map(group => (
            <Link key={group.id} to={`/groups/${group.id}`}>
              <div className="glass-panel p-6 rounded-3xl hover:border-primary/50 hover:shadow-[0_8px_32px_rgba(var(--primary),0.15)] transition-all duration-300 group/card relative overflow-hidden h-full flex flex-col">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-colors group-hover/card:bg-primary/10" />
                
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
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-background/50 border border-border/50 text-xs font-semibold">
                    {group.isPrivate ? <Lock className="w-3 h-3 text-amber-500" /> : <Unlock className="w-3 h-3 text-green-500" />}
                    <span>{group.memberIds.length}/50</span>
                  </div>
                </div>
                
                <div className="relative z-10 flex-1">
                  <h3 className="text-xl font-bold line-clamp-1 group-hover/card:text-primary transition-colors">{group.name}</h3>
                  <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{group.bio || 'No description provided.'}</p>
                </div>
                
                <div className="mt-6 pt-4 border-t border-border/50 flex justify-between items-center relative z-10">
                  <span className="text-sm font-semibold text-primary">View Dashboard</span>
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary group-hover/card:bg-primary group-hover/card:text-white transition-colors">
                    →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {isCreateModalOpen && (
          <CreateGroupModal onClose={() => setIsCreateModalOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
