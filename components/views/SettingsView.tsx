import React from 'react';
import { ArrowLeft, LogOut, UserIcon, Layers, Trash2 } from 'lucide-react';

interface Category {
  name: string;
  icon: string;
}

interface SettingsViewProps {
  username: string;
  onUsernameChange: (value: string) => void;
  categories: Category[];
  newCatName: string;
  setNewCatName: (value: string) => void;
  newCatIcon: string;
  setNewCatIcon: (value: string) => void;
  commonIcons: string[];
  onAddCategory: () => void;
  onDeleteCategory: (name: string) => void;
  onBack: () => void;
  onLogout: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  username,
  onUsernameChange,
  categories,
  newCatName,
  setNewCatName,
  newCatIcon,
  setNewCatIcon,
  commonIcons,
  onAddCategory,
  onDeleteCategory,
  onBack,
  onLogout
}) => {
  return (
    <div className="min-h-screen pb-20 flex flex-col items-center">
      <header className="w-full max-w-2xl px-4 pt-12 pb-8 flex items-center justify-between">
        <button 
          onClick={onBack} 
          className="p-3 bg-slate-800 rounded-2xl text-slate-400 hover:text-white transition-all shadow-lg active:scale-90"
        >
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
              <input 
                type="text" 
                value={username} 
                onChange={e => onUsernameChange(e.target.value)} 
                className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 text-white font-bold focus:outline-none focus:border-indigo-500 transition-colors" 
              />
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
                  <input 
                    type="text" 
                    value={newCatName} 
                    onChange={e => setNewCatName(e.target.value)} 
                    placeholder="Ex: Meditação" 
                    className="w-full bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none" 
                  />
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
                {commonIcons.map(i => (
                  <button 
                    key={i} 
                    onClick={() => setNewCatIcon(i)} 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all ${newCatIcon === i ? 'bg-indigo-600 scale-110 shadow-lg ring-2 ring-white/20' : 'bg-slate-800 hover:bg-slate-700'}`}
                  >
                    {i}
                  </button>
                ))}
              </div>
              <button 
                onClick={onAddCategory} 
                disabled={!newCatName.trim()} 
                className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase text-xs tracking-widest"
              >
                Adicionar às Crónicas
              </button>
            </div>
            
            <div className="space-y-3">
              {categories.map(c => (
                <div key={c.name} className="flex items-center justify-between p-5 bg-slate-900/30 border border-white/5 rounded-[1.5rem] group hover:bg-slate-900/50 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-800 rounded-xl flex items-center justify-center text-xl shadow-inner">{c.icon}</div>
                    <span className="font-bold text-white tracking-tight">{c.name}</span>
                  </div>
                  <button 
                    onClick={() => onDeleteCategory(c.name)} 
                    className="p-3 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800/50 space-y-4">
            <button 
              onClick={onBack} 
              className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-5 rounded-[1.5rem] shadow-2xl transition-all active:scale-95 uppercase text-xs tracking-[0.2em]"
            >
              Guardar Alterações
            </button>
            <button 
              onClick={onLogout} 
              className="w-full bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-500 font-black py-5 rounded-[1.5rem] border border-transparent hover:border-red-500/20 flex items-center justify-center gap-3 transition-all uppercase text-xs tracking-[0.2em]"
            >
              <LogOut size={20} /> Terminar Sessão
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};
