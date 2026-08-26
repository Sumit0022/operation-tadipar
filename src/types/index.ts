export interface Subject {
  id: string;
  name: string;
  shortName?: string;
  description?: string;
  color: string;
  icon: string;
  isActive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface Topic {
  id: string;
  subjectId: string;
  title: string;
  isCompleted: boolean;
  targetRevisions: number;
  revisionsCompleted: number;
  createdAt: number;
  updatedAt: number;
}

export interface Subtopic {
  id: string;
  topicId: string;
  title: string;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
}

export type ScheduleStatus = 'Pending' | 'Completed';
export type SessionType = 'Lecture' | 'Revision' | 'Practice' | 'Self Study';

export interface Schedule {
  id: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  subjectId: string;
  topicId?: string;
  sessionType?: SessionType;
  taskTitle: string;
  notes?: string;
  status: ScheduleStatus;
  priority?: 'Low' | 'Medium' | 'High';
  actualDurationSeconds?: number; // Track actual time studied
  createdAt: number;
  updatedAt: number;
}

export interface ActiveSession {
  scheduleId: string;
  subjectId: string;
  taskTitle: string;
  startTime: number; // Unix timestamp when the timer started/resumed
  accumulatedSeconds: number; // Time accumulated from previous pause/resume cycles
  status: 'running' | 'paused';
}

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  title: string;
  notes?: string;
  createdAt: number;
  updatedAt: number;
}
export interface Group {
  id: string;
  name: string;
  bio?: string;
  photoURL?: string;
  isPrivate: boolean;
  inviteCode: string;
  ownerId: string;
  memberIds: string[];
  createdAt: number;
}
export interface UserProfile {
  username: string;
  name?: string;
  photoURL?: string;
  createdAt?: number;
  activeSession?: ActiveSession | null;
}
