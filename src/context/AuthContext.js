import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';
import { cancelAttendanceReminder, scheduleDailyAttendanceReminder } from '../services/notifications';

const AuthContext = createContext(null);

const TOKEN_KEY = 'dms_token';
const REMINDER_ENABLED_KEY = 'attendance_reminder_enabled';
const REMINDER_TIME_KEY = 'attendance_reminder_time';

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadToken = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      if (storedToken) {
        setToken(storedToken);
        const profile = await api.get('/profile', {
          headers: { Authorization: `Bearer ${storedToken}` }
        });
        setUser(profile.data.user);

        const reminderEnabled = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);
        if (reminderEnabled === 'true') {
          const reminderTime = await AsyncStorage.getItem(REMINDER_TIME_KEY);
          const [hour, minute] = reminderTime ? reminderTime.split(':').map(Number) : [20, 0];
          await scheduleDailyAttendanceReminder({
            storage: AsyncStorage,
            title: "Attendance reminder",
            body: "Don’t forget to log today’s workout.",
            hour,
            minute
          });
        }
      }
    } catch (error) {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  const login = async (email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const response = await api.post('/auth/login', { email: normalizedEmail, password });
    await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);

    const reminderEnabled = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);
    if (reminderEnabled === 'true') {
      const reminderTime = await AsyncStorage.getItem(REMINDER_TIME_KEY);
      const [hour, minute] = reminderTime ? reminderTime.split(':').map(Number) : [20, 0];
      await scheduleDailyAttendanceReminder({
        storage: AsyncStorage,
        title: "Attendance reminder",
        body: "Don’t forget to log today’s workout.",
        hour,
        minute
      });
    }
  };

  const signup = async (name, email, password) => {
    const normalizedEmail = email.trim().toLowerCase();
    const response = await api.post('/auth/signup', { name, email: normalizedEmail, password });
    await AsyncStorage.setItem(TOKEN_KEY, response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);

    const reminderEnabled = await AsyncStorage.getItem(REMINDER_ENABLED_KEY);
    if (reminderEnabled === 'true') {
      const reminderTime = await AsyncStorage.getItem(REMINDER_TIME_KEY);
      const [hour, minute] = reminderTime ? reminderTime.split(':').map(Number) : [20, 0];
      await scheduleDailyAttendanceReminder({
        storage: AsyncStorage,
        title: "Attendance reminder",
        body: "Don’t forget to log today’s workout.",
        hour,
        minute
      });
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    await cancelAttendanceReminder(AsyncStorage);
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, setUser, login, signup, logout, loading, setReminderEnabled: async (enabled) => {
      await AsyncStorage.setItem(REMINDER_ENABLED_KEY, enabled ? 'true' : 'false');
      if (enabled) {
        const reminderTime = await AsyncStorage.getItem(REMINDER_TIME_KEY);
        const [hour, minute] = reminderTime ? reminderTime.split(':').map(Number) : [20, 0];
        await scheduleDailyAttendanceReminder({
          storage: AsyncStorage,
          title: "Attendance reminder",
          body: "Don’t forget to log today’s workout.",
          hour,
          minute
        });
      } else {
        await cancelAttendanceReminder(AsyncStorage);
      }
    } }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
