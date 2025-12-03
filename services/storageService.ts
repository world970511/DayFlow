import { Task, AppSettings } from '../types';

const TASKS_KEY = 'dayflow_tasks';
const SETTINGS_KEY = 'dayflow_settings';

export const getTasks = (): Task[] => {
  try {
    const data = localStorage.getItem(TASKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    console.error("Failed to load tasks", e);
    return [];
  }
};

export const saveTasks = (tasks: Task[]) => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const getSettings = (): AppSettings => {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : {
      morningAlertTime: "09:00",
      eveningAlertTime: "20:00",
      userName: "User"
    };
  } catch (e) {
    return {
      morningAlertTime: "09:00",
      eveningAlertTime: "20:00",
      userName: "User"
    };
  }
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

// Cleanup tasks older than 30 days
export const cleanupOldData = () => {
  const tasks = getTasks();
  const today = new Date();
  const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));

  const filteredTasks = tasks.filter(task => {
    const taskDate = new Date(task.date);
    return taskDate >= thirtyDaysAgo;
  });

  if (filteredTasks.length !== tasks.length) {
    saveTasks(filteredTasks);
    console.log("Cleaned up old data");
  }
};