import { useState } from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, LogOut, Cloud, ShieldCheck, Mail } from 'lucide-react';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring" as const, stiffness: 300, damping: 24 } }
};

export default function Profile() {
  const { user, profile, logout } = useAuthStore();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  if (!user || !profile) return null;

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="max-w-3xl mx-auto w-full pb-20"
    >
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-4xl font-black tracking-tight">Profile & Sync</h1>
        <p className="text-muted-foreground mt-2 text-lg font-medium">Manage your account and cloud data</p>
      </motion.div>

      <div className="grid gap-6">
        {/* Profile Card */}
        <motion.div variants={itemVariants} className="glass-panel p-8 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -mr-20 -mt-20 pointer-events-none" />
          
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-primary/20 to-indigo-500/20 p-1 flex-shrink-0">
                <div className="w-full h-full bg-card rounded-full overflow-hidden flex items-center justify-center border-4 border-background">
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <UserIcon className="w-12 h-12 text-muted-foreground/50" />
                  )}
                </div>
              </div>
              <div className="absolute bottom-2 right-2 w-5 h-5 bg-green-500 border-4 border-background rounded-full" title="Online & Synced" />
            </div>

            <div className="flex-1 text-center md:text-left space-y-4">
              <div>
                <h2 className="text-3xl font-extrabold tracking-tight">{profile.username}</h2>
                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground mt-1">
                  <Mail className="w-4 h-4" />
                  <span className="font-medium">{user.email}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
                <div className="px-4 py-2 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-2 text-sm font-bold text-primary">
                  <ShieldCheck className="w-4 h-4" /> Account Verified
                </div>
                <div className="px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center gap-2 text-sm font-bold text-indigo-400">
                  <Cloud className="w-4 h-4" /> Cloud Sync Active
                </div>
              </div>
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
