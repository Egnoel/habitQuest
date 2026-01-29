import React from 'react';
import { Zap } from 'lucide-react';

interface ComboNotificationProps {
  show: boolean;
  comboCount: number;
}

export const ComboNotification: React.FC<ComboNotificationProps> = ({ show, comboCount }) => {
  if (!show) return null;

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
      <div className="bg-amber-500 text-slate-900 font-black px-6 py-2 rounded-full shadow-2xl animate-pop flex items-center gap-2 border-2 border-white/50">
        <Zap size={20} className="animate-pulse" /> COMBO x{comboCount}!
      </div>
    </div>
  );
};
