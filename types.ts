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
  TIMER = 'TIMER',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS'
}

export interface AppSettings {
  morningAlertTime: string; // HH:MM
  eveningAlertTime: string; // HH:MM
  notificationsEnabled: boolean; // 알림 활성화 여부

  // [변경] 기존 사운드 필드 유지하되 의미 명확화
  focusEndSound: string; // 뽀모도로 집중 종료 알림음 ('ding' | 'chime' | ... | 'custom:file://...')
  breakEndSound: string; // 뽀모도로 휴식 종료 알림음
  timerEndSound: string; // 일반 타이머 종료 알람음

  // [신규] 백색 소음 설정 추가
  whiteNoiseSound: string; // 타이머 진행 중 배경 백색 소음 ('ocean' | 'rain' | ... | 'custom:file://...')
  whiteNoiseEnabled: boolean; // 백색 소음 활성화 여부
  whiteNoiseVolume: number; // 백색 소음 볼륨 (0-100)
}

// [신규] 커스텀 사운드 정보를 저장하기 위한 인터페이스
export interface CustomSound {
  id: string; // 고유 ID
  name: string; // 사용자 지정 이름
  filePath: string; // 디바이스 파일 경로 (file:// 또는 content://)
  category: 'whitenoise' | 'notification' | 'alarm'; // 사운드 카테고리
  addedAt: number; // 추가된 시간 (timestamp)
}

// [신규] 사운드 카테고리 타입
export type SoundCategory = 'whitenoise' | 'notification' | 'alarm';

export interface DaySummary {
  date: string;
  total: number;
  completed: number;
  summaryText?: string;
}

export type DailyNoteMap = Record<string, string>; // Key: YYYY-MM-DD, Value: Note text