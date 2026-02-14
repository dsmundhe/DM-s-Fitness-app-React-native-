import { Platform } from 'react-native';
import Constants from 'expo-constants';

const REMINDER_ID_KEY = 'attendance_reminder_id';
const isExpoGo = Constants.executionEnvironment === 'storeClient';
let notificationsModule = null;

export const notificationsSupported = () => !isExpoGo;

const getNotificationsModule = async () => {
  if (isExpoGo) {
    return null;
  }
  if (notificationsModule) {
    return notificationsModule;
  }
  const mod = await import('expo-notifications');
  notificationsModule = mod;
  return notificationsModule;
};

export const configureNotifications = async () => {
  const notifications = await getNotificationsModule();
  if (!notifications) {
    return false;
  }

  notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false
    })
  });

  if (Platform.OS === 'android') {
    await notifications.setNotificationChannelAsync('attendance-reminders', {
      name: 'Attendance Reminders',
      importance: notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#f97316'
    });
  }

  return true;
};

export const ensurePermissionsAsync = async () => {
  const notifications = await getNotificationsModule();
  if (!notifications) {
    return false;
  }

  const settings = await notifications.getPermissionsAsync();
  if (settings.status !== 'granted') {
    const request = await notifications.requestPermissionsAsync();
    return request.status === 'granted';
  }
  return true;
};

export const scheduleDailyAttendanceReminder = async ({ storage, title, body, hour = 20, minute = 0 }) => {
  const notifications = await getNotificationsModule();
  if (!notifications) {
    return null;
  }

  const enabled = await ensurePermissionsAsync();
  if (!enabled) {
    return null;
  }

  const existingId = await storage.getItem(REMINDER_ID_KEY);
  if (existingId) {
    return existingId;
  }

  const id = await notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      sound: 'default'
    },
    trigger: {
      hour,
      minute,
      repeats: true,
      channelId: 'attendance-reminders'
    }
  });

  await storage.setItem(REMINDER_ID_KEY, id);
  return id;
};

export const cancelAttendanceReminder = async (storage) => {
  const notifications = await getNotificationsModule();
  if (!notifications) {
    await storage.removeItem(REMINDER_ID_KEY);
    return;
  }

  const existingId = await storage.getItem(REMINDER_ID_KEY);
  if (existingId) {
    await notifications.cancelScheduledNotificationAsync(existingId);
    await storage.removeItem(REMINDER_ID_KEY);
  }
};
