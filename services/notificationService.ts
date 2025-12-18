import { LocalNotifications, ScheduleOptions } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';

// 네이티브 플랫폼인지 확인
export const isNativePlatform = (): boolean => {
  return Capacitor.isNativePlatform();
};

// 알림 권한 요청
export const requestPermission = async (): Promise<boolean> => {
  if (!isNativePlatform()) {
    console.log('웹 환경에서는 알림이 지원되지 않습니다.');
    return false;
  }

  try {
    const permission = await LocalNotifications.requestPermissions();
    return permission.display === 'granted';
  } catch (error) {
    console.error('알림 권한 요청 실패:', error);
    return false;
  }
};

// 권한 상태 확인
export const checkPermission = async (): Promise<boolean> => {
  if (!isNativePlatform()) return false;

  try {
    const permission = await LocalNotifications.checkPermissions();
    return permission.display === 'granted';
  } catch (error) {
    console.error('알림 권한 확인 실패:', error);
    return false;
  }
};

// 모든 예약된 알림 취소
export const cancelAllNotifications = async (): Promise<void> => {
  if (!isNativePlatform()) return;

  try {
    const pending = await LocalNotifications.getPending();
    if (pending.notifications.length > 0) {
      await LocalNotifications.cancel({
        notifications: pending.notifications.map(n => ({ id: n.id }))
      });
    }
  } catch (error) {
    console.error('알림 취소 실패:', error);
  }
};

// 아침/저녁 알림 예약
export const scheduleReminders = async (
  morningTime: string,  // "09:00" 형식
  eveningTime: string   // "20:00" 형식
): Promise<boolean> => {
  if (!isNativePlatform()) {
    console.log('웹 환경: 알림 예약 스킵');
    return false;
  }

  try {
    // 기존 알림 취소
    await cancelAllNotifications();

    const [morningHour, morningMin] = morningTime.split(':').map(Number);
    const [eveningHour, eveningMin] = eveningTime.split(':').map(Number);

    const scheduleOptions: ScheduleOptions = {
      notifications: [
        {
          id: 1,
          title: "🌅 좋은 아침이에요!",
          body: "오늘의 할 일을 확인하고 하루를 시작하세요.",
          schedule: {
            on: {
              hour: morningHour,
              minute: morningMin
            },
            repeats: true,
            allowWhileIdle: true
          },
          sound: 'default',
          actionTypeId: 'MORNING_ACTION'
        },
        {
          id: 2,
          title: "🌙 하루 마무리 시간이에요",
          body: "오늘 하루를 정리하고 내일을 준비하세요.",
          schedule: {
            on: {
              hour: eveningHour,
              minute: eveningMin
            },
            repeats: true,
            allowWhileIdle: true
          },
          sound: 'default',
          actionTypeId: 'EVENING_ACTION'
        }
      ]
    };

    await LocalNotifications.schedule(scheduleOptions);
    console.log(`알림 예약 완료: 아침 ${morningTime}, 저녁 ${eveningTime}`);
    return true;
  } catch (error) {
    console.error('알림 예약 실패:', error);
    return false;
  }
};

// 즉시 테스트 알림 보내기
export const sendTestNotification = async (type: 'morning' | 'evening'): Promise<void> => {
  if (!isNativePlatform()) {
    console.log('웹 환경: 테스트 알림 스킵');
    return;
  }

  try {
    const isMorning = type === 'morning';
    await LocalNotifications.schedule({
      notifications: [
        {
          id: isMorning ? 100 : 101,
          title: isMorning ? "🌅 아침 알림 테스트" : "🌙 저녁 알림 테스트",
          body: isMorning 
            ? "아침 알림이 정상적으로 작동합니다!" 
            : "저녁 알림이 정상적으로 작동합니다!",
          schedule: {
            at: new Date(Date.now() + 1000) // 1초 후
          },
          sound: 'default'
        }
      ]
    });
  } catch (error) {
    console.error('테스트 알림 실패:', error);
  }
};

// 알림 클릭 리스너 설정
export const setupNotificationListeners = (
  onMorningClick: () => void,
  onEveningClick: () => void
): void => {
  if (!isNativePlatform()) return;

  LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
    const id = notification.notification.id;
    if (id === 1 || id === 100) {
      onMorningClick();
    } else if (id === 2 || id === 101) {
      onEveningClick();
    }
  });
};

// 리스너 제거
export const removeNotificationListeners = (): void => {
  if (!isNativePlatform()) return;
  LocalNotifications.removeAllListeners();
};

// [신규] 즉시 아침 푸시 알림 전송 (알람음 포함)
export const sendMorningNotification = async (soundId: string): Promise<void> => {
  if (!isNativePlatform()) {
    console.log('웹 환경: 푸시 알림 스킵');
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 200,
          title: "🌅 좋은 아침이에요!",
          body: "오늘의 할 일을 확인하고 하루를 시작하세요.",
          schedule: {
            at: new Date(Date.now() + 100) // 즉시
          },
          sound: soundId, // 사용자가 선택한 알람음
          actionTypeId: 'MORNING_ACTION'
        }
      ]
    });
  } catch (error) {
    console.error('아침 푸시 알림 실패:', error);
  }
};

// [신규] 즉시 저녁 푸시 알림 전송 (알람음 포함)
export const sendEveningNotification = async (soundId: string): Promise<void> => {
  if (!isNativePlatform()) {
    console.log('웹 환경: 푸시 알림 스킵');
    return;
  }

  try {
    await LocalNotifications.schedule({
      notifications: [
        {
          id: 201,
          title: "🌙 하루 마무리 시간이에요",
          body: "오늘 하루를 정리하고 내일을 준비하세요.",
          schedule: {
            at: new Date(Date.now() + 100) // 즉시
          },
          sound: soundId, // 사용자가 선택한 알람음
          actionTypeId: 'EVENING_ACTION'
        }
      ]
    });
  } catch (error) {
    console.error('저녁 푸시 알림 실패:', error);
  }
};