/**
 * 사운드 서비스
 *
 * [주요 변경사항]
 * 1. 기존: Web Audio API로 합성음만 생성
 *    변경: 3가지 카테고리(백색소음/알림/알람) + 커스텀 파일 지원
 *
 * 2. 기존: SoundType = 'ding' | 'chime' | 'bell' | 'triplet' | 'alert' (5개 고정)
 *    변경: 카테고리별 5개 내장 사운드 + 무제한 커스텀 사운드
 *
 * 3. 신규: 백색 소음 루프 재생 기능 추가
 * 4. 신규: 디바이스 음악 파일 선택 및 재생 기능
 * 5. 신규: 커스텀 사운드 관리 (추가/삭제/목록)
 */

import { Capacitor } from '@capacitor/core';
import { CustomSound, SoundCategory } from '../types';

// [기존 유지] 기존 코드와의 호환성을 위해 SoundType 유지
export type SoundType = 'ding' | 'chime' | 'bell' | 'triplet' | 'alert';

// [신규] 내장 사운드 정의 인터페이스
interface BuiltinSound {
  id: string;
  name: string;
  type: 'loop' | 'oneshot'; // loop: 반복재생(백색소음), oneshot: 1회재생(알림/알람)
}

class SoundService {
  // [기존 유지] Web Audio API 컨텍스트
  private ctx: AudioContext | null = null;

  // [신규] 백색 소음 루프 재생용 오디오 엘리먼트
  private loopingAudio: HTMLAudioElement | null = null;

  // [신규] 커스텀 사운드 오디오 캐시 (성능 최적화)
  private audioCache: Map<string, HTMLAudioElement> = new Map();

  // [신규] 사용자가 추가한 커스텀 사운드 목록
  private customSounds: CustomSound[] = [];

  // [신규] 3가지 카테고리별 내장 사운드 정의 (각 5개씩 총 15개)
  private readonly BUILTIN_SOUNDS: Record<SoundCategory, BuiltinSound[]> = {
    // 백색 소음 (타이머 진행 중 배경음)
    whitenoise: [
      { id: 'Ocean', name: '🌊 파도 소리', type: 'loop' },
      { id: 'Rain', name: '🌧️ 빗소리', type: 'loop' },
      { id: 'Bird', name: '🌲 숲속 새소리', type: 'loop' },
      { id: 'Office', name: '☕ 카페 소음', type: 'loop' },
      { id: 'Fire', name: '🔥 모닥불', type: 'loop' }
    ],
    // 알림음 (뽀모도로 세션 종료)
    notification: [
      { id: 'Ding', name: '🔔 딩', type: 'oneshot' },
      { id: 'Chime', name: '🎵 차임', type: 'oneshot' },
      { id: 'Bell', name: '🔔 벨', type: 'oneshot' },
      { id: 'Triplets', name: '🎶 트리플렛', type: 'oneshot' },
      { id: 'Soft', name: '✨ 소프트', type: 'oneshot' }
    ],
    // 알람음 (일반 타이머 최종 종료)
    alarm: [
      { id: 'alarm1', name: '⏰ 클래식', type: 'oneshot' },
      { id: 'alarm2', name: '📢 강렬', type: 'oneshot' },
      { id: 'alarm3', name: '🎺 팡파레', type: 'oneshot' },
      { id: 'alarm4', name: '🔊 비프', type: 'oneshot' },
      { id: 'alarm5', name: '🎹 멜로디', type: 'oneshot' }
    ]
  };

  constructor() {
    // [신규] localStorage에서 커스텀 사운드 목록 로드
    this.loadCustomSounds();
  }

  // [기존 유지] Web Audio API 초기화
  private init() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // [기존 유지] 합성음 생성을 위한 Oscillator 생성
  private createOscillator(freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') {
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);

    gain.gain.setValueAtTime(0.1, startTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  // [변경] 기존 play 메서드를 내장 알림음/알람음 재생용으로 사용
  // [수정] Web Audio API 대신 실제 오디오 파일 사용
  private async playBuiltinSound(soundId: string) {
    try {
      // 사운드 ID를 기반으로 카테고리 결정
      let category = 'notification';
      if (['alarm1', 'alarm2', 'alarm3', 'alarm4', 'alarm5'].includes(soundId)) {
        category = 'alarm';
      }

      // 오디오 파일 경로 생성
      const audioPath = `/sounds/${category}/${soundId}.mp3`;
      const audio = new Audio(audioPath);

      // 재생
      await audio.play();
    } catch (error) {
      console.error(`내장 사운드 재생 실패 (${soundId}):`, error);
      // 폴백: 오디오 파일이 없으면 Web Audio API 사용
      this.playBuiltinSoundFallback(soundId);
    }
  }

  // [신규] 폴백용 Web Audio API 메서드 (오디오 파일이 없을 때)
  private playBuiltinSoundFallback(soundId: string) {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;

    // 기존 Oscillator 로직 유지
    switch (soundId) {
      case 'Ding':
        this.createOscillator(880, now, 0.5);
        break;
      case 'Chime':
        this.createOscillator(659.25, now, 0.4);
        this.createOscillator(830.61, now + 0.1, 0.4);
        break;
      case 'Bell':
        this.createOscillator(523.25, now, 1.0, 'triangle');
        this.createOscillator(1046.50, now, 0.8, 'sine');
        break;
      case 'Triplets':
        this.createOscillator(440, now, 0.2);
        this.createOscillator(554.37, now + 0.2, 0.2);
        this.createOscillator(659.25, now + 0.4, 0.4);
        break;
      case 'alert':
        this.createOscillator(440, now, 0.1, 'square');
        this.createOscillator(440, now + 0.2, 0.1, 'square');
        this.createOscillator(440, now + 0.4, 0.1, 'square');
        break;
      case 'Soft':
        this.createOscillator(523.25, now, 0.6);
        break;
      case 'alarm1':
        this.createOscillator(800, now, 0.3, 'square');
        this.createOscillator(800, now + 0.4, 0.3, 'square');
        this.createOscillator(800, now + 0.8, 0.5, 'square');
        break;
      case 'alarm2':
        this.createOscillator(600, now, 0.2, 'sawtooth');
        this.createOscillator(900, now + 0.2, 0.2, 'sawtooth');
        this.createOscillator(600, now + 0.4, 0.2, 'sawtooth');
        this.createOscillator(900, now + 0.6, 0.2, 'sawtooth');
        break;
      case 'alarm3':
        this.createOscillator(523.25, now, 0.3);
        this.createOscillator(659.25, now + 0.3, 0.3);
        this.createOscillator(783.99, now + 0.6, 0.5);
        break;
      case 'alarm4':
        this.createOscillator(440, now, 0.15, 'square');
        this.createOscillator(440, now + 0.2, 0.15, 'square');
        this.createOscillator(440, now + 0.4, 0.15, 'square');
        this.createOscillator(440, now + 0.6, 0.3, 'square');
        break;
      case 'alarm5':
        this.createOscillator(523.25, now, 0.2);
        this.createOscillator(587.33, now + 0.2, 0.2);
        this.createOscillator(659.25, now + 0.4, 0.2);
        this.createOscillator(783.99, now + 0.6, 0.4);
        break;
    }
  }

  // [신규] 백색 소음 재생
  // [수정] Web Audio API 대신 실제 오디오 파일 사용
  private async playBuiltinWhiteNoise(soundId: string, volume: number) {
    try {
      // 오디오 파일 경로 생성
      const audioPath = `/sounds/whitenoise/${soundId}.mp3`;
      const audio = new Audio(audioPath);

      // 루프 설정
      audio.loop = true;
      audio.volume = volume / 100;

      // 재생
      await audio.play();

      // 참조 저장 (stopWhiteNoise에서 사용)
      this.loopingAudio = audio;
    } catch (error) {
      console.error(`백색 소음 재생 실패 (${soundId}):`, error);
      // 폴백: 오디오 파일이 없으면 Web Audio API 사용
      this.playBuiltinWhiteNoiseFallback(soundId, volume);
    }
  }

  // [신규] 폴백용 백색 소음 생성 (오디오 파일이 없을 때)
  private playBuiltinWhiteNoiseFallback(soundId: string, volume: number) {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    // 간단한 백색 소음 시뮬레이션
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    switch (soundId) {
      case 'Ocean':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, this.ctx.currentTime);
        break;
      case 'Rain':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(200, this.ctx.currentTime);
        break;
      case 'Bird':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(150, this.ctx.currentTime);
        break;
      case 'Office':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(120, this.ctx.currentTime);
        break;
      case 'Fire':
        osc.type = 'sine';
        osc.frequency.setValueAtTime(80, this.ctx.currentTime);
        break;
    }

    gain.gain.setValueAtTime(volume / 100 * 0.05, this.ctx.currentTime);
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
  }

  // [신규] 커스텀 오디오 파일 재생 (디바이스 음악 파일)
  private async playCustom(filePath: string, loop: boolean = false, volume: number = 100) {
    try {
      // 캐시에 있으면 재사용
      if (!this.audioCache.has(filePath)) {
        const audio = new Audio(filePath);
        this.audioCache.set(filePath, audio);
      }

      const audio = this.audioCache.get(filePath)!;
      audio.loop = loop;
      audio.volume = volume / 100;
      audio.currentTime = 0;
      await audio.play();

      // 루프가 아니면 재생 후 캐시에서 제거 (메모리 관리)
      if (!loop) {
        audio.onended = () => {
          this.audioCache.delete(filePath);
        };
      }

      return audio;
    } catch (error) {
      console.error('커스텀 사운드 재생 실패:', error);
      alert('음악 파일을 재생할 수 없습니다. 파일이 삭제되었거나 권한이 없습니다.');
    }
  }

  // [신규] 백색 소음 재생 (루프)
  async playWhiteNoise(soundId: string, volume: number = 50) {
    // 기존 백색 소음 정지
    this.stopWhiteNoise();

    if (soundId.startsWith('custom:')) {
      // 커스텀 파일 재생
      const filePath = soundId.replace('custom:', '');
      const audio = await this.playCustom(filePath, true, volume);
      if (audio) {
        this.loopingAudio = audio;
      }
    } else {
      // [수정] 내장 백색 소음 재생 (오디오 파일 사용)
      await this.playBuiltinWhiteNoise(soundId, volume);
    }
  }

  // [신규] 백색 소음 정지
  stopWhiteNoise() {
    if (this.loopingAudio) {
      this.loopingAudio.pause();
      this.loopingAudio.currentTime = 0;
      this.loopingAudio = null;
    }
  }

  // [신규] 백색 소음 볼륨 조절
  setWhiteNoiseVolume(volume: number) {
    if (this.loopingAudio) {
      this.loopingAudio.volume = Math.max(0, Math.min(100, volume)) / 100;
    }
  }

  // [신규] 알림음/알람음 재생 (원샷)
  async play(soundId: string) {
    if (soundId.startsWith('custom:')) {
      // 커스텀 파일 재생
      const filePath = soundId.replace('custom:', '');
      await this.playCustom(filePath, false, 100);
    } else {
      // 내장 사운드 재생
      this.playBuiltinSound(soundId);
    }
  }

  // [신규] 커스텀 사운드 추가 (디바이스 파일 선택)
  async addCustomSound(
    category: SoundCategory,
    name: string
  ): Promise<string | null> {
    // Native 플랫폼이 아니면 파일 선택 불가
    if (!Capacitor.isNativePlatform()) {
      alert('파일 선택은 APK에서만 가능합니다.');
      return null;
    }

    try {
      // Capacitor File Picker 플러그인 사용
      const { FilePicker } = await import('@capawesome/capacitor-file-picker');

      const result = await FilePicker.pickFiles({
        types: ['audio/*'],
        readData: false // 파일 경로만 필요
      });

      if (result.files && result.files.length > 0) {
        const file = result.files[0];
        const customSound: CustomSound = {
          id: this.generateId(),
          name: name || file.name || '커스텀 사운드',
          filePath: file.path || '',
          category,
          addedAt: Date.now()
        };

        this.customSounds.push(customSound);
        this.saveCustomSounds();

        return `custom:${customSound.filePath}`;
      }
    } catch (error) {
      console.error('파일 선택 실패:', error);
      alert('파일을 선택할 수 없습니다. 권한을 확인해주세요.');
    }

    return null;
  }

  // [신규] 커스텀 사운드 삭제
  deleteCustomSound(soundId: string) {
    const filePath = soundId.replace('custom:', '');

    this.customSounds = this.customSounds.filter(
      s => s.filePath !== filePath
    );

    // 캐시에서도 제거
    this.audioCache.delete(filePath);

    this.saveCustomSounds();
  }

  // [신규] 특정 카테고리의 전체 사운드 목록 가져오기 (내장 + 커스텀)
  getSoundsForCategory(category: SoundCategory): BuiltinSound[] {
    const builtin = this.BUILTIN_SOUNDS[category];
    const custom = this.customSounds
      .filter(s => s.category === category)
      .map(s => ({
        id: `custom:${s.filePath}`,
        name: `🎵 ${s.name}`,
        type: category === 'whitenoise' ? 'loop' : 'oneshot'
      } as BuiltinSound));

    return [...builtin, ...custom];
  }

  // [신규] 커스텀 사운드 localStorage에 저장
  private saveCustomSounds() {
    try {
      localStorage.setItem('customSounds', JSON.stringify(this.customSounds));
    } catch (error) {
      console.error('커스텀 사운드 저장 실패:', error);
    }
  }

  // [신규] 커스텀 사운드 localStorage에서 로드
  private loadCustomSounds() {
    try {
      const saved = localStorage.getItem('customSounds');
      if (saved) {
        this.customSounds = JSON.parse(saved);
      }
    } catch (error) {
      console.error('커스텀 사운드 로드 실패:', error);
      this.customSounds = [];
    }
  }

  // [신규] ID 생성 (기존 Task 생성 로직과 동일)
  private generateId(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // [신규] 사운드 미리듣기
  async previewSound(soundId: string, category: SoundCategory) {
    if (category === 'whitenoise') {
      // 백색 소음은 3초간 재생 후 자동 정지
      await this.playWhiteNoise(soundId, 50);
      setTimeout(() => this.stopWhiteNoise(), 3000);
    } else {
      // 알림/알람은 1회 재생
      await this.play(soundId);
    }
  }
}

export const soundService = new SoundService();
