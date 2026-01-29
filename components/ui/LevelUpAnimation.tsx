import React from 'react';
import { Trophy } from 'lucide-react';

interface LevelUpAnimationProps {
  show: boolean;
  level: number;
}

export const LevelUpAnimation: React.FC<LevelUpAnimationProps> = ({ show, level }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none px-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-500">
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-12 rounded-[3.5rem] shadow-[0_0_100px_rgba(99,102,241,0.6)] text-center animate-bounce border-4 border-amber-400/50 relative overflow-hidden">
        <div className="absolute -inset-20 bg-white/10 blur-[50px] rotate-45 animate-pulse"></div>
        <Trophy size={80} className="mx-auto text-amber-400 mb-6 drop-shadow-2xl" />
        <h2 className="text-5xl font-black text-white mb-2 tracking-tighter italic">LEVEL UP!</h2>
        <div className="h-1 w-24 bg-amber-400 mx-auto rounded-full mb-4"></div>
        <p className="text-2xl font-bold text-amber-200">ASCENSÃO AO NÍVEL {level}!</p>
      </div>
    </div>
  );
};
