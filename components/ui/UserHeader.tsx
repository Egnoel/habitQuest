import React from 'react';
import { UserStats } from '../../types';
import { Trophy, Settings as SettingsIcon, User as UserIcon } from 'lucide-react';

interface UserHeaderProps {
  user: UserStats;
  xpProgress: number;
  onSettingsClick: () => void;
}

export const UserHeader: React.FC<UserHeaderProps> = ({ user, xpProgress, onSettingsClick }) => {
  return (
    <header className="w-full max-w-7xl px-4 pt-8 pb-4">
      <div className="glass rounded-[2.5rem] p-6 lg:p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
        <div className="relative group">
          <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ring-4 ring-indigo-500/20 group-hover:scale-105 transition-transform">
            <UserIcon size={48} className="text-white" />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-900 font-extrabold px-3 py-1 rounded-full text-sm">
            LVL {user.level}
          </div>
        </div>
        <div className="flex-1 w-full space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
            <h1 className="text-3xl font-extrabold text-white">{user.username}</h1>
            <div className="flex items-center gap-3">
              <div className="text-slate-400 text-sm font-bold flex items-center gap-2">
                <Trophy size={16} className="text-amber-400" /> TOTAL XP: {user.totalXp}
              </div>
              <button 
                onClick={onSettingsClick} 
                className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-700"
              >
                <SettingsIcon size={18} />
              </button>
            </div>
          </div>
          <div className="w-full h-4 bg-slate-900/50 rounded-full border border-slate-700 p-0.5">
            <div 
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full xp-bar-animate" 
              style={{ width: `${xpProgress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </header>
  );
};
