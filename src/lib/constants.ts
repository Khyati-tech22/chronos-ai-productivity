import { Zap, BookOpen, Layers } from 'lucide-react';
import { type TimeWindow, type Priority } from '../services/geminiService';

export const TIME_OPTIONS: { value: TimeWindow; label: string; icon: any; description: string }[] = [
  { 
    value: '5-15m', 
    label: 'Quick Sprint', 
    icon: Zap, 
    description: 'High-level summaries & fast wins' 
  },
  { 
    value: '30-60m', 
    label: 'Core Focus', 
    icon: BookOpen, 
    description: 'Concepts & mini-exercises' 
  },
  { 
    value: '2h+', 
    label: 'Deep Work', 
    icon: Layers, 
    description: 'Full dives & project plans' 
  },
];

export const PRIORITY_OPTIONS: { value: Priority; description: string }[] = [
  { value: 'low', description: 'Focuses on low-friction entry points and enjoyable, steady progress.' },
  { value: 'medium', description: 'A balanced approach with practical concepts and quality-of-life improvements.' },
  { value: 'high', description: 'Be blunt, direct, and focus strictly on non-negotiable must-haves.' },
];
