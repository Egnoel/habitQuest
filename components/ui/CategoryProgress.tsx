import React from 'react';
import { PieChart } from 'lucide-react';

interface CategoryData {
  name: string;
  icon: string;
  progress: number;
  total: number;
  reached: number;
}

interface CategoryProgressProps {
  categoryProgress: CategoryData[];
}

export const CategoryProgress: React.FC<CategoryProgressProps> = ({ categoryProgress }) => {
  return (
    <div className="glass rounded-[2rem] p-6 shadow-xl">
      <h3 className="text-lg font-bold mb-5 flex items-center gap-2 text-white">
        <PieChart size={20} className="text-pink-400" /> Categorias
      </h3>
      <div className="space-y-4">
        {categoryProgress.filter(c => c.total > 0).map(cat => (
          <div key={cat.name} className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-white">
              <span>{cat.icon} {cat.name}</span>
              <span>{cat.reached}/{cat.total} metas</span>
            </div>
            <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-500" style={{ width: `${cat.progress}%` }}></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
