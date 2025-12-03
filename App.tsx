import React, { useState, useEffect } from 'react';
import { Plus, Home, Calendar as CalendarIcon, Clock, Settings, Bell, Zap, CheckCircle2, AlertTriangle, Trash2, PenLine } from 'lucide-react';
import TaskItem from './components/TaskItem';
import HistoryView from './components/HistoryView';
import { Task, AppView, AppSettings, DailyNoteMap } from './types';
import * as storage from './services/storageService';
import * as gemini from './services/geminiService';

const App: React.FC = () => {
  // State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dailyNotes, setDailyNotes] = useState<DailyNoteMap>({});
  const [currentView, setCurrentView] = useState<AppView>(AppView.TODAY);
  const [newTaskText, setNewTaskText] = useState('');
  const [settings, setSettings] = useState<AppSettings>(storage.getSettings());
  const [showStorageWarning, setShowStorageWarning] = useState(false);
  
  // Storage Full Modal State
  const [showStorageFullModal, setShowStorageFullModal] = useState(false);

  // Future Planning State
  const [selectedDate, setSelectedDate] = useState<string>(storage.getLocalDateStr());
  
  // Modals / Overlays
  const [showMorningBrief, setShowMorningBrief] = useState(false);
  const [showEveningReview, setShowEveningReview] = useState(false);
  const [morningMessage, setMorningMessage] = useState('');
  const [reviewMessage, setReviewMessage] = useState('');
  
  // Morning specific input
  const [morningInputText, setMorningInputText] = useState('');

  // Evening specific input (Daily Reflection)
  const [eveningNoteText, setEveningNoteText] = useState('');

  // Initialize
  useEffect(() => {
    const loadedTasks = storage.getTasks();
    const loadedNotes = storage.getDailyNotes();
    setTasks(loadedTasks);
    setDailyNotes(loadedNotes);
    
    checkRoutine(loadedTasks);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save on change with storage full handling
  useEffect(() => {
    const success = storage.saveTasks(tasks);
    if (!success) {
        setShowStorageWarning(true);
        setShowStorageFullModal(true); // Trigger the prompt
    } else {
        setShowStorageWarning(false);
        setShowStorageFullModal(false);
    }
  }, [tasks]);

  // Save notes on change
  useEffect(() => {
    const success = storage.saveDailyNotes(dailyNotes);
    if (!success) {
        setShowStorageWarning(true);
        setShowStorageFullModal(true);
    }
  }, [dailyNotes]);

  const handleStorageCleanup = () => {
      const { updatedTasks, updatedNotes, deletedMonth } = storage.deleteOldestMonthRecords(tasks, dailyNotes);
      if (deletedMonth) {
          setTasks(updatedTasks);
          setDailyNotes(updatedNotes);
          // Alert is optional, but confirms action
          // alert(`${deletedMonth} 기록이 삭제되었습니다.`);
          setShowStorageFullModal(false);
      } else {
          // Should rarely happen if storage is full but empty tasks
          alert("삭제할 과거 기록이 없습니다.");
          setShowStorageFullModal(false);
      }
  };

  const checkRoutine = async (currentTasks: Task[]) => {
    const today = storage.getLocalDateStr();
    
    // Check for Morning Logic:
    // If there are unconfirmed future plans for today
    const unconfirmedPlans = currentTasks.filter(t => 
      t.date === today && t.isFuturePlan && !t.isConfirmed
    );

    if (unconfirmedPlans.length > 0) {
      const msg = await gemini.generateMorningBriefing(unconfirmedPlans);
      setMorningMessage(msg);
      setShowMorningBrief(true);
    }
  };

  // --- CRUD Operations ---

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  };

  const addTask = (date: string, isFuture: boolean, text: string = newTaskText) => {
    if (!text.trim()) return;
    
    const newTask: Task = {
      id: generateId(),
      text: text,
      completed: false,
      memo: '',
      date: date,
      isFuturePlan: isFuture,
      isConfirmed: !isFuture // If adding directly to today, it's confirmed
    };

    setTasks(prev => [newTask, ...prev]);
    if (text === newTaskText) setNewTaskText('');
    if (text === morningInputText) setMorningInputText('');
  };

  const toggleTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  const deleteTask = (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const updateMemo = (id: string, memo: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, memo } : t));
  };

  const confirmMorningPlan = () => {
    const today = storage.getLocalDateStr();
    setTasks(prev => prev.map(t => 
      (t.date === today && t.isFuturePlan) ? { ...t, isConfirmed: true } : t
    ));
    setShowMorningBrief(false);
  };

  const finishEveningReview = () => {
      const today = storage.getLocalDateStr();
      if (eveningNoteText.trim()) {
          setDailyNotes(prev => ({
              ...prev,
              [today]: eveningNoteText.trim()
          }));
      }
      setShowEveningReview(false);
  };

  // Handle Enter key for Korean IME
  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
        e.preventDefault();
        action();
    }
  };

  // --- Simulations ---

  const triggerMorningRoutine = async () => {
    const today = storage.getLocalDateStr();
    const todaysTasks = tasks.filter(t => t.date === today);
    
    const msg = await gemini.generateMorningBriefing(todaysTasks);
    setMorningMessage(msg);
    setShowMorningBrief(true);
  };

  const triggerEveningRoutine = async () => {
    const today = storage.getLocalDateStr();
    const todaysTasks = tasks.filter(t => t.date === today);
    
    // Set existing note if any
    setEveningNoteText(dailyNotes[today] || '');

    const msg = await gemini.generateDailyReview(todaysTasks);
    setReviewMessage(msg);
    setShowEveningReview(true);
  };

  // --- Views ---

  const renderToday = () => {
    const today = storage.getLocalDateStr();
    // Filter tasks for today that are confirmed OR manually added (isConfirmed is true for manual adds)
    const todaysTasks = tasks.filter(t => t.date === today && t.isConfirmed);
    const completedCount = todaysTasks.filter(t => t.completed).length;
    const progress = todaysTasks.length > 0 ? (completedCount / todaysTasks.length) * 100 : 0;

    return (
      <div className="space-y-6 pb-24">
        {/* Storage Warning Banner (Visible if user cancels modal) */}
        {showStorageWarning && !showStorageFullModal && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                <AlertTriangle size={18} />
                <div className="text-sm">
                    <p className="font-bold">저장 공간 부족</p>
                    <p>저장에 실패했습니다. 공간을 확보해주세요.</p>
                </div>
                <button 
                  onClick={() => setShowStorageFullModal(true)}
                  className="ml-auto text-xs bg-red-100 hover:bg-red-200 px-2 py-1 rounded"
                >
                  해결하기
                </button>
            </div>
        )}

        {/* Header / Progress */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
           <div className="flex justify-between items-center mb-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-800">오늘의 할 일</h1>
                <p className="text-slate-500">
                  {todaysTasks.length}개 중 {completedCount}개 완료
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center text-blue-500 font-bold text-sm border-2 border-blue-100">
                {Math.round(progress)}%
              </div>
           </div>
           
           <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
             <div className="h-full bg-blue-500 transition-all duration-700 ease-out" style={{ width: `${progress}%` }}></div>
           </div>
        </div>

        {/* Input */}
        <div className="flex gap-2">
           <input 
             type="text" 
             value={newTaskText}
             onChange={(e) => setNewTaskText(e.target.value)}
             onKeyDown={(e) => handleKeyDown(e, () => addTask(today, false))}
             placeholder="오늘 해야 할 일을 적어주세요..."
             className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm"
           />
           <button 
            onClick={() => addTask(today, false)}
            className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-colors shadow-md active:scale-95"
           >
             <Plus />
           </button>
        </div>

        {/* List */}
        <div className="space-y-1 min-h-[200px]">
          {todaysTasks.length === 0 && (
            <div className="text-center py-10 text-slate-400">
              <p>할 일이 없습니다.</p>
              <p className="text-xs mt-2">새로운 할 일을 추가해보세요!</p>
            </div>
          )}
          {todaysTasks.map(task => (
            <TaskItem 
              key={task.id} 
              task={task} 
              onToggle={toggleTask} 
              onDelete={deleteTask}
              onUpdateMemo={updateMemo}
            />
          ))}
        </div>
      </div>
    );
  };

  const renderFuture = () => {
    // Simple future date selector
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const minDate = storage.getLocalDateStr(tomorrow);

    // Ensure selectedDate is at least today if not set, though state init handles this.
    const tasksForSelectedDate = tasks.filter(t => t.date === selectedDate);

    return (
      <div className="space-y-6 pb-24">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center">
            <CalendarIcon className="mr-2 text-indigo-500" size={20} />
            미래 계획
          </h2>
          <p className="text-sm text-slate-500 mb-4">미리 일정을 예약하세요. 당일 아침에 확인 알림을 드립니다.</p>
          
          <label className="block text-sm font-medium text-slate-700 mb-1">날짜 선택</label>
          <input 
            type="date" 
            min={minDate}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-4 py-2 border border-slate-200 rounded-lg mb-4"
          />

          <div className="flex gap-2 mb-6">
             <input 
               type="text" 
               value={newTaskText}
               onChange={(e) => setNewTaskText(e.target.value)}
               onKeyDown={(e) => handleKeyDown(e, () => addTask(selectedDate, true))}
               placeholder={`${selectedDate}에 할 일...`}
               className="flex-1 px-4 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
             />
             <button 
              onClick={() => addTask(selectedDate, true)}
              className="bg-indigo-600 text-white p-2 px-4 rounded-lg hover:bg-indigo-700"
             >
               추가
             </button>
          </div>

          <h3 className="font-semibold text-slate-700 mb-2">{selectedDate} 예약된 일정:</h3>
          <div className="space-y-2">
            {tasksForSelectedDate.length === 0 && <p className="text-sm text-slate-400 italic">예약된 일정이 없습니다.</p>}
            {tasksForSelectedDate.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100">
                 <span className="text-slate-700">{task.text}</span>
                 <button onClick={() => deleteTask(task.id)} className="text-slate-400 hover:text-red-500"><Plus className="rotate-45" /></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const renderSettings = () => {
    return (
      <div className="space-y-6 pb-24">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <Settings className="mr-2 text-slate-500" size={20} />
            설정
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">아침 알림 시간</label>
                <input 
                  type="time" 
                  value={settings.morningAlertTime}
                  onChange={(e) => {
                     const newSettings = { ...settings, morningAlertTime: e.target.value };
                     setSettings(newSettings);
                     storage.saveSettings(newSettings);
                  }}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">저녁 알림 시간</label>
                <input 
                  type="time" 
                  value={settings.eveningAlertTime}
                  onChange={(e) => {
                     const newSettings = { ...settings, eveningAlertTime: e.target.value };
                     setSettings(newSettings);
                     storage.saveSettings(newSettings);
                  }}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <h3 className="font-semibold text-slate-900 mb-2">알림 테스트 (데모)</h3>
              <p className="text-xs text-slate-500 mb-3">알림 기능을 수동으로 실행해볼 수 있습니다.</p>
              <div className="flex gap-2">
                <button 
                  onClick={() => { setCurrentView(AppView.TODAY); triggerMorningRoutine(); }}
                  className="flex-1 bg-amber-100 text-amber-700 px-4 py-2 rounded-lg font-medium hover:bg-amber-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Bell size={16} /> 아침
                </button>
                <button 
                  onClick={() => { setCurrentView(AppView.TODAY); triggerEveningRoutine(); }}
                  className="flex-1 bg-indigo-100 text-indigo-700 px-4 py-2 rounded-lg font-medium hover:bg-indigo-200 transition-colors flex items-center justify-center gap-2"
                >
                  <Bell size={16} /> 저녁
                </button>
              </div>
            </div>
            
            <div className="pt-6 border-t border-slate-100">
                <h3 className="font-semibold text-slate-900 mb-2">데이터 관리</h3>
                <p className="text-xs text-slate-500">
                    데이터는 브라우저 내부에 저장되며, 저장 공간이 가득 찰 경우 알림이 표시됩니다.
                </p>
                {showStorageWarning && (
                     <div className="mt-2 text-xs text-red-500 font-bold flex items-center gap-1">
                         <AlertTriangle size={12} />
                         현재 저장 공간이 부족합니다.
                         <button 
                           onClick={() => setShowStorageFullModal(true)}
                           className="underline ml-1"
                         >
                           공간 확보하기
                         </button>
                     </div>
                )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col max-w-md mx-auto bg-slate-50 shadow-2xl relative overflow-hidden">
      
      {/* Top Bar */}
      <div className="px-6 pt-8 pb-2 flex justify-between items-center bg-white border-b border-slate-100 z-10">
        <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">DayFlow</span>
        <div className="text-sm font-medium text-slate-500">
           {new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto px-4 py-6 scrollbar-hide">
        {currentView === AppView.TODAY && renderToday()}
        {currentView === AppView.FUTURE && renderFuture()}
        {currentView === AppView.HISTORY && (
            <HistoryView 
                tasks={tasks} 
                dailyNotes={dailyNotes}
                onDelete={deleteTask}
                onToggle={toggleTask}
                onUpdateMemo={updateMemo}
            />
        )}
        {currentView === AppView.SETTINGS && renderSettings()}
      </div>

      {/* Bottom Navigation */}
      <div className="bg-white border-t border-slate-100 px-6 py-4 flex justify-between items-center z-20">
        <button 
          onClick={() => setCurrentView(AppView.TODAY)}
          className={`flex flex-col items-center gap-1 ${currentView === AppView.TODAY ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Home size={24} strokeWidth={currentView === AppView.TODAY ? 2.5 : 2} />
          <span className="text-[10px] font-medium">오늘</span>
        </button>
        <button 
          onClick={() => setCurrentView(AppView.FUTURE)}
          className={`flex flex-col items-center gap-1 ${currentView === AppView.FUTURE ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <CalendarIcon size={24} strokeWidth={currentView === AppView.FUTURE ? 2.5 : 2} />
          <span className="text-[10px] font-medium">계획</span>
        </button>
        <button 
          onClick={() => setCurrentView(AppView.HISTORY)}
          className={`flex flex-col items-center gap-1 ${currentView === AppView.HISTORY ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Clock size={24} strokeWidth={currentView === AppView.HISTORY ? 2.5 : 2} />
          <span className="text-[10px] font-medium">기록</span>
        </button>
        <button 
          onClick={() => setCurrentView(AppView.SETTINGS)}
          className={`flex flex-col items-center gap-1 ${currentView === AppView.SETTINGS ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <Settings size={24} strokeWidth={currentView === AppView.SETTINGS ? 2.5 : 2} />
          <span className="text-[10px] font-medium">설정</span>
        </button>
      </div>

      {/* --- MODALS --- */}

      {/* Storage Full Warning Modal */}
      {showStorageFullModal && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-[70] flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4 text-red-500">
                <AlertTriangle size={24} />
                <h3 className="text-xl font-bold text-slate-900">저장 공간 부족</h3>
              </div>
              
              <p className="text-slate-600 mb-6 leading-relaxed">
                  저장 공간이 가득 차서 새로운 내용을 저장할 수 없습니다.<br/>
                  <span className="font-semibold text-slate-800">가장 오래된 월의 기록을 삭제</span>하여 공간을 확보하시겠습니까?
              </p>

              <div className="flex gap-3">
                  <button 
                    onClick={() => setShowStorageFullModal(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
                  >
                    나중에
                  </button>
                  <button 
                    onClick={handleStorageCleanup}
                    className="flex-1 bg-red-500 hover:bg-red-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-red-200 flex items-center justify-center gap-2"
                  >
                    <Trash2 size={18} />
                    삭제하기
                  </button>
              </div>
           </div>
        </div>
      )}

      {/* Morning Briefing Modal */}
      {showMorningBrief && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4 text-amber-500">
                <Zap className="fill-current" />
                <h3 className="text-xl font-bold text-slate-900">아침 브리핑</h3>
              </div>
              
              <div className="min-h-[100px] mb-4">
                  <>
                    <p className="text-slate-600 italic mb-4">"{morningMessage}"</p>
                    
                    {/* Task Verification List */}
                    <div className="bg-slate-50 rounded-xl p-3 mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">예약된 일정</p>
                            <span className="text-xs text-slate-400">이 일정이 맞나요?</span>
                        </div>
                        <ul className="space-y-2 max-h-32 overflow-y-auto">
                            {tasks.filter(t => t.date === storage.getLocalDateStr()).map(t => (
                                <li key={t.id} className="flex items-center justify-between text-sm text-slate-700 bg-white p-2 rounded border border-slate-100 shadow-sm">
                                    <span className="flex items-center gap-2">
                                       <div className={`w-1.5 h-1.5 rounded-full ${t.isConfirmed ? 'bg-green-400' : 'bg-amber-400'}`}></div>
                                       {t.text}
                                    </span>
                                    <button 
                                        onClick={() => deleteTask(t.id)}
                                        className="text-slate-300 hover:text-red-500"
                                    >
                                        <Plus className="rotate-45" size={14} />
                                    </button>
                                </li>
                            ))}
                            {tasks.filter(t => t.date === storage.getLocalDateStr()).length === 0 && (
                                <li className="text-slate-400 text-sm italic text-center py-2">예약된 일정이 없습니다.</li>
                            )}
                        </ul>
                    </div>

                    {/* Quick Add Input */}
                    <div className="flex gap-2 mb-2">
                        <input 
                            type="text" 
                            value={morningInputText}
                            onChange={(e) => setMorningInputText(e.target.value)}
                            onKeyDown={(e) => handleKeyDown(e, () => addTask(storage.getLocalDateStr(), false, morningInputText))}
                            placeholder="오늘 할 일 추가..."
                            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                        <button 
                            onClick={() => addTask(storage.getLocalDateStr(), false, morningInputText)}
                            className="bg-slate-200 hover:bg-slate-300 text-slate-600 p-2 rounded-lg transition-colors"
                        >
                            <Plus size={18} />
                        </button>
                    </div>
                  </>
              </div>

              <button 
                onClick={confirmMorningPlan}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-amber-200"
              >
                확인 및 하루 시작
              </button>
           </div>
        </div>
      )}

      {/* Evening Review Modal */}
      {showEveningReview && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-6 animate-in fade-in duration-200">
           <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl p-6">
              <div className="flex items-center gap-3 mb-4 text-indigo-500">
                <CheckCircle2 className="fill-current text-white bg-indigo-500 rounded-full" />
                <h3 className="text-xl font-bold text-slate-900">하루 마무리</h3>
              </div>
              
              <div className="min-h-[100px] mb-6">
                  <div className="prose prose-sm text-slate-600">
                    <p className="italic text-lg text-slate-800 mb-6 font-medium">"{reviewMessage}"</p>
                    
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                        <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">진행률</span>
                            <span className="text-lg font-bold text-indigo-600">
                                {tasks.filter(t => t.date === storage.getLocalDateStr() && t.completed).length} 
                                <span className="text-slate-400 text-sm font-normal mx-1">/</span> 
                                {tasks.filter(t => t.date === storage.getLocalDateStr()).length}
                            </span>
                        </div>
                        <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{width: `${
                                tasks.filter(t => t.date === storage.getLocalDateStr()).length > 0 
                                ? (tasks.filter(t => t.date === storage.getLocalDateStr() && t.completed).length / tasks.filter(t => t.date === storage.getLocalDateStr()).length * 100) 
                                : 0
                            }%`}}></div>
                        </div>
                    </div>

                    {/* Daily Reflection Input */}
                    <div className="mb-2">
                        <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                            <PenLine size={16} />
                            오늘 하루는 어떠셨나요?
                        </label>
                        <textarea 
                            value={eveningNoteText}
                            onChange={(e) => {
                                if (e.target.value.length <= 140) {
                                    setEveningNoteText(e.target.value);
                                }
                            }}
                            placeholder="오늘 하루를 140자 이내로 정리해보세요..."
                            className="w-full h-24 p-3 text-sm text-slate-700 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                        <div className="text-right mt-1">
                            <span className={`text-xs ${eveningNoteText.length === 140 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                {eveningNoteText.length} / 140
                            </span>
                        </div>
                    </div>
                  </div>
              </div>

              <button 
                onClick={finishEveningReview}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-colors shadow-lg shadow-indigo-200"
              >
                종료 및 휴식
              </button>
           </div>
        </div>
      )}

    </div>
  );
};

export default App;