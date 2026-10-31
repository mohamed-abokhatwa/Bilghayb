import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { strings, type Locale } from './i18n';

// Local reminders work everywhere (even in demo mode). The server can also
// send pushes via the token we register.

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensurePermission() {
  if (Platform.OS === 'web') return false;
  const cur = await Notifications.getPermissionsAsync();
  if (cur.granted) return true;
  const req = await Notifications.requestPermissionsAsync();
  return req.granted;
}

export async function getPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;
  try {
    const projectId =
      (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
      Constants.easConfig?.projectId;
    if (!projectId) return null;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}

export async function scheduleReminders(locale: Locale, morning: boolean, special: boolean) {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!(await ensurePermission())) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('reminders', {
      name: 'Reminders',
      // eslint-disable-next-line import/namespace -- re-exported through nested modules; tsc verifies it
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
  const s = strings[locale];
  const channel = Platform.OS === 'android' ? { channelId: 'reminders' } : {};

  if (morning) {
    await Notifications.scheduleNotificationAsync({
      content: { title: s.yourPersonToday + ' 🤍', body: s.ob2Body },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 6, minute: 0, ...channel },
    });
  }
  if (special) {
    // Last third of the night (approx.)
    await Notifications.scheduleNotificationAsync({
      content: { title: s.specialTime, body: locale === 'ar' ? 'ينزل ربنا في الثلث الأخير من الليل.' : 'Our Lord descends in the last third of the night.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: 3, minute: 30, ...channel },
    });
    // Friday, last hour before Maghrib (approx.). Weekday: 1 = Sunday … 6 = Friday.
    await Notifications.scheduleNotificationAsync({
      content: { title: s.specialTime, body: locale === 'ar' ? 'آخر ساعة من يوم الجمعة.' : 'The last hour of Friday.' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.WEEKLY, weekday: 6, hour: 17, minute: 0, ...channel },
    });
  }
}
