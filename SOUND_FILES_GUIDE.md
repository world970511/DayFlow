# 커스텀 사운드 파일 추가 가이드

## 개요

APK에 내장할 사운드 파일을 추가하는 방법을 안내합니다.

---

## 1. 디렉토리 구조

```
public/
└── sounds/
    ├── whitenoise/      # 백색 소음 (5개)
    │   ├── ocean.mp3
    │   ├── rain.mp3
    │   ├── forest.mp3
    │   ├── cafe.mp3
    │   └── fire.mp3
    ├── notification/    # 알림음 (5개)
    │   ├── ding.mp3
    │   ├── chime.mp3
    │   ├── bell.mp3
    │   ├── triplet.mp3
    │   └── soft.mp3
    └── alarm/          # 알람음 (5개)
        ├── alarm1.mp3
        ├── alarm2.mp3
        ├── alarm3.mp3
        ├── alarm4.mp3
        └── alarm5.mp3
```

---

## 2. 사운드 파일 준비하기

### 2.1 파일 형식
- **권장 형식**: MP3 (호환성이 가장 좋음)
- **대체 형식**: M4A, OGG, WAV

### 2.2 파일 크기
- **백색 소음**: 1-3MB (루프 재생되므로 짧아도 됨)
- **알림음**: 50-200KB (짧은 효과음)
- **알람음**: 100-500KB (1-3초 정도)

### 2.3 사운드 소스 찾기

#### 무료 사운드 라이브러리
1. **Freesound** (https://freesound.org/)
   - 검색어: "ocean waves", "rain", "forest birds", "cafe ambience", "fire crackling"
   - 라이선스: Creative Commons

2. **Zapsplat** (https://www.zapsplat.com/)
   - 무료 계정으로 다운로드 가능
   - 알림음, 알람음 다양

3. **Pixabay** (https://pixabay.com/sound-effects/)
   - 완전 무료
   - 상업적 사용 가능

#### AI로 생성하기
- **ElevenLabs** 등의 AI 오디오 생성 도구 사용
- **Web Audio API**로 직접 생성 (현재 폴백 방식)

---

## 3. 사운드 파일 추가 방법

### 방법 1: 직접 파일 추가
1. 준비한 사운드 파일을 해당 폴더에 복사:
   ```bash
   # 예시: ocean.mp3를 whitenoise 폴더에 복사
   cp your-ocean-sound.mp3 public/sounds/whitenoise/ocean.mp3
   ```

2. 파일명이 정확히 일치하는지 확인:
   - whitenoise: `ocean.mp3`, `rain.mp3`, `forest.mp3`, `cafe.mp3`, `fire.mp3`
   - notification: `ding.mp3`, `chime.mp3`, `bell.mp3`, `triplet.mp3`, `soft.mp3`
   - alarm: `alarm1.mp3`, `alarm2.mp3`, `alarm3.mp3`, `alarm4.mp3`, `alarm5.mp3`

### 방법 2: .gitkeep 파일만 유지 (현재 상태)
- 파일이 없으면 Web Audio API 폴백이 자동으로 작동
- 단점: 음질이 실제 사운드보다 떨어짐

---

## 4. Android에 사운드 파일 포함시키기

### 4.1 Vite 빌드 시 자동 포함
Vite는 `public/` 폴더의 모든 파일을 빌드 결과물에 자동으로 복사합니다.

```bash
npm run build
# 결과: dist/sounds/ 폴더에 모든 사운드 파일이 복사됨
```

### 4.2 Capacitor Sync
```bash
npx cap sync android
```
이 명령어는 `dist/` 폴더의 내용을 Android 프로젝트의 `assets/public/` 폴더로 복사합니다.

### 4.3 확인
```bash
# Android 프로젝트에서 파일 확인
ls android/app/src/main/assets/public/sounds/
```

---

## 5. 사운드 파일이 없을 때의 동작

### 폴백 시스템
`soundService.ts`는 오디오 파일이 없을 때 자동으로 Web Audio API 폴백을 사용합니다:

```typescript
try {
  const audio = new Audio('/sounds/whitenoise/ocean.mp3');
  await audio.play();
} catch (error) {
  // 파일이 없으면 폴백 사용
  this.playBuiltinWhiteNoiseFallback('ocean', volume);
}
```

#### 폴백 사운드 특징
- 장점: 파일 없이도 작동, 용량 절약
- 단점: 단순한 사인파 소리, 음질 낮음

---

## 6. 빌드 및 테스트

### 전체 빌드 프로세스
```bash
# 1. 사운드 파일 추가 (선택사항)
cp your-sounds/*.mp3 public/sounds/

# 2. 웹 빌드
npm run build

# 3. Android 동기화
npx cap sync android

# 4. Android Studio 열기
npx cap open android

# 5. Android Studio에서 APK 빌드
# Build > Build Bundle(s) / APK(s) > Build APK(s)
```

### APK에서 테스트
1. APK 설치 후 타이머 기능 실행
2. 설정에서 각 사운드 미리듣기로 확인
3. 실제 파일이 있으면 고음질 재생됨
4. 파일이 없으면 폴백 사운드 재생됨

---

## 7. 권장 워크플로우

### 옵션 1: 파일 포함 (고품질)
```bash
# 사운드 파일 준비 후
cp ocean.mp3 public/sounds/whitenoise/
cp rain.mp3 public/sounds/whitenoise/
# ... (모든 파일 복사)

npm run build
npx cap sync android
npx cap open android
```

**장점**: 고음질, 자연스러운 소리
**단점**: APK 용량 증가 (약 5-15MB)

### 옵션 2: 파일 없음 (경량)
```bash
# 파일 추가 없이 바로 빌드
npm run build
npx cap sync android
npx cap open android
```

**장점**: APK 용량 작음
**단점**: 폴백 사운드 사용 (단순한 비프음)

### 옵션 3: 일부만 포함 (추천)
```bash
# 중요한 사운드만 추가
cp ocean.mp3 public/sounds/whitenoise/  # 백색 소음 1개만
cp alarm1.mp3 public/sounds/alarm/       # 알람음 1개만

npm run build
npx cap sync android
```

**장점**: 균형잡힌 용량과 품질
**단점**: 일부는 폴백 사용

---

## 8. 사운드 파일 제작 팁

### 백색 소음 (Whitenoise)
- **길이**: 10-30초 (루프 재생되므로 끊김 없도록)
- **볼륨**: 중간 정도 (사용자가 조절 가능)
- **형식**: MP3 128kbps 이상

### 알림음 (Notification)
- **길이**: 0.5-1초 (짧고 명확하게)
- **볼륨**: 명확하게 들리도록
- **특징**: 부드럽고 귀에 거슬리지 않게

### 알람음 (Alarm)
- **길이**: 1-3초
- **볼륨**: 크고 명확하게
- **특징**: 주의를 끌 수 있도록 강렬하게

---

## 9. .gitignore 설정

대용량 사운드 파일을 Git에 커밋하지 않으려면:

```bash
# .gitignore에 추가
public/sounds/*.mp3
public/sounds/*.wav
public/sounds/*.ogg

# .gitkeep만 유지
!public/sounds/**/.gitkeep
```

---

## 10. 라이선스 주의사항

- 무료 사운드 라이브러리 사용 시 라이선스 확인 필수
- Creative Commons는 출처 표시 필요
- 상업적 사용 시 권리 확인
- 안전하게 사용하려면 Public Domain 또는 CC0 라이선스 선택

---

**작성일**: 2025-12-18
**작성자**: Claude Sonnet 4.5
