# 타이머 사운드 기능 설정 가이드

## 개요

타이머 사운드 기능이 추가되었습니다. 이 문서는 필요한 플러그인 설치 및 권한 설정 방법을 안내합니다.

---

## 1. 필요한 플러그인 설치

디바이스의 음악 파일을 선택하려면 **Capacitor File Picker** 플러그인이 필요합니다.

### 설치 명령어

```bash
npm install capacitor-plugin-file-picker
npx cap sync
```

---

## 2. Android 권한 설정

### AndroidManifest.xml 수정

`android/app/src/main/AndroidManifest.xml` 파일을 열고 다음 권한을 추가하세요:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 기존 권한들 -->

    <!-- [신규] 외부 저장소 읽기 권한 (Android 12 이하) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />

    <!-- [신규] 오디오 파일 읽기 권한 (Android 13+) -->
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />

    <application>
        <!-- 앱 설정 -->
    </application>
</manifest>
```

### 권한 설명

- **READ_EXTERNAL_STORAGE**: Android 12 이하에서 외부 저장소의 파일에 접근하기 위한 권한
- **READ_MEDIA_AUDIO**: Android 13부터 도입된 세분화된 권한으로, 오디오 파일만 접근 가능

---

## 3. 빌드 및 실행

```bash
# 빌드
npm run build

# Android 동기화
npx cap sync android

# Android Studio에서 실행
npx cap open android
```

---

## 4. 기능 설명

### 4.1 내장 사운드 (15개)

플러그인 설치 없이 바로 사용 가능합니다.

#### 백색 소음 (5개)
- 🌊 파도 소리
- 🌧️ 빗소리
- 🌲 숲속 새소리
- ☕ 카페 소음
- 🔥 모닥불

#### 알림음 (5개)
- 🔔 딩
- 🎵 차임
- 🔔 벨
- 🎶 트리플렛
- ✨ 소프트

#### 알람음 (5개)
- ⏰ 클래식
- 📢 강렬
- 🎺 팡파레
- 🔊 비프
- 🎹 멜로디

### 4.2 커스텀 사운드

**APK에서만 사용 가능**합니다. 디바이스에 저장된 음악 파일을 선택하여 사용할 수 있습니다.

#### 사용 방법
1. 설정 화면 → 타이머 사운드 설정
2. 원하는 카테고리 탭 선택 (백색 소음 / 알림음 / 알람음)
3. "내 음악 추가" 버튼 클릭
4. 사운드 이름 입력
5. 파일 선택 화면에서 음악 파일 선택
6. 추가된 사운드가 목록에 표시됨
7. 미리듣기 버튼으로 확인 후 선택

---

## 5. 변경사항 요약

### 5.1 새로운 파일
- `services/soundService.ts` - 완전히 재작성됨
- `components/SoundSettings.tsx` - 신규 컴포넌트
- `types.ts` - CustomSound, SoundCategory 타입 추가

### 5.2 수정된 파일
- `types.ts` - AppSettings에 whiteNoiseSound, whiteNoiseEnabled, whiteNoiseVolume 추가
- `services/storageService.ts` - 기본 설정에 사운드 필드 추가
- `App.tsx` - SoundSettings 컴포넌트 통합, 타이머 탭 추가
- `components/TimerView.tsx` - 백색 소음 재생/정지 기능 통합

### 5.3 주요 기능
1. **3가지 카테고리 사운드 시스템**
   - 백색 소음: 타이머 진행 중 배경 재생 (루프)
   - 알림음: 뽀모도로 세션 종료 시 재생
   - 알람음: 일반 타이머 최종 종료 시 재생

2. **내장 사운드 15개**
   - Web Audio API로 합성음 생성
   - 플러그인 없이 웹/앱 모두 동작

3. **커스텀 사운드 무제한 추가**
   - 디바이스 음악 파일 선택 (APK 전용)
   - localStorage에 경로 저장
   - 카테고리별 관리

4. **미리듣기 기능**
   - 백색 소음: 3초간 재생
   - 알림/알람: 1회 재생

5. **백색 소음 볼륨 조절**
   - 0~100% 슬라이더
   - 타이머 실행 중 실시간 조절 가능

---

## 6. 트러블슈팅

### 파일 선택이 작동하지 않음
- APK로 빌드되었는지 확인 (웹에서는 미지원)
- AndroidManifest.xml에 권한이 추가되었는지 확인
- 앱 설정에서 파일 접근 권한이 허용되었는지 확인

### 선택한 음악이 재생되지 않음
- 파일이 삭제되었거나 이동되었을 수 있음
- 지원되지 않는 오디오 포맷일 수 있음 (MP3, M4A, WAV 권장)
- 다시 파일을 선택하거나 내장 사운드 사용

### 백색 소음이 들리지 않음
- 설정에서 "백색 소음 사용"이 활성화되었는지 확인
- 볼륨이 0%가 아닌지 확인
- 타이머가 실행 중일 때만 재생됨

---

## 7. 향후 개선 사항 (선택사항)

### 7.1 실제 백색 소음 오디오 파일 추가
현재는 Web Audio API로 간단한 사인파를 생성하고 있습니다. 더 나은 음질을 위해:

1. `public/assets/sounds/` 폴더 생성
2. 백색 소음 오디오 파일 추가 (ocean.mp3, rain.mp3 등)
3. `soundService.ts`의 `playBuiltinWhiteNoise` 메서드를 HTMLAudioElement로 변경

```typescript
// 예시
private async playBuiltinWhiteNoise(soundId: string, volume: number) {
  const audioPath = `/assets/sounds/${soundId}.mp3`;
  const audio = new Audio(audioPath);
  audio.loop = true;
  audio.volume = volume / 100;
  await audio.play();
  this.loopingAudio = audio;
}
```

### 7.2 iOS 지원
iOS에서 파일 선택을 지원하려면 추가 설정이 필요합니다:

1. `ios/App/App/Info.plist`에 권한 추가:
```xml
<key>NSAppleMusicUsageDescription</key>
<string>타이머 사운드로 사용할 음악을 선택하려면 미디어 라이브러리 접근이 필요합니다.</string>
```

2. File Picker 대신 Media Picker 플러그인 사용 고려

---

## 8. 라이선스 및 크레딧

- Capacitor File Picker: MIT License
- Web Audio API: 브라우저 표준 API

---

**구현 완료일**: 2025-12-18
**작성자**: Claude Sonnet 4.5
