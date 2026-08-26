import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Target, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { auth, db, googleProvider } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/auth';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  const checkUsernameExists = async (username: string) => {
    const q = query(collection(db, 'users'), where('username', '==', username));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!formData.username.trim()) throw new Error('Username is required');
        const usernameExists = await checkUsernameExists(formData.username);
        if (usernameExists) throw new Error('Username already taken');

        const { user: newUser } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        
        await setDoc(doc(db, 'users', newUser.uid), {
          username: formData.username,
          email: formData.email,
          createdAt: Date.now()
        });
        
        toast.success('Account created successfully!');
      } else {
        await signInWithEmailAndPassword(auth, formData.email, formData.password);
        toast.success('Welcome back!');
      }
    } catch (error: any) {
      toast.error(error.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    try {
      const { user: authUser } = await signInWithPopup(auth, googleProvider);
      
      // If new user, create profile with a default username
      const docRef = doc(db, 'users', authUser.uid);
      const { getDoc } = await import('firebase/firestore');
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        const baseUsername = authUser.displayName?.replace(/\s+/g, '').toLowerCase() || authUser.email?.split('@')[0] || 'user';
        let uniqueUsername = baseUsername;
        let counter = 1;
        while (await checkUsernameExists(uniqueUsername)) {
          uniqueUsername = `${baseUsername}${counter}`;
          counter++;
        }
        
        await setDoc(docRef, {
          username: uniqueUsername,
          email: authUser.email,
          photoURL: authUser.photoURL,
          createdAt: Date.now()
        });
      }
      
      toast.success('Successfully logged in with Google');
    } catch (error: any) {
      toast.error(error.message || 'Google authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center p-4 relative overflow-hidden bg-background">
      {/* Animated Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[120px] animate-pulse-slow" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-indigo-500/10 blur-[150px] animate-pulse-slow" style={{ animationDelay: '2s' }} />

      <div className="relative w-full max-w-md" style={{ perspective: 1200 }}>
        <motion.div
          className="relative w-full aspect-[4/5] sm:aspect-auto sm:min-h-[600px] transition-all duration-1000"
          style={{ transformStyle: 'preserve-3d' }}
          animate={{ rotateY: isSignUp ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 50, damping: 15 }}
        >
          {/* FRONT - Sign In */}
          <div className="absolute inset-0 w-full h-full" style={{ backfaceVisibility: 'hidden' }}>
            <div className="w-full h-full glass-panel rounded-[2.5rem] p-8 flex flex-col justify-center shadow-2xl border border-white/10">
              <div className="flex flex-col items-center mb-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-6 shadow-inner border border-primary/20">
                  <Target className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">Welcome Back</h1>
                <p className="text-muted-foreground mt-2 font-medium">Log in to sync your schedule</p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                  <input
                    type="password"
                    placeholder="Password"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                  />
                </div>
                
                <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-bold text-lg mt-4 shadow-[0_0_20px_rgba(var(--primary),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary),0.5)]">
                  {loading ? 'Authenticating...' : 'Sign In'}
                </Button>
              </form>

              <div className="my-8 flex items-center gap-4">
                <div className="h-px bg-border/50 flex-1" />
                <span className="text-sm font-semibold text-muted-foreground">OR</span>
                <div className="h-px bg-border/50 flex-1" />
              </div>

              <Button type="button" variant="secondary" onClick={handleGoogleAuth} disabled={loading} className="w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-3">
                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </Button>

              <div className="mt-8 text-center">
                <span className="text-muted-foreground font-medium">New to Operation Tadipar? </span>
                <button onClick={() => setIsSignUp(true)} className="text-primary font-bold hover:underline transition-all">
                  Create an account
                </button>
              </div>
            </div>
          </div>

          {/* BACK - Sign Up */}
          <div 
            className="absolute inset-0 w-full h-full" 
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <div className="w-full h-full glass-panel rounded-[2.5rem] p-8 flex flex-col justify-center shadow-2xl border border-white/10">
              <div className="flex flex-col items-center mb-8">
                <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4 shadow-inner border border-indigo-500/20">
                  <UserIcon className="w-8 h-8 text-indigo-400" />
                </div>
                <h1 className="text-3xl font-extrabold tracking-tight">Join Us</h1>
                <p className="text-muted-foreground mt-2 font-medium">Create your cloud-synced planner</p>
              </div>

              <form onSubmit={handleEmailAuth} className="space-y-4">
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="text"
                    placeholder="Unique Username"
                    required
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/50 transition-all font-medium"
                  />
                </div>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="email"
                    placeholder="Email Address"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/50 transition-all font-medium"
                  />
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-indigo-400 transition-colors" />
                  <input
                    type="password"
                    placeholder="Password (min 6 chars)"
                    required
                    minLength={6}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-indigo-400/50 focus:ring-1 focus:ring-indigo-400/50 transition-all font-medium"
                  />
                </div>
                
                <Button type="submit" disabled={loading} className="w-full h-14 rounded-2xl font-bold text-lg mt-4 bg-indigo-500 hover:bg-indigo-600 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:shadow-[0_0_30px_rgba(99,102,241,0.5)]">
                  {loading ? 'Creating...' : 'Create Account'}
                </Button>
              </form>

              <div className="mt-8 text-center">
                <span className="text-muted-foreground font-medium">Already have an account? </span>
                <button onClick={() => setIsSignUp(false)} className="text-indigo-400 font-bold hover:underline transition-all">
                  Sign in here
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
