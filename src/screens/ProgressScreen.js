import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { BarChart, LineChart } from 'react-native-chart-kit';
import { LinearGradient } from 'expo-linear-gradient';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import EmptyState from '../components/EmptyState';
import ScreenLoader from '../components/ScreenLoader';
import SectionCard from '../components/SectionCard';
import { useToast } from '../context/ToastContext';
import { addDays, toDateString } from '../utils/date';
import { readCache, writeCache } from '../services/cache';

const screenWidth = Dimensions.get('window').width - 48;
const TRENDS_TTL_MS = 2 * 60 * 1000;

const chartConfig = {
  backgroundGradientFrom: '#0f172a',
  backgroundGradientTo: '#0f172a',
  color: (opacity = 1) => `rgba(249, 115, 22, ${opacity})`,
  labelColor: () => '#cbd5f5',
  strokeWidth: 2,
  decimalPlaces: 0
};

const AnimatedBlock = ({ value, children }) => (
  <Animated.View
    style={{
      opacity: value,
      transform: [
        {
          translateY: value.interpolate({
            inputRange: [0, 1],
            outputRange: [14, 0]
          })
        }
      ]
    }}
  >
    {children}
  </Animated.View>
);

const MetricTile = ({ label, value, accent }) => (
  <View style={styles.metricTile}>
    <Text style={styles.metricTileLabel}>{label}</Text>
    <Text style={[styles.metricTileValue, { color: accent }]}>{value}</Text>
  </View>
);

const ProgressScreen = () => {
  const { token } = useContext(AuthContext);
  const { showToast } = useToast();
  const [trend, setTrend] = useState({ labels: [], series: { running: [], pushups: [], strength: [] } });
  const [loading, setLoading] = useState(true);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const heroAnim = useRef(new Animated.Value(0)).current;
  const statAnim = useRef(new Animated.Value(0)).current;
  const summaryAnim = useRef(new Animated.Value(0)).current;

  const loadTrends = async (force = false) => {
    try {
      setLoading(true);
      const end = toDateString();
      const start = addDays(end, -6);
      const cacheKey = `trends:${start}:${end}:${token?.slice(-8) || 'anon'}`;
      if (!force) {
        const cached = await readCache(cacheKey, TRENDS_TTL_MS);
        if (cached) {
          setTrend(cached);
          return;
        }
      }
      const response = await api.get(`/analytics/trends?start=${start}&end=${end}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTrend(response.data);
      await writeCache(cacheKey, response.data);
    } catch (error) {
      showToast({
        type: 'error',
        title: 'Trends unavailable',
        message: 'Unable to load progress data.'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await loadTrends();
      Animated.stagger(100, [
        Animated.timing(heroAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(statAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
        Animated.timing(summaryAnim, { toValue: 1, duration: 240, useNativeDriver: true })
      ]).start();
    })();
  }, []);

  const runningData = useMemo(() => trend.series.running || [], [trend.series.running]);
  const pushupsData = useMemo(() => trend.series.pushups || [], [trend.series.pushups]);
  const strengthData = useMemo(() => trend.series.strength || [], [trend.series.strength]);

  const runningTotal = useMemo(() => runningData.reduce((sum, v) => sum + Number(v || 0), 0), [runningData]);
  const pushupsTotal = useMemo(() => pushupsData.reduce((sum, v) => sum + Number(v || 0), 0), [pushupsData]);
  const strengthTotal = useMemo(() => strengthData.reduce((sum, v) => sum + Number(v || 0), 0), [strengthData]);

  const runningPeak = useMemo(() => Math.max(0, ...runningData.map((v) => Number(v || 0))), [runningData]);
  const pushupsPeak = useMemo(() => Math.max(0, ...pushupsData.map((v) => Number(v || 0))), [pushupsData]);
  const strengthPeak = useMemo(() => Math.max(0, ...strengthData.map((v) => Number(v || 0))), [strengthData]);

  const hasRunningData = useMemo(() => runningData.some((value) => Number(value) > 0), [runningData]);
  const hasPushupsData = useMemo(() => pushupsData.some((value) => Number(value) > 0), [pushupsData]);
  const hasStrengthData = useMemo(() => strengthData.some((value) => Number(value) > 0), [strengthData]);

  const runningPercent = useMemo(
    () => (runningPeak > 0 ? runningData.map((v) => Math.round((Number(v || 0) / runningPeak) * 100)) : []),
    [runningData, runningPeak]
  );
  const pushupsPercent = useMemo(
    () => (pushupsPeak > 0 ? pushupsData.map((v) => Math.round((Number(v || 0) / pushupsPeak) * 100)) : []),
    [pushupsData, pushupsPeak]
  );
  const strengthPercent = useMemo(
    () => (strengthPeak > 0 ? strengthData.map((v) => Math.round((Number(v || 0) / strengthPeak) * 100)) : []),
    [strengthData, strengthPeak]
  );

  const trendNote = useMemo(() => {
    if (runningTotal >= 15 || pushupsTotal >= 200) return 'Training volume is high this week.';
    if (runningTotal >= 7 || pushupsTotal >= 100) return 'Good progression. Keep your recovery consistent.';
    return 'Start by logging one complete session daily.';
  }, [runningTotal, pushupsTotal]);

  return (
    <LinearGradient colors={['#070d1a', '#0a1220', '#020617']} style={styles.container}>
      <ScreenLoader visible={loading} message="Loading trends..." />
      <ScrollView contentContainerStyle={styles.content}>
        <AnimatedBlock value={heroAnim}>
          <LinearGradient colors={['#111a2c', '#0b1322']} style={styles.hero}>
            <Text style={styles.heroTitle}>Progress Analytics</Text>
            <Text style={styles.heroSubtitle}>Last 7 days performance and trend quality.</Text>
            <TouchableOpacity style={styles.detailsButton} onPress={() => setDetailsOpen(true)}>
              <Text style={styles.detailsText}>Open chart details</Text>
            </TouchableOpacity>
          </LinearGradient>
        </AnimatedBlock>

        <AnimatedBlock value={statAnim}>
          <View style={styles.metricGrid}>
            <MetricTile label="Running total" value={`${runningTotal.toFixed(1)} km`} accent="#f97316" />
            <MetricTile label="Push-ups total" value={pushupsTotal} accent="#38bdf8" />
            <MetricTile label="Strength total" value={strengthTotal} accent="#22c55e" />
            <MetricTile label="Best run" value={`${runningPeak.toFixed(1)} km`} accent="#f59e0b" />
          </View>
        </AnimatedBlock>

        <AnimatedBlock value={summaryAnim}>
          <SectionCard title="Weekly Summary">
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Best push-ups</Text>
              <Text style={styles.summaryValue}>{pushupsPeak}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Best strength day</Text>
              <Text style={styles.summaryValue}>{strengthPeak}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Trend quality</Text>
              <Text style={styles.summaryValue}>
                {hasRunningData || hasPushupsData || hasStrengthData ? 'Tracked' : 'No data'}
              </Text>
            </View>
            <View style={styles.noteBox}>
              <Text style={styles.noteTitle}>Insight</Text>
              <Text style={styles.noteText}>{trendNote}</Text>
            </View>
          </SectionCard>
        </AnimatedBlock>
      </ScrollView>

      <Modal transparent visible={detailsOpen} animationType="slide" onRequestClose={() => setDetailsOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Progress Details</Text>
              <TouchableOpacity onPress={() => setDetailsOpen(false)}>
                <Text style={styles.modalClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              <SectionCard title="Running (km)">
                {trend.labels.length && hasRunningData ? (
                  <LineChart
                    data={{ labels: trend.labels, datasets: [{ data: runningData.length ? runningData : [0] }] }}
                    width={screenWidth}
                    height={230}
                    chartConfig={chartConfig}
                    bezier
                    withDots={false}
                    withHorizontalLabels={false}
                    withVerticalLabels={false}
                  />
                ) : (
                  <EmptyState title="No running data" message="Log a workout to see running trends." />
                )}
                <View style={styles.axisRow}>
                  <Text style={styles.axisLabel}>Y-axis: km</Text>
                  <Text style={styles.axisLabel}>X-axis: days</Text>
                </View>
              </SectionCard>

              <SectionCard title="Push-ups">
                {trend.labels.length && hasPushupsData ? (
                  <BarChart
                    data={{ labels: trend.labels, datasets: [{ data: pushupsData.length ? pushupsData : [0] }] }}
                    width={screenWidth}
                    height={230}
                    chartConfig={chartConfig}
                    withHorizontalLabels={false}
                    withVerticalLabels={false}
                  />
                ) : (
                  <EmptyState title="No push-up data" message="Log a workout to see push-up trends." />
                )}
                <View style={styles.axisRow}>
                  <Text style={styles.axisLabel}>Y-axis: reps</Text>
                  <Text style={styles.axisLabel}>X-axis: days</Text>
                </View>
              </SectionCard>

              <SectionCard title="Strength Total">
                {trend.labels.length && hasStrengthData ? (
                  <LineChart
                    data={{ labels: trend.labels, datasets: [{ data: strengthData.length ? strengthData : [0] }] }}
                    width={screenWidth}
                    height={230}
                    chartConfig={chartConfig}
                    bezier
                    withDots={false}
                    withHorizontalLabels={false}
                    withVerticalLabels={false}
                  />
                ) : (
                  <EmptyState title="No strength data" message="Log workouts to see strength totals." />
                )}
                <View style={styles.axisRow}>
                  <Text style={styles.axisLabel}>Y-axis: reps</Text>
                  <Text style={styles.axisLabel}>X-axis: days</Text>
                </View>
              </SectionCard>

              <SectionCard title="Performance (%)">
                {trend.labels.length && (hasRunningData || hasPushupsData || hasStrengthData) ? (
                  <LineChart
                    data={{
                      labels: trend.labels,
                      datasets: [
                        { data: runningPercent.length ? runningPercent : [0], color: () => '#f97316' },
                        { data: pushupsPercent.length ? pushupsPercent : [0], color: () => '#38bdf8' },
                        { data: strengthPercent.length ? strengthPercent : [0], color: () => '#22c55e' }
                      ],
                      legend: ['Running', 'Push-ups', 'Strength']
                    }}
                    width={screenWidth}
                    height={250}
                    chartConfig={chartConfig}
                    bezier
                    withDots={false}
                    withHorizontalLabels={false}
                    withVerticalLabels={false}
                  />
                ) : (
                  <EmptyState title="No progress yet" message="Log workouts to see percent progress." />
                )}
                <View style={styles.axisRow}>
                  <Text style={styles.axisLabel}>Y-axis: %</Text>
                  <Text style={styles.axisLabel}>X-axis: days</Text>
                </View>
              </SectionCard>
              <View style={styles.modalSpacer} />
            </ScrollView>
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
    padding: 18,
    borderWidth: 1,
    borderColor: '#22344f',
    marginBottom: 14
  },
  heroTitle: { color: '#f8fafc', fontSize: 24, fontWeight: '700' },
  heroSubtitle: { color: '#b7c6dd', marginTop: 6, marginBottom: 12 },
  detailsButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#2b3d5a',
    paddingHorizontal: 12,
    paddingVertical: 7
  },
  detailsText: { color: '#f97316', fontWeight: '600' },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  metricTile: {
    width: '48%',
    backgroundColor: '#0c1424',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2f49',
    padding: 12,
    marginBottom: 10
  },
  metricTileLabel: { color: '#93a4be', fontSize: 12 },
  metricTileValue: { marginTop: 6, fontWeight: '700', fontSize: 20 },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8
  },
  summaryLabel: { color: '#b7c6dd' },
  summaryValue: { color: '#f8fafc', fontWeight: '700' },
  noteBox: {
    marginTop: 8,
    backgroundColor: '#0b1628',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#253750',
    padding: 10
  },
  noteTitle: { color: '#f97316', fontWeight: '700', marginBottom: 4 },
  noteText: { color: '#d1def1' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.75)',
    justifyContent: 'flex-end'
  },
  modalCard: {
    backgroundColor: '#0b1220',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    padding: 20,
    maxHeight: '86%'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  modalTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 18 },
  modalClose: { color: '#f97316', fontWeight: '600' },
  axisRow: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  axisLabel: { color: '#94a3b8', fontSize: 12 },
  modalSpacer: { height: 12 }
});

export default ProgressScreen;
