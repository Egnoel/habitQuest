
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Habit, UserStats, RankType } from './types';
import { XP_PER_LEVEL, XP_PER_CHECKIN, MILESTONES, CATEGORIES, STREAK_BONUS_MULTIPLIER } from './constants';
import { getMotivationalTip } from './services/geminiService';
import { 
  Trophy, 
  Flame, 
  Plus, 
  CheckCircle2, 
  TrendingUp, 
  Award, 
  User as UserIcon, 
  Ghost,
  Trash2,
  Sparkles,
  ChevronRight
} from 'lucide-react';

const App: React.FC = () => {
  // --- State ---
  const [habits, setHabits] = useState<Habit[]>([]);
  const [user, setUser] = useState<UserStats>({
    xp: 0,
    level: 1,
    totalXp: 0,
    username: 'Guerreiro do Hábito'
  });
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitCat, setNewHabitCat] = useState(CATEGORIES[0].name);
  const [aiTip, setAiTip] = useState('');
  const [showLevelUp, setShowLevelUp] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    const savedHabits = localStorage.getItem('habit_quest_habits');
    const savedUser = localStorage.getItem('habit_quest_user');
    if (savedHabits) setHabits(JSON.parse(savedHabits));
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    localStorage.setItem('habit_quest_habits', JSON.stringify(habits));
    localStorage.setItem('habit_quest_user', JSON.stringify(user));
  }, [habits, user]);

  // --- Helpers ---
  const getCurrentRank = (streak: number): { rank: RankType; color: string } => {
    let current = MILESTONES[0];
    for (const m of MILESTONES) {
      if (streak >= m.days) current = m;
      else break;
    }
    return { rank: current.rank, color: current.color };
  };

  const getNextMilestone = (streak: number) => {
    return MILESTONES.find(m => m.days > streak) || null;
  };

  // --- Actions ---
  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const cat = CATEGORIES.find(c => c.name === newHabitCat);
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: newHabitName,
      category: newHabitCat,
      description: '',
      streak: 0,
      lastCompleted: null,
      xp: 0,
      icon: cat?.icon || '⭐'
    };
    setHabits([...habits, habit]);
    setNewHabitName('');
    setIsAdding(false);
  };

  const removeHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
  };

  const completeHabit = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1) return;

    const habit = habits[habitIndex];
    if (habit.lastCompleted === today) return; // Already done today

    // Calculate streak
    let newStreak = habit.streak;
    const lastDate = habit.lastCompleted ? new Date(habit.lastCompleted) : null;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (habit.lastCompleted === yesterdayStr || !habit.lastCompleted) {
      newStreak += 1;
    } else {
      newStreak = 1; // Broke streak
    }

    // Calculate XP
    const streakBonus = Math.floor(newStreak * STREAK_BONUS_MULTIPLIER);
    const totalGained = XP_PER_CHECKIN + streakBonus;

    // Update User
    let newXp = user.xp + totalGained;
    let newLevel = user.level;
    let leveledUp = false;

    while (newXp >= XP_PER_LEVEL) {
      newXp -= XP_PER_LEVEL;
      newLevel += 1;
      leveledUp = true;
    }

    if (leveledUp) {
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }

    setUser({
      ...user,
      xp: newXp,
      level: newLevel,
      totalXp: user.totalXp + totalGained
    });

    // Update Habit
    const newHabits = [...habits];
    newHabits[habitIndex] = {
      ...habit,
      streak: newStreak,
      lastCompleted: today,
      xp: habit.xp + totalGained
    };
    setHabits(newHabits);

    // AI Tip
    const tip = await getMotivationalTip(habit.name, newStreak);
    setAiTip(tip);
  };

  const xpProgress = (user.xp / XP_PER_LEVEL) * 100;

  return (
    <div className="min-h-screen pb-20 lg:pb-8 flex flex-col items-center">
      {/* Header Profile Section */}
      <header className="w-full max-w-5xl px-4 pt-8 pb-4">
        <div className="glass rounded-3xl p-6 lg:p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full"></div>
          
          <div className="relative group">
            <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ring-4 ring-indigo-500/20 group-hover:scale-105 transition-transform">
              <UserIcon size={48} className="text-white" />
            </div>
            <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-900 font-extrabold px-3 py-1 rounded-full text-sm shadow-md">
              LVL {user.level}
            </div>
          </div>

          <div className="flex-1 w-full space-y-4 text-center md:text-left">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
              <div>
                <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                  {user.username}
                </h1>
                <p className="text-indigo-300 font-medium">Lendário Explorador de Hábitos</p>
              </div>
              <div className="text-slate-400 text-sm font-bold flex items-center justify-center md:justify-end gap-2">
                <Trophy size={16} className="text-amber-400" />
                TOTAL XP: {user.totalXp}
              </div>
            </div>

            {/* XP BAR */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-bold uppercase tracking-widest text-slate-400 px-1">
                <span>XP Progress</span>
                <span>{user.xp} / {XP_PER_LEVEL}</span>
              </div>
              <div className="w-full h-4 bg-slate-900/50 rounded-full border border-slate-700 p-0.5 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 rounded-full shadow-[0_0_15px_rgba(99,102,241,0.5)] xp-bar-animate"
                  style={{ width: `${xpProgress}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full max-w-5xl px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        
        {/* Left: Stats & Milestones (Col 4) */}
        <aside className="lg:col-span-4 space-y-6">
          <div className="glass rounded-3xl p-6 shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <TrendingUp size={20} className="text-emerald-400" />
              Sua Jornada
            </h3>
            <div className="space-y-4">
              {MILESTONES.map((m, idx) => (
                <div key={idx} className="flex items-center gap-4 group">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 ${m.color.replace('text', 'border')} bg-slate-800/50`}>
                    <Award size={20} className={m.color} />
                  </div>
                  <div>
                    <div className={`font-bold ${m.color}`}>{m.rank}</div>
                    <div className="text-xs text-slate-500 font-medium">{m.days === 0 ? 'Início' : `${m.days} dias de sequência`}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {aiTip && (
            <div className="glass rounded-3xl p-6 bg-indigo-900/20 border-indigo-500/30 relative overflow-hidden animate-in fade-in slide-in-from-bottom-2">
              <Sparkles className="absolute top-2 right-2 text-indigo-400 opacity-30" />
              <h4 className="text-sm font-bold text-indigo-400 uppercase tracking-widest mb-2">Dica do Mestre</h4>
              <p className="text-sm italic text-indigo-100 leading-relaxed">"{aiTip}"</p>
            </div>
          )}
        </aside>

        {/* Right: Habits (Col 8) */}
        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Flame size={28} className="text-orange-500" />
              Hábitos Ativos
            </h2>
            <button 
              onClick={() => setIsAdding(true)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:scale-105"
            >
              <Plus size={20} />
              Criar Quest
            </button>
          </div>

          {habits.length === 0 && !isAdding && (
            <div className="glass rounded-3xl p-12 text-center border-dashed border-2 border-slate-700">
              <Ghost size={64} className="mx-auto text-slate-700 mb-4" />
              <h3 className="text-xl font-bold text-slate-500">Nenhum hábito rastreado.</h3>
              <p className="text-slate-600 mb-6">Começa a tua jornada adicionando o teu primeiro desafio.</p>
              <button 
                onClick={() => setIsAdding(true)}
                className="text-indigo-400 font-bold flex items-center gap-2 mx-auto hover:text-indigo-300"
              >
                Criar agora <ChevronRight size={18} />
              </button>
            </div>
          )}

          {isAdding && (
            <div className="glass rounded-3xl p-6 space-y-6 border-indigo-500/50 animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-xl">Nova Missão</h3>
                <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white">&times;</button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Nome do Hábito</label>
                  <input 
                    type="text" 
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    placeholder="Ex: Ler 10 páginas, Fazer exercício..."
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl px-4 py-3 focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Categoria</label>
                  <div className="flex flex-wrap gap-2">
                    {CATEGORIES.map(cat => (
                      <button
                        key={cat.name}
                        onClick={() => setNewHabitCat(cat.name)}
                        className={`px-4 py-2 rounded-xl text-sm font-bold border transition-all ${
                          newHabitCat === cat.name 
                            ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg shadow-indigo-600/20' 
                            : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500'
                        }`}
                      >
                        {cat.icon} {cat.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-4 pt-4">
                  <button 
                    onClick={addHabit}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3 rounded-xl transition-all"
                  >
                    Confirmar Hábito
                  </button>
                  <button 
                    onClick={() => setIsAdding(false)}
                    className="px-6 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold py-3 rounded-xl"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4">
            {habits.map((habit) => {
              const { rank, color } = getCurrentRank(habit.streak);
              const nextMilestone = getNextMilestone(habit.streak);
              const today = new Date().toISOString().split('T')[0];
              const isDone = habit.lastCompleted === today;

              return (
                <div 
                  key={habit.id} 
                  className={`glass rounded-3xl p-5 flex flex-col md:flex-row items-center gap-6 transition-all border-l-8 ${isDone ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-indigo-600'}`}
                >
                  <div className="flex-shrink-0 w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-inner">
                    {habit.icon}
                  </div>

                  <div className="flex-1 text-center md:text-left space-y-1">
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                      <h4 className="text-xl font-bold">{habit.name}</h4>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-current ${color}`}>
                        RANK: {rank}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Flame size={14} className="text-orange-500" />
                        <span className="text-orange-100">{habit.streak} dias de sequência</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award size={14} className="text-indigo-400" />
                        <span>{habit.xp} XP acumulado</span>
                      </div>
                    </div>
                    
                    {nextMilestone && (
                      <div className="mt-2 text-[11px] text-slate-500 flex items-center justify-center md:justify-start gap-1">
                        Próximo Rank: <strong>{nextMilestone.rank}</strong> em {nextMilestone.days - habit.streak} dias.
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => completeHabit(habit.id)}
                      disabled={isDone}
                      className={`h-14 px-8 rounded-2xl flex items-center gap-2 font-black transition-all active:scale-95 ${
                        isDone 
                        ? 'bg-emerald-500/20 text-emerald-400 cursor-default border border-emerald-500/30' 
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30'
                      }`}
                    >
                      {isDone ? <CheckCircle2 size={24} /> : <Plus size={24} />}
                      {isDone ? 'FEITO' : 'CHECK-IN'}
                    </button>
                    <button 
                      onClick={() => removeHabit(habit.id)}
                      className="p-3 text-slate-600 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Level Up Notification */}
      {showLevelUp && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[3rem] shadow-[0_0_100px_rgba(99,102,241,0.6)] text-center animate-bounce border-4 border-amber-400/50">
            <Trophy size={64} className="mx-auto text-amber-400 mb-4" />
            <h2 className="text-4xl font-black text-white mb-2">LEVEL UP!</h2>
            <p className="text-xl font-bold text-amber-200">Chegaste ao Nível {user.level}!</p>
          </div>
        </div>
      )}
      
      {/* Bottom Floating Stats Bar (Mobile) */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] lg:hidden z-40">
        <div className="glass rounded-full p-2 flex items-center justify-between border-slate-700 shadow-2xl">
          <div className="flex items-center gap-3 pl-4">
             <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-black">
               {user.level}
             </div>
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-slate-400 leading-none">XP TOTAL</span>
               <span className="text-sm font-black">{user.totalXp}</span>
             </div>
          </div>
          <button 
            onClick={() => setIsAdding(true)}
            className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/40"
          >
            <Plus size={24} className="text-white" />
          </button>
          <div className="flex items-center gap-3 pr-4 text-right">
             <div className="flex flex-col">
               <span className="text-[10px] font-bold text-slate-400 leading-none">MISSÕES</span>
               <span className="text-sm font-black">{habits.length}</span>
             </div>
             <Flame size={20} className="text-orange-500" />
          </div>
        </div>
      </nav>
    </div>
  );
};

export default App;
