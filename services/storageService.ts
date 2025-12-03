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

export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : {
      morningAlertTime: "09:00",
      eveningAlertTime: "20:00" ,
      notificationsEnabled: true
    };
  } catch (e) {
    return {
      morningAlertTime: "09:00",
      eveningAlertTime: "20:00",
      notificationsEnabled: true
    };
  }
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};