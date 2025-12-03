import React, { useMemo } from 'react';
import { Task } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Calendar } from 'lucide-react';

interface HistoryViewProps {
  tasks: Task[];
}

const HistoryView: React.FC<HistoryViewProps> = ({ tasks }) => {
  const stats = useMemo(() => {
    // Group by date (last 30 days)
    const groups: Record<string, { total: number; completed: number }> = {};
    const today = new Date();
    
    // Initialize last 30 days with empty data
    for (let i = 0; i < 30; i++) {
        const d = new Date();
        d.setDate(today.getDate() - i);
        const dateStr = d.toISOString().split('T')[0];
        groups[dateStr] = { total: 0, completed: 0 };
    }

    tasks.forEach(task => {
        if (groups[task.date]) {
            groups[task.date].total += 1;
            if (task.completed) groups[task.date].completed += 1;
        }
    });

    return Object.entries(groups)
        .sort((a, b) => b[0].localeCompare(a[0])) // Newest first
        .map(([date, data]) => ({ date, ...data }));
  }, [tasks]);

  const COLORS = ['#CBD5E1', '#3B82F6']; // Slate-300 (incomplete), Blue-500 (complete)

  return (
    <div className="space-y-6 pb-20">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
                <Calendar className="mr-2 text-blue-500" size={20} />
                Monthly Overview
            </h2>
            <p className="text-sm text-slate-500 mb-6">Records are automatically deleted after 30 days.</p>
            
            <div className="space-y-4">
                {stats.map((day) => {
                    // Don't show empty future days (though we initialized past days, just a safeguard)
                    if (day.total === 0) return null; 

                    const percentage = Math.round((day.completed / day.total) * 100) || 0;
                    const data = [
                        { name: 'Incomplete', value: day.total - day.completed },
                        { name: 'Completed', value: day.completed },
                    ];

                    return (
                        <div key={day.date} className="flex items-center p-3 rounded-lg hover:bg-slate-50 transition-colors">
                            <div className="w-24 flex-shrink-0">
                                <span className="text-sm font-medium text-slate-700">{day.date}</span>
                            </div>
                            <div className="flex-1 px-4">
                                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                                        style={{ width: `${percentage}%` }}
                                    ></div>
                                </div>
                            </div>
                            <div className="w-16 text-right">
                                <span className="text-xs font-bold text-slate-600">{percentage}%</span>
                            </div>
                            <div className="w-8 h-8 ml-2">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={data}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={0}
                                            outerRadius={12}
                                            paddingAngle={0}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {data.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    );
                })}
                {stats.every(d => d.total === 0) && (
                    <div className="text-center py-10 text-slate-400">
                        No activity recorded in the last 30 days.
                    </div>
                )}
            </div>
        </div>
    </div>
  );
};

export default HistoryView;