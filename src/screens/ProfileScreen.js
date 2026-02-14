import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import SectionCard from '../components/SectionCard';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLoader from '../components/ScreenLoader';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';
import { ensurePermissionsAsync, notificationsSupported } from '../services/notifications';

const AnimatedSection = ({ value, children, style }) => (
  <Animated.View
    style={[
      style,
      {
        opacity: value,
        transform: [
          {
            translateY: value.interpolate({
              inputRange: [0, 1],
              outputRange: [14, 0]
            })
          }
        ]
      }
    ]}
  >
    {children}
  </Animated.View>
);

const StatChip = ({ label, value }) => (
  <View style={styles.statChip}>
    <Text style={styles.statLabel}>{label}</Text>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const ProfileScreen = () => {
  const { token, user, setUser, logout, setReminderEnabled } = useContext(AuthContext);
  const { showToast } = useToast();

  const [goals, setGoals] = useState({
    runningKm: '2',
    pushups: '20',
    biceps: '20',
    thighs: '20',
    shoulders: '20',
    sixpack: '20',
    chest: '20'
  });
  const [loading, setLoading] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [reminderOn, setReminderOn] = useState(false);
  const [timePickerOpen, setTimePickerOpen] = useState(false);
  const [reminderTime, setReminderTime] = useState({ hour: 20, minute: 0 });
  const [pendingTime, setPendingTime] = useState({ hour: 20, minute: 0 });

  const heroAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const goalsAnim = useRef(new Animated.Value(0)).current;
  const reminderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.stagger(90, [
      Animated.timing(heroAnim, { toValue: 1, duration: 230, useNativeDriver: true }),
      Animated.timing(statsAnim, { toValue: 1, duration: 230, useNativeDriver: true }),
      Animated.timing(goalsAnim, { toValue: 1, duration: 230, useNativeDriver: true }),
      Animated.timing(reminderAnim, { toValue: 1, duration: 230, useNativeDriver: true })
    ]).start();
  }, [heroAnim, statsAnim, goalsAnim, reminderAnim]);

  useEffect(() => {
    const loadReminder = async () => {
      const stored = await AsyncStorage.getItem('attendance_reminder_enabled');
      setReminderOn(stored === 'true');
      const storedTime = await AsyncStorage.getItem('attendance_reminder_time');
      if (storedTime) {
        const [hour, minute] = storedTime.split(':').map(Number);
        setReminderTime({ hour, minute });
        setPendingTime({ hour, minute });
      }
    };
    loadReminder();
  }, []);

  useEffect(() => {
    if (user?.goals) {
      setGoals({
        runningKm: String(user.goals.runningKm ?? 2),
        pushups: String(user.goals.pushups ?? 20),
        biceps: String(user.goals.biceps ?? 20),
        thighs: String(user.goals.thighs ?? 20),
        shoulders: String(user.goals.shoulders ?? 20),
        sixpack: String(user.goals.sixpack ?? 20),
        chest: String(user.goals.chest ?? 20)
      });
    }
  }, [user]);

  const initials = useMemo(() => {
    const name = user?.name || '';
    const trimmed = name.trim();
    if (!trimmed) return 'U';
    return trimmed[0].toUpperCase();
  }, [user?.name]);

  const strengthGoal = useMemo(
    () =>
      Number(goals.biceps || 0) +
      Number(goals.thighs || 0) +
      Number(goals.shoulders || 0) +
      Number(goals.sixpack || 0) +
      Number(goals.chest || 0),
    [goals]
  );

  const handleSave = async () => {
    try {
      setLoading(true);
      const payload = {
        runningKm: Number(goals.runningKm || 0),
        pushups: Number(goals.pushups || 0),
        biceps: Number(goals.biceps || 0),
        thighs: Number(goals.thighs || 0),
        shoulders: Number(goals.shoulders || 0),
        sixpack: Number(goals.sixpack || 0),
        chest: Number(goals.chest || 0)
      };
      const response = await api.put('/profile/goals', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.user);
      showToast({ type: 'success', title: 'Saved', message: 'Goals updated successfully.' });
      setEditOpen(false);
    } catch (error) {
      showToast({ type: 'error', title: 'Update failed', message: 'Unable to update goals.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#070d1a', '#0a1220', '#020617']} style={styles.container}>
      <ScreenLoader visible={loading} message="Saving profile..." />
      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedSection value={heroAnim}>
          <LinearGradient colors={['#111a2c', '#0b1322']} style={styles.hero}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <Text style={styles.name}>{user?.name || 'User'}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </LinearGradient>
        </AnimatedSection>

        <AnimatedSection value={statsAnim}>
          <View style={styles.statsRow}>
            <StatChip label="Run goal" value={`${goals.runningKm} km`} />
            <StatChip label="Push-up goal" value={`${goals.pushups}`} />
            <StatChip label="Strength goal" value={`${strengthGoal}`} />
          </View>
        </AnimatedSection>

        <AnimatedSection value={goalsAnim}>
          <SectionCard title="Daily Goals">
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Running</Text>
              <Text style={styles.goalValue}>{goals.runningKm} km</Text>
            </View>
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Push-ups</Text>
              <Text style={styles.goalValue}>{goals.pushups} reps</Text>
            </View>
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Biceps</Text>
              <Text style={styles.goalValue}>{goals.biceps} reps</Text>
            </View>
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Thighs</Text>
              <Text style={styles.goalValue}>{goals.thighs} reps</Text>
            </View>
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Shoulders</Text>
              <Text style={styles.goalValue}>{goals.shoulders} reps</Text>
            </View>
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Six-pack</Text>
              <Text style={styles.goalValue}>{goals.sixpack} reps</Text>
            </View>
            <View style={styles.goalRow}>
              <Text style={styles.goalLabel}>Chest</Text>
              <Text style={styles.goalValue}>{goals.chest} reps</Text>
            </View>
          </SectionCard>
        </AnimatedSection>

        <AnimatedSection value={reminderAnim}>
          <SectionCard title="Attendance Reminder">
            <View style={styles.reminderRow}>
              <View style={styles.reminderTextWrap}>
                <Text style={styles.reminderTitle}>Daily notification</Text>
                <Text style={styles.reminderHint}>
                  Scheduled at {String(reminderTime.hour).padStart(2, '0')}:
                  {String(reminderTime.minute).padStart(2, '0')} every day.
                </Text>
              </View>
              <Switch
                value={reminderOn}
                onValueChange={async (value) => {
                  if (value) {
                    if (!notificationsSupported()) {
                      showToast({
                        type: 'warning',
                        title: 'Not supported in Expo Go',
                        message: 'Use a development build to enable notifications.'
                      });
                      setReminderOn(false);
                      return;
                    }
                    const granted = await ensurePermissionsAsync();
                    if (!granted) {
                      showToast({
                        type: 'warning',
                        title: 'Permission required',
                        message: 'Enable notifications to receive reminders.'
                      });
                      setReminderOn(false);
                      return;
                    }
                  }
                  setReminderOn(value);
                  await setReminderEnabled(value);
                }}
                thumbColor={reminderOn ? '#f97316' : '#94a3b8'}
                trackColor={{ false: '#1f2937', true: '#fdba74' }}
              />
            </View>
            <View style={styles.reminderTimeRow}>
              <Text style={styles.reminderTimeLabel}>Schedule time</Text>
              <TouchableOpacity
                style={[styles.reminderTimeButton, !reminderOn ? styles.reminderTimeDisabled : null]}
                onPress={() => setTimePickerOpen(true)}
              >
                <Text style={styles.reminderTimeValue}>
                  {String(reminderTime.hour).padStart(2, '0')}:{String(reminderTime.minute).padStart(2, '0')}
                </Text>
              </TouchableOpacity>
            </View>
          </SectionCard>
        </AnimatedSection>

        <PrimaryButton label="Edit Goals" onPress={() => setEditOpen(true)} />
        <View style={styles.spacer} />
        <PrimaryButton label="Logout" onPress={() => setConfirmLogout(true)} />
      </ScrollView>

      <Modal transparent visible={editOpen} animationType="slide" onRequestClose={() => setEditOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Goals</Text>
              <TouchableOpacity onPress={() => setEditOpen(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <InputField label="Running (km)" value={goals.runningKm} onChangeText={(value) => setGoals((prev) => ({ ...prev, runningKm: value.replace(/[^0-9.]/g, '') }))} keyboardType="numeric" />
              <InputField label="Push-ups" value={goals.pushups} onChangeText={(value) => setGoals((prev) => ({ ...prev, pushups: value.replace(/[^0-9]/g, '') }))} keyboardType="numeric" />
              <InputField label="Biceps" value={goals.biceps} onChangeText={(value) => setGoals((prev) => ({ ...prev, biceps: value.replace(/[^0-9]/g, '') }))} keyboardType="numeric" />
              <InputField label="Thighs" value={goals.thighs} onChangeText={(value) => setGoals((prev) => ({ ...prev, thighs: value.replace(/[^0-9]/g, '') }))} keyboardType="numeric" />
              <InputField label="Shoulders" value={goals.shoulders} onChangeText={(value) => setGoals((prev) => ({ ...prev, shoulders: value.replace(/[^0-9]/g, '') }))} keyboardType="numeric" />
              <InputField label="Six-pack" value={goals.sixpack} onChangeText={(value) => setGoals((prev) => ({ ...prev, sixpack: value.replace(/[^0-9]/g, '') }))} keyboardType="numeric" />
              <InputField label="Chest" value={goals.chest} onChangeText={(value) => setGoals((prev) => ({ ...prev, chest: value.replace(/[^0-9]/g, '') }))} keyboardType="numeric" />
              <PrimaryButton label={loading ? 'Saving...' : 'Save Goals'} onPress={handleSave} disabled={loading} />
              <View style={styles.modalSpacer} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      <ConfirmModal
        visible={confirmLogout}
        title="Log out?"
        message="You will need to sign in again to access your data."
        confirmText="Logout"
        onCancel={() => setConfirmLogout(false)}
        onConfirm={() => {
          setConfirmLogout(false);
          logout();
        }}
      />

      <Modal transparent visible={timePickerOpen} animationType="fade" onRequestClose={() => setTimePickerOpen(false)}>
        <View style={styles.timeOverlay}>
          <TouchableOpacity style={styles.timeBackdrop} onPress={() => setTimePickerOpen(false)} />
          <View style={styles.timeCard}>
            <Text style={styles.timeTitle}>Choose reminder time</Text>
            <DateTimePicker
              value={new Date(2020, 1, 1, pendingTime.hour, pendingTime.minute)}
              mode="time"
              is24Hour={true}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={async (event, selectedDate) => {
                if (Platform.OS === 'android') {
                  if (event.type === 'dismissed') {
                    setTimePickerOpen(false);
                    return;
                  }
                  if (event.type === 'set' && selectedDate) {
                    const nextHour = selectedDate.getHours();
                    const nextMinute = selectedDate.getMinutes();
                    setPendingTime({ hour: nextHour, minute: nextMinute });
                    setReminderTime({ hour: nextHour, minute: nextMinute });
                    await AsyncStorage.setItem('attendance_reminder_time', `${nextHour}:${nextMinute}`);
                    if (reminderOn) {
                      await setReminderEnabled(false);
                      await setReminderEnabled(true);
                    }
                    setTimePickerOpen(false);
                  }
                  return;
                }

                if (!selectedDate) {
                  return;
                }
                const nextHour = selectedDate.getHours();
                const nextMinute = selectedDate.getMinutes();
                setPendingTime({ hour: nextHour, minute: nextMinute });
              }}
            />
            <View style={styles.timeActions}>
              <TouchableOpacity onPress={() => setTimePickerOpen(false)} style={styles.timeButton}>
                <Text style={styles.timeButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={async () => {
                  setReminderTime(pendingTime);
                  await AsyncStorage.setItem('attendance_reminder_time', `${pendingTime.hour}:${pendingTime.minute}`);
                  if (reminderOn) {
                    await setReminderEnabled(false);
                    await setReminderEnabled(true);
                  }
                  setTimePickerOpen(false);
                }}
                style={[styles.timeButton, styles.timeButtonPrimary]}
              >
                <Text style={styles.timeButtonTextPrimary}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 60, paddingBottom: 30 },
  hero: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#23344f',
    padding: 18,
    marginBottom: 12,
    alignItems: 'center'
  },
  avatar: {
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#0b1220',
    borderWidth: 2,
    borderColor: '#2b3d5a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarText: { color: '#f97316', fontSize: 34, fontWeight: '700' },
  name: { color: '#f8fafc', fontSize: 24, fontWeight: '700', marginTop: 10 },
  email: { color: '#93a4be', marginTop: 4 },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 8
  },
  statChip: {
    flex: 1,
    backgroundColor: '#0c1424',
    borderWidth: 1,
    borderColor: '#1f2f49',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 10
  },
  statLabel: { color: '#93a4be', fontSize: 12 },
  statValue: { color: '#f8fafc', fontWeight: '700', marginTop: 4 },
  goalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  goalLabel: { color: '#b7c6dd' },
  goalValue: { color: '#f8fafc', fontWeight: '700' },
  reminderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reminderTextWrap: { flex: 1, paddingRight: 12 },
  reminderTitle: { color: '#f8fafc', fontWeight: '700' },
  reminderHint: { color: '#93a4be', marginTop: 4 },
  reminderTimeRow: {
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  reminderTimeLabel: { color: '#cbd5f5' },
  reminderTimeButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  reminderTimeValue: { color: '#f8fafc', fontWeight: '600' },
  reminderTimeDisabled: { opacity: 0.5 },
  spacer: { height: 10 },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#0b1220',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: '80%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  modalTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  modalClose: { color: '#f97316', fontWeight: '600' },
  modalSpacer: { height: 12 },
  timeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24
  },
  timeBackdrop: {
    ...StyleSheet.absoluteFillObject
  },
  timeCard: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#0b1220',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#1e293b'
  },
  timeTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 16, marginBottom: 12 },
  timeActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12
  },
  timeButton: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#111827'
  },
  timeButtonText: { color: '#e2e8f0', fontWeight: '600' },
  timeButtonPrimary: { backgroundColor: '#f97316' },
  timeButtonTextPrimary: { color: '#0b1220', fontWeight: '700' }
});

export default ProfileScreen;
