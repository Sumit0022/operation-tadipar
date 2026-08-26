import { create } from 'zustand';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useAppStore } from './index';
import { useSettingsStore } from './settings';

interface UserProfile {
  username: string;
  photoURL?: string;
  createdAt?: number;
}

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  profile: null,
  loading: true,
  setUser: (user) => set({ user }),
  setProfile: (profile) => set({ profile }),
  logout: async () => {
    await signOut(auth);
    set({ user: null, profile: null });
    // Reset local data
    useAppStore.getState().resetData();
  },
}));

let syncTimeout: any;

// Subscribe to local state changes and sync to Firestore
const setupCloudSync = (uid: string) => {
  useAppStore.subscribe((state) => {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      try {
        const { subjects, topics, subtopics, schedules, holidays } = state;
        const settings = useSettingsStore.getState();
        await setDoc(doc(db, 'users', uid, 'data', 'sync'), {
          subjects, topics, subtopics, schedules, holidays, settings
        });
      } catch (e) {
        console.error("Error syncing to cloud:", e);
      }
    }, 2000); // debounce 2 seconds
  });
  
  useSettingsStore.subscribe((settings) => {
    clearTimeout(syncTimeout);
    syncTimeout = setTimeout(async () => {
      try {
        const state = useAppStore.getState();
        const { subjects, topics, subtopics, schedules, holidays } = state;
        await setDoc(doc(db, 'users', uid, 'data', 'sync'), {
          subjects, topics, subtopics, schedules, holidays, settings
        });
      } catch (e) {
        console.error("Error syncing to cloud:", e);
      }
    }, 2000); // debounce 2 seconds
  });
};

// Initialize auth listener
onAuthStateChanged(auth, async (user) => {
  if (user) {
    useAuthStore.getState().setUser(user);
    // Fetch profile
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      useAuthStore.getState().setProfile(docSnap.data() as UserProfile);
    } else {
      useAuthStore.getState().setProfile({ username: user.displayName || user.email?.split('@')[0] || 'User' });
    }
    
    // Fetch user data
    try {
      const dataRef = doc(db, 'users', user.uid, 'data', 'sync');
      const dataSnap = await getDoc(dataRef);
      if (dataSnap.exists()) {
        const data = dataSnap.data();
        useAppStore.getState().importData({
          subjects: data.subjects || [],
          topics: data.topics || [],
          subtopics: data.subtopics || [],
          schedules: data.schedules || [],
          holidays: data.holidays || []
        });
        if (data.settings) {
          useSettingsStore.setState(data.settings);
        }
      }
      // Start syncing changes up
      setupCloudSync(user.uid);
    } catch (e) {
      console.error("Failed to load user data from cloud", e);
    }
  } else {
    useAuthStore.getState().setUser(null);
    useAuthStore.getState().setProfile(null);
  }
  useAuthStore.setState({ loading: false });
});
