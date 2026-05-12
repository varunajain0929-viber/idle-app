import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const STORAGE_KEY = 'idle.morningBell.v1';
const NOTIFICATION_ID = 'idle-morning-bell';
const HOUR = 6;
const MINUTE = 0;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function isStoredEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw === '1';
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('idle-morning-bell', {
    name: 'Morning bell',
    importance: Notifications.AndroidImportance.DEFAULT,
    sound: 'default',
    enableVibrate: false,
    showBadge: false,
  });
}

async function scheduleBell() {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => {});
  await Notifications.scheduleNotificationAsync({
    identifier: NOTIFICATION_ID,
    content: {
      title: 'Today is fresh.',
      sound: 'default',
      ...(Platform.OS === 'android' ? { channelId: 'idle-morning-bell' } : null),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: HOUR,
      minute: MINUTE,
    },
  });
}

export async function enable(): Promise<boolean> {
  const existing = await Notifications.getPermissionsAsync();
  let granted = existing.granted;
  if (!granted && existing.canAskAgain) {
    const asked = await Notifications.requestPermissionsAsync();
    granted = asked.granted;
  }
  if (!granted) {
    await AsyncStorage.setItem(STORAGE_KEY, '0');
    return false;
  }
  await ensureAndroidChannel();
  await scheduleBell();
  await AsyncStorage.setItem(STORAGE_KEY, '1');
  return true;
}

export async function disable(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(NOTIFICATION_ID).catch(() => {});
  await AsyncStorage.setItem(STORAGE_KEY, '0');
}

export async function reconcileOnBoot(): Promise<void> {
  const enabled = await isStoredEnabled();
  if (!enabled) return;
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) {
    await AsyncStorage.setItem(STORAGE_KEY, '0');
    return;
  }
  await ensureAndroidChannel();
  await scheduleBell();
}
