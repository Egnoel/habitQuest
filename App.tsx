import React, { useState, useRef } from 'react';
import { Habit, UserStats } from './types';
import { XP_PER_LEVEL, XP_PER_CHECKIN, CATEGORIES, STREAK_BONUS_MULTIPLIER } from './constants';
import { getMotivationalTip } from './services/geminiService';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useSound } from './hooks/useSound';
import { LoginView } from './components/views/LoginView';
import { DashboardView } from './components/views/DashboardView';
import { SettingsView } from './components/views/SettingsView';
import { ComboNotification } from './components/ui/ComboNotification';
import { LevelUpAnimation } from './components/ui/LevelUpAnimation';
import { UndoToast } from './components/ui/UndoToast';

type View = 'login' | 'dashboard' | 'settings';

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
  // Custom Hooks
  const { habits, setHabits, user, setUser, categories, setCategories, view, setView } = useLocalStorage();
  
  // State
  const [isAdding, setIsAdding] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [newHabitDescription, setNewHabitDescription] = useState('');
  const [newHabitCat, setNewHabitCat] = useState(CATEGORIES[0].name);
  const [newHabitTarget, setNewHabitTarget] = useState<string>('');
  
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'name' | 'streak' | 'xp'>('name');

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

  const [editUsername, setEditUsername] = useState(user.username);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState(COMMON_ICONS[0]);
  const [editingCat, setEditingCat] = useState<string | null>(null);

  const undoTimerRef = useRef<number | null>(null);
  const celebrationTimerRef = useRef<number | null>(null);

  const { playSound } = useSound(comboCount);

  // Handlers
  const handleLogin = (e: React.FormEvent) => { 
    e.preventDefault(); 
    if (editUsername.trim()) { 
      setUser(p => ({ ...p, username: editUsername })); 
      setView('dashboard'); 
    } 
  };

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
    setNewHabitName(''); 
    setNewHabitDescription(''); 
    setNewHabitTarget(''); 
    setIsAdding(false);
  };

  const removeHabit = (id: string) => { 
    setHabits(habits.filter(h => h.id !== id)); 
    setConfirmDeleteId(null); 
  };

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

  const undoCompletion = () => { 
    if (undoAction) { 
      playSound('undo'); 
      setHabits(undoAction.previousHabits); 
      setUser(undoAction.previousUser); 
      setUndoAction(null); 
      setCelebratingHabitId(null); 
      setComboCount(0); 
      setShowCombo(false); 
    } 
  };
  
  const completeHabit = async (id: string) => {
    const today = new Date().toISOString().split('T')[0];
    const habitIndex = habits.findIndex(h => h.id === id);
    if (habitIndex === -1 || habits[habitIndex].lastCompleted === today || habits[habitIndex].isPaused) return;

    const habit = habits[habitIndex];
    const now = Date.now();
    if (now - lastCompletionTime < COMBO_WINDOW_MS) { 
      setComboCount(c => c + 1); 
      setShowCombo(true); 
      playSound('combo'); 
    } else { 
      setComboCount(0); 
      setShowCombo(false); 
      playSound('success'); 
    }
    setLastCompletionTime(now);

    setCelebratingHabitId(id);
    if (celebrationTimerRef.current) clearTimeout(celebrationTimerRef.current);
    celebrationTimerRef.current = setTimeout(() => setCelebratingHabitId(null), 3000);

    const snapshotHabits = JSON.parse(JSON.stringify(habits));
    const snapshotUser = JSON.parse(JSON.stringify(user));

    const yesterday = new Date(); 
    yesterday.setDate(yesterday.getDate() - 1);
    const yStr = yesterday.toISOString().split('T')[0];
    const newStreak = (habit.lastCompleted === yStr || !habit.lastCompleted) ? habit.streak + 1 : 1;

    const streakBonus = Math.floor(newStreak * STREAK_BONUS_MULTIPLIER);
    const comboBonus = comboCount * 50;
    const totalGained = XP_PER_CHECKIN + streakBonus + comboBonus;

    let nXp = user.xp + totalGained;
    let nLvl = user.level;
    if (nXp >= XP_PER_LEVEL) { 
      nXp -= XP_PER_LEVEL; 
      nLvl++; 
      setShowLevelUp(true); 
      playSound('level'); 
      setTimeout(() => setShowLevelUp(false), 3000); 
    }

    setUser({ ...user, xp: nXp, level: nLvl, totalXp: user.totalXp + totalGained });
    const nHabits = [...habits];
    nHabits[habitIndex] = { 
      ...habit, 
      streak: newStreak, 
      lastCompleted: today, 
      history: [...habit.history, today], 
      xp: habit.xp + totalGained 
    };
    setHabits(nHabits);

    setUndoAction({ habitId: id, previousHabits: snapshotHabits, previousUser: snapshotUser });
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setUndoAction(null), 10000);

    const tip = await getMotivationalTip(habit.name, newStreak);
    setAiTip(tip);
  };

  const addCategory = () => {
    if (!newCatName.trim()) return;
    if (editingCat) {
      setCategories(categories.map(c => c.name === editingCat ? { name: newCatName, icon: newCatIcon } : c));
    } else {
      setCategories([...categories, { name: newCatName, icon: newCatIcon }]);
    }
    setNewCatName(''); 
    setEditingCat(null);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-50">
      {/* Notifications */}
      <ComboNotification show={showCombo} comboCount={comboCount} />
      <LevelUpAnimation show={showLevelUp} level={user.level} />
      <UndoToast 
        undoAction={undoAction} 
        onUndo={undoCompletion} 
        onDismiss={() => setUndoAction(null)} 
      />

      {/* Views */}
      {view === 'login' && (
        <LoginView 
          username={editUsername} 
          onUsernameChange={setEditUsername} 
          onLogin={handleLogin} 
        />
      )}

      {view === 'dashboard' && (
        <DashboardView
          user={user}
          habits={habits}
          categories={categories}
          isAdding={isAdding}
          setIsAdding={setIsAdding}
          newHabitName={newHabitName}
          setNewHabitName={setNewHabitName}
          newHabitDescription={newHabitDescription}
          setNewHabitDescription={setNewHabitDescription}
          newHabitCat={newHabitCat}
          setNewHabitCat={setNewHabitCat}
          newHabitTarget={newHabitTarget}
          setNewHabitTarget={setNewHabitTarget}
          filterCategory={filterCategory}
          sortBy={sortBy}
          celebratingHabitId={celebratingHabitId}
          confirmDeleteId={confirmDeleteId}
          editingHabitId={editingHabitId}
          showHistoryId={showHistoryId}
          inlineEditName={inlineEditName}
          inlineEditIcon={inlineEditIcon}
          inlineEditCat={inlineEditCat}
          inlineEditDescription={inlineEditDescription}
          setInlineEditName={setInlineEditName}
          setInlineEditIcon={setInlineEditIcon}
          setInlineEditCat={setInlineEditCat}
          setInlineEditDescription={setInlineEditDescription}
          aiTip={aiTip}
          onAddHabit={addHabit}
          onCompleteHabit={completeHabit}
          onStartEdit={startInlineEdit}
          onSaveEdit={saveInlineEdit}
          onCancelEdit={() => setEditingHabitId(null)}
          onTogglePause={togglePauseHabit}
          onDeleteHabit={removeHabit}
          onConfirmDelete={(id) => setConfirmDeleteId(id)}
          onCancelDelete={() => setConfirmDeleteId(null)}
          onToggleHistory={(id) => setShowHistoryId(showHistoryId === id ? null : id)}
          onSettingsClick={() => setView('settings')}
        />
      )}

      {view === 'settings' && (
        <SettingsView
          username={editUsername}
          onUsernameChange={setEditUsername}
          categories={categories}
          newCatName={newCatName}
          setNewCatName={setNewCatName}
          newCatIcon={newCatIcon}
          setNewCatIcon={setNewCatIcon}
          commonIcons={COMMON_ICONS}
          onAddCategory={addCategory}
          onDeleteCategory={(name) => setCategories(categories.filter(c => c.name !== name))}
          onBack={() => setView('dashboard')}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
};

export default App;
