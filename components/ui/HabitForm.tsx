import React from 'react';
import { X } from 'lucide-react';

interface Category {
  name: string;
  icon: string;
}

interface HabitFormProps {
  newHabitName: string;
  setNewHabitName: (value: string) => void;
  newHabitDescription: string;
  setNewHabitDescription: (value: string) => void;
  newHabitCat: string;
  setNewHabitCat: (value: string) => void;
  newHabitTarget: string;
  setNewHabitTarget: (value: string) => void;
  categories: Category[];
  onSubmit: () => void;
  onCancel: () => void;
}

export const HabitForm: React.FC<HabitFormProps> = ({
  newHabitName,
  setNewHabitName,
  newHabitDescription,
  setNewHabitDescription,
  newHabitCat,
  setNewHabitCat,
  newHabitTarget,
  setNewHabitTarget,
  categories,
  onSubmit,
  onCancel
}) => {
  return (
    <div className="glass rounded-[2rem] p-6 space-y-6 border-indigo-500/50 animate-in zoom-in-95">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-xl text-white">Nova Missão</h3>
        <button onClick={onCancel} className="text-slate-500 hover:text-white">
          <X size={24} />
        </button>
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Hábito</label>
            <input 
              type="text" 
              value={newHabitName} 
              onChange={e => setNewHabitName(e.target.value)} 
              placeholder="Ex: Ler..." 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500 text-white" 
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Categoria</label>
            <select 
              value={newHabitCat} 
              onChange={e => setNewHabitCat(e.target.value)} 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-4 py-4 focus:outline-none focus:border-indigo-500 text-white appearance-none"
            >
              {categories.map(c => <option key={c.name} value={c.name}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Meta (Dias)</label>
            <input 
              type="number" 
              value={newHabitTarget} 
              onChange={e => setNewHabitTarget(e.target.value)} 
              placeholder="Ex: 21" 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500 text-white" 
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Descrição</label>
          <textarea 
            value={newHabitDescription} 
            onChange={e => setNewHabitDescription(e.target.value)} 
            placeholder="Define o teu objetivo..." 
            className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-3 focus:outline-none focus:border-indigo-500 text-white min-h-[80px]" 
          />
        </div>
        <button 
          onClick={onSubmit} 
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-2xl shadow-lg transition-transform active:scale-[0.98]"
        >
          Confirmar Missão Épica
        </button>
      </div>
    </div>
  );
};
