import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User as UserIcon, LogOut, Cloud, ShieldCheck, Mail, Edit2, Save, X, Image as ImageIcon } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import toast from 'react-hot-toast';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Profile() {
  const { user, profile, logout, updateProfileData } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: profile?.name || '',
    username: profile?.username || '',
    photoURL: profile?.photoURL || ''
  });

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleSave = async () => {
    if (!formData.username.trim()) {
      toast.error('Username cannot be empty');
      return;
    }
    
    setIsSaving(true);
    try {
      await updateProfileData({
        name: formData.name,
        username: formData.username.toLowerCase().replace(/[^a-z0-9_]/g, ''),
        photoURL: formData.photoURL
      });
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin mb-4" />
        <p className="text-muted-foreground font-medium">Loading profile data...</p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto w-full pb-20"
    >
      <motion.div variants={itemVariants} className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight">Profile & Sync</h1>
          <p className="text-muted-foreground mt-2 text-lg font-medium">Manage your account and cloud data</p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)} variant="secondary" className="flex items-center gap-2">
            <Edit2 className="w-4 h-4" /> Edit Profile
          </Button>
        )}
      </motion.div>

      <div className="grid gap-6">
        {/* Profile Card */}
        <motion.div variants={itemVariants} className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="relative group/avatar">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-indigo-500/20 p-1 flex-shrink-0">
                <div className="w-full h-full bg-card rounded-full overflow-hidden flex items-center justify-center border-4 border-background">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-muted-foreground/50" />
                  )}
                </div>
              </div>
              <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-background rounded-full shadow-sm" title="Online & Synced" />
            </div>

            <div className="flex-1 text-center md:text-left space-y-4 w-full">
              <AnimatePresence mode="wait">
                {isEditing ? (
                  <motion.div 
                    key="edit-form"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-4 text-left w-full max-w-md mx-auto md:mx-0"
                  >
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-muted-foreground pl-1">Full Name</label>
                      <input
                        type="text"
                        placeholder="E.g. John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full glass-input rounded-2xl py-3 px-4 font-medium text-foreground placeholder:text-muted-foreground/50"
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-muted-foreground pl-1">Unique Username</label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                        <input
                          type="text"
                          placeholder="username"
                          value={formData.username}
                          onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                          className="w-full glass-input rounded-2xl py-3 pl-8 pr-4 font-medium text-foreground placeholder:text-muted-foreground/50"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3 pt-2">
                      <Button onClick={handleSave} disabled={isSaving} className="flex-1 h-12 rounded-xl font-bold flex items-center justify-center gap-2">
                        {isSaving ? 'Saving...' : <><Save className="w-4 h-4" /> Save Changes</>}
                      </Button>
                      <Button onClick={() => {
                        setIsEditing(false);
                        setFormData({ name: profile.name || '', username: profile.username || '', photoURL: profile.photoURL || '' });
                      }} variant="ghost" disabled={isSaving} className="w-12 h-12 rounded-xl flex items-center justify-center p-0">
                        <X className="w-5 h-5" />
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div 
                    key="display-info"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                  >
                    <h2 className="text-3xl font-extrabold tracking-tight">
                      {profile.name || profile.username}
                    </h2>
                    {profile.name && (
                      <p className="text-primary font-medium mt-1">@{profile.username}</p>
                    )}
                    <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground mt-2">
                      <Mail className="w-4 h-4" />
                      <span className="font-medium">{user.email}</span>
                    </div>

                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-4">
                      <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-sm font-bold text-primary">
                        <ShieldCheck className="w-4 h-4" /> Account Verified
                      </div>
                      <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 text-sm font-bold text-indigo-400">
                        <Cloud className="w-4 h-4" /> Cloud Sync Active
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>

        {/* Sync Settings */}
        <motion.div variants={itemVariants} className="glass-panel p-8 rounded-[2.5rem]">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-primary" /> Data Synchronization
          </h3>
          <div className="bg-background/40 border border-border/50 rounded-2xl p-6">
            <p className="text-foreground/80 font-medium mb-4">
              Your data is automatically synced to the cloud in real-time. Changes made on this device will instantly reflect on any other device where you log in with this account.
            </p>
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary/30 p-3 rounded-xl w-fit">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Real-time sync is running
            </div>
          </div>
        </motion.div>

        {/* Danger Zone */}
        <motion.div variants={itemVariants} className="glass-panel p-8 rounded-[2.5rem] border-destructive/20">
          <h3 className="text-xl font-bold mb-4 text-destructive flex items-center gap-2">
            <LogOut className="w-5 h-5" /> Account Actions
          </h3>
          <p className="text-muted-foreground font-medium mb-6">
            Logging out will remove your local data from this device for security. It remains safe in the cloud.
          </p>
          <Button 
            variant="danger" 
            size="lg" 
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="rounded-xl font-bold"
          >
            {isLoggingOut ? 'Logging out...' : 'Log Out of this Device'}
          </Button>
        </motion.div>
      </div>
    </motion.div>
  );
}
