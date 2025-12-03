export interface Task {
  id: string;
  text: string;
  completed: boolean;
  memo: string;
  date: string; // YYYY-MM-DD
  isFuturePlan: boolean; // True if created via future planning
  isConfirmed: boolean; // True if confirmed during morning routine
}

export enum AppView {
  TODAY = 'TODAY',
  FUTURE = 'FUTURE',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS'
}

export interface AppSettings {
  morningAlertTime: string; // HH:MM
  eveningAlertTime: string; // HH:MM
  userName: string;
}

export interface DaySummary {
  date: string;
  total: number;
  completed: number;
  summaryText?: string;
}