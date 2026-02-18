import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AppGradient from '../components/AppGradient';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import SectionCard from '../components/SectionCard';
import ScreenLoader from '../components/ScreenLoader';
import { useToast } from '../context/ToastContext';
import { toDateString } from '../utils/date';
import { readCache, writeCache } from '../services/cache';

const DASHBOARD_TTL_MS = 2 * 60 * 1000;

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
              outputRange: [16, 0]
            })
          }
        ]
      }
    ]}
  >
    {children}
  </Animated.View>
);

const KpiTile = ({ label, value, accent }) => (
  <View style={styles.kpiTile}>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
  </View>
);

const MomentumRow = ({ label, current, total, color }) => {
  const pct = total > 0 ? Math.min(100, Math.round((current / total) * 100)) : 0;
  return (
    <View style={styles.momentumRow}>
      <View style={styles.momentumHeader}>
        <Text style={styles.momentumLabel}>{label}</Text>
        <Text style={styles.momentumValue}>
          {current}/{total} ({pct}%)
        </Text>
      </View>
      <View style={styles.momentumTrack}>
        <View style={[styles.momentumFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const StreakScreen = () => {
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const kpiAnim = useRef(new Animated.Value(0)).current;
  const momentumAnim = useRef(new Animated.Value(0)).current;
  const strategyAnim = useRef(new Animated.Value(0)).current;

  const loadStreak = async () => {
    try {
      const today = toDateString();
      const cacheKey = `dashboard:${today}:${token?.slice(-8) || 'anon'}`;
      const cached = await readCache(cacheKey, DASHBOARD_TTL_MS);
      if (cached) {
        setData(cached);
        return;
      }
      const response = await api.get(`/analytics/dashboard?today=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
      await writeCache(cacheKey, response.data);
    } catch (error) {
      showToast({ type: 'error', title: 'Streak error', message: 'Unable to load streak data.' });
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadStreak();
      setLoading(false);
      Animated.stagger(100, [
        Animated.timing(heroAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(kpiAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(momentumAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(strategyAnim, { toValue: 1, duration: 260, useNativeDriver: true })
      ]).start();
    })();
  }, []);

  const streak = data?.streakCount || 0;
  const best = data?.bestStreak || 0;
  const weekly = data?.attendance?.week || 0;
  const monthly = data?.attendance?.month || 0;
  const fitness = data?.fitnessScore || 0;

  const weeklyPct = useMemo(() => Math.min(100, Math.round((weekly / 7) * 100)), [weekly]);
  const monthlyPct = useMemo(() => Math.min(100, Math.round((monthly / 30) * 100)), [monthly]);
  const streakHealth = useMemo(() => Math.min(100, Math.round((weeklyPct * 0.6) + (monthlyPct * 0.4))), [weeklyPct, monthlyPct]);

  const headline = useMemo(() => {
    if (streak >= 10) return 'Elite consistency. Protect recovery and keep quality high.';
    if (streak >= 5) return 'Great streak. Keep logging before the day closes.';
    if (streak >= 2) return 'Momentum is active. Build one more win today.';
    return 'Start the streak today with one focused session.';
  }, [streak]);

  return (
    <AppGradient style={styles.container}>
      <ScreenLoader visible={loading} message="Loading streak..." />
      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedSection value={heroAnim}>
          <LinearGradient colors={['#111a2c', '#0b1322']} style={styles.hero}>
            <Text style={styles.heroTitle}>Streak Intelligence</Text>
            <Text style={styles.heroSubtitle}>{headline}</Text>
            <View style={styles.ring}>
              <Text style={styles.ringValue}>{streak}</Text>
              <Text style={styles.ringLabel}>current days</Text>
            </View>
            <Text style={styles.heroFooter}>Best streak: {best} days</Text>
          </LinearGradient>
        </AnimatedSection>

        <AnimatedSection value={kpiAnim}>
          <View style={styles.kpiGrid}>
            <KpiTile label="Streak health" value={`${streakHealth}%`} accent="#f97316" />
            <KpiTile label="Weekly ratio" value={`${weeklyPct}%`} accent="#38bdf8" />
            <KpiTile label="Monthly ratio" value={`${monthlyPct}%`} accent="#22c55e" />
            <KpiTile label="Fitness score" value={fitness} accent="#f59e0b" />
          </View>
        </AnimatedSection>

        <AnimatedSection value={momentumAnim}>
          <SectionCard title="Momentum Tracker">
            <MomentumRow label="Weekly attendance" current={weekly} total={7} color="#f97316" />
            <MomentumRow label="Monthly attendance" current={monthly} total={30} color="#38bdf8" />
            <View style={styles.healthBox}>
              <Text style={styles.healthTitle}>Consistency Index</Text>
              <Text style={styles.healthValue}>{streakHealth}%</Text>
            </View>
          </SectionCard>
        </AnimatedSection>

        <AnimatedSection value={strategyAnim}>
          <SectionCard title="Execution Plan">
            <View style={styles.planRow}>
              <Text style={styles.planNum}>1</Text>
              <Text style={styles.planText}>Log attendance before your reminder time daily.</Text>
            </View>
            <View style={styles.planRow}>
              <Text style={styles.planNum}>2</Text>
              <Text style={styles.planText}>Target one high-value workout and one light recovery session weekly.</Text>
            </View>
            <View style={styles.planRow}>
              <Text style={styles.planNum}>3</Text>
              <Text style={styles.planText}>Keep at least 70% weekly attendance to grow streak durability.</Text>
            </View>
          </SectionCard>
        </AnimatedSection>
      </ScrollView>
    </AppGradient>
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
    marginBottom: 14,
    alignItems: 'center'
  },
  heroTitle: { color: '#f8fafc', fontSize: 24, fontWeight: '700' },
  heroSubtitle: { color: '#b7c6dd', marginTop: 6, marginBottom: 14, textAlign: 'center' },
  ring: {
    width: 146,
    height: 146,
    borderRadius: 73,
    borderWidth: 5,
    borderColor: '#f97316',
    backgroundColor: '#0f172a',
    alignItems: 'center',
    justifyContent: 'center'
  },
  ringValue: { color: '#f97316', fontSize: 40, fontWeight: '700' },
  ringLabel: { color: '#cbd5f5', marginTop: 4 },
  heroFooter: { color: '#93a4be', marginTop: 12 },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  kpiTile: {
    width: '48%',
    backgroundColor: '#0c1424',
    borderWidth: 1,
    borderColor: '#1f2f49',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10
  },
  kpiLabel: { color: '#93a4be', fontSize: 12 },
  kpiValue: { marginTop: 6, fontSize: 22, fontWeight: '700' },
  momentumRow: { marginBottom: 14 },
  momentumHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  momentumLabel: { color: '#d1def1', fontWeight: '600' },
  momentumValue: { color: '#93a4be' },
  momentumTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: '#0c1628',
    borderWidth: 1,
    borderColor: '#26344d',
    overflow: 'hidden'
  },
  momentumFill: { height: '100%' },
  healthBox: {
    marginTop: 4,
    backgroundColor: '#0b1628',
    borderWidth: 1,
    borderColor: '#26344d',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center'
  },
  healthTitle: { color: '#93a4be' },
  healthValue: { color: '#f97316', fontSize: 28, fontWeight: '700', marginTop: 2 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12
  },
  planNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#f97316',
    color: '#0b1220',
    textAlign: 'center',
    fontWeight: '700',
    marginRight: 10,
    overflow: 'hidden'
  },
  planText: { flex: 1, color: '#cbd5f5', lineHeight: 20 }
});

export default StreakScreen;
