import React, { useState } from 'react';
import { Task } from '../types';
import { Check, ChevronDown, ChevronUp, Trash2, StickyNote } from 'lucide-react';

interface TaskItemProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onUpdateMemo: (id: string, memo: string) => void;
  readonly?: boolean;
}

const TaskItem: React.FC<TaskItemProps> = ({ task, onToggle, onDelete, onUpdateMemo, readonly = false }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`group bg-white rounded-xl shadow-sm border border-slate-100 mb-3 transition-all duration-200 ${task.completed ? 'opacity-80' : 'opacity-100'}`}>
      <div className="flex items-center p-4">
        {!readonly && (
          <button
            onClick={() => onToggle(task.id)}
            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors mr-3 ${
              task.completed
                ? 'bg-green-500 border-green-500 text-white'
                : 'border-slate-300 hover:border-green-400'
            }`}
          >
            {task.completed && <Check size={14} strokeWidth={3} />}
          </button>
        )}
        
        <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
          <p className={`text-base font-medium truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-700'}`}>
            {task.text}
          </p>
          {task.memo && !isExpanded && (
            <div className="flex items-center mt-1 text-xs text-slate-400">
               <StickyNote size={10} className="mr-1" />
               <span className="truncate max-w-[200px]">{task.memo}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-1 ml-2">
           {/* Explicit Memo Button */}
           <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className={`p-2 rounded-full transition-colors ${task.memo ? 'text-indigo-500 bg-indigo-50' : 'text-slate-300 hover:text-indigo-500 hover:bg-indigo-50'}`}
            title="메모 추가"
          >
            <StickyNote size={18} />
          </button>
          
          {!readonly && (
             <button 
             onClick={() => onDelete(task.id)}
             className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
           >
             <Trash2 size={16} />
           </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 pl-12 animate-in slide-in-from-top-2 duration-200">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                메모 / 노트
            </label>
            <textarea
                value={task.memo}
                onChange={(e) => onUpdateMemo(task.id, e.target.value)}
                placeholder="상세 내용, 생각, 회고 등을 적어보세요..."
                className="w-full text-sm text-slate-600 bg-slate-50 border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-blue-100 focus:border-blue-400 outline-none resize-none h-20"
                readOnly={readonly}
                autoFocus
            />
        </div>
      )}
    </div>
  );
};

export default TaskItem;