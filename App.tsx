
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  ChevronRight,
  Settings as SettingsIcon,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  Save,
  Target,
  Medal,
  Zap,
  RotateCcw,
  X,
  Layers,
  Edit2,
  Star,
  Check,
  BarChart2,
  Calendar as CalendarIcon,
  PieChart,
  Filter,
  SortAsc,
  Info,
  ChevronDown
} from 'lucide-react';

type View = 'login' | 'dashboard' | 'settings';
type SortOption = 'name' | 'streak' | 'xp';

interface UndoAction {
  habitId: string;
  previousHabits: Habit[];
  previousUser: UserStats;
}

interface Category {
  name: string;
  icon: string;
}

const COMMON_ICONS = ['🍎', '⚡', '🧠', '💪', '📚', '🧘', '💧', '🥗', '🏃', '🎨', '🎸', '💻', '💸', '🧹', '🌱', '🌙'];

const App: React.FC = () => {
  // --- State ---
  const [view, setView] = useState<View>('login');
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [user, setUser] = useState<UserStats>({
    xp: 0,
    level: 1,
    totalXp: 0,
    username: ''
  });
  
  // Creation state
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [newHabitCat, setNewHabitCat] = useState(CATEGORIES[0].name);
  const [newHabitTarget, setNewHabitTarget] = useState<string>('');
  
  // Filter & Sort state
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  // UI status
  const [aiTip, setAiTip] = useState('');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [celebratingHabitId, setCelebratingHabitId] = useState<string | null>(null);
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [inlineEditName, setInlineEditName] = useState('');
  const [inlineEditIcon, setInlineEditIcon] = useState('');
  const [inlineEditDescription, setInlineEditDescription] = useState('');
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Settings edit state
  const [editUsername, setEditUsername] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(COMMON_ICONS[0]);
  const [editingCat, setEditingCat] = useState<string | null>(null);

  // Refs for timers
  const undoTimerRef = useRef<number | null>(null);
  const celebrationTimerRef = useRef<number | null>(null);

  // --- Sound Effects ---
  const playSound = (type: 'success' | 'level' | 'undo') => {
    try {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1); // C6
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      } else if (type === 'level') {
        osc.type = 'triangle';
        const freqs = [523.25, 659.25, 783.99, 1046.50]; // C Major arpeggio
        freqs.forEach((f, i) => {
          osc.frequency.setValueAtTime(f, now + i * 0.1);
        });
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now);
        osc.stop(now + 0.6);
      } else if (type === 'undo') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now);
        osc.stop(now + 0.2);
      }
    } catch (e) {
      console.warn('Audio playback failed', e);
    }
  };

  // --- Persistence ---
  useEffect(() => {
    const savedHabits = localStorage.getItem('habit_quest_habits');
    const savedUser = localStorage.getItem('habit_quest_user');
    const savedView = localStorage.getItem('habit_quest_view');
    const savedCats = localStorage.getItem('habit_quest_categories');
    
    if (savedHabits) {
        const parsedHabits: Habit[] = JSON.parse(savedHabits);
        setHabits(parsedHabits.map(h => ({ 
          ...h, 
          history: h.history || [],
          description: h.description || ''
        })));
    }
    if (savedCats) setCategories(JSON.parse(savedCats));
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      setUser(parsedUser);
      setEditUsername(parsedUser.username);
    }
    if (savedView === 'dashboard' || savedView === 'settings') {
      setView(savedView as View);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('habit_quest_habits', JSON.stringify(habits));
    localStorage.setItem('habit_quest_user', JSON.stringify(user));
    localStorage.setItem('habit_quest_view', view);
    localStorage.setItem('habit_quest_categories', JSON.stringify(categories));
  }, [habits, user, view, categories]);

  useEffect(() => {
    return () => {
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
      if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
    };
  }, []);

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

  // --- Filtered & Sorted Habits ---
  const displayHabits = useMemo(() => {
    let filtered = filterCategory === 'All' 
      ? habits 
      : habits.filter(h => h.category === filterCategory);

    return [...filtered].sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'streak') return b.streak - a.streak;
      if (sortBy === 'xp') return b.xp - a.xp;
      return 0;
    });
  }, [habits, filterCategory, sortBy]);

  // --- Stats Derivations ---
  const xpByDay = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      let dailyXp = 0;
      let completedCount = 0;
      
      habits.forEach(habit => {
        if (habit.history.includes(date)) {
          dailyXp += XP_PER_CHECKIN;
          completedCount++;
        }
      });

      const allCompleted = habits.length > 0 && completedCount === habits.length;
      return { date, xp: dailyXp, allCompleted };
    });
  }, [habits]);

  const categoryProgress = useMemo(() => {
    return categories.map(cat => {
      const catHabits = habits.filter(h => h.category === cat.name);
      if (catHabits.length === 0) return { ...cat, progress: 0, total: 0, reached: 0 };
      
      const habitsWithTarget = catHabits.filter(h => h.targetStreak && h.targetStreak > 0);
      const reached = habitsWithTarget.filter(h => h.streak >= (h.targetStreak || 0)).length;
      const progress = habitsWithTarget.length > 0 ? (reached / habitsWithTarget.length) * 100 : 0;
      
      return { ...cat, progress, total: habitsWithTarget.length, reached };
    });
  }, [habits, categories]);

  // --- Actions ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editUsername.trim()) return;
    setUser(prev => ({ ...prev, username: editUsername }));
    setView('dashboard');
  };

  const handleLogout = () => {
    setView('login');
  };

  const saveSettings = () => {
    setUser(prev => ({ ...prev, username: editUsername }));
    setView('dashboard');
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const cat = categories.find(c => c.name === newHabitCat);
    const habit: Habit = {
      id: crypto.randomUUID(),
      name: newHabitName,
      description: newHabitDescription,
      category: newHabitCat,
      streak: 0,
      lastCompleted: null,
      history: [],
      xp: 0,
      icon: cat?.icon || '⭐',
      targetStreak: newHabitTarget ? parseInt(newHabitTarget) : undefined
    };
    setHabits([...habits, habit]);
    setNewHabitName('');
    setNewHabitDescription('');
    setNewHabitTarget('');
    setIsAdding(false);
  };

  const removeHabit = (id: string) => {
    setHabits(habits.filter(h => h.id !== id));
    if (editingHabitId === id) setEditingHabitId(null);
    setConfirmDeleteId(null);
  };

  const undoCompletion = () => {
    if (!undoAction) return;
    playSound('undo');
    setHabits(undoAction.previousHabits);
    setUser(undoAction.previousUser);
    setUndoAction(null);
    setCelebratingHabitId(null);
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
  };

  const completeHabit = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1) return;

    const habit = habits[habitIndex];
    if (habit.lastCompleted === today) return;

    playSound('success');
    setCelebratingHabitId(id);
    if (celebrationTimerRef.current) window.clearTimeout(celebrationTimerRef.current);
    celebrationTimerRef.current = window.setTimeout(() => setCelebratingHabitId(null), 3000);

    const snapshotHabits = JSON.parse(JSON.stringify(habits));
    const snapshotUser = JSON.parse(JSON.stringify(user));

    let newStreak = habit.streak;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (habit.lastCompleted === yesterdayStr || !habit.lastCompleted) {
      newStreak += 1;
    } else {
      newStreak = 1;
    }

    const streakBonus = Math.floor(newStreak * STREAK_BONUS_MULTIPLIER);
    const totalGained = XP_PER_CHECKIN + streakBonus;

    let newXp = user.xp + totalGained;
    let newLevel = user.level;
    let leveledUp = false;

    while (newXp >= XP_PER_LEVEL) {
      newXp -= XP_PER_LEVEL;
      newLevel += 1;
      leveledUp = true;
    }

    if (leveledUp) {
      playSound('level');
      setShowLevelUp(true);
      setTimeout(() => setShowLevelUp(false), 3000);
    }

    setUser({
      ...user,
      xp: newXp,
      level: newLevel,
      totalXp: user.totalXp + totalGained
    });

    const newHabits = [...habits];
    newHabits[habitIndex] = {
      ...habit,
      streak: newStreak,
      lastCompleted: today,
      history: [...habit.history, today],
      xp: habit.xp + totalGained
    };
    setHabits(newHabits);

    setUndoAction({
      habitId: id,
      previousHabits: snapshotHabits,
      previousUser: snapshotUser
    });

    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = window.setTimeout(() => {
      setUndoAction(null);
    }, 10000);

    const tip = await getMotivationalTip(habit.name, newStreak);
    setAiTip(tip);
  };

  const startInlineEdit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setInlineEditName(habit.name);
    setInlineEditIcon(habit.icon);
    setInlineEditDescription(habit.description || '');
  };

  const cancelInlineEdit = () => {
    setEditingHabitId(null);
  };

  const saveInlineEdit = () => {
    if (!editingHabitId || !inlineEditName.trim()) return;
    setHabits(prev => prev.map(h => 
      h.id === editingHabitId 
        ? { ...h, name: inlineEditName, icon: inlineEditIcon, description: inlineEditDescription } 
        : h
    ));
    setEditingHabitId(null);
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    if (editingCat) {
      setCategories(categories.map(c => c.name === editingCat ? { name: newCatName, icon: newCatIcon } : c));
      setEditingCat(null);
    } else {
      setCategories([...categories, { name: newCatName, icon: newCatIcon }]);
    }
    setNewCatName('');
    setNewCatIcon(COMMON_ICONS[0]);
  };

  const removeCategory = (name: string) => {
    setCategories(categories.filter(c => c.name !== name));
  };

  const startEditCategory = (cat: Category) => {
    setNewCatName(cat.name);
    setNewCatIcon(cat.icon);
    setEditingCat(cat.name);
  };

  const xpProgress = (user.xp / XP_PER_LEVEL) * 100;

  // --- UI Components ---
  const XPBarChart = () => {
    const maxVal = Math.max(...xpByDay.map(v => v.xp), 500);
    return (
      <div className="h-32 flex items-end justify-between gap-1 px-2 mt-4">
        {xpByDay.map(({ date, xp, allCompleted }, idx) => {
          const height = (xp / maxVal) * 100;
          const isToday = idx === xpByDay.length - 1;
          return (
            <div key={date} className="flex-1 flex flex-col items-center gap-1.5 group relative">
              <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 bg-slate-800 text-xs px-2 py-1 rounded-md transition-opacity pointer-events-none z-10 whitespace-nowrap border border-slate-700">
                {xp} XP {allCompleted && '✨'}
              </div>
              
              {allCompleted && (
                <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.6)]" title="Dia Perfeito!"></div>
              )}
              
              <div 
                className={`w-full rounded-t-lg transition-all duration-700 ease-out relative ${isToday ? 'bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-slate-700 hover:bg-slate-600'}`}
                style={{ height: `${height}%`, minHeight: '4px' }}
              >
                {allCompleted && <div className="absolute inset-0 bg-white/10 rounded-t-lg"></div>}
              </div>
              
              <span className="text-[10px] text-slate-500 font-bold uppercase truncate max-w-full">
                {new Date(date).toLocaleDateString('pt-PT', { weekday: 'short' })}
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  const LoginPage = () => (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass max-w-md w-full rounded-[2.5rem] p-8 lg:p-12 shadow-2xl relative overflow-hidden text-center space-y-8">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full"></div>
        <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-purple-500/20 blur-[80px] rounded-full"></div>
        
        <div className="space-y-4">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg shadow-indigo-500/20 rotate-3">
            <ShieldCheck size={40} className="text-white" />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-white">HabitQuest</h1>
          <p className="text-slate-400 font-medium">Transforma a tua rotina numa aventura épica.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6 text-left relative z-10">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nome do Herói</label>
            <input 
              autoFocus
              type="text" 
              value={editUsername}
              onChange={(e) => setEditUsername(e.target.value)}
              placeholder="Como te chamaremos?"
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500 transition-all text-lg font-medium text-white"
            />
          </div>
          <button 
            type="submit"
            disabled={!editUsername.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-600/20 hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-3 text-lg"
          >
            Começar Jornada
            <ChevronRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );

  const DashboardPage = () => {
    return (
      <div className="min-h-screen pb-20 lg:pb-8 flex flex-col items-center">
        <header className="w-full max-w-7xl px-4 pt-8 pb-4">
          <div className="glass rounded-[2.5rem] p-6 lg:p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-indigo-500/10 blur-3xl rounded-full"></div>
            
            <div className="relative group">
              <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ring-4 ring-indigo-500/20 group-hover:scale-105 transition-transform">
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
                  <p className="text-indigo-300 font-medium">Explorador de Hábitos</p>
                </div>
                <div className="flex items-center justify-center md:justify-end gap-3">
                  <div className="text-slate-400 text-sm font-bold flex items-center gap-2">
                    <Trophy size={16} className="text-amber-400" />
                    TOTAL XP: {user.totalXp}
                  </div>
                  <button 
                    onClick={() => setView('settings')}
                    className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-colors border border-slate-700"
                  >
                    <SettingsIcon size={18} />
                  </button>
                </div>
              </div>

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

        <main className="w-full max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
          <aside className="lg:col-span-4 space-y-6">
            <div className="glass rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold flex items-center gap-2">
                        <BarChart2 size={20} className="text-indigo-400" />
                        Ganhos de XP
                    </h3>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Últimos 7 dias</span>
                </div>
                <XPBarChart />
                <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-widest">
                  <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                  <span>Indicador de Dia Perfeito</span>
                </div>
            </div>

            <div className="glass rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
              <h3 className="text-lg font-bold mb-5 flex items-center gap-2">
                <PieChart size={20} className="text-pink-400" />
                Resumo por Categoria
              </h3>
              <div className="space-y-4">
                {categoryProgress.filter(c => c.total > 0).map((cat) => (
                  <div key={cat.name} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="flex items-center gap-2 text-white">{cat.icon} {cat.name}</span>
                      <span className="text-slate-400">{cat.reached}/{cat.total} metas</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 transition-all duration-1000"
                        style={{ width: `${cat.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-[2rem] p-6 shadow-xl">
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
          </aside>

          <section className="lg:col-span-8 space-y-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <h2 className="text-2xl font-bold flex items-center gap-3 text-slate-100">
                <Flame size={28} className="text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.4)]" />
                Missões Ativas
              </h2>
              
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative group">
                  <select 
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="appearance-none bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-8 py-2 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer text-white"
                  >
                    <option value="All">Todas as Categorias</option>
                    {categories.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                  <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <div className="relative group">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="appearance-none bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-8 py-2 text-sm font-bold focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer text-white"
                  >
                    <option value="name">Ordenar por Nome</option>
                    <option value="streak">Ordenar por Sequência</option>
                    <option value="xp">Ordenar por XP</option>
                  </select>
                  <SortAsc size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>

                <button 
                  onClick={() => setIsAdding(true)}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all hover:scale-105 ml-auto sm:ml-0"
                >
                  <Plus size={20} />
                  Criar
                </button>
              </div>
            </div>

            {isAdding && (
              <div className="glass rounded-[2rem] p-6 space-y-6 border-indigo-500/50 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xl text-white">Nova Missão</h3>
                  <button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white"><X size={24} /></button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Nome do Hábito</label>
                      <input 
                        type="text" 
                        value={newHabitName}
                        onChange={(e) => setNewHabitName(e.target.value)}
                        placeholder="Ex: Ler 10 páginas..."
                        className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500 transition-colors text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest text-amber-500">Meta (Dias)</label>
                      <input 
                        type="number" 
                        value={newHabitTarget}
                        onChange={(e) => setNewHabitTarget(e.target.value)}
                        placeholder="Ex: 21"
                        className="w-full bg-slate-900/50 border border-amber-500/30 rounded-2xl px-6 py-4 focus:outline-none focus:border-amber-500 transition-colors font-bold text-amber-200"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-2 tracking-widest">Descrição (Opcional)</label>
                    <textarea 
                      value={newHabitDescription}
                      onChange={(e) => setNewHabitDescription(e.target.value)}
                      placeholder="Define o que queres alcançar..."
                      className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-3 focus:outline-none focus:border-indigo-500 transition-colors text-white min-h-[80px]"
                    />
                  </div>
                  <div className="flex gap-4 pt-4">
                    <button 
                      onClick={addHabit}
                      className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-indigo-600/20"
                    >
                      Confirmar Hábito
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-4">
              {displayHabits.map((habit) => {
                const { rank, color } = getCurrentRank(habit.streak);
                const today = new Date().toISOString().split('T')[0];
                const isDone = habit.lastCompleted === today;
                const hasTargetReached = habit.targetStreak && habit.streak >= habit.targetStreak;
                const isCelebrating = celebratingHabitId === habit.id;
                const isEditingInline = editingHabitId === habit.id;
                const isExpanded = showHistoryId === habit.id;
                const isDeleting = confirmDeleteId === habit.id;

                return (
                  <div key={habit.id} className="space-y-2 group/card relative">
                    {!isEditingInline && !isDeleting && (
                      <button 
                        onClick={() => setConfirmDeleteId(habit.id)}
                        className="absolute top-3 right-3 p-2 bg-slate-800/80 rounded-full text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover/card:opacity-100 z-30"
                      >
                        <X size={14} />
                      </button>
                    )}

                    {isDeleting && (
                      <div className="absolute inset-0 bg-slate-900/95 z-40 rounded-[2rem] flex items-center justify-center p-4 gap-4 border border-red-500/50 animate-in fade-in zoom-in-95 duration-200">
                        <div className="text-center">
                          <p className="text-sm font-bold text-white mb-3">Eliminar este hábito?</p>
                          <div className="flex gap-3 justify-center">
                            <button 
                              onClick={() => removeHabit(habit.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-500 transition-colors"
                            >
                              Confirmar
                            </button>
                            <button 
                              onClick={() => setConfirmDeleteId(null)}
                              className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition-colors"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    <div 
                        className={`glass rounded-[2rem] p-5 flex flex-col md:flex-row items-center gap-6 transition-all border-l-8 ${isDone ? 'border-l-emerald-500 bg-emerald-500/5' : 'border-l-indigo-600'} relative overflow-hidden ${isCelebrating ? 'animate-pop animate-gold-glow ring-4 ring-amber-400' : ''} ${hasTargetReached ? 'animate-gold-subtle border-l-amber-500' : ''}`}
                    >
                        {isCelebrating && [1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                        <div 
                            key={n}
                            className="sparkle-particle text-amber-400"
                            style={{
                            left: `${50 + (Math.random() - 0.5) * 80}%`,
                            top: `${50 + (Math.random() - 0.5) * 80}%`,
                            '--tw-translate-x': `${(Math.random() - 0.5) * 200}px`,
                            '--tw-translate-y': `${(Math.random() - 0.5) * 200}px`,
                            animationDelay: `${Math.random() * 0.2}s`
                            } as React.CSSProperties}
                        >
                            <Star size={16 + Math.random() * 10} fill="currentColor" />
                        </div>
                        ))}

                        {hasTargetReached && !isEditingInline && (
                        <div className="absolute top-0 right-0 p-3 text-amber-400 animate-trophy-float z-10">
                            <Trophy size={28} className="drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]" />
                        </div>
                        )}

                        <div 
                            onClick={() => startInlineEdit(habit)}
                            className={`flex-shrink-0 w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-3xl shadow-inner relative cursor-pointer hover:bg-slate-700 transition-colors ${isEditingInline ? 'ring-2 ring-indigo-500' : ''}`}
                        >
                            {isEditingInline ? (
                                <Edit2 size={24} className="text-indigo-400" />
                            ) : (
                                habit.icon
                            )}
                        </div>

                        <div className="flex-1 text-center md:text-left space-y-1">
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                            {isEditingInline ? (
                            <div className="flex flex-col gap-2 w-full">
                                <div className="flex items-center gap-2">
                                  <input 
                                      autoFocus
                                      type="text"
                                      value={inlineEditName}
                                      onChange={(e) => setInlineEditName(e.target.value)}
                                      className="bg-slate-800 border border-indigo-500 rounded-lg px-3 py-1 text-xl font-bold focus:outline-none flex-1 text-white"
                                  />
                                  <button onClick={saveInlineEdit} className="p-2 bg-emerald-600 rounded-lg text-white"><Check size={18} /></button>
                                  <button onClick={cancelInlineEdit} className="p-2 bg-slate-700 rounded-lg text-white"><X size={18} /></button>
                                </div>
                                <textarea 
                                  value={inlineEditDescription}
                                  onChange={(e) => setInlineEditDescription(e.target.value)}
                                  className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1 text-sm focus:outline-none w-full min-h-[60px] text-slate-300"
                                  placeholder="Descrição do hábito..."
                                />
                            </div>
                            ) : (
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                              <h4 
                                  onClick={() => startInlineEdit(habit)}
                                  className="text-xl font-bold cursor-pointer hover:text-indigo-400 transition-colors flex items-center gap-2 group text-white"
                              >
                                  {habit.name}
                                  <Edit2 size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                              </h4>
                              <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded border border-current ${color}`}>
                                {rank}
                              </span>
                            </div>
                            )}
                        </div>
                        
                        {!isEditingInline && (
                          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-slate-400">
                              <div className="flex items-center gap-1.5">
                                  <Flame size={14} className="text-orange-500" />
                                  <span className="text-orange-100">{habit.streak} dias</span>
                              </div>
                              <button 
                                  onClick={() => setShowHistoryId(isExpanded ? null : habit.id)}
                                  className={`flex items-center gap-1.5 transition-colors ${isExpanded ? 'text-indigo-400' : 'hover:text-indigo-400'}`}
                              >
                                  <CalendarIcon size={14} />
                                  <span>Painel</span>
                              </button>
                              {habit.description && (
                                <div className="hidden md:flex items-center gap-1.5 text-slate-500 italic truncate max-w-[200px]">
                                  <Info size={12} />
                                  <span className="truncate">{habit.description}</span>
                                </div>
                              )}
                          </div>
                        )}
                        </div>

                        <div className="flex items-center gap-3 relative z-20">
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
                        </div>
                    </div>

                    {isExpanded && (
                        <div className="glass rounded-[1.5rem] p-6 mx-4 animate-in slide-in-from-top-2 space-y-4">
                            {habit.description && (
                              <div className="space-y-2">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                  <Info size={12} />
                                  Descrição
                                </h5>
                                <p className="text-sm text-slate-300 leading-relaxed bg-slate-900/40 p-3 rounded-xl border border-slate-800/50">
                                  {habit.description}
                                </p>
                              </div>
                            )}

                            <div className="space-y-3">
                                <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <CalendarIcon size={12} />
                                    Atividade dos Últimos 30 Dias
                                </h5>
                                <div className="flex flex-wrap gap-1.5">
                                    {Array.from({ length: 30 }, (_, i) => {
                                        const d = new Date();
                                        d.setDate(d.getDate() - (29 - i));
                                        const dStr = d.toISOString().split('T')[0];
                                        const isCompleted = habit.history.includes(dStr);
                                        return (
                                            <div 
                                                key={dStr} 
                                                title={dStr}
                                                className={`w-5 h-5 rounded-md transition-all ${isCompleted ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]' : 'bg-slate-800'}`}
                                            ></div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </main>

        <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] lg:hidden z-40">
          <div className="glass rounded-full p-2 flex items-center justify-between border-slate-700 shadow-2xl">
            <div className="flex items-center gap-3 pl-4">
               <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-black text-white">
                 {user.level}
               </div>
               <span className="text-xs font-bold text-slate-300">Nível {user.level}</span>
            </div>
            <button 
              onClick={() => setIsAdding(true)}
              className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/40"
            >
              <Plus size={24} className="text-white" />
            </button>
            <div className="flex items-center gap-3 pr-4 text-right">
               <button onClick={() => setView('settings')} className="p-2 text-slate-400">
                  <SettingsIcon size={20} />
               </button>
            </div>
          </div>
        </nav>

        {undoAction && (
          <div className="fixed bottom-24 lg:bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8">
            <div className="glass bg-slate-900 border-indigo-500/50 rounded-2xl px-6 py-4 flex items-center gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] border">
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white">Missão concluída!</span>
                <span className="text-xs text-slate-400">Tens 10 segundos para anular.</span>
              </div>
              <div className="h-8 w-[1px] bg-slate-700 mx-2"></div>
              <button 
                onClick={undoCompletion}
                className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-black text-sm uppercase tracking-widest transition-colors"
              >
                <RotateCcw size={16} />
                Anular
              </button>
              <button 
                onClick={() => setUndoAction(null)}
                className="p-1 text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const SettingsPage = () => (
    <div className="min-h-screen pb-20 flex flex-col items-center">
      <header className="w-full max-w-2xl px-4 pt-12 pb-8 flex items-center justify-between">
        <button 
          onClick={() => setView('dashboard')}
          className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white">Definições</h2>
        <div className="w-12"></div>
      </header>

      <main className="w-full max-w-2xl px-4 space-y-6">
        <section className="glass rounded-[2rem] p-8 space-y-8">
          <div className="space-y-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
              <UserIcon size={16} />
              Perfil do Utilizador
            </h3>
            
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-300">Nome de Exibição</label>
              <input 
                type="text" 
                value={editUsername}
                onChange={(e) => setEditUsername(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500 transition-all font-medium text-white"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-700/50 space-y-6">
            <h3 className="text-sm font-black text-slate-500 uppercase tracking-widest flex items-center gap-2 pt-4">
              <Layers size={16} />
              Gerir Categorias
            </h3>

            <div className="bg-slate-900/50 rounded-2xl p-6 border border-slate-700/50 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Nome da Categoria</label>
                  <input 
                    type="text" 
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Ex: Lazer"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-indigo-500 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase">Ícone</label>
                  <div className="flex items-center gap-2 h-11 px-3 bg-slate-800 border border-slate-700 rounded-xl">
                    <span className="text-xl">{newCatIcon}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase">Selecionar Ícone</label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-1 custom-scrollbar">
                  {COMMON_ICONS.map(icon => (
                    <button 
                      key={icon}
                      onClick={() => setNewCatIcon(icon)}
                      className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${newCatIcon === icon ? 'bg-indigo-600 scale-110 shadow-lg' : 'bg-slate-800 hover:bg-slate-700'}`}
                    >
                      {icon}
                    </button>
                  ))}
                </div>
              </div>

              <button 
                onClick={addCategory}
                disabled={!newCatName.trim()}
                className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 text-white shadow-lg shadow-indigo-600/20"
              >
                {editingCat ? <Save size={18} /> : <Plus size={18} />}
                {editingCat ? 'Atualizar Categoria' : 'Adicionar Nova Categoria'}
              </button>
              
              {editingCat && (
                <button 
                  onClick={() => { setEditingCat(null); setNewCatName(''); setNewCatIcon(COMMON_ICONS[0]); }}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-xs font-bold text-slate-400"
                >
                  Cancelar Edição
                </button>
              )}
            </div>

            <div className="space-y-2 mt-4">
              {categories.map(cat => (
                <div key={cat.name} className="flex items-center justify-between p-4 bg-slate-900/30 border border-slate-700/30 rounded-[1.5rem] group hover:bg-slate-900/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-xl">
                      {cat.icon}
                    </div>
                    <span className="font-bold text-white">{cat.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => startEditCategory(cat)}
                      className="p-2 text-slate-500 hover:text-indigo-400 transition-colors"
                      title="Editar"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button 
                      onClick={() => removeCategory(cat.name)}
                      className="p-2 text-slate-500 hover:text-red-400 transition-colors"
                      title="Remover"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-4 border-t border-slate-700/50 space-y-4">
             <button 
               onClick={saveSettings}
               className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
             >
               <Save size={20} />
               Guardar Perfil
             </button>
             
             <button 
               onClick={handleLogout}
               className="w-full bg-slate-800 hover:bg-red-500/20 hover:text-red-400 text-slate-400 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all border border-transparent hover:border-red-500/30"
             >
               <LogOut size={20} />
               Terminar Sessão
             </button>
          </div>
        </section>
      </main>
    </div>
  );

  return (
    <div className="min-h-screen">
      {view === 'login' && <LoginPage />}
      {view === 'dashboard' && <DashboardPage />}
      {view === 'settings' && <SettingsPage />}

      {showLevelUp && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none px-4">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[3rem] shadow-[0_0_100px_rgba(99,102,241,0.6)] text-center animate-bounce border-4 border-amber-400/50">
            <Trophy size={64} className="mx-auto text-amber-400 mb-4" />
            <h2 className="text-4xl font-black text-white mb-2">LEVEL UP!</h2>
            <p className="text-xl font-bold text-amber-200">Chegaste ao Nível {user.level}!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
