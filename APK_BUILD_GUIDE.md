# APK 빌드 완벽 가이드

## 개요
DayFlow 앱을 Android APK로 빌드하는 전체 과정을 안내합니다.

---

## 전제 조건

### 필수 소프트웨어
1. **Node.js** (v18 이상)
2. **Android Studio** (최신 버전)
3. **Java JDK** (Android Studio 설치 시 자동 설치됨)

### 확인 명령어
```bash
node --version   # v18 이상
npm --version    # v9 이상
java --version   # Java 17 이상
```

---

## 1단계: 의존성 설치

```bash
# 프로젝트 루트에서 실행
npm install
```

이미 설치되어 있다면 스킵 가능합니다.

---

## 2단계: 환경 변수 설정 (선택사항)

Gemini API를 사용하는 경우 `.env.local` 파일 생성:

```bash
# .env.local
GEMINI_API_KEY=your_api_key_here
```

---

## 3단계: 커스텀 사운드 추가 (선택사항)

APK에 고품질 사운드를 포함하려면:

```bash
# 사운드 파일을 public/sounds/ 폴더에 복사
cp your-ocean.mp3 public/sounds/whitenoise/ocean.mp3
cp your-rain.mp3 public/sounds/whitenoise/rain.mp3
# ... (원하는 사운드 추가)
```

**파일이 없어도 됩니다!** Web Audio API 폴백이 자동으로 작동합니다.

자세한 내용은 [SOUND_FILES_GUIDE.md](SOUND_FILES_GUIDE.md) 참고.

---

## 4단계: 웹 애플리케이션 빌드

```bash
npm run build
```

**결과**: `dist/` 폴더에 빌드된 웹 애플리케이션이 생성됩니다.

### 빌드 확인
```bash
ls -la dist/
# index.html, assets/, sounds/ 등이 있어야 함
```

---

## 5단계: Capacitor 동기화

```bash
npx cap sync android
```

이 명령어는 다음을 수행합니다:
1. `dist/` 폴더를 Android 프로젝트의 `assets/public/`로 복사
2. Capacitor 플러그인 업데이트
3. Android 프로젝트 설정 동기화

### 동기화 확인
```bash
# Android 프로젝트에 파일이 복사되었는지 확인
ls android/app/src/main/assets/public/
```

---

## 6단계: Android Studio 열기

```bash
npx cap open android
```

Android Studio가 자동으로 열립니다.

### 수동으로 열기
Android Studio를 직접 실행하고 `android/` 폴더를 프로젝트로 엽니다.

---

## 7단계: Android 권한 확인

`android/app/src/main/AndroidManifest.xml` 파일에서 필요한 권한이 있는지 확인:

```xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <!-- 기존 권한들 -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />

    <!-- 사운드 파일 선택용 권한 -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />

    <application>
        <!-- 앱 설정 -->
    </application>
</manifest>
```

권한이 없다면 [SOUND_SETUP.md](SOUND_SETUP.md)를 참고하여 추가하세요.

---

## 8단계: APK 빌드

### 방법 1: Android Studio GUI
1. Android Studio 상단 메뉴: **Build > Build Bundle(s) / APK(s) > Build APK(s)**
2. 빌드가 완료되면 우측 하단에 "locate" 링크 클릭
3. APK 파일 위치로 이동: `android/app/build/outputs/apk/debug/app-debug.apk`

### 방법 2: 터미널 (Gradle)
```bash
cd android
./gradlew assembleDebug
```

**결과**: `android/app/build/outputs/apk/debug/app-debug.apk` 생성

### Release APK (서명된 APK)
```bash
./gradlew assembleRelease
```

**주의**: Release APK는 서명이 필요합니다. 서명 설정은 아래 참고.

---

## 9단계: APK 설치 및 테스트

### USB 디버깅으로 설치
1. Android 디바이스에서 **개발자 옵션** 활성화
2. **USB 디버깅** 활성화
3. USB로 컴퓨터와 연결
4. Android Studio에서 **Run > Run 'app'** 클릭

### APK 파일로 직접 설치
1. `app-debug.apk` 파일을 디바이스로 전송 (메일, 클라우드 등)
2. 디바이스에서 APK 파일 실행
3. "출처를 알 수 없는 앱 설치" 허용
4. 설치 완료

---

## 10단계: 테스트 체크리스트

### 기본 기능
- [ ] 앱이 정상적으로 실행됨
- [ ] 오늘의 할 일 CRUD 작동
- [ ] 미래 계획 추가/삭제 작동
- [ ] 히스토리 조회 작동

### 타이머 기능
- [ ] Pomodoro 타이머 작동
- [ ] 일반 타이머 작동
- [ ] 백색 소음 재생/정지 작동
- [ ] 백색 소음 볼륨 조절 작동
- [ ] 알림음/알람음 재생 작동

### 사운드 기능
- [ ] 내장 사운드 재생 확인 (15개)
- [ ] 커스텀 사운드 추가 가능 (파일 선택)
- [ ] 미리듣기 기능 작동
- [ ] 선택한 사운드가 타이머에서 재생됨

### 알림 기능
- [ ] 아침 브리핑 알림 작동
- [ ] 저녁 회고 알림 작동
- [ ] 알림 시간 설정 가능

### 데이터
- [ ] 데이터가 로컬에 저장됨
- [ ] 앱 재시작 후에도 데이터 유지
- [ ] 히스토리 이미지 다운로드 작동

---

## Release APK 서명 (배포용)

### 1. Keystore 생성
```bash
keytool -genkey -v -keystore dayflow-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -alias dayflow-key
```

입력 정보:
- 비밀번호 설정
- 이름, 조직 등 입력

### 2. Android 프로젝트에 서명 설정 추가

`android/gradle.properties`에 추가:
```properties
DAYFLOW_RELEASE_STORE_FILE=../dayflow-release-key.jks
DAYFLOW_RELEASE_KEY_ALIAS=dayflow-key
DAYFLOW_RELEASE_STORE_PASSWORD=your_keystore_password
DAYFLOW_RELEASE_KEY_PASSWORD=your_key_password
```

`android/app/build.gradle`에 추가:
```gradle
android {
    ...
    signingConfigs {
        release {
            if (project.hasProperty('DAYFLOW_RELEASE_STORE_FILE')) {
                storeFile file(DAYFLOW_RELEASE_STORE_FILE)
                storePassword DAYFLOW_RELEASE_STORE_PASSWORD
                keyAlias DAYFLOW_RELEASE_KEY_ALIAS
                keyPassword DAYFLOW_RELEASE_KEY_PASSWORD
            }
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Release APK 빌드
```bash
cd android
./gradlew assembleRelease
```

**결과**: `android/app/build/outputs/apk/release/app-release.apk`

---

## 빌드 오류 해결

### 오류 1: "BUILD FAILED" - Gradle 오류
**해결**:
```bash
cd android
./gradlew clean
cd ..
npx cap sync android
```

### 오류 2: "Module not found"
**해결**:
```bash
rm -rf node_modules
npm install
npm run build
npx cap sync android
```

### 오류 3: "SDK location not found"
**해결**:
`android/local.properties` 파일에 SDK 경로 추가:
```properties
sdk.dir=/Users/YOUR_USERNAME/Library/Android/sdk
```

### 오류 4: 사운드 파일이 재생되지 않음
**원인**: 파일 경로 문제 또는 권한 부족
**해결**:
1. `AndroidManifest.xml`에 권한 추가 확인
2. 앱 설정에서 권한 허용 확인
3. 파일이 `android/app/src/main/assets/public/sounds/`에 있는지 확인

---

## 전체 빌드 스크립트 (한 번에 실행)

```bash
#!/bin/bash
# build-apk.sh

echo "1. 웹 빌드 시작..."
npm run build

echo "2. Capacitor 동기화 시작..."
npx cap sync android

echo "3. Android 빌드 시작..."
cd android
./gradlew assembleDebug
cd ..

echo "4. APK 위치:"
echo "android/app/build/outputs/apk/debug/app-debug.apk"

echo "완료!"
```

실행:
```bash
chmod +x build-apk.sh
./build-apk.sh
```

---

## 빠른 참고

### 개발 빌드 (디버깅용)
```bash
npm run build && npx cap sync android && npx cap open android
```

### 프로덕션 빌드 (배포용)
```bash
npm run build && npx cap sync android && cd android && ./gradlew assembleRelease
```

---

## 추가 리소스

- [Capacitor 공식 문서](https://capacitorjs.com/docs)
- [Android Studio 다운로드](https://developer.android.com/studio)
- [사운드 설정 가이드](SOUND_SETUP.md)
- [커스텀 사운드 가이드](SOUND_FILES_GUIDE.md)

---

**작성일**: 2025-12-18
**작성자**: Claude Sonnet 4.5
