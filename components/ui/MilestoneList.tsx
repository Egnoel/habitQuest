import React from 'react';
import { TrendingUp, Award } from 'lucide-react';
import { MILESTONES } from '../../constants';

export const MilestoneList: React.FC = () => {
  return (
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
              <div className="text-xs text-slate-500 font-medium">
                {m.days === 0 ? 'Início' : `${m.days} dias de sequência`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
