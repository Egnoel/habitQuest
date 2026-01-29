import React from 'react';
import { ShieldCheck, ChevronRight } from 'lucide-react';

interface LoginViewProps {
  username: string;
  onUsernameChange: (value: string) => void;
  onLogin: (e: React.FormEvent) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ username, onUsernameChange, onLogin }) => {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="glass max-w-md w-full rounded-[2.5rem] p-8 lg:p-12 shadow-2xl text-center space-y-8 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-64 h-64 bg-indigo-500/20 blur-[80px] rounded-full"></div>
        <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl mx-auto flex items-center justify-center shadow-lg rotate-3">
          <ShieldCheck size={40} className="text-white" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold text-white">HabitQuest</h1>
          <p className="text-slate-400 font-medium">A tua aventura épica começa aqui.</p>
        </div>
        <form onSubmit={onLogin} className="space-y-6 text-left">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nome do Herói</label>
            <input 
              autoFocus 
              type="text" 
              value={username} 
              onChange={e => onUsernameChange(e.target.value)} 
              placeholder="Como te chamas?" 
              className="w-full bg-slate-900/50 border border-slate-700 rounded-2xl px-6 py-4 focus:outline-none focus:border-indigo-500 text-white" 
            />
          </div>
          <button 
            type="submit" 
            disabled={!username.trim()} 
            className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-black py-4 rounded-2xl transition-all shadow-xl hover:scale-[1.02] flex items-center justify-center gap-3"
          >
            Começar Jornada <ChevronRight size={20} />
          </button>
        </form>
      </div>
    </div>
  );
};
