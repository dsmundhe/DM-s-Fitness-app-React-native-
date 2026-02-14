import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import ScreenLoader from '../components/ScreenLoader';
import SectionCard from '../components/SectionCard';
import { useToast } from '../context/ToastContext';
import { toDateString } from '../utils/date';
import { readCache, writeCache } from '../services/cache';

const DASHBOARD_TTL_MS = 2 * 60 * 1000;

const AnimatedCard = ({ animation, children, style }) => (
  <Animated.View
    style={[
      style,
      {
        opacity: animation,
        transform: [
          {
            translateY: animation.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0]
            })
          }
        ]
      }
    ]}
  >
    {children}
  </Animated.View>
);

const StatTile = ({ label, value, accent }) => (
  <View style={styles.statTile}>
    <Text style={styles.statTileLabel}>{label}</Text>
    <Text style={[styles.statTileValue, { color: accent }]}>{value}</Text>
  </View>
);

const ProgressBar = ({ label, value, total, color }) => {
  const pct = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0;
  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressHead}>
        <Text style={styles.progressLabel}>{label}</Text>
        <Text style={styles.progressMeta}>
          {value}/{total} ({pct}%)
        </Text>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
};

const DashboardScreen = () => {
  const { token, user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const consistencyAnim = useRef(new Animated.Value(0)).current;
  const badgesAnim = useRef(new Animated.Value(0)).current;

  const runEntryAnimations = () => {
    Animated.stagger(100, [
      Animated.timing(heroAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(statsAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(consistencyAnim, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(badgesAnim, { toValue: 1, duration: 280, useNativeDriver: true })
    ]).start();
  };

  const loadDashboard = async (force = false) => {
    try {
      const today = toDateString();
      const cacheKey = `dashboard:${today}:${token?.slice(-8) || 'anon'}`;
      if (!force) {
        const cached = await readCache(cacheKey, DASHBOARD_TTL_MS);
        if (cached) {
          setData(cached);
          return;
        }
      }
      const response = await api.get(`/analytics/dashboard?today=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(response.data);
      await writeCache(cacheKey, response.data);
    } catch (error) {
      showToast({ type: 'error', title: 'Dashboard error', message: 'Unable to load dashboard data.' });
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadDashboard(false);
      setLoading(false);
      runEntryAnimations();
    })();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard(true);
    setRefreshing(false);
  };

  const firstName = user?.name ? user.name.split(' ')[0] : 'Athlete';
  const weekly = data?.attendance?.week || 0;
  const monthly = data?.attendance?.month || 0;
  const streak = data?.streakCount || 0;
  const bestStreak = data?.bestStreak || 0;
  const fitness = data?.fitnessScore || 0;
  const badges = data?.badges || [];

  const readiness = useMemo(() => {
    const consistencyScore = Math.min(100, Math.round((weekly / 7) * 100));
    const fitnessScore = Math.min(100, Math.max(0, Math.round(fitness)));
    return Math.round((consistencyScore * 0.55) + (fitnessScore * 0.45));
  }, [weekly, fitness]);

  const coachMessage = useMemo(() => {
    if (weekly >= 6) return 'Excellent pace. Maintain recovery and hydration.';
    if (weekly >= 4) return 'Strong consistency. Push one extra session this week.';
    if (weekly >= 2) return 'Momentum is building. Keep your streak active tonight.';
    return 'Start with one focused session today and log it before 8 PM.';
  }, [weekly]);

  return (
    <LinearGradient colors={['#070d1a', '#0a1220', '#020617']} style={styles.container}>
      <ScreenLoader visible={loading} message="Loading dashboard..." />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
      >
        <AnimatedCard animation={heroAnim}>
          <LinearGradient colors={['#111a2c', '#0b1322']} style={styles.hero}>
            <View style={styles.heroTop}>
              <Text style={styles.heroWelcome}>Welcome back</Text>
              <Text style={styles.heroName}>{firstName}</Text>
            </View>
            <View style={styles.readinessWrap}>
              <Text style={styles.readinessLabel}>Readiness</Text>
              <Text style={styles.readinessValue}>{readiness}%</Text>
            </View>
            <Text style={styles.heroSub}>Daily performance and consistency snapshot.</Text>
          </LinearGradient>
        </AnimatedCard>

        <AnimatedCard animation={statsAnim}>
          <View style={styles.statsGrid}>
            <StatTile label="Current streak" value={`${streak}d`} accent="#f97316" />
            <StatTile label="Best streak" value={`${bestStreak}d`} accent="#38bdf8" />
            <StatTile label="Fitness score" value={fitness} accent="#22c55e" />
            <StatTile label="Badges" value={badges.length} accent="#f59e0b" />
          </View>
        </AnimatedCard>

        <AnimatedCard animation={consistencyAnim}>
          <SectionCard title="Consistency Monitor">
            <ProgressBar label="Weekly attendance" value={weekly} total={7} color="#f97316" />
            <ProgressBar label="Monthly attendance" value={monthly} total={30} color="#38bdf8" />
            <View style={styles.coachBox}>
              <Text style={styles.coachTitle}>Coach insight</Text>
              <Text style={styles.coachText}>{coachMessage}</Text>
            </View>
          </SectionCard>
        </AnimatedCard>

        <AnimatedCard animation={badgesAnim}>
          <SectionCard title="Achievement Wall">
            {badges.length ? (
              <View style={styles.badgeGrid}>
                {badges.map((badge) => (
                  <View key={badge} style={styles.badgeChip}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.emptyText}>No badges yet. Complete daily entries to unlock rewards.</Text>
            )}
          </SectionCard>
        </AnimatedCard>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingTop: 48, paddingBottom: 30 },
  hero: {
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#203047',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10
  },
  heroTop: { marginBottom: 12 },
  heroWelcome: { color: '#94a3b8', fontSize: 14 },
  heroName: { color: '#f8fafc', fontSize: 30, fontWeight: '700', marginTop: 2 },
  readinessWrap: {
    alignSelf: 'flex-start',
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10
  },
  readinessLabel: { color: '#a5b4fc', fontSize: 12 },
  readinessValue: { color: '#f8fafc', fontWeight: '700', fontSize: 20 },
  heroSub: { color: '#cbd5f5' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  statTile: {
    width: '48%',
    backgroundColor: '#0c1424',
    borderWidth: 1,
    borderColor: '#1f2c43',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10
  },
  statTileLabel: { color: '#93a4be', fontSize: 12 },
  statTileValue: { fontSize: 24, fontWeight: '700', marginTop: 6 },
  progressBlock: { marginBottom: 14 },
  progressHead: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  progressLabel: { color: '#d1def1', fontWeight: '600' },
  progressMeta: { color: '#93a4be' },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: '#0c1628',
    borderWidth: 1,
    borderColor: '#26344d',
    overflow: 'hidden'
  },
  progressFill: { height: '100%', borderRadius: 999 },
  coachBox: {
    backgroundColor: '#0a1323',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#26344d',
    padding: 12
  },
  coachTitle: { color: '#f97316', fontWeight: '700', marginBottom: 4 },
  coachText: { color: '#d1def1' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  badgeChip: {
    backgroundColor: '#0c1424',
    borderRadius: 999,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#23324c'
  },
  badgeText: { color: '#f8fafc', fontWeight: '600' },
  emptyText: { color: '#93a4be' }
});

export default DashboardScreen;
