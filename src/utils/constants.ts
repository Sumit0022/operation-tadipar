import { Book, Calculator, FileText, Globe, Landmark, Layout, PieChart, Briefcase, GraduationCap, Scale, Code } from 'lucide-react';

export const SUBJECT_COLORS = [
  { name: 'Blue', value: '#3b82f6' },
  { name: 'Purple', value: '#a855f7' },
  { name: 'Green', value: '#22c55e' },
  { name: 'Red', value: '#ef4444' },
  { name: 'Orange', value: '#f97316' },
  { name: 'Teal', value: '#14b8a6' },
  { name: 'Pink', value: '#ec4899' },
  { name: 'Yellow', value: '#eab308' },
];

export const SUBJECT_ICONS = {
  Book,
  Calculator,
  FileText,
  Globe,
  Landmark,
  Layout,
  PieChart,
  Briefcase,
  GraduationCap,
  Scale,
  Code
};

export type IconName = keyof typeof SUBJECT_ICONS;
