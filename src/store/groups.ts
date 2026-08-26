import { create } from 'zustand';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuthStore } from './auth';
import type { Group } from '../types';

interface GroupsState {
  myGroups: Group[];
  loading: boolean;
  fetchMyGroups: () => Promise<void>;
  createGroup: (data: { name: string; bio: string; isPrivate: boolean }) => Promise<void>;
  joinGroup: (groupId: string, inviteCode?: string) => Promise<void>;
  leaveGroup: (groupId: string) => Promise<void>;
  deleteGroup: (groupId: string) => Promise<void>;
}

const generateInviteCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

// Helper to prevent hanging on Firestore calls
const withTimeout = <T>(promise: Promise<T>, ms = 8000): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Network timeout. Please check your connection.')), ms))
  ]);
};

export const useGroupsStore = create<GroupsState>((set, get) => ({
  myGroups: [],
  loading: false,

  fetchMyGroups: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    set({ loading: true });
    try {
      const q = query(collection(db, 'groups'), where('memberIds', 'array-contains', user.uid));
      const querySnapshot = await withTimeout(getDocs(q));
      const groups = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Group));
      set({ myGroups: groups });
    } catch (e) {
      console.error("Failed to fetch groups", e);
    } finally {
      set({ loading: false });
    }
  },

  createGroup: async ({ name, bio, isPrivate }) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error("Must be logged in");

    const newGroupRef = doc(collection(db, 'groups'));
    const newGroup: Group = {
      id: newGroupRef.id,
      name,
      bio,
      isPrivate,
      inviteCode: generateInviteCode(),
      ownerId: user.uid,
      memberIds: [user.uid],
      createdAt: Date.now()
    };

    await withTimeout(setDoc(newGroupRef, newGroup));
    set(state => ({ myGroups: [...state.myGroups, newGroup] }));
  },

  joinGroup: async (groupId, inviteCode) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error("Must be logged in");

    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await withTimeout(getDoc(groupRef));
    if (!groupSnap.exists()) throw new Error("Group not found");

    const group = groupSnap.data() as Group;

    if (group.memberIds.includes(user.uid)) {
      throw new Error("Already a member");
    }
    if (group.memberIds.length >= 50) {
      throw new Error("Group is full (max 50 members)");
    }
    if (group.isPrivate) {
      if (!inviteCode || inviteCode.toUpperCase() !== group.inviteCode) {
        throw new Error("Invalid invite code");
      }
    }

    await withTimeout(updateDoc(groupRef, {
      memberIds: arrayUnion(user.uid)
    }));

    // Refresh groups
    await get().fetchMyGroups();
  },

  leaveGroup: async (groupId) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error("Must be logged in");

    const groupRef = doc(db, 'groups', groupId);
    await withTimeout(updateDoc(groupRef, {
      memberIds: arrayRemove(user.uid)
    }));

    set(state => ({
      myGroups: state.myGroups.filter(g => g.id !== groupId)
    }));
  },

  deleteGroup: async (groupId) => {
    const { user } = useAuthStore.getState();
    if (!user) throw new Error("Must be logged in");

    const groupRef = doc(db, 'groups', groupId);
    const groupSnap = await withTimeout(getDoc(groupRef));
    if (groupSnap.exists()) {
      const group = groupSnap.data() as Group;
      if (group.ownerId !== user.uid) {
        throw new Error("Only the owner can delete the group");
      }
      await withTimeout(deleteDoc(groupRef));
      set(state => ({
        myGroups: state.myGroups.filter(g => g.id !== groupId)
      }));
    }
  }
}));
