import React from 'react';
import { CheckCircle2, RotateCcw, X } from 'lucide-react';

interface UndoAction {
  habitId: string;
  previousHabits: any[];
  previousUser: any;
}

interface UndoToastProps {
  undoAction: UndoAction | null;
  onUndo: () => void;
  onDismiss: () => void;
}

export const UndoToast: React.FC<UndoToastProps> = ({ undoAction, onUndo, onDismiss }) => {
  if (!undoAction) return null;

  return (
    <div className="fixed bottom-28 lg:bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8">
      <div className="glass bg-slate-900/90 border-indigo-500/50 rounded-2xl px-6 py-4 flex items-center gap-5 shadow-2xl border backdrop-blur-xl">
        <div className="flex flex-col">
          <span className="text-sm font-black text-white flex items-center gap-2">
            MISSÃO CONCLUÍDA <CheckCircle2 size={14} className="text-emerald-400" />
          </span>
          <span className="text-[10px] font-bold text-slate-500 uppercase">Tempo de reversão: 10s</span>
        </div>
        <div className="h-8 w-px bg-slate-700"></div>
        <button 
          onClick={onUndo} 
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-black text-xs uppercase transition-all hover:scale-105 active:scale-95"
        >
          <RotateCcw size={16} /> ANULAR
        </button>
        <button 
          onClick={onDismiss} 
          className="p-1 text-slate-500 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};
