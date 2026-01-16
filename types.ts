
export type RankType = 'Novice' | 'Apprentice' | 'Disciplined' | 'Expert' | 'Master' | 'Legend' | 'Immortal' | 'God';

export interface Habit {
  id: string;
  name: string;
  category: string;
  description: string;
  streak: number;
  lastCompleted: string | null; // ISO Date
  xp: number;
  icon: string;
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
