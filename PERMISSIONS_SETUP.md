# 권한 설정 가이드

DayFlow 앱이 정상적으로 작동하려면 다음 권한들이 필요합니다.

## 필요한 권한

### 1. 다른 앱 위에 표시 (SYSTEM_ALERT_WINDOW)
- **필요한 이유**: 오버레이 모드에서 다른 앱 사용 중에도 알림 모달을 표시하기 위함
- **사용 위치**: 시간 기반 아침/저녁 알림

### 2. 미디어 파일 읽기 (READ_MEDIA_AUDIO)
- **필요한 이유**: 사용자가 디바이스의 음악 파일을 커스텀 사운드로 추가하기 위함
- **사용 위치**: 사운드 설정에서 커스텀 사운드 추가

### 3. 푸시 알림 (POST_NOTIFICATIONS)
- **필요한 이유**: Android 13 이상에서 알림 표시
- **사용 위치**: 푸시 알림 모드, 타이머 완료 알림

### 4. 정확한 알람 (SCHEDULE_EXACT_ALARM)
- **필요한 이유**: 정확한 시간에 알림 전송
- **사용 위치**: 아침/저녁 알림 예약

## Android 설정 파일 수정

### 1. AndroidManifest.xml 수정

위치: `android/app/src/main/AndroidManifest.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>

    <!-- Permissions -->

    <uses-permission android:name="android.permission.INTERNET" />

    <!-- 알림 권한 (Android 13+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <!-- 정확한 알람 예약 권한 (Android 12+) -->
    <uses-permission android:name="android.permission.SCHEDULE_EXACT_ALARM" />

    <!-- 다른 앱 위에 표시 (오버레이 모드) -->
    <uses-permission android:name="android.permission.SYSTEM_ALERT_WINDOW" />

    <!-- 미디어 파일 읽기 권한 (커스텀 사운드) -->
    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE"
        android:maxSdkVersion="32" />
    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
</manifest>
```

### 2. PermissionsPlugin.java 생성

위치: `android/app/src/main/java/com/dayflow/app/PermissionsPlugin.java`

이 파일의 전체 내용은 워크트리의 `android/app/src/main/java/com/dayflow/app/PermissionsPlugin.java`를 참고하세요.

주요 메서드:
- `checkOverlayPermission()`: 오버레이 권한 확인
- `requestOverlayPermission()`: 오버레이 권한 요청 (설정 화면 열기)
- `checkAudioPermission()`: 미디어 권한 확인
- `requestAudioPermission()`: 미디어 권한 요청

### 3. MainActivity.java 수정

위치: `android/app/src/main/java/com/dayflow/app/MainActivity.java`

```java
package com.dayflow.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // 커스텀 플러그인 등록
        registerPlugin(PermissionsPlugin.class);
    }
}
```

## 사용자 권한 요청 플로우

1. **앱 최초 실행 시**
   - 앱이 자동으로 모든 권한 상태 확인
   - 설정 > 알림 설정에서 권한 상태 표시

2. **오버레이 모드 선택 시**
   - "다른 앱 위에 표시" 권한 필요
   - 권한이 없으면 경고 표시 및 "권한 요청" 버튼 표시
   - 버튼 클릭 시 Android 설정 화면으로 이동
   - 사용자가 수동으로 권한 허용 필요

3. **커스텀 사운드 추가 시**
   - "미디어 파일 접근" 권한 필요
   - 권한이 없으면 자동으로 권한 요청 다이얼로그 표시
   - 사용자가 허용/거부 선택

4. **푸시 알림 모드 선택 시**
   - "푸시 알림" 권한 자동 확인
   - 권한이 없으면 알림 토글 시 자동 요청

## 권한별 Android 버전 호환성

| 권한 | Android 5 | Android 6-12 | Android 13+ |
|------|-----------|--------------|-------------|
| SYSTEM_ALERT_WINDOW | 자동 허용 | 설정 화면에서 수동 허용 | 설정 화면에서 수동 허용 |
| READ_EXTERNAL_STORAGE | 자동 허용 | 런타임 요청 | 사용 안 함 |
| READ_MEDIA_AUDIO | - | - | 런타임 요청 |
| POST_NOTIFICATIONS | - | - | 런타임 요청 |
| SCHEDULE_EXACT_ALARM | - | 자동 허용 | 자동 허용 |

## 테스트 체크리스트

- [ ] 오버레이 권한이 없을 때 경고 표시됨
- [ ] 오버레이 권한 요청 버튼이 설정 화면으로 이동함
- [ ] 미디어 권한 요청 시 다이얼로그 표시됨
- [ ] 권한 허용 후 상태가 "허용됨 ✓"으로 변경됨
- [ ] 오버레이 모드에서 다른 앱 위에 모달이 표시됨
- [ ] 커스텀 사운드 추가 시 파일 선택 가능
- [ ] Android 13 이상에서 푸시 알림이 정상 작동함

## 문제 해결

### 오버레이 권한이 작동하지 않는 경우
1. Android 설정 > 앱 > DayFlow > 다른 앱 위에 표시 확인
2. 권한이 허용되어 있는지 확인
3. 앱 재시작

### 미디어 권한이 작동하지 않는 경우
1. Android 설정 > 앱 > DayFlow > 권한 > 음악 및 오디오 확인
2. Android 13 미만: "파일 및 미디어" 또는 "저장공간" 확인
3. 권한 허용 후 앱 재시작

### 푸시 알림이 표시되지 않는 경우
1. Android 설정 > 앱 > DayFlow > 알림 확인
2. 모든 알림 카테고리가 활성화되어 있는지 확인
3. 배터리 절약 모드가 앱을 제한하지 않는지 확인

---

**작성일**: 2025-12-19
**작성자**: Claude Sonnet 4.5
