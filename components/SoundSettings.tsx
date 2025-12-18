/**
 * 사운드 설정 컴포넌트
 *
 * [신규 컴포넌트]
 * 사용자가 타이머 사운드를 설정할 수 있는 UI 제공
 *
 * 기능:
 * 1. 3가지 카테고리 탭 (백색 소음 / 알림음 / 알람음)
 * 2. 카테고리별 내장 사운드 5개 + 커스텀 사운드 목록
 * 3. 미리듣기 기능
 * 4. 디바이스 음악 파일 추가 기능 (APK 전용)
 * 5. 커스텀 사운드 삭제 기능
 * 6. 백색 소음 볼륨 조절
 */

import React, { useState } from 'react';
import { Volume2, Plus, Trash2, Play, Music } from 'lucide-react';
import { AppSettings, SoundCategory } from '../types';
import { soundService } from '../services/soundService';

interface SoundSettingsProps {
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
}

const SoundSettings: React.FC<SoundSettingsProps> = ({ settings, onUpdateSettings }) => {
  // [상태] 현재 선택된 카테고리 탭
  const [activeCategory, setActiveCategory] = useState<SoundCategory>('whitenoise');

  // [상태] 미리듣기 중인 사운드 ID
  const [previewingSound, setPreviewingSound] = useState<string | null>(null);

  // 카테고리별 현재 선택된 사운드 가져오기
  const getSelectedSound = (category: SoundCategory): string => {
    switch (category) {
      case 'whitenoise':
        return settings.whiteNoiseSound;
      case 'notification':
        return settings.focusEndSound; // 뽀모도로 집중 종료 알림음 대표로 사용
      case 'alarm':
        return settings.timerEndSound;
    }
  };

  // 사운드 선택 핸들러
  const handleSelectSound = (category: SoundCategory, soundId: string) => {
    const newSettings = { ...settings };

    switch (category) {
      case 'whitenoise':
        newSettings.whiteNoiseSound = soundId;
        break;
      case 'notification':
        // 알림음은 집중/휴식 모두 같은 사운드로 설정
        newSettings.focusEndSound = soundId;
        newSettings.breakEndSound = soundId;
        break;
      case 'alarm':
        newSettings.timerEndSound = soundId;
        break;
    }

    onUpdateSettings(newSettings);
  };

  // 미리듣기 핸들러
  const handlePreview = async (soundId: string, category: SoundCategory) => {
    setPreviewingSound(soundId);
    await soundService.previewSound(soundId, category);

    // 미리듣기 완료 후 상태 초기화 (백색 소음은 3초, 알림/알람은 즉시)
    setTimeout(() => setPreviewingSound(null), category === 'whitenoise' ? 3000 : 1000);
  };

  // 커스텀 사운드 추가 핸들러
  const handleAddCustom = async () => {
    const name = prompt('사운드 이름을 입력하세요 (예: 내가 좋아하는 노래)');
    if (!name) return;

    const soundId = await soundService.addCustomSound(activeCategory, name);
    if (soundId) {
      // 추가된 사운드를 바로 선택
      handleSelectSound(activeCategory, soundId);
      alert(`"${name}" 사운드가 추가되었습니다!`);
    }
  };

  // 커스텀 사운드 삭제 핸들러
  const handleDeleteCustom = (soundId: string) => {
    if (confirm('이 사운드를 삭제하시겠습니까?')) {
      soundService.deleteCustomSound(soundId);

      // 삭제된 사운드가 현재 선택된 사운드면 기본값으로 변경
      const selectedSound = getSelectedSound(activeCategory);
      if (selectedSound === soundId) {
        const defaultSound = activeCategory === 'whitenoise' ? 'ocean'
          : activeCategory === 'notification' ? 'ding'
          : 'alarm1';
        handleSelectSound(activeCategory, defaultSound);
      }

      // 강제 리렌더링을 위해 settings 업데이트
      onUpdateSettings({ ...settings });
    }
  };

  // 백색 소음 볼륨 변경 핸들러
  const handleVolumeChange = (volume: number) => {
    const newSettings = { ...settings, whiteNoiseVolume: volume };
    onUpdateSettings(newSettings);
    soundService.setWhiteNoiseVolume(volume);
  };

  // 백색 소음 활성화 토글
  const handleToggleWhiteNoise = () => {
    const newSettings = { ...settings, whiteNoiseEnabled: !settings.whiteNoiseEnabled };
    onUpdateSettings(newSettings);
  };

  // 카테고리별 사운드 목록 가져오기
  const sounds = soundService.getSoundsForCategory(activeCategory);
  const selectedSound = getSelectedSound(activeCategory);

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div className="flex items-center gap-2 mb-4">
        <Music className="text-indigo-500" size={20} />
        <h3 className="text-lg font-bold text-slate-900">타이머 사운드 설정</h3>
      </div>

      {/* 카테고리 탭 */}
      <div className="bg-slate-50 p-1 rounded-xl flex gap-1">
        <button
          onClick={() => setActiveCategory('whitenoise')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            activeCategory === 'whitenoise'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          백색 소음
        </button>
        <button
          onClick={() => setActiveCategory('notification')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            activeCategory === 'notification'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          알림음
        </button>
        <button
          onClick={() => setActiveCategory('alarm')}
          className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
            activeCategory === 'alarm'
              ? 'bg-white text-indigo-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          알람음
        </button>
      </div>

      {/* 카테고리 설명 */}
      <div className="bg-blue-50 border border-blue-100 rounded-xl p-3">
        <p className="text-xs text-blue-700">
          {activeCategory === 'whitenoise' && '타이머 진행 중 배경으로 재생되는 백색 소음입니다.'}
          {activeCategory === 'notification' && '뽀모도로 집중/휴식 세션이 종료될 때 재생됩니다.'}
          {activeCategory === 'alarm' && '일반 타이머가 최종 종료될 때 재생되는 알람음입니다.'}
        </p>
      </div>

      {/* 백색 소음 활성화 토글 (백색 소음 탭에서만 표시) */}
      {activeCategory === 'whitenoise' && (
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200">
          <div>
            <p className="font-semibold text-slate-900">백색 소음 사용</p>
            <p className="text-xs text-slate-500">타이머 진행 중 배경음 재생</p>
          </div>
          <button
            onClick={handleToggleWhiteNoise}
            className={`relative w-14 h-8 rounded-full transition-colors ${
              settings.whiteNoiseEnabled ? 'bg-indigo-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${
                settings.whiteNoiseEnabled ? 'translate-x-7' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      )}

      {/* 볼륨 슬라이더 (백색 소음 탭에서만 표시) */}
      {activeCategory === 'whitenoise' && (
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Volume2 size={18} className="text-slate-600" />
              <span className="font-semibold text-slate-900">볼륨</span>
            </div>
            <span className="text-sm font-bold text-indigo-600">{settings.whiteNoiseVolume}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="5"
            value={settings.whiteNoiseVolume}
            onChange={(e) => handleVolumeChange(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>
      )}

      {/* 사운드 목록 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-sm font-semibold text-slate-700">
            사운드 선택 ({sounds.length}개)
          </p>
          <button
            onClick={handleAddCustom}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Plus size={14} />
            내 음악 추가
          </button>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {sounds.map((sound) => {
            const isSelected = selectedSound === sound.id;
            const isCustom = sound.id.startsWith('custom:');
            const isPreviewing = previewingSound === sound.id;

            return (
              <div
                key={sound.id}
                className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                {/* 사운드 정보 */}
                <div className="flex items-center gap-3 flex-1">
                  <button
                    onClick={() => handleSelectSound(activeCategory, sound.id)}
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-500'
                        : 'border-slate-300 hover:border-indigo-400'
                    }`}
                  >
                    {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                  </button>
                  <div className="flex-1">
                    <p className={`text-sm font-semibold ${isSelected ? 'text-indigo-900' : 'text-slate-900'}`}>
                      {sound.name}
                    </p>
                    {isCustom && (
                      <p className="text-xs text-slate-500">커스텀 사운드</p>
                    )}
                  </div>
                </div>

                {/* 액션 버튼 */}
                <div className="flex items-center gap-2">
                  {/* 미리듣기 버튼 */}
                  <button
                    onClick={() => handlePreview(sound.id, activeCategory)}
                    disabled={isPreviewing}
                    className={`p-2 rounded-lg transition-colors ${
                      isPreviewing
                        ? 'bg-indigo-100 text-indigo-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                    title="미리듣기"
                  >
                    <Play size={16} className={isPreviewing ? 'animate-pulse' : ''} />
                  </button>

                  {/* 삭제 버튼 (커스텀 사운드만) */}
                  {isCustom && (
                    <button
                      onClick={() => handleDeleteCustom(sound.id)}
                      className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      title="삭제"
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 도움말 */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
        <p className="text-xs text-slate-600 leading-relaxed">
          💡 <strong>도움말:</strong> "내 음악 추가" 버튼은 APK에서만 작동합니다.
          디바이스에 저장된 음악 파일을 선택하여 타이머 사운드로 사용할 수 있습니다.
        </p>
      </div>
    </div>
  );
};

export default SoundSettings;
