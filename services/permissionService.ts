import { Capacitor } from '@capacitor/core';

/**
 * 권한 관리 서비스
 * - SYSTEM_ALERT_WINDOW (다른 앱 위에 표시)
 * - READ_MEDIA_AUDIO (미디어 파일 읽기)
 */

// 네이티브 플랫폼인지 확인
const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

/**
 * 오버레이 권한 확인 및 요청
 * SYSTEM_ALERT_WINDOW 권한은 특별 권한으로 설정 화면으로 이동해야 함
 */
export const checkOverlayPermission = async (): Promise<boolean> => {
  if (!isNativePlatform()) {
    console.log('웹 환경: 오버레이 권한 불필요');
    return true;
  }

  try {
    // Android Settings로 이동하여 권한 요청
    // @ts-ignore - Capacitor native code에서 처리
    const result = await Capacitor.Plugins.Permissions?.checkOverlayPermission();
    return result?.granted || false;
  } catch (error) {
    console.error('오버레이 권한 확인 실패:', error);
    return false;
  }
};

/**
 * 오버레이 권한 설정 화면 열기
 */
export const requestOverlayPermission = async (): Promise<void> => {
  if (!isNativePlatform()) {
    console.log('웹 환경: 권한 요청 불필요');
    return;
  }

  try {
    // Android 설정 화면으로 이동
    // @ts-ignore - Capacitor native code에서 처리
    await Capacitor.Plugins.Permissions?.requestOverlayPermission();
  } catch (error) {
    console.error('오버레이 권한 요청 실패:', error);
  }
};

/**
 * 미디어 파일 읽기 권한 확인
 * READ_MEDIA_AUDIO 권한 (Android 13+)
 */
export const checkAudioPermission = async (): Promise<boolean> => {
  if (!isNativePlatform()) {
    console.log('웹 환경: 미디어 권한 불필요');
    return true;
  }

  try {
    // @ts-ignore - Capacitor native code에서 처리
    const result = await Capacitor.Plugins.Permissions?.checkAudioPermission();
    return result?.granted || false;
  } catch (error) {
    console.error('미디어 권한 확인 실패:', error);
    return false;
  }
};

/**
 * 미디어 파일 읽기 권한 요청
 */
export const requestAudioPermission = async (): Promise<boolean> => {
  if (!isNativePlatform()) {
    console.log('웹 환경: 권한 요청 불필요');
    return true;
  }

  try {
    // @ts-ignore - Capacitor native code에서 처리
    const result = await Capacitor.Plugins.Permissions?.requestAudioPermission();
    return result?.granted || false;
  } catch (error) {
    console.error('미디어 권한 요청 실패:', error);
    return false;
  }
};

/**
 * 모든 필수 권한 확인
 */
export const checkAllPermissions = async (): Promise<{
  overlay: boolean;
  audio: boolean;
}> => {
  const [overlay, audio] = await Promise.all([
    checkOverlayPermission(),
    checkAudioPermission()
  ]);

  return { overlay, audio };
};
