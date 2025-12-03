import React, { useMemo, useState } from 'react';
import { Task, DailyNoteMap } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Calendar, Trophy, ChevronLeft, ChevronRight, Image as ImageIcon, ChevronDown, ChevronUp, AlertTriangle, Quote } from 'lucide-react';
import TaskItem from './TaskItem';

interface HistoryViewProps {
  tasks: Task[];
  dailyNotes?: DailyNoteMap;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onUpdateMemo: (id: string, memo: string) => void;
}

const HistoryView: React.FC<HistoryViewProps> = ({ tasks, dailyNotes = {}, onDelete, onToggle, onUpdateMemo }) => {
  // State for currently selected month
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // State for expanding a specific day's tasks
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  // State for Delete Confirmation Modal
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const yearMonthStr = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }, [currentDate]);

  const changeMonth = (delta: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + delta);
    setCurrentDate(newDate);
    setExpandedDate(null); // Close accordion on month change
  };

  const handleDeleteClick = (id: string) => {
    setDeleteTargetId(id);
  };

  const confirmDelete = () => {
    if (deleteTargetId) {
        onDelete(deleteTargetId);
        setDeleteTargetId(null);
    }
  };

  const cancelDelete = () => {
    setDeleteTargetId(null);
  };

  const stats = useMemo(() => {
    // Filter tasks for the selected month
    const tasksInMonth = tasks.filter(t => t.date.startsWith(yearMonthStr));
    
    // Group by date
    const groups: Record<string, { total: number; completed: number; tasks: Task[]; note?: string }> = {};
    
    // Get number of days in the month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    // Initialize all days
    for (let i = 1; i <= daysInMonth; i++) {
        const dayStr = String(i).padStart(2, '0');
        const dateKey = `${yearMonthStr}-${dayStr}`;
        // Only add days up to today if looking at current month
        const checkDate = new Date(year, month, i);
        const today = new Date();
        today.setHours(0,0,0,0);
        
        // Also include if there is a note for that day, even if no tasks
        if (checkDate <= today || tasksInMonth.some(t => t.date === dateKey) || dailyNotes[dateKey]) {
             groups[dateKey] = { total: 0, completed: 0, tasks: [], note: dailyNotes[dateKey] };
        }
    }

    tasksInMonth.forEach(task => {
        if (!groups[task.date]) {
            groups[task.date] = { total: 0, completed: 0, tasks: [], note: dailyNotes[task.date] };
        }
        groups[task.date].total += 1;
        groups[task.date].tasks.push(task);
        if (task.completed) groups[task.date].completed += 1;
    });

    // Convert to array and sort descending by date
    return Object.entries(groups)
        .sort((a, b) => b[0].localeCompare(a[0])) 
        .map(([date, data]) => ({ date, ...data }));
  }, [tasks, yearMonthStr, currentDate, dailyNotes]);

  const monthlySummary = useMemo(() => {
    const total = stats.reduce((acc, curr) => acc + curr.total, 0);
    const completed = stats.reduce((acc, curr) => acc + curr.completed, 0);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  }, [stats]);

  // --- HELPER FOR CANVAS TEXT WRAP ---
  const wrapText = (ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) => {
    const words = text.split(''); // Split by character for Korean/CJK support logic roughly, or actual words for space based.
    // For mixed CJK/English, character based splitting + checking width is safer for simple implementation without complex lib.
    // However, splitting by words (space) is standard. Let's try word split first, then char if needed.
    // Actually, simple char loop is safer for "140 chars" which might not have spaces.
    
    let line = '';
    let currentY = y;
    let count = 0;

    for (let n = 0; n < text.length; n++) {
        const testLine = line + text[n];
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && n > 0) {
            ctx.fillText(line, x, currentY);
            line = text[n];
            currentY += lineHeight;
            count++;
            // Prevent writing outside cell
            if (count > 8) return; 
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, x, currentY);
  }

  // --- DIARY IMAGE GENERATION LOGIC ---
  const handleDownload = () => {
    // Wait for fonts to load before drawing to ensure Gowun Dodum is applied
    document.fonts.ready.then(() => {
        generateImage();
    });
  };

  const generateImage = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // A4 Landscape Size: 297mm x 210mm
    // @ ~150 DPI: 1754 x 1240 pixels
    const width = 1754;
    const height = 1240;
    canvas.width = width;
    canvas.height = height;

    // 1. Background (Creamy paper texture color)
    ctx.fillStyle = '#fdfbf7'; 
    ctx.fillRect(0, 0, width, height);

    // 2. Header (Month Year)
    ctx.textAlign = 'center';
    
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const monthIndex = currentDate.getMonth();
    const year = currentDate.getFullYear();
    
    // Use Gowun Dodum font
    const fontPrimary = '"Gowun Dodum", sans-serif';

    // Title
    ctx.font = `bold 70px ${fontPrimary}`;
    ctx.fillStyle = '#334155'; // Slate 700
    ctx.fillText(monthNames[monthIndex], width / 2, 100);
    
    // Year
    ctx.font = `bold 36px ${fontPrimary}`;
    ctx.fillStyle = '#94a3b8'; // Slate 400
    ctx.fillText(year.toString(), width / 2, 150);

    // 3. Grid Calculations
    const margin = 50;
    const headerHeight = 200;
    const gridWidth = width - (margin * 2);
    const gridHeight = height - headerHeight - margin;
    
    const cols = 7;
    // Calculate weeks needed to display the full month
    const firstDayObj = new Date(year, monthIndex, 1);
    const firstDay = firstDayObj.getDay(); // 0 = Sun
    const lastDate = new Date(year, monthIndex + 1, 0).getDate();
    
    // We force 6 rows to ensure consistent cell size and look
    const rows = 6; 
    
    const cellWidth = gridWidth / cols;
    const cellHeight = gridHeight / rows;
    
    const startX = margin;
    const startY = headerHeight;

    // Draw Day Headers (Mon, Tue, etc.)
    const days = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
    ctx.font = `bold 24px ${fontPrimary}`;
    ctx.fillStyle = '#64748b'; // Slate 500
    
    days.forEach((day, i) => {
        const x = startX + (i * cellWidth) + (cellWidth / 2);
        ctx.fillText(day, x, startY - 20);
    });

    // Draw Grid & Content
    ctx.strokeStyle = '#cbd5e1'; // Slate 300 for grid lines
    ctx.lineWidth = 2;
    
    let currentDay = 1;
    let dayIndex = 0; 

    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const x = startX + (c * cellWidth);
            const y = startY + (r * cellHeight);
            
            // Draw Cell Border
            ctx.strokeRect(x, y, cellWidth, cellHeight);

            // Check if we should draw a date here
            if (dayIndex >= firstDay && currentDay <= lastDate) {
                // Date Number
                ctx.textAlign = 'left';
                ctx.font = `bold 28px ${fontPrimary}`;
                
                if (c === 0) ctx.fillStyle = '#ef4444'; // Red for Sunday
                else if (c === 6) ctx.fillStyle = '#3b82f6'; // Blue for Saturday
                else ctx.fillStyle = '#334155';
                
                ctx.fillText(currentDay.toString(), x + 12, y + 36);
                
                // Tasks Logic
                const dateStr = `${yearMonthStr}-${String(currentDay).padStart(2, '0')}`;
                const dayData = stats.find(s => s.date === dateStr);
                
                if (dayData) {
                    const taskStartX = x + 12;
                    let taskY = y + 70;
                    const lineHeight = 26;

                    // CHECK FOR DAILY NOTE FIRST
                    if (dayData.note) {
                        ctx.fillStyle = '#475569'; // Slate 600
                        ctx.font = `16px ${fontPrimary}`; // Slightly smaller for note
                        
                        // Wrap text within cell
                        wrapText(ctx, dayData.note, taskStartX, taskY, cellWidth - 25, 22);

                    } else if (dayData.tasks.length > 0) {
                        // Regular Task List Logic
                        // Limit tasks to prevent overflow
                        const maxTasksPerCell = Math.floor((cellHeight - 75) / lineHeight); 
                        
                        ctx.font = `18px ${fontPrimary}`; 
                        
                        let renderedCount = 0;
                        
                        for (const task of dayData.tasks) {
                            if (renderedCount >= maxTasksPerCell) break;
                            
                            if (task.completed) {
                                ctx.fillStyle = '#1e293b'; 
                            } else {
                                ctx.fillStyle = '#94a3b8'; 
                            }

                            // Small Bullet
                            ctx.beginPath();
                            ctx.arc(taskStartX + 4, taskY - 6, 3, 0, Math.PI * 2);
                            ctx.fill();

                            const maxChars = Math.floor((cellWidth - 25) / 11);
                            let text = task.text;
                            if (text.length > maxChars) text = text.substring(0, maxChars) + '..';

                            ctx.fillText(text, taskStartX + 15, taskY);
                            
                            taskY += lineHeight;
                            renderedCount++;
                        }
                        
                        if (dayData.tasks.length > maxTasksPerCell) {
                             ctx.fillStyle = '#94a3b8';
                             ctx.font = `italic 16px ${fontPrimary}`;
                             ctx.fillText(`+${dayData.tasks.length - maxTasksPerCell} more`, taskStartX + 15, taskY);
                        }
                    }
                }
                
                currentDay++;
            }
            dayIndex++;
        }
    }

    // Trigger Download
    const dataUrl = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `DayFlow_Diary_${yearMonthStr}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const COLORS = ['#CBD5E1', '#3B82F6']; // Slate-300 (incomplete), Blue-500 (complete)
  const PAST_COLORS = ['#E2E8F0', '#94A3B8']; // Past records: lighter grey, darker grey for completed

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  return (
    <div className="space-y-6 pb-20 relative">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-slate-800 flex items-center">
                    <Calendar className="mr-2 text-blue-500" size={20} />
                    월간 기록
                </h2>
                <div className="flex items-center gap-2 bg-slate-50 rounded-lg p-1 border border-slate-200">
                    <button onClick={() => changeMonth(-1)} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-500">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="font-bold text-slate-700 min-w-[80px] text-center">{yearMonthStr}</span>
                    <button onClick={() => changeMonth(1)} className="p-1 hover:bg-white hover:shadow-sm rounded transition-all text-slate-500" disabled={new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1) > new Date()}>
                        <ChevronRight size={20} className={new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1) > new Date() ? "opacity-30" : ""} />
                    </button>
                </div>
            </div>
            
            {/* Monthly Summary Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-5 mb-8 border border-blue-100 flex items-center justify-between relative overflow-hidden">
                <div className="absolute right-0 top-0 p-4 opacity-10 pointer-events-none">
                    <Trophy size={80} className="text-blue-600" />
                </div>
                
                <div className="z-10">
                    <p className="text-sm font-semibold text-blue-600 mb-1 flex items-center gap-1">
                        <Trophy size={14} />
                        달성률
                    </p>
                    <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-slate-800">{monthlySummary.percentage}</span>
                        <span className="text-lg font-medium text-slate-400">%</span>
                    </div>
                </div>

                <div className="text-right z-10 bg-white/60 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/50">
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wide font-semibold">완료 업무</p>
                    <div className="flex items-center justify-end gap-2">
                        <span className="text-2xl font-bold text-blue-600">{monthlySummary.completed}</span>
                        <span className="text-sm text-slate-400">/ {monthlySummary.total}</span>
                    </div>
                </div>
            </div>

            <div className="flex justify-between items-end mb-3 pl-1">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">일별 상세</h3>
                <button 
                    onClick={handleDownload}
                    className="flex items-center gap-2 text-xs font-semibold bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300 px-3 py-1.5 rounded-lg transition-all shadow-sm active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={monthlySummary.total === 0}
                >
                    <ImageIcon size={14} />
                    다이어리 이미지 저장
                </button>
            </div>

            <div className="space-y-4">
                {stats.map((day) => {
                    // Show day even if total is 0 if there's a note
                    if (day.total === 0 && !day.note) return null; 

                    const percentage = day.total > 0 ? Math.round((day.completed / day.total) * 100) : 0;
                    const data = [
                        { name: '미완료', value: day.total - day.completed },
                        { name: '완료', value: day.completed },
                    ];
                    
                    const isExpanded = expandedDate === day.date;
                    const isPast = day.date < todayStr;
                    
                    // Colors based on past or present
                    const textColor = isPast ? 'text-slate-400' : 'text-slate-700';
                    const progressColor = isPast ? 'bg-slate-300' : 'bg-blue-500';
                    const percentageBadgeBg = isPast ? 'bg-slate-100 text-slate-400' : 'bg-blue-50 text-blue-600';
                    const chartColors = isPast ? PAST_COLORS : COLORS;

                    return (
                        <div key={day.date} className={`rounded-lg border transition-colors ${isPast ? 'bg-white border-transparent' : 'bg-white border-transparent hover:border-slate-100'}`}>
                            <div 
                                onClick={() => setExpandedDate(isExpanded ? null : day.date)}
                                className={`flex items-center p-3 cursor-pointer rounded-lg hover:bg-slate-50 ${isExpanded ? 'bg-slate-50 shadow-inner' : ''}`}
                            >
                                <div className="w-auto min-w-[150px] flex-shrink-0 flex items-center gap-2 mr-2">
                                    <span className="text-slate-400">
                                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </span>
                                    <span className={`text-sm font-medium ${textColor}`}>{day.date}</span>
                                    {day.total > 0 && (
                                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${percentageBadgeBg}`}>
                                            {percentage}%
                                        </span>
                                    )}
                                    {day.note && (
                                        <Quote size={14} className="text-indigo-400 ml-1" />
                                    )}
                                </div>
                                <div className="flex-1 px-2">
                                    {day.total > 0 ? (
                                        <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                                                style={{ width: `${percentage}%` }}
                                            ></div>
                                        </div>
                                    ) : (
                                        <div className="text-xs text-slate-400">회고 기록 있음</div>
                                    )}
                                </div>
                                {day.total > 0 && (
                                    <div className="w-8 h-8 ml-2 opacity-80">
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
                                                        <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                )}
                            </div>
                            
                            {/* Expanded List */}
                            {isExpanded && (
                                <div className="px-3 pb-3 pt-1 border-t border-slate-100 bg-slate-50/50 rounded-b-lg">
                                    <p className="text-xs text-slate-400 mb-2 mt-2 px-1">기록 수정 및 삭제가 가능합니다.</p>
                                    
                                    {/* Daily Note Display */}
                                    {day.note && (
                                        <div className="mb-4 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                                            <div className="flex items-start gap-2">
                                                <Quote size={16} className="text-indigo-400 shrink-0 mt-0.5" />
                                                <p className="text-sm text-slate-600 leading-relaxed font-medium">
                                                    {day.note}
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        {day.tasks.map(task => (
                                            <TaskItem 
                                                key={task.id} 
                                                task={task} 
                                                onToggle={onToggle}
                                                onDelete={handleDeleteClick} 
                                                onUpdateMemo={onUpdateMemo}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {stats.every(d => d.total === 0 && !d.note) && (
                    <div className="text-center py-10 text-slate-400 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                        기록된 활동이 없습니다.
                    </div>
                )}
            </div>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteTargetId && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
                    <div className="flex items-center gap-3 text-amber-500 mb-4">
                        <div className="bg-amber-100 p-2 rounded-full">
                            <AlertTriangle size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">기록 삭제</h3>
                    </div>
                    
                    <p className="text-slate-600 mb-6 leading-relaxed">
                        이 기록을 정말 삭제하시겠습니까?<br/>
                        <span className="text-sm text-slate-400">삭제된 데이터는 복구할 수 없습니다.</span>
                    </p>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={cancelDelete}
                            className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors"
                        >
                            취소
                        </button>
                        <button 
                            onClick={confirmDelete}
                            className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-200 transition-colors"
                        >
                            삭제
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default HistoryView;