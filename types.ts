
export type RankType = 'Novice' | 'Apprentice' | 'Disciplined' | 'Expert' | 'Master' | 'Legend' | 'Immortal' | 'God';

export interface Habit {
  id: string;
  name: string;
  category: string;
  description: string;
  streak: number;
  lastCompleted: string | null; // ISO Date (YYYY-MM-DD)
  history: string[]; // Array of ISO Dates (YYYY-MM-DD)
  xp: number;
  icon: string;
  targetStreak?: number; 
  isPaused?: boolean;
}

export interface UserStats {
  xp: number;
  level: number;
  totalXp: number;
  username: string;
}

export interface Milestone {
  days: number;
  rank: RankType;
  color: string;
}
