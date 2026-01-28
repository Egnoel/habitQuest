
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
  Trash2,
  ChevronRight,
  Settings as SettingsIcon,
  LogOut,
  ArrowLeft,
  ShieldCheck,
  Save,
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
  ChevronDown,
  PauseCircle,
  PlayCircle
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
const COMBO_WINDOW_MS = 60000;

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
  
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [newHabitCat, setNewHabitCat] = useState(CATEGORIES[0].name);
  const [newHabitTarget, setNewHabitTarget] = useState<string>('');
  
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<SortOption>('name');

  const [aiTip, setAiTip] = useState('');
  const [showLevelUp, setShowLevelUp] = useState(false);
  const [undoAction, setUndoAction] = useState<UndoAction | null>(null);
  const [celebratingHabitId, setCelebratingHabitId] = useState<string | null>(null);
  
  // Inline Edit State
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [inlineEditName, setInlineEditName] = useState('');
  const [inlineEditIcon, setInlineEditIcon] = useState('');
  const [inlineEditCat, setInlineEditCat] = useState('');
  const [inlineEditDescription, setInlineEditDescription] = useState('');
  
  const [showHistoryId, setShowHistoryId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [comboCount, setComboCount] = useState(0);
  const [lastCompletionTime, setLastCompletionTime] = useState(0);
  const [showCombo, setShowCombo] = useState(false);

  const [editUsername, setEditUsername] = useState('');
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(COMMON_ICONS[0]);
  const [editingCat, setEditingCat] = useState<string | null>(null);

  const undoTimerRef = useRef<number | null>(null);
  const celebrationTimerRef = useRef<number | null>(null);
  const comboTimerRef = useRef<number | null>(null);

  // --- Audio ---
  const playSound = (type: 'success' | 'level' | 'undo' | 'combo') => {
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
        osc.frequency.setValueAtTime(523.25, now);
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.1);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
      } else if (type === 'level') {
        osc.type = 'triangle';
        [523.25, 659.25, 783.99, 1046.50].forEach((f, i) => osc.frequency.setValueAtTime(f, now + i * 0.1));
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
        osc.start(now); osc.stop(now + 0.6);
      } else if (type === 'undo') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.15);
        gain.gain.setValueAtTime(0.05, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        osc.start(now); osc.stop(now + 0.2);
      } else if (type === 'combo') {
        osc.type = 'square';
        const baseFreq = 440 + (comboCount * 110);
        osc.frequency.setValueAtTime(baseFreq, now);
        gain.gain.setValueAtTime(0.02, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.start(now); osc.stop(now + 0.1);
      }
    } catch (e) {}
  };

  // --- Persistence ---
  useEffect(() => {
    const savedHabits = localStorage.getItem('habit_quest_habits');
    const savedUser = localStorage.getItem('habit_quest_user');
    const savedView = localStorage.getItem('habit_quest_view');
    const savedCats = localStorage.getItem('habit_quest_categories');
    if (savedHabits) setHabits(JSON.parse(savedHabits).map((h: any) => ({ ...h, history: h.history || [], description: h.description || '', isPaused: !!h.isPaused })));
    if (savedCats) setCategories(JSON.parse(savedCats));
    if (savedUser) { const u = JSON.parse(savedUser); setUser(u); setEditUsername(u.username); }
    if (savedView) setView(savedView as View);
  }, []);

  useEffect(() => {
    localStorage.setItem('habit_quest_habits', JSON.stringify(habits));
    localStorage.setItem('habit_quest_user', JSON.stringify(user));
    localStorage.setItem('habit_quest_view', view);
    localStorage.setItem('habit_quest_categories', JSON.stringify(categories));
  }, [habits, user, view, categories]);

  // --- Helpers ---
  const getCurrentRank = (streak: number): { rank: RankType; color: string } => {
    let current = MILESTONES[0];
    for (const m of MILESTONES) { if (streak >= m.days) current = m; else break; }
    return { rank: current.rank, color: current.color };
  };

  const displayHabits = useMemo(() => {
    let filtered = filterCategory === 'All' ? habits : habits.filter(h => h.category === filterCategory);
    return [...filtered].sort((a, b) => {
      if (a.isPaused && !b.isPaused) return 1;
      if (!a.isPaused && b.isPaused) return -1;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      if (sortBy === 'streak') return b.streak - a.streak;
      if (sortBy === 'xp') return b.xp - a.xp;
      return 0;
    });
  }, [habits, filterCategory, sortBy]);

  const xpByDay = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(); d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    return last7Days.map(date => {
      let dailyXp = 0;
      let completedCount = 0;
      const activeOnDate = habits.filter(h => !h.isPaused);
      habits.forEach(habit => { if (habit.history.includes(date)) { dailyXp += XP_PER_CHECKIN; completedCount++; } });
      const allCompleted = activeOnDate.length > 0 && completedCount >= activeOnDate.length;
      return { date, xp: dailyXp, allCompleted };
    });
  }, [habits]);

  const movingAverageXp = useMemo(() => {
    const values = xpByDay.map(v => v.xp);
    const trend = []; let sum = 0;
    for (let i = 0; i < values.length; i++) { sum += values[i]; trend.push(sum / (i + 1)); }
    return trend;
  }, [xpByDay]);

  const categoryProgress = useMemo(() => categories.map(cat => {
      const catHabits = habits.filter(h => h.category === cat.name);
      if (catHabits.length === 0) return { ...cat, progress: 0, total: 0, reached: 0 };
      const habitsWithTarget = catHabits.filter(h => h.targetStreak && h.targetStreak > 0);
      const reached = habitsWithTarget.filter(h => h.streak >= (h.targetStreak || 0)).length;
      const progress = habitsWithTarget.length > 0 ? (reached / habitsWithTarget.length) * 100 : 0;
      return { ...cat, progress, total: habitsWithTarget.length, reached };
    }), [habits, categories]);

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => { e.preventDefault(); if (editUsername.trim()) { setUser(p => ({ ...p, username: editUsername })); setView('dashboard'); } };

  const handleLogout = () => {
    localStorage.removeItem('habit_quest_habits');
    localStorage.removeItem('habit_quest_user');
    localStorage.removeItem('habit_quest_view');
    localStorage.removeItem('habit_quest_categories');
    setUser({ xp: 0, level: 1, totalXp: 0, username: '' });
    setHabits([]);
    setCategories(CATEGORIES);
    setView('login');
  };

  const addHabit = () => {
    if (!newHabitName.trim()) return;
    const cat = categories.find(c => c.name === newHabitCat);
    setHabits([...habits, { 
      id: crypto.randomUUID(), 
      name: newHabitName, 
      description: newHabitDescription, 
      category: newHabitCat, 
      streak: 0, 
      lastCompleted: null, 
      history: [], 
      xp: 0, 
      icon: cat?.icon || '⭐', 
      targetStreak: newHabitTarget ? parseInt(newHabitTarget) : undefined,
      isPaused: false
    }]);
    setNewHabitName(''); setNewHabitDescription(''); setNewHabitTarget(''); setIsAdding(false);
  };

  const removeHabit = (id: string) => { setHabits(habits.filter(h => h.id !== id)); setConfirmDeleteId(null); };

  const togglePauseHabit = (id: string) => {
    setHabits(prev => prev.map(h => h.id === id ? { ...h, isPaused: !h.isPaused } : h));
  };

  const startInlineEdit = (habit: Habit) => {
    setEditingHabitId(habit.id);
    setInlineEditName(habit.name);
    setInlineEditIcon(habit.icon);
    setInlineEditCat(habit.category);
    setInlineEditDescription(habit.description || '');
  };

  const saveInlineEdit = () => {
    if (!editingHabitId || !inlineEditName.trim()) return;
    setHabits(prev => prev.map(h => 
      h.id === editingHabitId 
        ? { ...h, name: inlineEditName, icon: inlineEditIcon, category: inlineEditCat, description: inlineEditDescription } 
        : h
    ));
    setEditingHabitId(null);
  };

  const undoCompletion = () => { if (undoAction) { playSound('undo'); setHabits(undoAction.previousHabits); setUser(undoAction.previousUser); setUndoAction(null); setCelebratingHabitId(null); setComboCount(0); setShowCombo(false); } };
  
  const completeHabit = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1 || habits[habitIndex].lastCompleted === today || habits[habitIndex].isPaused) return;

    const habit = habits[habitIndex];
    const now = Date.now();
    if (now - lastCompletionTime < COMBO_WINDOW_MS) { setComboCount(c => c + 1); setShowCombo(true); playSound('combo'); } 
    else { setComboCount(0); setShowCombo(false); playSound('success'); }
    setLastCompletionTime(now);

    setCelebratingHabitId(id);
    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    celebrationTimerRef.current = setTimeout(() => setCelebratingHabitId(null), 3000);

    const snapshotHabits = JSON.parse(JSON.stringify(habits));
    const snapshotUser = JSON.parse(JSON.stringify(user));

    const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    const newStreak = (habit.lastCompleted === yStr || !habit.lastCompleted) ? habit.streak + 1 : 1;

    const streakBonus = Math.floor(newStreak * STREAK_BONUS_MULTIPLIER);
    const comboBonus = comboCount * 50;
    const totalGained = XP_PER_CHECKIN + streakBonus + comboBonus;

    let nXp = user.xp + totalGained;
    let nLvl = user.level;
    if (nXp >= XP_PER_LEVEL) { nXp -= XP_PER_LEVEL; nLvl++; setShowLevelUp(true); playSound('level'); setTimeout(() => setShowLevelUp(false), 3000); }

    setUser({ ...user, xp: nXp, level: nLvl, totalXp: user.totalXp + totalGained });
    const nHabits = [...habits];
    nHabits[habitIndex] = { ...habit, streak: newStreak, lastCompleted: today, history: [...habit.history, today], xp: habit.xp + totalGained };
    setHabits(nHabits);

    setUndoAction({ habitId: id, previousHabits: snapshotHabits, previousUser: snapshotUser });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoAction(null), 10000);

    const tip = await getMotivationalTip(habit.name, newStreak);
    setAiTip(tip);
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    if (editingCat) setCategories(categories.map(c => c.name === editingCat ? { name: newCatName, icon: newCatIcon } : c));
    else setCategories([...categories, { name: newCatName, icon: newCatIcon }]);
    setNewCatName(''); setEditingCat(null);
  };

  const xpProgress = (user.xp / XP_PER_LEVEL) * 100;

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50">
      {/* LOGIN VIEW */}
      {view === 'login' && (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="glass max-w-md w-full rounded-[2.5rem] p-8 lg:p-12 shadow-2xl text-center space-y-8 relative overflow-hidden">
            <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full"></div>
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg rotate-3"><ShieldCheck size={40} className="text-white" /></div>
            <div className="space-y-2"><h1 className="text-4xl font-extrabold text-white">HabitQuest</h1><p className="text-slate-400 font-medium">A tua aventura épica começa aqui.</p></div>
            <form onSubmit={handleLogin} className="space-y-6 text-left">
              <div className="space-y-2"><label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome do Herói</label>
              <input autoFocus type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} placeholder="Como te chamas?" className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500 text-white" /></div>
              <button type="submit" disabled={!editUsername.trim()} className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl hover:scale-[1.02] flex items-center justify-center gap-3">Começar Jornada <ChevronRight size={20} /></button>
            </form>
          </div>
        </div>
      )}

      {/* DASHBOARD VIEW */}
      {view === 'dashboard' && (
        <div className="min-h-screen pb-20 flex flex-col items-center">
          {showCombo && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[60] pointer-events-none">
              <div className="bg-amber-500 text-slate-900 font-black px-6 py-2 rounded-full shadow-2xl animate-pop flex items-center gap-2 border-2 border-white/50">
                <Zap size={20} className="animate-pulse" /> COMBO x{comboCount}!
              </div>
            </div>
          )}

          <header className="w-full max-w-7xl px-4 pt-8 pb-4">
            <div className="glass rounded-[2.5rem] p-6 lg:p-8 flex flex-col md:flex-row items-center gap-8 shadow-2xl relative overflow-hidden">
              <div className="relative group">
                <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg ring-4 ring-indigo-500/20 group-hover:scale-105 transition-transform"><UserIcon size={48} className="text-white" /></div>
                <div className="absolute -bottom-2 -right-2 bg-amber-400 text-slate-900 font-extrabold px-3 py-1 rounded-full text-sm">LVL {user.level}</div>
              </div>
              <div className="flex-1 w-full space-y-4">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-2">
                  <h1 className="text-3xl font-extrabold text-white">{user.username}</h1>
                  <div className="flex items-center gap-3"><div className="text-slate-400 text-sm font-bold flex items-center gap-2"><Trophy size={16} className="text-amber-400" /> TOTAL XP: {user.totalXp}</div>
                  <button onClick={() => setView('settings')} className="p-2 bg-slate-800 rounded-xl text-slate-400 hover:text-white border border-slate-700"><SettingsIcon size={18} /></button></div>
                </div>
                <div className="w-full h-4 bg-slate-900/50 rounded-full border border-slate-700 p-0.5"><div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full xp-bar-animate" style={{ width: `${xpProgress}%` }}></div></div>
              </div>
            </div>
          </header>

          <main className="w-full max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
            <aside className="lg:col-span-4 space-y-6">
              <div className="glass rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
                <h3 className="text-lg font-bold flex items-center gap-2 text-white mb-4"><BarChart2 size={20} className="text-indigo-400" /> Ganhos de XP</h3>
                <div className="relative h-32 flex items-end justify-between gap-1 px-2">
                  {xpByDay.map(({ xp, allCompleted }, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
                      {allCompleted && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse mb-1"></div>}
                      <div className={`w-full rounded-t-lg bg-slate-700 hover:bg-slate-600 transition-all ${idx === 6 ? 'bg-indigo-500' : ''}`} style={{ height: `${(xp / Math.max(...xpByDay.map(v=>v.xp), 500)) * 100}%`, minHeight: '4px' }}></div>
                    </div>
                  ))}
                  <svg className="absolute inset-0 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 128">
                    <polyline fill="none" stroke="#6366f1" strokeWidth="1" strokeOpacity="0.4" points={movingAverageXp.map((v, i) => `${(i / 6) * 100},${128 - (v / Math.max(...xpByDay.map(v=>v.xp), 500)) * 128}`).join(' ')} />
                  </svg>
                </div>
              </div>

              <div className="glass rounded-[2rem] p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-white"><PieChart size={20} className="text-pink-400" /> Categorias</h3>
                <div className="space-y-4">
                  {categoryProgress.filter(c => c.total > 0).map(cat => (
                    <div key={cat.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-white"><span>{cat.icon} {cat.name}</span><span>{cat.reached}/{cat.total} metas</span></div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden"><div className="h-full bg-indigo-500" style={{ width: `${cat.progress}%` }}></div></div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="glass rounded-[2rem] p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-white">
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

              {aiTip && <div className="glass rounded-[2rem] p-6 bg-indigo-900/20 border-indigo-500/30 animate-in slide-in-from-bottom-2"><h4 className="text-xs font-black text-indigo-400 uppercase mb-2">Dica do Mestre</h4><p className="text-sm italic text-indigo-100">"{aiTip}"</p></div>}
            </aside>

            <section className="lg:col-span-8 space-y-6">
              <div className="flex items-center justify-between gap-4">
                <h2 className="text-2xl font-bold flex items-center gap-3 text-white"><Flame size={28} className="text-orange-500" /> Missões</h2>
                <button onClick={() => setIsAdding(true)} className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all hover:scale-105"><Plus size={20} /> Criar</button>
              </div>

              {isAdding && (
                <div className="glass rounded-[2rem] p-6 space-y-6 border-indigo-500/50 animate-in zoom-in-95">
                  <div className="flex items-center justify-between"><h3 className="font-bold text-xl text-white">Nova Missão</h3><button onClick={() => setIsAdding(false)} className="text-slate-500 hover:text-white"><X size={24} /></button></div>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="md:col-span-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hábito</label>
                        <input type="text" value={newHabitName} onChange={e => setNewHabitName(e.target.value)} placeholder="Ex: Ler..." className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500 text-white" />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Categoria</label>
                        <select value={newHabitCat} onChange={e => setNewHabitCat(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-4 py-4 focus:outline-none focus:border-indigo-500 text-white appearance-none">
                          {categories.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Meta (Dias)</label>
                        <input type="number" value={newHabitTarget} onChange={e => setNewHabitTarget(e.target.value)} placeholder="Ex: 21" className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500 text-white" />
                      </div>
                    </div>
                    <div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descrição</label>
                    <textarea value={newHabitDescription} onChange={e => setNewHabitDescription(e.target.value)} placeholder="Define o teu objetivo..." className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-3 focus:outline-none focus:border-indigo-500 text-white min-h-[80px]" /></div>
                    <button onClick={addHabit} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg transition-transform active:scale-[0.98]">Confirmar Missão Épica</button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                {displayHabits.map(habit => {
                  const { rank, color } = getCurrentRank(habit.streak);
                  const isDone = habit.lastCompleted === new Date().toISOString().split('T')[0];
                  const hasTargetReached = habit.targetStreak && habit.streak >= habit.targetStreak;
                  const isCelebrating = celebratingHabitId === habit.id;
                  const isDeleting = confirmDeleteId === habit.id;
                  const isEditingInline = editingHabitId === habit.id;
                  const pCount = Math.min(8 + Math.floor(habit.streak / 3), 20);

                  return (
                    <div key={habit.id} className={`group relative transition-all duration-300 ${habit.isPaused ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                      {/* Top-Left: Inline Edit Icon */}
                      {!isDeleting && !isEditingInline && (
                        <button 
                          onClick={() => startInlineEdit(habit)} 
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
                            onClick={() => togglePauseHabit(habit.id)} 
                            className={`p-2 bg-slate-800/90 backdrop-blur-md rounded-full ${habit.isPaused ? 'text-emerald-400 hover:text-emerald-300' : 'text-amber-400 hover:text-amber-300'} hover:scale-110 shadow-lg border border-white/5`}
                            title={habit.isPaused ? "Retomar Hábito" : "Ignorar Hábito (Suspender)"}
                          >
                            {habit.isPaused ? <PlayCircle size={14} /> : <PauseCircle size={14} />}
                          </button>
                          <button 
                            onClick={() => setConfirmDeleteId(habit.id)} 
                            className="p-2 bg-slate-800/90 backdrop-blur-md rounded-full text-slate-500 hover:text-red-400 hover:scale-110 shadow-lg border border-white/5"
                            title="Eliminar hábito"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}

                      {isDeleting && (
                        <div className="absolute inset-0 bg-slate-900/95 z-40 rounded-[2rem] flex items-center justify-center p-4 gap-4 border border-red-500/50 animate-in zoom-in-95">
                          <div className="text-center"><p className="text-sm font-bold text-white mb-3">Eliminar missão?</p>
                          <div className="flex gap-3"><button onClick={() => removeHabit(habit.id)} className="px-5 py-2 bg-red-600 text-white rounded-xl text-xs font-black shadow-lg">SIM</button><button onClick={() => setConfirmDeleteId(null)} className="px-5 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-black">NÃO</button></div></div>
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
                          <div key={n} className="sparkle-particle text-amber-400" style={{ left: `${50 + (Math.random()-0.5)*80}%`, top: `${50 + (Math.random()-0.5)*80}%`, '--tw-translate-x': `${(Math.random()-0.5)*300}px`, '--tw-translate-y': `${(Math.random()-0.5)*300}px`, animationDelay: `${Math.random()*0.2}s` } as any}><Star size={12 + Math.random()*14} fill="currentColor" /></div>
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
                                  <button onClick={saveInlineEdit} className="p-2 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white shadow-lg transition-transform active:scale-90"><Check size={18}/></button>
                                  <button onClick={() => setEditingHabitId(null)} className="p-2 bg-slate-700 hover:bg-slate-600 rounded-xl text-white shadow-lg transition-transform active:scale-90"><X size={18}/></button>
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
                              <button onClick={() => setShowHistoryId(showHistoryId === habit.id ? null : habit.id)} className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-400 transition-colors">
                                <CalendarIcon size={14} /> Histórico
                              </button>
                              <div className="text-[10px] text-slate-600 hidden md:block">Categoria: {habit.category}</div>
                            </div>
                          )}
                        </div>

                        <button 
                          onClick={() => completeHabit(habit.id)} 
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
                              <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2"><Info size={12} className="text-indigo-400" /> Sobre a Missão</h5>
                              <p className="text-sm text-slate-300 bg-slate-900/60 p-4 rounded-2xl border border-white/5 italic">"{habit.description}"</p>
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
                                // We check history for all currently existing habits.
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
                })}
              </div>
            </section>
          </main>
          
          {/* Mobile Nav */}
          <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-sm lg:hidden z-40">
            <div className="glass rounded-full p-2 flex items-center justify-between border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
              <div className="flex items-center gap-3 pl-4">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-black text-white shadow-lg ring-2 ring-white/10">{user.level}</div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-indigo-400 leading-none">NÍVEL</span>
                  <span className="text-xs font-bold text-slate-200">ASCENSÃO</span>
                </div>
              </div>
              <button onClick={() => setIsAdding(true)} className="w-14 h-14 bg-indigo-600 hover:bg-indigo-500 rounded-full flex items-center justify-center shadow-2xl transition-transform active:scale-90 border-4 border-slate-900">
                <Plus size={28} className="text-white" />
              </button>
              <button onClick={() => setView('settings')} className="p-4 text-slate-400 hover:text-white transition-colors">
                <SettingsIcon size={22} />
              </button>
            </div>
          </nav>

          {/* Undo Toast */}
          {undoAction && (
            <div className="fixed bottom-28 lg:bottom-12 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8">
              <div className="glass bg-slate-900/90 border-indigo-500/50 rounded-2xl px-6 py-4 flex items-center gap-5 shadow-2xl border backdrop-blur-xl">
                <div className="flex flex-col">
                  <span className="text-sm font-black text-white flex items-center gap-2">MISSÃO CONCLUÍDA <CheckCircle2 size={14} className="text-emerald-400" /></span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Tempo de reversão: 10s</span>
                </div>
                <div className="h-8 w-px bg-slate-700"></div>
                <button onClick={undoCompletion} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 font-black text-xs uppercase transition-all hover:scale-105 active:scale-95">
                  <RotateCcw size={16} /> ANULAR
                </button>
                <button onClick={() => setUndoAction(null)} className="p-1 text-slate-500 hover:text-white transition-colors">
                  <X size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SETTINGS VIEW */}
      {view === 'settings' && (
        <div className="min-h-screen pb-20 flex flex-col items-center">
          <header className="w-full max-w-2xl px-4 pt-12 pb-8 flex items-center justify-between">
            <button onClick={() => setView('dashboard')} className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all shadow-lg active:scale-90">
              <ArrowLeft size={24} />
            </button>
            <h2 className="text-2xl font-black text-white tracking-tight uppercase">Definições</h2>
            <div className="w-12"></div>
          </header>
          <main className="w-full max-w-2xl px-4 space-y-6">
            <section className="glass rounded-[2.5rem] p-8 space-y-8 shadow-2xl border-white/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full"></div>
              
              <div className="space-y-6">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                  <UserIcon size={14} className="text-indigo-400" /> Identidade do Herói
                </h3>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-400">Nome de Visualização</label>
                  <input type="text" value={editUsername} onChange={e => setEditUsername(e.target.value)} className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors" />
                </div>
              </div>

              <div className="pt-8 border-t border-slate-800/50 space-y-8">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                  <Layers size={14} className="text-purple-400" /> Forjar Categorias
                </h3>
                <div className="bg-slate-900/40 rounded-[2rem] p-6 border border-white/5 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500">NOME</label>
                      <input type="text" value={newCatName} onChange={e => setNewCatName(e.target.value)} placeholder="Ex: Meditação" className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-slate-500">SÍMBOLO</label>
                      <div className="flex items-center gap-2 h-[52px] px-4 bg-slate-800/50 border border-slate-700 rounded-xl">
                        <span className="text-2xl">{newCatIcon}</span>
                        <span className="text-[10px] text-slate-500 font-bold ml-auto">SELECCIONADO</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 p-1 max-h-40 overflow-y-auto custom-scrollbar">
                    {COMMON_ICONS.map(i => (
                      <button 
                        key={i} 
                        onClick={() => setNewCatIcon(i)} 
                        className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${newCatIcon === i ? 'bg-indigo-600 scale-110 shadow-lg ring-2 ring-white/20' : 'bg-slate-800 hover:bg-slate-700'}`}
                      >
                        {i}
                      </button>
                    ))}
                  </div>
                  <button onClick={addCategory} disabled={!newCatName.trim()} className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase text-xs tracking-widest">Adicionar às Crónicas</button>
                </div>
                
                <div className="space-y-3">
                  {categories.map(c => (
                    <div key={c.name} className="flex items-center justify-between p-5 bg-slate-900/30 border border-white/5 rounded-[1.5rem] group hover:bg-slate-900/50 transition-all">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-xl shadow-inner">{c.icon}</div>
                        <span className="font-bold text-white tracking-tight">{c.name}</span>
                      </div>
                      <button onClick={() => setCategories(categories.filter(ca=>ca.name!==c.name))} className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100">
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8 border-t border-slate-800/50 space-y-4">
                <button onClick={() => setView('dashboard')} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[1.5rem] shadow-2xl transition-all active:scale-95 uppercase text-xs tracking-[0.2em]">Guardar Alterações</button>
                <button onClick={handleLogout} className="w-full bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-500 font-black py-5 rounded-[1.5rem] border border-transparent hover:border-red-500/20 flex items-center justify-center gap-3 transition-all uppercase text-xs tracking-[0.2em]">
                  <LogOut size={20} /> Terminar Sessão
                </button>
              </div>
            </section>
          </main>
        </div>
      )}

      {/* Level Up Fullscreen Animation Overlay */}
      {showLevelUp && (
        <div className="fixed inset-0 flex items-center justify-center z-[100] pointer-events-none px-4 bg-indigo-950/40 backdrop-blur-sm animate-in fade-in duration-500">
          <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-12 rounded-[3.5rem] shadow-[0_0_100px_rgba(99,102,241,0.6)] text-center animate-bounce border-4 border-amber-400/50 relative overflow-hidden">
            <div className="absolute -inset-20 bg-white/10 blur-[50px] rotate-45 animate-pulse"></div>
            <Trophy size={80} className="mx-auto text-amber-400 mb-6 drop-shadow-2xl" />
            <h2 className="text-5xl font-black text-white mb-2 tracking-tighter italic">LEVEL UP!</h2>
            <div className="h-1 w-24 bg-amber-400 mx-auto rounded-full mb-4"></div>
            <p className="text-2xl font-bold text-amber-200">ASCENSÃO AO NÍVEL {user.level}!</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
