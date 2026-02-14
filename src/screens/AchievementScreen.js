import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import SectionCard from '../components/SectionCard';
import ScreenLoader from '../components/ScreenLoader';
import { useToast } from '../context/ToastContext';
import { toDateString } from '../utils/date';
import { readCache, writeCache } from '../services/cache';

const DASHBOARD_TTL_MS = 2 * 60 * 1000;

const milestones = [
  { days: 3, label: '3-Day Streak' },
  { days: 7, label: '7-Day Streak' },
  { days: 14, label: '14-Day Streak' },
  { days: 30, label: '30-Day Streak' }
];

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

const KpiTile = ({ label, value, accent }) => (
  <View style={styles.kpiTile}>
    <Text style={styles.kpiLabel}>{label}</Text>
    <Text style={[styles.kpiValue, { color: accent }]}>{value}</Text>
  </View>
);

const AchievementScreen = () => {
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();
  const [badges, setBadges] = useState([]);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [loading, setLoading] = useState(true);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const kpiAnim = useRef(new Animated.Value(0)).current;
  const badgesAnim = useRef(new Animated.Value(0)).current;
  const milestoneAnim = useRef(new Animated.Value(0)).current;

  const loadBadges = async () => {
    try {
      const today = toDateString();
      const cacheKey = `dashboard:${today}:${token?.slice(-8) || 'anon'}`;
      const cached = await readCache(cacheKey, DASHBOARD_TTL_MS);
      if (cached) {
        setBadges(cached.badges || []);
        setStreak(cached.streakCount || 0);
        setBestStreak(cached.bestStreak || 0);
        return;
      }
      const response = await api.get(`/analytics/dashboard?today=${today}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setBadges(response.data.badges || []);
      setStreak(response.data.streakCount || 0);
      setBestStreak(response.data.bestStreak || 0);
      await writeCache(cacheKey, response.data);
    } catch (error) {
      showToast({ type: 'error', title: 'Achievements error', message: 'Unable to load achievements.' });
    }
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadBadges();
      setLoading(false);
      Animated.stagger(100, [
        Animated.timing(heroAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(kpiAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(badgesAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(milestoneAnim, { toValue: 1, duration: 250, useNativeDriver: true })
      ]).start();
    })();
  }, []);

  const nextMilestone = useMemo(() => milestones.find((item) => streak < item.days), [streak]);
  const progressToNext = useMemo(() => {
    if (!nextMilestone) return 100;
    return Math.min(100, Math.round((streak / nextMilestone.days) * 100));
  }, [nextMilestone, streak]);

  const unlockedCount = useMemo(() => milestones.filter((m) => streak >= m.days).length, [streak]);
  const completion = useMemo(() => Math.round((unlockedCount / milestones.length) * 100), [unlockedCount]);

  const statusText = useMemo(() => {
    if (!nextMilestone) return 'All major milestones unlocked.';
    return `Next target: ${nextMilestone.label}`;
  }, [nextMilestone]);

  return (
    <LinearGradient colors={['#070d1a', '#0a1220', '#020617']} style={styles.container}>
      <ScreenLoader visible={loading} message="Loading achievements..." />
      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedSection value={heroAnim}>
          <LinearGradient colors={['#111a2c', '#0b1322']} style={styles.hero}>
            <Text style={styles.heroTitle}>Achievement Center</Text>
            <Text style={styles.heroSubtitle}>{statusText}</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressToNext}%` }]} />
            </View>
            <Text style={styles.progressValue}>{progressToNext}% to next milestone</Text>
          </LinearGradient>
        </AnimatedSection>

        <AnimatedSection value={kpiAnim}>
          <View style={styles.kpiGrid}>
            <KpiTile label="Unlocked badges" value={badges.length} accent="#f97316" />
            <KpiTile label="Milestone completion" value={`${completion}%`} accent="#38bdf8" />
            <KpiTile label="Current streak" value={`${streak}d`} accent="#22c55e" />
            <KpiTile label="Best streak" value={`${bestStreak}d`} accent="#f59e0b" />
          </View>
        </AnimatedSection>

        <AnimatedSection value={badgesAnim}>
          <SectionCard title="Unlocked Badges">
            {badges.length ? (
              <View style={styles.badgeGrid}>
                {badges.map((badge) => (
                  <View key={badge} style={styles.badgeChip}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.helper}>No badges unlocked yet. Keep your attendance streak active.</Text>
            )}
          </SectionCard>
        </AnimatedSection>

        <AnimatedSection value={milestoneAnim}>
          <SectionCard title="Milestone Tracker">
            {milestones.map((milestone) => {
              const done = streak >= milestone.days;
              const ratio = Math.min(100, Math.round((streak / milestone.days) * 100));
              return (
                <View key={milestone.days} style={styles.milestoneBlock}>
                  <View style={styles.milestoneRow}>
                    <Text style={styles.milestoneText}>{milestone.label}</Text>
                    <Text style={[styles.milestoneValue, done ? styles.milestoneDone : null]}>
                      {done ? 'Unlocked' : `${ratio}%`}
                    </Text>
                  </View>
                  <View style={styles.miniTrack}>
                    <View
                      style={[
                        styles.miniFill,
                        {
                          width: `${done ? 100 : ratio}%`,
                          backgroundColor: done ? '#22c55e' : '#f97316'
                        }
                      ]}
                    />
                  </View>
                </View>
              );
            })}
          </SectionCard>
        </AnimatedSection>
      </ScrollView>
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
    marginBottom: 14
  },
  heroTitle: { color: '#f8fafc', fontSize: 24, fontWeight: '700' },
  heroSubtitle: { color: '#b7c6dd', marginTop: 6, marginBottom: 12 },
  progressTrack: {
    height: 9,
    borderRadius: 999,
    backgroundColor: '#0c1628',
    borderWidth: 1,
    borderColor: '#26344d',
    overflow: 'hidden'
  },
  progressFill: { height: '100%', backgroundColor: '#f97316' },
  progressValue: { color: '#93a4be', marginTop: 8 },
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
  helper: { color: '#93a4be' },
  milestoneBlock: { marginBottom: 12 },
  milestoneRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6
  },
  milestoneText: { color: '#f8fafc' },
  milestoneValue: { color: '#94a3b8', fontWeight: '700' },
  milestoneDone: { color: '#22c55e' },
  miniTrack: {
    height: 8,
    borderRadius: 999,
    backgroundColor: '#0c1628',
    borderWidth: 1,
    borderColor: '#26344d',
    overflow: 'hidden'
  },
  miniFill: { height: '100%' }
});

export default AchievementScreen;
