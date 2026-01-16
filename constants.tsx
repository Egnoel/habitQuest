
import React from 'react';
import { Milestone } from './types';

export const XP_PER_LEVEL = 1000;
export const XP_PER_CHECKIN = 100;
export const STREAK_BONUS_MULTIPLIER = 1.1;

export const MILESTONES: Milestone[] = [
  { days: 0, rank: 'Novice', color: 'text-slate-400' },
  { days: 3, rank: 'Apprentice', color: 'text-emerald-400' },
  { days: 7, rank: 'Disciplined', color: 'text-blue-400' },
  { days: 15, rank: 'Expert', color: 'text-purple-400' },
  { days: 21, rank: 'Master', color: 'text-pink-400' },
  { days: 30, rank: 'Legend', color: 'text-amber-400' },
  { days: 45, rank: 'Immortal', color: 'text-red-500' },
  { days: 90, rank: 'God', color: 'text-white' },
];

export const CATEGORIES = [
  { name: 'Saúde', icon: '🍎' },
  { name: 'Produtividade', icon: '⚡' },
  { name: 'Mindset', icon: '🧠' },
  { name: 'Fitness', icon: '💪' },
  { name: 'Aprendizado', icon: '📚' },
];
