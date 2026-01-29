import React from 'react';
import { Habit } from '../../types';
import { 
  Edit2, 
  X, 
  PauseCircle, 
  PlayCircle, 
  CheckCircle2, 
  Plus, 
  Flame, 
  Calendar as CalendarIcon,
  Trophy,
  Star,
  Check,
  Info
} from 'lucide-react';
import { MILESTONES } from '../../constants';

interface Category {
  name: string;
  icon: string;
}

interface HabitCardProps {
  habit: Habit;
  habits: Habit[];
  categories: Category[];
  celebratingHabitId: string | null;
  confirmDeleteId: string | null;
  editingHabitId: string | null;
  showHistoryId: string | null;
  inlineEditName: string;
  inlineEditIcon: string;
  inlineEditCat: string;
  inlineEditDescription: string;
  setInlineEditName: (value: string) => void;
  setInlineEditIcon: (value: string) => void;
  setInlineEditCat: (value: string) => void;
  setInlineEditDescription: (value: string) => void;
  onComplete: (id: string) => void;
  onStartEdit: (habit: Habit) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onTogglePause: (id: string) => void;
  onDelete: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onToggleHistory: (id: string) => void;
}

export const HabitCard: React.FC<HabitCardProps> = ({
  habit,
  habits,
  categories,
  celebratingHabitId,
  confirmDeleteId,
  editingHabitId,
  showHistoryId,
  inlineEditName,
  inlineEditIcon,
  inlineEditCat,
  inlineEditDescription,
  setInlineEditName,
  setInlineEditIcon,
  setInlineEditCat,
  setInlineEditDescription,
  onComplete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onTogglePause,
  onDelete,
  onConfirmDelete,
  onCancelDelete,
  onToggleHistory
}) => {
  const getCurrentRank = (streak: number): { rank: string; color: string } => {
    let current = MILESTONES[0];
    for (const m of MILESTONES) { 
      if (streak >= m.days) current = m; 
      else break; 
    }
    return { rank: current.rank, color: current.color };
  };

  const { rank, color } = getCurrentRank(habit.streak);
  const isDone = habit.lastCompleted === new Date().toISOString().split('T')[0];
  const hasTargetReached = habit.targetStreak && habit.streak >= habit.targetStreak;
  const isCelebrating = celebratingHabitId === habit.id;
  const isDeleting = confirmDeleteId === habit.id;
  const isEditingInline = editingHabitId === habit.id;
  const pCount = Math.min(8 + Math.floor(habit.streak / 3), 20);

  return (
    <div className={`group relative transition-all duration-300 ${habit.isPaused ? 'opacity-50 grayscale-[0.5]' : ''}`}>
      {/* Top-Left: Inline Edit Icon */}
      {!isDeleting && !isEditingInline && (
        <button 
          onClick={() => onStartEdit(habit)} 
          className="absolute top-3 left-3 p-2 bg-slate-800/90 backdrop-blur-md rounded-full text-indigo-400 hover:text-indigo-300 hover:scale-110 opacity-0 group-hover:opacity-100 z-30 transition-all shadow-lg border border-indigo-500/20"
          title="Editar hábito"
        >
          <Edit2 size={14} />
        </button>
      )}

      {/* Top-Right: Actions */}
      {!isDeleting && !isEditingInline && (
        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 z-30 transition-all">
          <button 
            onClick={() => onTogglePause(habit.id)} 
            className={`p-2 bg-slate-800/90 backdrop-blur-md rounded-full ${habit.isPaused ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'} hover:scale-110 shadow-lg border border-white/5`}
            title={habit.isPaused ? "Retomar Hábito" : "Ignorar Hábito (Suspender)"}
          >
            {habit.isPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
          </button>
          <button 
            onClick={() => onConfirmDelete(habit.id)} 
            className="p-2 bg-slate-800/90 backdrop-blur-md rounded-full text-slate-500 hover:text-red-400 hover:scale-110 shadow-lg border border-white/5"
            title="Eliminar hábito"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {isDeleting && (
        <div className="absolute inset-0 bg-slate-900/95 z-40 rounded-[2rem] flex items-center justify-center p-4 gap-4 border border-red-500/50 animate-in zoom-in-95">
          <div className="text-center">
            <p className="text-sm font-bold text-white mb-3">Eliminar missão?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => onDelete(habit.id)} 
                className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-black shadow-lg"
              >
                SIM
              </button>
              <button 
                onClick={onCancelDelete} 
                className="px-5 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-black"
              >
                NÃO
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={`glass rounded-[2rem] p-5 flex flex-col md:flex-row items-center gap-6 transition-all border-l-8 ${isDone ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-indigo-600'} relative overflow-hidden ${isCelebrating ? 'animate-pop animate-gold-glow ring-4 ring-amber-400' : ''} ${hasTargetReached ? 'animate-gold-subtle border-l-amber-500' : ''}`}>
        
        {/* Target Reached Visual Reward */}
        {hasTargetReached && !isEditingInline && (
          <div className="absolute -top-1 -right-1 p-4 text-amber-400 animate-trophy-float z-10 pointer-events-none opacity-80">
            <Trophy size={32} className="drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]" />
          </div>
        )}

        {isCelebrating && Array.from({ length: pCount }).map((_, n) => (
          <div 
            key={n} 
            className="sparkle-particle text-amber-400" 
            style={{ 
              left: `${50 + (Math.random()-0.5)*80}%`, 
              top: `${50 + (Math.random()-0.5)*80}%`, 
              '--tw-translate-x': `${(Math.random()-0.5)*300}px`, 
              '--tw-translate-y': `${(Math.random()-0.5)*300}px`, 
              animationDelay: `${Math.random()*0.2}s` 
            } as any}
          >
            <Star size={12 + Math.random()*14} fill="currentColor" />
          </div>
        ))}
        
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-inner relative group/icon overflow-hidden">
          {isEditingInline ? (
            <input 
              type="text" 
              value={inlineEditIcon} 
              onChange={e => setInlineEditIcon(e.target.value)} 
              className="w-full h-full bg-slate-900/50 text-center focus:outline-none border-2 border-indigo-500/50 rounded-2xl"
              title="Altera o emoji"
            />
          ) : (
            habit.icon
          )}
          {habit.isPaused && (
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] flex items-center justify-center rounded-2xl">
              <PauseCircle size={24} className="text-white drop-shadow-lg" />
            </div>
          )}
        </div>

        <div className="flex-1 text-center md:text-left w-full">
          <div className="flex flex-col md:flex-row md:items-center justify-center md:justify-start gap-2 mb-1">
            {isEditingInline ? (
              <div className="flex flex-col gap-2 w-full max-w-sm">
                <input 
                  autoFocus
                  type="text" 
                  value={inlineEditName} 
                  onChange={e => setInlineEditName(e.target.value)}
                  placeholder="Nome do hábito..."
                  className="w-full bg-slate-900/80 border border-indigo-500 rounded-xl px-4 py-2 font-bold text-white focus:outline-none shadow-inner"
                />
                <div className="flex gap-2 items-center">
                  <select 
                    value={inlineEditCat} 
                    onChange={e => setInlineEditCat(e.target.value)}
                    className="flex-1 bg-slate-900/80 border border-indigo-500/30 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-300 focus:outline-none"
                  >
                    {categories.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                  </select>
                  <button 
                    onClick={onSaveEdit} 
                    className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white shadow-lg transition-transform active:scale-90"
                  >
                    <Check size={18}/>
                  </button>
                  <button 
                    onClick={onCancelEdit} 
                    className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white shadow-lg transition-transform active:scale-90"
                  >
                    <X size={18}/>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h4 className={`text-xl font-black ${habit.isPaused ? 'text-slate-500' : 'text-white'} flex items-center gap-2 truncate`}>
                  {habit.name}
                </h4>
                {habit.isPaused && <span className="text-[10px] font-black text-slate-600 border border-slate-700/50 px-2 py-0.5 rounded-full uppercase tracking-tighter">Suspenso</span>}
                {!habit.isPaused && <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-current transition-colors ${color}`}>{rank}</span>}
              </div>
            )}
          </div>
          {!isEditingInline && (
            <div className="flex items-center justify-center md:justify-start gap-4 text-xs font-bold">
              <div className="flex items-center gap-1.5 text-slate-400 group-hover:text-orange-400 transition-colors">
                <Flame size={14} className={habit.isPaused ? "text-slate-600" : "text-orange-500"} /> 
                <span className={habit.isPaused ? "text-slate-600" : "text-orange-100"}>{habit.streak} dias</span>
              </div>
              <button 
                onClick={() => onToggleHistory(habit.id)} 
                className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-400 transition-colors"
              >
                <CalendarIcon size={14} /> Histórico
              </button>
              <div className="text-[10px] text-slate-600 hidden md:block">Categoria: {habit.category}</div>
            </div>
          )}
        </div>

        <button 
          onClick={() => onComplete(habit.id)} 
          disabled={isDone || habit.isPaused} 
          className={`h-14 min-w-[140px] px-8 rounded-2xl flex items-center justify-center gap-3 font-black transition-all active:scale-95 ${isDone ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 shadow-inner' : habit.isPaused ? 'bg-slate-800/50 text-slate-700 cursor-not-allowed border border-white/5' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 hover:scale-[1.02]'}`}
        >
          {isDone ? <CheckCircle2 size={24} className="animate-bounce" /> : habit.isPaused ? <PauseCircle size={22}/> : <Plus size={24} className="group-hover:rotate-90 transition-transform" />} 
          <span>{isDone ? 'FEITO' : habit.isPaused ? 'PAUSA' : 'MISSÃO'}</span>
        </button>
      </div>

      {/* Calendar / History Expanded Panel */}
      {showHistoryId === habit.id && (
        <div className="glass rounded-[2rem] p-6 mx-4 mt-2 animate-in slide-in-from-top-4 space-y-6 shadow-2xl border-indigo-500/10">
          {habit.description && (
            <div className="space-y-2">
              <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
                <Info size={12} className="text-indigo-400" /> Sobre a Missão
              </h5>
              <p className="text-sm text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-white/5 italic">
                "{habit.description}"
              </p>
            </div>
          )}
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Fluxo Temporal (30 Dias)</h5>
              <div className="flex gap-4">
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-amber-300/80">
                  <Star size={10} className="fill-amber-300" /> DIA PERFEITO
                </div>
                <div className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400/80">
                  <div className="w-2 h-2 rounded bg-emerald-500"></div> CONCLUÍDO
                </div>
              </div>
            </div>
            <div className="grid grid-cols-7 sm:grid-cols-10 md:grid-cols-15 gap-2">
              {Array.from({ length: 30 }).map((_, i) => { 
                const d = new Date(); 
                d.setDate(d.getDate() - (29 - i)); 
                const s = d.toISOString().split('T')[0]; 
                const isHabitDone = habit.history.includes(s);
                
                // Global Perfect Day Logic: All ACTIVE habits on that day were completed
                const activeHabitsCount = habits.filter(h => !h.isPaused).length;
                const totalDoneOnDay = habits.filter(h => h.history.includes(s)).length;
                const isGlobalPerfect = activeHabitsCount > 0 && totalDoneOnDay >= activeHabitsCount;

                return (
                  <div 
                    key={s} 
                    title={isGlobalPerfect ? `Dia Perfeito! (${s})` : s} 
                    className={`aspect-square w-full min-w-[20px] rounded-lg flex items-center justify-center relative transition-all duration-300 ${isHabitDone ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'bg-slate-800/80 hover:bg-slate-700'}`}
                  >
                    {isGlobalPerfect && (
                      <div className="absolute -top-1 -right-1 z-10 drop-shadow-[0_0_5px_rgba(251,191,36,0.8)]">
                        <Star size={12} className="text-amber-300 fill-amber-300 animate-pulse" />
                      </div>
                    )}
                    <span className="text-[8px] opacity-20 pointer-events-none">{d.getDate()}</span>
                  </div>
                ); 
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
