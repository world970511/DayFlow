
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Play, Pause, RotateCcw, Coffee, Brain, Timer as TimerIcon, Zap, CheckCircle2 } from 'lucide-react';
import { AppSettings } from '../types';
// [변경] SoundType import 제거 (더 이상 필요 없음, string으로 처리)
import { soundService } from '../services/soundService.ts';

// Define missing types for Timer modes and Pomodoro states
type TimerMode = 'POMODORO' | 'NORMAL';
type PomodoroState = 'FOCUS' | 'SHORT_BREAK' | 'LONG_BREAK';

interface TimerViewProps {
  settings: AppSettings;
}

const TimerView: React.FC<TimerViewProps> = ({ settings }) => {
  const [mode, setMode] = useState<TimerMode>('POMODORO');
  const [pomodoroState, setPomodoroState] = useState<PomodoroState>('FOCUS');
  
  // Pomodoro sessions tracking
  const [focusCount, setFocusCount] = useState(0);
  
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  
  // For Normal Mode - total seconds
  const [normalDuration, setNormalDuration] = useState(10 * 60);

  const timerRef = useRef<number | null>(null);

  const config = {
    POMODORO: {
      FOCUS: 25 * 60,
      SHORT_BREAK: 5 * 60,
      LONG_BREAK: 15 * 60
    }
  };

  // Predefined durations for quick selection in Normal Mode
  const PRESETS = [
    { label: '5분', value: 5 * 60 },
    { label: '10분', value: 10 * 60 },
    { label: '30분', value: 30 * 60 },
    { label: '1시간', value: 60 * 60 },
    { label: '2시간', value: 120 * 60 },
  ];

  // Sync timeLeft when switching modes or choosing normal duration
  useEffect(() => {
    if (!isRunning) {
      if (mode === 'POMODORO') {
        setTimeLeft(config.POMODORO[pomodoroState]);
      } else {
        setTimeLeft(normalDuration);
      }
    }
  }, [mode, pomodoroState, normalDuration]);

  // [신규] 백색 소음 재생/정지 (타이머 실행 상태에 따라)
  useEffect(() => {
    if (isRunning && settings.whiteNoiseEnabled) {
      // 타이머 시작 시 백색 소음 재생
      soundService.playWhiteNoise(settings.whiteNoiseSound, settings.whiteNoiseVolume);
    } else {
      // 타이머 정지 시 백색 소음 중지
      soundService.stopWhiteNoise();
    }

    // 컴포넌트 언마운트 시 백색 소음 정지
    return () => {
      soundService.stopWhiteNoise();
    };
  }, [isRunning, settings.whiteNoiseEnabled, settings.whiteNoiseSound, settings.whiteNoiseVolume]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      handleTimerComplete();
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isRunning, timeLeft]);

  const handleTimerComplete = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // [신규] 백색 소음 정지
    soundService.stopWhiteNoise();

    if (mode === 'POMODORO') {
      let nextState: PomodoroState = 'FOCUS';
      let msg = "";
      // [변경] SoundType 제거하고 string으로 처리 (커스텀 사운드 지원)
      let soundToPlay: string | null = null;

      if (pomodoroState === 'FOCUS') {
        soundToPlay = settings.focusEndSound;
        const newCount = focusCount + 1;
        setFocusCount(newCount);
        if (newCount % 4 === 0) {
          nextState = 'LONG_BREAK';
          msg = "4번째 집중 완료! 긴 휴식을 취하세요.";
        } else {
          nextState = 'SHORT_BREAK';
          msg = "집중 완료! 잠깐 쉬어가세요.";
        }
      } else {
        soundToPlay = settings.breakEndSound;
        nextState = 'FOCUS';
        msg = "휴식 끝! 다시 집중해볼까요?";
      }

      // [변경] settings.soundEnabled 제거 (항상 재생, 사용자가 설정에서 선택한 사운드 사용)
      if (soundToPlay) {
        soundService.play(soundToPlay);
      }

      setPomodoroState(nextState);
      setTimeLeft(config.POMODORO[nextState]);
      setIsRunning(false);
      alert(msg);
    } else {
      // [변경] 일반 타이머 종료 시 알람음 재생
      soundService.play(settings.timerEndSound);
      setIsRunning(false);
      alert('타이머가 종료되었습니다!');
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);
  
  const resetTimer = () => {
    setIsRunning(false);
    if (mode === 'POMODORO') {
      setTimeLeft(config.POMODORO[pomodoroState]);
    } else {
      setTimeLeft(normalDuration);
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ':' : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const progress = useMemo(() => {
    const total = mode === 'POMODORO' ? config.POMODORO[pomodoroState] : normalDuration;
    if (total === 0) return 0;
    return ((total - timeLeft) / total) * 100;
  }, [timeLeft, mode, pomodoroState, normalDuration]);

  const getThemeColor = () => {
    if (mode === 'NORMAL') return 'text-slate-800';
    if (pomodoroState === 'FOCUS') return 'text-indigo-600';
    return 'text-green-600';
  };

  const getRingColor = () => {
    if (mode === 'NORMAL') return 'stroke-slate-900';
    if (pomodoroState === 'FOCUS') return 'stroke-indigo-500';
    return 'stroke-green-500';
  };

  // SVG Constants
  const size = 250;
  const center = size / 2;
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2 - 5; 
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Mode Toggle */}
      <div className="bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
        <button 
          onClick={() => setMode('POMODORO')} 
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-semibold ${mode === 'POMODORO' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <Brain size={18} />
          뽀모도로
        </button>
        <button 
          onClick={() => setMode('NORMAL')} 
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl transition-all font-semibold ${mode === 'NORMAL' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}
        >
          <TimerIcon size={18} />
          일반 타이머
        </button>
      </div>

      <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center relative overflow-hidden">
        {/* Session Indicators for Pomodoro / Duration Presets for Normal */}
        {mode === 'POMODORO' ? (
          <div className="flex flex-col items-center mb-6">
            <div className="flex gap-2 mb-3 bg-slate-50 p-1.5 rounded-2xl">
              {(['FOCUS', 'SHORT_BREAK', 'LONG_BREAK'] as PomodoroState[]).map(s => (
                <button 
                  key={s} 
                  onClick={() => { if(!isRunning) { setPomodoroState(s); } }} 
                  disabled={isRunning}
                  className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${pomodoroState === s ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 disabled:opacity-50'}`}
                >
                  {s === 'FOCUS' ? '집중' : s === 'SHORT_BREAK' ? '짧은 휴식' : '긴 휴식'}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4].map((step) => (
                <div 
                  key={step}
                  className={`w-2 h-2 rounded-full transition-all duration-500 ${focusCount >= step ? 'bg-indigo-500' : 'bg-slate-200'}`}
                />
              ))}
              <span className="ml-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Session { (focusCount % 4) + (pomodoroState === 'FOCUS' ? 0 : 0) } / 4
              </span>
            </div>
          </div>
        ) : (
          <div className="w-full flex flex-col items-center mb-6">
            <div className="flex flex-wrap justify-center gap-2 mb-4">
              {PRESETS.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => { if(!isRunning) setNormalDuration(preset.value); }}
                  disabled={isRunning}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all border ${normalDuration === preset.value ? 'bg-slate-900 border-slate-900 text-white shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30'}`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            {!isRunning && (
              <div className="w-full px-4 flex items-center gap-3">
                <span className="text-[10px] font-black text-slate-300 uppercase">0m</span>
                <input 
                  type="range"
                  min="60"
                  max="14400"
                  step="60"
                  value={normalDuration}
                  onChange={(e) => setNormalDuration(parseInt(e.target.value))}
                  className="flex-1 h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-slate-800"
                />
                <span className="text-[10px] font-black text-slate-300 uppercase">4h</span>
              </div>
            )}
          </div>
        )}

        {/* Timer Circle */}
        <div className="relative flex items-center justify-center mb-8" style={{ width: size, height: size }}>
          <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full -rotate-90">
            <circle 
              cx={center} 
              cy={center} 
              r={radius} 
              stroke="currentColor" 
              strokeWidth={strokeWidth} 
              fill="transparent" 
              className="text-slate-50" 
            />
            <circle 
              cx={center} 
              cy={center} 
              r={radius} 
              stroke="currentColor" 
              strokeWidth={strokeWidth} 
              fill="transparent" 
              strokeDasharray={circumference} 
              strokeDashoffset={circumference * (1 - progress / 100)} 
              strokeLinecap="round" 
              className={`transition-all duration-1000 ${getRingColor()}`} 
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-5xl font-black tracking-tighter tabular-nums ${getThemeColor()}`}>
              {formatTime(timeLeft)}
            </span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
              {mode === 'POMODORO' ? (pomodoroState === 'FOCUS' ? 'Focusing' : 'Resting') : 'Remaining'}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          <button 
            onClick={resetTimer} 
            className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors active:scale-90"
          >
            <RotateCcw size={20}/>
          </button>
          
          <button 
            onClick={toggleTimer} 
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95 ${isRunning ? 'bg-red-500 shadow-red-100' : (mode === 'POMODORO' ? 'bg-indigo-600 shadow-indigo-100' : 'bg-slate-900 shadow-slate-100')}`}
          >
            {isRunning ? <Pause size={28} fill="currentColor"/> : <Play size={28} fill="currentColor" className="ml-1"/>}
          </button>
          
          <button 
            onClick={() => { 
               if(mode === 'POMODORO') {
                  setFocusCount(0); 
                  setPomodoroState('FOCUS'); 
               } else {
                  setNormalDuration(10 * 60);
               }
               setIsRunning(false); 
            }}
            className="w-12 h-12 rounded-full border border-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-50 transition-colors active:scale-90"
            title="초기화"
          >
            {mode === 'POMODORO' ? <CheckCircle2 size={20} className={focusCount > 0 ? 'text-green-500' : ''}/> : <Zap size={20} />}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className={`p-5 rounded-2xl border bg-white border-slate-100 shadow-sm transition-all`}>
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl bg-slate-50 ${getThemeColor()}`}>
             {mode === 'POMODORO' ? (pomodoroState === 'FOCUS' ? <Brain size={20}/> : <Coffee size={20}/>) : <TimerIcon size={20}/>}
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-sm text-slate-800">
              {mode === 'POMODORO' ? (pomodoroState === 'FOCUS' ? '몰입 시간' : '재충전 시간') : '타이머 설정'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              {mode === 'POMODORO' 
                ? (pomodoroState === 'FOCUS' 
                    ? '현재 작업에만 집중하세요. 세션이 끝나면 자동으로 휴식 시간이 준비됩니다.' 
                    : '긴장을 풀고 잠시 쉬어주세요. 4회 집중 후에는 긴 휴식이 제공됩니다.')
                : isRunning 
                  ? '설정된 시간 동안 목표에 집중해보세요.'
                  : '슬라이더나 퀵 버튼을 사용하여 원하는 시간을 빠르고 정확하게 설정하세요.'
              }
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TimerView;
