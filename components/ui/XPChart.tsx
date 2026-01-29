import React from 'react';
import { BarChart2 } from 'lucide-react';

interface XPData {
  date: string;
  xp: number;
  allCompleted: boolean;
}

interface XPChartProps {
  xpByDay: XPData[];
  movingAverageXp: number[];
}

export const XPChart: React.FC<XPChartProps> = ({ xpByDay, movingAverageXp }) => {
  const maxXp = Math.max(...xpByDay.map(v => v.xp), 500);

  return (
    <div className="glass rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
      <h3 className="text-lg font-bold flex items-center gap-2 text-white mb-4">
        <BarChart2 size={20} className="text-indigo-400" /> Ganhos de XP
      </h3>
      <div className="relative h-32 flex items-end justify-between gap-1 px-2">
        {xpByDay.map(({ xp, allCompleted }, idx) => (
          <div key={idx} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end group">
            {allCompleted && <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse mb-1"></div>}
            <div 
              className={`w-full rounded-t-lg bg-slate-700 hover:bg-slate-600 transition-all ${idx === 6 ? 'bg-indigo-500' : ''}`} 
              style={{ height: `${(xp / maxXp) * 100}%`, minHeight: '4px' }}
            ></div>
          </div>
        ))}
        <svg className="absolute inset-0 pointer-events-none" preserveAspectRatio="none" viewBox="0 0 100 128">
          <polyline 
            fill="none" 
            stroke="#6366f1" 
            strokeWidth="1" 
            strokeOpacity="0.4" 
            points={movingAverageXp.map((v, i) => `${(i / 6) * 100},${128 - (v / maxXp) * 128}`).join(' ')} 
          />
        </svg>
      </div>
    </div>
  );
};
