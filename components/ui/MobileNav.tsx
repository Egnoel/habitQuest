import React from 'react';
import { Plus, Settings as SettingsIcon } from 'lucide-react';

interface MobileNavProps {
  userLevel: number;
  onAddClick: () => void;
  onSettingsClick: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ userLevel, onAddClick, onSettingsClick }) => {
  return (
    <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm lg:hidden z-40">
      <div className="glass rounded-full p-2 flex items-center justify-between border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 pl-4">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-black text-white shadow-lg ring-2 ring-white/10">
            {userLevel}
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-indigo-400 leading-none">NÍVEL</span>
            <span className="text-xs font-bold text-slate-200">ASCENSÃO</span>
          </div>
        </div>
        <button 
          onClick={onAddClick} 
          className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90 border-4 border-slate-900"
        >
          <Plus size={28} className="text-white" />
        </button>
        <button 
          onClick={onSettingsClick} 
          className="p-4 text-slate-400 hover:text-white transition-colors"
        >
          <SettingsIcon size={22} />
        </button>
      </div>
    </nav>
  );
};
