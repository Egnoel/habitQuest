import React, { useMemo } from 'react';
import { Habit, UserStats } from '../../types';
import { Flame, Plus } from 'lucide-react';
import { UserHeader } from '../ui/UserHeader';
import { XPChart } from '../ui/XPChart';
import { CategoryProgress } from '../ui/CategoryProgress';
import { MilestoneList } from '../ui/MilestoneList';
import { MobileNav } from '../ui/MobileNav';
import { HabitForm } from '../ui/HabitForm';
import { HabitCard } from '../ui/HabitCard';
import { XP_PER_LEVEL, XP_PER_CHECKIN } from '../../constants';

interface Category {
  name: string;
  icon: string;
}

interface DashboardViewProps {
  user: UserStats;
  habits: Habit[];
  categories: Category[];
  isAdding: boolean;
  setIsAdding: (value: boolean) => void;
  newHabitName: string;
  setNewHabitName: (value: string) => void;
  newHabitDescription: string;
  setNewHabitDescription: (value: string) => void;
  newHabitCat: string;
  setNewHabitCat: (value: string) => void;
  newHabitTarget: string;
  setNewHabitTarget: (value: string) => void;
  filterCategory: string;
  sortBy: 'name' | 'streak' | 'xp';
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
  aiTip: string;
  onAddHabit: () => void;
  onCompleteHabit: (id: string) => void;
  onStartEdit: (habit: Habit) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onTogglePause: (id: string) => void;
  onDeleteHabit: (id: string) => void;
  onConfirmDelete: (id: string) => void;
  onCancelDelete: () => void;
  onToggleHistory: (id: string) => void;
  onSettingsClick: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  user,
  habits,
  categories,
  isAdding,
  setIsAdding,
  newHabitName,
  setNewHabitName,
  newHabitDescription,
  setNewHabitDescription,
  newHabitCat,
  setNewHabitCat,
  newHabitTarget,
  setNewHabitTarget,
  filterCategory,
  sortBy,
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
  aiTip,
  onAddHabit,
  onCompleteHabit,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onTogglePause,
  onDeleteHabit,
  onConfirmDelete,
  onCancelDelete,
  onToggleHistory,
  onSettingsClick
}) => {
  const xpProgress = (user.xp / XP_PER_LEVEL) * 100;

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
      const d = new Date(); 
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();
    return last7Days.map(date => {
      let dailyXp = 0;
      let completedCount = 0;
      const activeOnDate = habits.filter(h => !h.isPaused);
      habits.forEach(habit => { 
        if (habit.history.includes(date)) { 
          dailyXp += XP_PER_CHECKIN; 
          completedCount++; 
        } 
      });
      const allCompleted = activeOnDate.length > 0 && completedCount >= activeOnDate.length;
      return { date, xp: dailyXp, allCompleted };
    });
  }, [habits]);

  const movingAverageXp = useMemo(() => {
    const values = xpByDay.map(v => v.xp);
    const trend = []; 
    let sum = 0;
    for (let i = 0; i < values.length; i++) { 
      sum += values[i]; 
      trend.push(sum / (i + 1)); 
    }
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

  return (
    <div className="min-h-screen pb-20 flex flex-col items-center">
      <UserHeader user={user} xpProgress={xpProgress} onSettingsClick={onSettingsClick} />

      <main className="w-full max-w-7xl px-4 grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
        <aside className="lg:col-span-4 space-y-6">
          <XPChart xpByDay={xpByDay} movingAverageXp={movingAverageXp} />
          <CategoryProgress categoryProgress={categoryProgress} />
          <MilestoneList />
          {aiTip && (
            <div className="glass rounded-[2rem] p-6 bg-indigo-900/20 border-indigo-500/30 animate-in slide-in-from-bottom-2">
              <h4 className="text-xs font-black text-indigo-400 uppercase mb-2">Dica do Mestre</h4>
              <p className="text-sm italic text-indigo-100">"{aiTip}"</p>
            </div>
          )}
        </aside>

        <section className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-2xl font-bold flex items-center gap-3 text-white">
              <Flame size={28} className="text-orange-500" /> Missões
            </h2>
            <button 
              onClick={() => setIsAdding(true)} 
              className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 px-4 rounded-xl flex items-center gap-2 transition-all hover:scale-105"
            >
              <Plus size={20} /> Criar
            </button>
          </div>

          {isAdding && (
            <HabitForm
              newHabitName={newHabitName}
              setNewHabitName={setNewHabitName}
              newHabitDescription={newHabitDescription}
              setNewHabitDescription={setNewHabitDescription}
              newHabitCat={newHabitCat}
              setNewHabitCat={setNewHabitCat}
              newHabitTarget={newHabitTarget}
              setNewHabitTarget={setNewHabitTarget}
              categories={categories}
              onSubmit={onAddHabit}
              onCancel={() => setIsAdding(false)}
            />
          )}

          <div className="grid grid-cols-1 gap-4">
            {displayHabits.map(habit => (
              <HabitCard
                key={habit.id}
                habit={habit}
                habits={habits}
                categories={categories}
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
                onComplete={onCompleteHabit}
                onStartEdit={onStartEdit}
                onSaveEdit={onSaveEdit}
                onCancelEdit={onCancelEdit}
                onTogglePause={onTogglePause}
                onDelete={onDeleteHabit}
                onConfirmDelete={onConfirmDelete}
                onCancelDelete={onCancelDelete}
                onToggleHistory={onToggleHistory}
              />
            ))}
          </div>
        </section>
      </main>

      <MobileNav 
        userLevel={user.level} 
        onAddClick={() => setIsAdding(true)} 
        onSettingsClick={onSettingsClick} 
      />
    </div>
  );
};
