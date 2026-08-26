import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Users, Lock, Unlock } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useGroupsStore } from '../../store/groups';
import toast from 'react-hot-toast';

export default function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const { createGroup } = useGroupsStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    isPrivate: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Group name is required');
      return;
    }
    
    setLoading(true);
    try {
      await createGroup(formData);
      toast.success('Group created successfully!');
      onClose();
    } catch (error: any) {
      toast.error(error.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="glass-panel w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl relative z-10 overflow-hidden"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
        
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center text-primary">
              <Users className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black">Create Group</h2>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-secondary/50 flex items-center justify-center text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted-foreground pl-1">Group Name <span className="text-destructive">*</span></label>
            <input
              type="text"
              placeholder="e.g., CA Final Study Group"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full glass-input rounded-2xl py-3.5 px-4 font-medium text-foreground placeholder:text-muted-foreground/50"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-muted-foreground pl-1">Description (Optional)</label>
            <textarea
              placeholder="What is this group about?"
              value={formData.bio}
              onChange={e => setFormData({ ...formData, bio: e.target.value })}
              rows={3}
              className="w-full glass-input rounded-2xl py-3.5 px-4 font-medium text-foreground placeholder:text-muted-foreground/50 resize-none"
            />
          </div>

          <div className="space-y-2 pt-2">
            <label className="text-sm font-semibold text-muted-foreground pl-1">Privacy</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPrivate: false })}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${!formData.isPrivate ? 'border-primary bg-primary/10 text-primary' : 'border-border/50 bg-background/50 text-muted-foreground hover:border-primary/30'}`}
              >
                <Unlock className="w-6 h-6" />
                <span className="font-bold">Public</span>
                <span className="text-xs text-center opacity-80">Anyone can discover and join</span>
              </button>
              
              <button
                type="button"
                onClick={() => setFormData({ ...formData, isPrivate: true })}
                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-2 transition-all ${formData.isPrivate ? 'border-amber-500 bg-amber-500/10 text-amber-500' : 'border-border/50 bg-background/50 text-muted-foreground hover:border-amber-500/30'}`}
              >
                <Lock className="w-6 h-6" />
                <span className="font-bold">Private</span>
                <span className="text-xs text-center opacity-80">Requires an invite code to join</span>
              </button>
            </div>
          </div>

          <div className="pt-4">
            <Button 
              type="submit" 
              disabled={loading} 
              className="w-full h-14 rounded-2xl font-bold text-lg shadow-[0_0_20px_rgba(var(--primary),0.3)]"
            >
              {loading ? 'Creating...' : 'Create Group'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
