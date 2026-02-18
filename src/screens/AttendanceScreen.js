import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AppGradient from '../components/AppGradient';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import SectionCard from '../components/SectionCard';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLoader from '../components/ScreenLoader';
import { useToast } from '../context/ToastContext';
import { toDateString } from '../utils/date';
import { readCache, removeCacheByPrefix, writeCache } from '../services/cache';

const ATTENDANCE_TTL_MS = 2 * 60 * 1000;

const MetricTile = ({ label, value, unit }) => (
  <View style={styles.metricTile}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>
      {value}
      {unit ? <Text style={styles.metricUnit}> {unit}</Text> : null}
    </Text>
  </View>
);

const AttendanceScreen = () => {
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();
  const [loading, setLoading] = useState(false);
  const [loadingEntry, setLoadingEntry] = useState(true);
  const [goalCompletion, setGoalCompletion] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({
    runningKm: '0',
    pushups: '0',
    biceps: '0',
    thighs: '0',
    shoulders: '0',
    sixpack: '0',
    chest: '0'
  });

  const today = toDateString();
  const heroAnim = useRef(new Animated.Value(0)).current;
  const modalAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(heroAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [heroAnim]);

  useEffect(() => {
    Animated.timing(modalAnim, {
      toValue: formOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: true
    }).start();
  }, [formOpen, modalAnim]);

  const loadEntry = async () => {
    try {
      setLoadingEntry(true);
      const cacheKey = `workout:date:${today}:${token?.slice(-8) || 'anon'}`;
      const cached = await readCache(cacheKey, ATTENDANCE_TTL_MS);
      if (cached?.entry) {
        const entry = cached.entry;
        setForm({
          runningKm: String(entry.runningKm || 0),
          pushups: String(entry.pushups || 0),
          biceps: String(entry.biceps || 0),
          thighs: String(entry.thighs || 0),
          shoulders: String(entry.shoulders || 0),
          sixpack: String(entry.sixpack || 0),
          chest: String(entry.chest || 0)
        });
        if (typeof cached.goalCompletion === 'number') {
          setGoalCompletion(cached.goalCompletion);
        }
        return;
      }
      const response = await api.get(`/workouts/date/${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await writeCache(cacheKey, response.data);
      if (response.data.entry) {
        const entry = response.data.entry;
        setForm({
          runningKm: String(entry.runningKm || 0),
          pushups: String(entry.pushups || 0),
          biceps: String(entry.biceps || 0),
          thighs: String(entry.thighs || 0),
          shoulders: String(entry.shoulders || 0),
          sixpack: String(entry.sixpack || 0),
          chest: String(entry.chest || 0)
        });
        setGoalCompletion(response.data.goalCompletion ?? null);
      }
    } catch (error) {
      showToast({ type: 'error', title: 'Load failed', message: 'Unable to load today attendance.' });
    } finally {
      setLoadingEntry(false);
    }
  };

  useEffect(() => {
    loadEntry();
  }, []);

  const handleChange = (key, value) => {
    const sanitized = value.replace(/[^0-9.]/g, '');
    setForm((prev) => ({ ...prev, [key]: sanitized }));
  };

  const totalStrength = useMemo(
    () =>
      Number(form.biceps || 0) +
      Number(form.thighs || 0) +
      Number(form.shoulders || 0) +
      Number(form.sixpack || 0) +
      Number(form.chest || 0),
    [form]
  );

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const payload = {
        date: today,
        runningKm: Number(form.runningKm || 0),
        pushups: Number(form.pushups || 0),
        biceps: Number(form.biceps || 0),
        thighs: Number(form.thighs || 0),
        shoulders: Number(form.shoulders || 0),
        sixpack: Number(form.sixpack || 0),
        chest: Number(form.chest || 0)
      };

      const response = await api.post('/workouts', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setGoalCompletion(response.data.goalCompletion ?? null);
      const cacheKey = `workout:date:${today}:${token?.slice(-8) || 'anon'}`;
      await writeCache(cacheKey, { entry: payload, goalCompletion: response.data.goalCompletion ?? null });
      await removeCacheByPrefix('dashboard:');
      await removeCacheByPrefix('trends:');
      showToast({ type: 'success', title: 'Saved', message: 'Attendance updated successfully.' });
      setFormOpen(false);
    } catch (error) {
      showToast({ type: 'error', title: 'Save failed', message: 'Unable to save attendance.' });
    } finally {
      setLoading(false);
    }
  };

  const modalTranslateY = modalAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [280, 0]
  });

  return (
    <AppGradient style={styles.container}>
      <ScreenLoader visible={loadingEntry} message="Loading attendance..." />
      <ScrollView contentContainerStyle={styles.content}>
        <Animated.View
          style={[
            styles.hero,
            {
              opacity: heroAnim,
              transform: [
                {
                  translateY: heroAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [16, 0]
                  })
                }
              ]
            }
          ]}
        >
          <View style={styles.heroTop}>
            <View>
              <Text style={styles.heroTitle}>Attendance</Text>
              <Text style={styles.heroDate}>{today}</Text>
            </View>
            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeText}>Daily Log</Text>
            </View>
          </View>
          <Text style={styles.heroSub}>Track your daily output and keep your consistency streak alive.</Text>
          <PrimaryButton label="Log Attendance" onPress={() => setFormOpen(true)} />
        </Animated.View>

        <SectionCard title="Today Snapshot">
          <View style={styles.metricsGrid}>
            <MetricTile label="Running" value={form.runningKm} unit="km" />
            <MetricTile label="Push-ups" value={form.pushups} unit="reps" />
            <MetricTile label="Strength" value={totalStrength} unit="reps" />
          </View>
        </SectionCard>

        <SectionCard title="Body Group Distribution">
          <View style={styles.listCard}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Biceps</Text>
              <Text style={styles.rowValue}>{form.biceps}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Thighs</Text>
              <Text style={styles.rowValue}>{form.thighs}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Shoulders</Text>
              <Text style={styles.rowValue}>{form.shoulders}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Six-pack</Text>
              <Text style={styles.rowValue}>{form.sixpack}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Chest</Text>
              <Text style={styles.rowValue}>{form.chest}</Text>
            </View>
          </View>
        </SectionCard>

        {goalCompletion !== null ? (
          <SectionCard title="Completion Score">
            <View style={styles.completionWrap}>
              <Text style={styles.completionValue}>{goalCompletion}%</Text>
              <Text style={styles.completionText}>of your daily target completed</Text>
            </View>
          </SectionCard>
        ) : null}
      </ScrollView>

      <Modal transparent visible={formOpen} animationType="none" onRequestClose={() => setFormOpen(false)}>
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalCard,
              {
                opacity: modalAnim,
                transform: [{ translateY: modalTranslateY }]
              }
            ]}
          >
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Log Today Attendance</Text>
                <Text style={styles.modalSubtitle}>{today}</Text>
              </View>
              <TouchableOpacity onPress={() => setFormOpen(false)} style={styles.modalCloseButton}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Cardio & Core</Text>
                <InputField label="Running (km)" value={form.runningKm} onChangeText={(value) => handleChange('runningKm', value)} keyboardType="numeric" />
                <InputField label="Push-ups (reps)" value={form.pushups} onChangeText={(value) => handleChange('pushups', value)} keyboardType="numeric" />
                <InputField label="Six-pack (reps)" value={form.sixpack} onChangeText={(value) => handleChange('sixpack', value)} keyboardType="numeric" />
              </View>
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>Strength</Text>
                <InputField label="Biceps (reps)" value={form.biceps} onChangeText={(value) => handleChange('biceps', value)} keyboardType="numeric" />
                <InputField label="Thighs (reps)" value={form.thighs} onChangeText={(value) => handleChange('thighs', value)} keyboardType="numeric" />
                <InputField label="Shoulders (reps)" value={form.shoulders} onChangeText={(value) => handleChange('shoulders', value)} keyboardType="numeric" />
                <InputField label="Chest (reps)" value={form.chest} onChangeText={(value) => handleChange('chest', value)} keyboardType="numeric" />
              </View>
              <PrimaryButton label={loading ? 'Saving...' : 'Save Attendance'} onPress={handleSubmit} disabled={loading} />
              <View style={styles.modalSpacer} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

      <ScreenLoader visible={loading} message="Saving attendance..." />
    </AppGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 56, paddingBottom: 30 },
  hero: {
    backgroundColor: '#0b1322',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1f2d45',
    padding: 18,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  heroBadge: {
    backgroundColor: '#0a1323',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#24324a'
  },
  heroBadgeText: { color: '#f97316', fontSize: 12, fontWeight: '700' },
  heroTitle: { color: '#f8fafc', fontSize: 24, fontWeight: '700' },
  heroDate: { color: '#f97316', marginTop: 4, marginBottom: 8, fontWeight: '600' },
  heroSub: { color: '#b7c6dd', marginBottom: 14 },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8
  },
  metricTile: {
    flex: 1,
    backgroundColor: '#0c1426',
    borderWidth: 1,
    borderColor: '#1e2a41',
    borderRadius: 16,
    padding: 12
  },
  metricLabel: { color: '#93a4be', fontSize: 12 },
  metricValue: { color: '#f8fafc', fontWeight: '700', fontSize: 20, marginTop: 4 },
  metricUnit: { color: '#93a4be', fontSize: 12, fontWeight: '500' },
  listCard: {
    backgroundColor: '#0c1426',
    borderWidth: 1,
    borderColor: '#1e2a41',
    borderRadius: 16,
    padding: 12
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  rowLabel: { color: '#b7c6dd' },
  rowValue: { color: '#f8fafc', fontWeight: '700' },
  completionWrap: { alignItems: 'center', paddingVertical: 8 },
  completionValue: { color: '#f97316', fontSize: 32, fontWeight: '700' },
  completionText: { color: '#93a4be' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#0b1322',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderWidth: 1,
    borderColor: '#1f2d45',
    padding: 18,
    maxHeight: '83%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  modalTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  modalSubtitle: { color: '#93a4be', marginTop: 4 },
  modalCloseButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#26344d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0a1323'
  },
  modalClose: { color: '#f97316', fontWeight: '600' },
  modalSection: {
    backgroundColor: '#0c1426',
    borderWidth: 1,
    borderColor: '#1e2a41',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12
  },
  modalSectionTitle: { color: '#a5b4fc', fontWeight: '700', marginBottom: 8 },
  modalSpacer: { height: 10 }
});

export default AttendanceScreen;
