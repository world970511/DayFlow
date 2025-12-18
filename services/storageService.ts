import { Task, AppSettings, DailyNoteMap } from '../types';

const TASKS_KEY = 'dayflow_tasks';
const SETTINGS_KEY = 'dayflow_settings';
const NOTES_KEY = 'dayflow_notes';

// Utility to get local date string YYYY-MM-DD
export const getLocalDateStr = (d: Date = new Date()): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTasks = (): Task[] => {
  try {
    const data = localStorage.getItem(TASKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load tasks", e);
    return [];
  }
};

export const saveTasks = (tasks: Task[]): boolean => {
  try {
    localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
    return true;
  } catch (e) {
    if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        console.error("Storage full");
        return false;
    }
    return false;
  }
};

export const getDailyNotes = (): DailyNoteMap => {
  try {
    const data = localStorage.getItem(NOTES_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
};

export const saveDailyNotes = (notes: DailyNoteMap): boolean => {
  try {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
    return true;
  } catch (e) {
     if (e instanceof DOMException && (e.name === 'QuotaExceededError' || e.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
        return false;
    }
    return false;
  }
};

export const deleteOldestMonthRecords = (tasks: Task[], notes: DailyNoteMap): { updatedTasks: Task[], updatedNotes: DailyNoteMap, deletedMonth: string | null } => {
    if (tasks.length === 0 && Object.keys(notes).length === 0) return { updatedTasks: [], updatedNotes: {}, deletedMonth: null };
    
    // Find min date from tasks
    let minDate = tasks.length > 0 ? tasks[0].date : '';
    for(const t of tasks) {
        if(!minDate || t.date < minDate) minDate = t.date;
    }

    // Check notes for older dates
    for(const date of Object.keys(notes)) {
        if(!minDate || date < minDate) minDate = date;
    }

    if (!minDate) return { updatedTasks: [], updatedNotes: {}, deletedMonth: null };

    // Extract YYYY-MM
    const targetMonth = minDate.substring(0, 7);
    
    const updatedTasks = tasks.filter(t => !t.date.startsWith(targetMonth));
    
    const updatedNotes = { ...notes };
    for(const date of Object.keys(updatedNotes)) {
        if(date.startsWith(targetMonth)) {
            delete updatedNotes[date];
        }
    }

    return { updatedTasks, updatedNotes, deletedMonth: targetMonth };
};

// [변경] 기본 설정에 사운드 관련 필드 추가
export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      // [신규] 기존 설정에 새로운 필드가 없으면 기본값으로 채움 (마이그레이션)
      return {
        morningAlertTime: parsed.morningAlertTime || "09:00",
        eveningAlertTime: parsed.eveningAlertTime || "20:00",
        notificationsEnabled: parsed.notificationsEnabled !== undefined ? parsed.notificationsEnabled : true,
        // [신규] 시간 기반 알림 방식
        useOverlay: parsed.useOverlay !== undefined ? parsed.useOverlay : true,
        pushNotificationSound: parsed.pushNotificationSound || 'alarm1',
        // 기존 사운드 설정 (알림/알람)
        focusEndSound: parsed.focusEndSound || 'ding',
        breakEndSound: parsed.breakEndSound || 'chime',
        timerEndSound: parsed.timerEndSound || 'alarm1',
        // [신규] 백색 소음 설정
        whiteNoiseSound: parsed.whiteNoiseSound || 'ocean',
        whiteNoiseEnabled: parsed.whiteNoiseEnabled !== undefined ? parsed.whiteNoiseEnabled : false,
        whiteNoiseVolume: parsed.whiteNoiseVolume !== undefined ? parsed.whiteNoiseVolume : 30,
      };
    }
    // 데이터가 없으면 기본값 반환
    return getDefaultSettings();
  } catch (e) {
    return getDefaultSettings();
  }
};

// [신규] 기본 설정값을 반환하는 헬퍼 함수
const getDefaultSettings = (): AppSettings => ({
  morningAlertTime: "09:00",
  eveningAlertTime: "20:00",
  notificationsEnabled: true,
  // [신규] 시간 기반 알림 방식 기본값
  useOverlay: true, // 기본값: 오버레이 모드
  pushNotificationSound: 'alarm1',
  // 기존 사운드 기본값
  focusEndSound: 'ding',
  breakEndSound: 'chime',
  timerEndSound: 'alarm1',
  // [신규] 백색 소음 기본값
  whiteNoiseSound: 'ocean',
  whiteNoiseEnabled: false,
  whiteNoiseVolume: 30,
});

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};