import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, ImageBackground, Modal, RefreshControl, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import AppGradient from '../components/AppGradient';
import { Ionicons } from '@expo/vector-icons';
import AuthContext from '../context/AuthContext';
import api from '../services/api';
import ScreenLoader from '../components/ScreenLoader';
import SectionCard from '../components/SectionCard';
import { useToast } from '../context/ToastContext';
import { addDays, toDateString } from '../utils/date';
import { readCache, writeCache } from '../services/cache';

const DASHBOARD_TTL_MS = 2 * 60 * 1000;
const PLAN_DAYS = 6;
const GALLERY_IMAGES = [
  'https://i.pinimg.com/736x/11/8b/f9/118bf9d346e5362bad8ada359685ad0c.jpg',
  'https://i.pinimg.com/1200x/e9/63/ec/e963ec186a8a0dffdbe927beeac02adf.jpg',
  'https://i.pinimg.com/736x/20/53/1d/20531d35e197174cf984aa4f76b52a70.jpg',
  'https://i.pinimg.com/736x/c0/8f/2e/c08f2eb8c93e82c3cec9eec106f6aed8.jpg',
  'https://i.pinimg.com/1200x/53/59/cc/5359cc29a70e9e1061b6c4326668df06.jpg',
  'https://i.pinimg.com/736x/a5/47/b6/a547b6f56462fc0a90ef33702b4060a9.jpg',
  'https://i.pinimg.com/1200x/cd/a3/a1/cda3a1bf1a3db02e925e5a3605bf1114.jpg'
];

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

const ConfirmModal = ({ visible, title, message, confirmLabel, cancelLabel, destructive, onConfirm, onCancel }) => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true
    }).start();
  }, [animation, visible]);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [40, 0]
  });

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <View style={styles.confirmOverlay}>
        <Animated.View style={[styles.confirmCard, { opacity: animation, transform: [{ translateY }] }]}>
          <View style={styles.confirmHeader}>
            <View style={styles.confirmDot} />
            <Text style={styles.confirmTitle}>{title}</Text>
          </View>
          <Text style={styles.confirmMessage}>{message}</Text>
          <View style={styles.confirmActions}>
            <TouchableOpacity onPress={onCancel} style={[styles.confirmButton, styles.confirmCancel]}>
              <Text style={styles.confirmCancelText}>{cancelLabel || 'Cancel'}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onConfirm}
              style={[styles.confirmButton, destructive ? styles.confirmDestructive : styles.confirmPrimary]}
            >
              <Text style={styles.confirmConfirmText}>{confirmLabel || 'Confirm'}</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const PlanInputModal = ({ visible, title, subtitle, value, onChangeText, onSave, onCancel }) => {
  const animation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animation, {
      toValue: visible ? 1 : 0,
      duration: 220,
      useNativeDriver: true
    }).start();
  }, [animation, visible]);

  const translateY = animation.interpolate({
    inputRange: [0, 1],
    outputRange: [50, 0]
  });

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onCancel}>
      <View style={styles.planModalOverlay}>
        <Animated.View style={[styles.planModalCard, { opacity: animation, transform: [{ translateY }] }]}>
          <View style={styles.planModalHeader}>
            <Text style={styles.planModalTitle}>{title}</Text>
            {subtitle ? <Text style={styles.planModalSubtitle}>{subtitle}</Text> : null}
          </View>
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder="Workout focus or note"
            placeholderTextColor="#64748b"
            style={styles.planModalInput}
            multiline
          />
          <View style={styles.planModalActions}>
            <TouchableOpacity onPress={onCancel} style={[styles.planModalButton, styles.planModalCancel]}>
              <Text style={styles.planModalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={onSave} style={[styles.planModalButton, styles.planModalSave]}>
              <Text style={styles.planModalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const getWeekStartDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const dayOfWeek = date.getDay(); // 0=Sun..6=Sat
  const diff = (dayOfWeek + 6) % 7; // Monday as start
  date.setDate(date.getDate() - diff);
  return toDateString(date);
};

const formatShortDate = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const buildPlanRows = (weekStart) =>
  Array.from({ length: PLAN_DAYS }, (_, index) => {
    const date = addDays(weekStart, index);
    const [year, month, day] = date.split('-').map(Number);
    const jsDate = new Date(year, month - 1, day);
    const weekday = jsDate.toLocaleDateString('en-US', { weekday: 'long' });
    return {
      id: date,
      date,
      weekday,
      plan: '',
      done: false
    };
  });

const applyWeekDates = (rows, weekStart) =>
  Array.from({ length: PLAN_DAYS }, (_, index) => {
    const base = rows?.[index] || {};
    const date = addDays(weekStart, index);
    const [year, month, day] = date.split('-').map(Number);
    const jsDate = new Date(year, month - 1, day);
    const weekday = jsDate.toLocaleDateString('en-US', { weekday: 'long' });
    return {
      id: date,
      date,
      weekday,
      plan: typeof base.plan === 'string' ? base.plan : '',
      done: Boolean(base.done)
    };
  });

const DashboardScreen = () => {
  const { token, user } = useContext(AuthContext);
  const { showToast } = useToast();
  const [data, setData] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [planRows, setPlanRows] = useState([]);
  const [planReady, setPlanReady] = useState(false);
  const [planActionLoading, setPlanActionLoading] = useState(false);
  const [planActionMessage, setPlanActionMessage] = useState('Updating plan...');
  const [confirmState, setConfirmState] = useState({
    open: false,
    title: '',
    message: '',
    confirmLabel: 'Confirm',
    destructive: false,
    onConfirm: null
  });
  const [planEditor, setPlanEditor] = useState({
    open: false,
    index: null,
    value: '',
    title: '',
    subtitle: ''
  });

  const heroAnim = useRef(new Animated.Value(0)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;
  const consistencyAnim = useRef(new Animated.Value(0)).current;
  const badgesAnim = useRef(new Animated.Value(0)).current;
  const galleryRef = useRef(null);
  const galleryIndex = useRef(0);
  const galleryWidth = useRef(Dimensions.get('window').width * 0.9).current;
  const galleryScrollX = useRef(new Animated.Value(0)).current;
  const planSaveTimer = useRef(null);
  const planSaveError = useRef(false);
  const planActionTimer = useRef(null);

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

  useEffect(() => {
    const interval = setInterval(() => {
      if (!galleryRef.current) {
        return;
      }
      galleryIndex.current = (galleryIndex.current + 1) % GALLERY_IMAGES.length;
      galleryRef.current.scrollTo({ x: galleryIndex.current * galleryWidth, animated: true });
    }, 3200);
    return () => clearInterval(interval);
  }, [galleryWidth]);

  const today = toDateString();
  const weekStart = useMemo(() => getWeekStartDate(today), [today]);

  useEffect(() => {
    let active = true;
    const loadPlan = async () => {
      try {
        const response = await api.get(`/plans/week?start=${weekStart}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!active) return;
        if (Array.isArray(response.data?.rows) && response.data.rows.length === PLAN_DAYS) {
          setPlanRows(applyWeekDates(response.data.rows, weekStart));
        } else {
          setPlanRows(buildPlanRows(weekStart));
        }
      } catch (error) {
        if (active) {
          setPlanRows(buildPlanRows(weekStart));
          showToast({ type: 'error', title: 'Plan error', message: 'Unable to load weekly plan.' });
        }
      } finally {
        if (active) {
          setPlanReady(true);
        }
      }
    };
    setPlanReady(false);
    loadPlan();
    return () => {
      active = false;
    };
  }, [weekStart, token, showToast]);

  useEffect(() => {
    if (!planReady) {
      return;
    }
    if (planSaveTimer.current) {
      clearTimeout(planSaveTimer.current);
    }
    planSaveTimer.current = setTimeout(async () => {
      try {
        await api.post(
          '/plans/week',
          { weekStart, rows: applyWeekDates(planRows, weekStart) },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        planSaveError.current = false;
      } catch (error) {
        if (!planSaveError.current) {
          showToast({ type: 'error', title: 'Plan save failed', message: 'Unable to save weekly plan.' });
          planSaveError.current = true;
        }
      }
    }, 500);
  }, [planRows, planReady, weekStart, token, showToast]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDashboard(true);
    setPlanReady(false);
    try {
      const response = await api.get(`/plans/week?start=${weekStart}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (Array.isArray(response.data?.rows) && response.data.rows.length === PLAN_DAYS) {
        setPlanRows(applyWeekDates(response.data.rows, weekStart));
      } else {
        setPlanRows(buildPlanRows(weekStart));
      }
    } catch (error) {
      setPlanRows(buildPlanRows(weekStart));
    } finally {
      setPlanReady(true);
    }
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

  const handlePlanChange = (index, field, value) => {
    setPlanRows((prev) =>
      prev.map((row, rowIndex) =>
        rowIndex === index ? { ...row, [field]: value } : row
      )
    );
  };

  const runPlanAction = (message, action) => {
    if (planActionTimer.current) {
      clearTimeout(planActionTimer.current);
    }
    setPlanActionMessage(message);
    setPlanActionLoading(true);
    action();
    planActionTimer.current = setTimeout(() => {
      setPlanActionLoading(false);
    }, 450);
  };

  const resetPlanWeek = () => {
    setConfirmState({
      open: true,
      title: 'Reset weekly plan?',
      message: 'This will clear all workouts and checks for this week.',
      confirmLabel: 'Reset',
      destructive: true,
      onConfirm: () => runPlanAction('Resetting plan...', () => setPlanRows(buildPlanRows(weekStart)))
    });
  };

  const handlePlanToggle = (index) => {
    const current = planRows[index];
    if (!current) {
      return;
    }
    const nextValue = !current.done;
    setConfirmState({
      open: true,
      title: nextValue ? 'Mark as done?' : 'Unmark done?',
      message: nextValue
        ? `Confirm you completed ${current.weekday} (${formatShortDate(current.date)}).`
        : `Confirm you want to remove the check for ${current.weekday} (${formatShortDate(current.date)}).`,
      confirmLabel: 'Confirm',
      destructive: !nextValue,
      onConfirm: () =>
        runPlanAction('Updating check...', () => handlePlanChange(index, 'done', nextValue))
    });
  };

  const openPlanEditor = (index) => {
    const row = planRows[index];
    if (!row) {
      return;
    }
    setPlanEditor({
      open: true,
      index,
      value: row.plan || '',
      title: `${row.weekday} Plan`,
      subtitle: formatShortDate(row.date)
    });
  };

  const closePlanEditor = () => {
    setPlanEditor((prev) => ({ ...prev, open: false }));
  };

  const savePlanEditor = () => {
    if (planEditor.index === null || planEditor.index === undefined) {
      closePlanEditor();
      return;
    }
    runPlanAction('Saving plan...', () => handlePlanChange(planEditor.index, 'plan', planEditor.value));
    closePlanEditor();
  };

  return (
    <AppGradient style={styles.container}>
      <ScreenLoader visible={loading} message="Loading dashboard..." />
      <ScreenLoader visible={planActionLoading} message={planActionMessage} />
      <ConfirmModal
        visible={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        destructive={confirmState.destructive}
        onCancel={() => setConfirmState((prev) => ({ ...prev, open: false }))}
        onConfirm={() => {
          if (typeof confirmState.onConfirm === 'function') {
            confirmState.onConfirm();
          }
          setConfirmState((prev) => ({ ...prev, open: false }));
        }}
      />
      <PlanInputModal
        visible={planEditor.open}
        title={planEditor.title}
        subtitle={planEditor.subtitle}
        value={planEditor.value}
        onChangeText={(text) => setPlanEditor((prev) => ({ ...prev, value: text }))}
        onCancel={closePlanEditor}
        onSave={savePlanEditor}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f97316" />}
      >
        <AnimatedCard animation={heroAnim}>
          <View style={styles.hero}>
            <View style={styles.heroOverlay}>
              <View style={styles.heroTop}>
                <View>
                  <Text style={styles.heroWelcome}>Welcome back</Text>
                  <Text style={styles.heroName}>{firstName}</Text>
                </View>
                <View style={styles.readinessWrap}>
                  <Text style={styles.readinessLabel}>Readiness</Text>
                  <Text style={styles.readinessValue}>{readiness}%</Text>
                </View>
              </View>
              <Text style={styles.heroSub}>Daily performance and consistency snapshot.</Text>
              <View style={styles.heroMetaRow}>
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipLabel}>Streak</Text>
                  <Text style={styles.heroChipValue}>{streak} days</Text>
                </View>
                <View style={styles.heroChip}>
                  <Text style={styles.heroChipLabel}>Fitness</Text>
                  <Text style={styles.heroChipValue}>{fitness}</Text>
                </View>
                <View style={[styles.heroChip, styles.heroChipLast]}>
                  <Text style={styles.heroChipLabel}>Badges</Text>
                  <Text style={styles.heroChipValue}>{badges.length}</Text>
                </View>
              </View>
            </View>
          </View>
        </AnimatedCard>

        <AnimatedCard animation={statsAnim}>
          <View style={styles.galleryCard}>
            <View style={styles.galleryHeader}>
              <Text style={styles.galleryTitle}>Featured Workouts</Text>
            </View>
            <Animated.ScrollView
              horizontal
              pagingEnabled
              snapToInterval={galleryWidth}
              decelerationRate="fast"
              ref={galleryRef}
              showsHorizontalScrollIndicator={false}
              style={[styles.galleryScroll, { width: galleryWidth }]}
              contentContainerStyle={styles.galleryRow}
              onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: galleryScrollX } } }], {
                useNativeDriver: false
              })}
              scrollEventThrottle={16}
            >
              {GALLERY_IMAGES.map((uri) => (
                <ImageBackground
                  key={uri}
                  source={{ uri }}
                  style={[styles.galleryImage, { width: galleryWidth }]}
                  imageStyle={styles.galleryImageInner}
                >
                  <View style={styles.galleryOverlay}>
                    <Text style={styles.galleryTag}>Premium</Text>
                    <Text style={styles.galleryLabel}>Power Session</Text>
                  </View>
                </ImageBackground>
              ))}
            </Animated.ScrollView>
            <View style={styles.galleryDots}>
              {GALLERY_IMAGES.map((_, index) => {
                const inputRange = [
                  (index - 1) * galleryWidth,
                  index * galleryWidth,
                  (index + 1) * galleryWidth
                ];
                const dotScale = galleryScrollX.interpolate({
                  inputRange,
                  outputRange: [1, 1.6, 1],
                  extrapolate: 'clamp'
                });
                const dotOpacity = galleryScrollX.interpolate({
                  inputRange,
                  outputRange: [0.4, 1, 0.4],
                  extrapolate: 'clamp'
                });
                return (
                  <Animated.View
                    key={`dot-${index}`}
                    style={[styles.galleryDot, { transform: [{ scale: dotScale }], opacity: dotOpacity }]}
                  />
                );
              })}
            </View>
          </View>
        </AnimatedCard>

        <AnimatedCard animation={consistencyAnim}>
          <View style={styles.panel}>
            <View style={styles.panelHeader}>
              <Text style={styles.panelTitle}>Performance Snapshot</Text>
              <Text style={styles.panelMeta}>Today</Text>
            </View>
            <View style={styles.statsGrid}>
              <StatTile label="Current streak" value={`${streak}d`} accent="#f97316" />
              <StatTile label="Best streak" value={`${bestStreak}d`} accent="#38bdf8" />
              <StatTile label="Fitness score" value={fitness} accent="#22c55e" />
              <StatTile label="Badges" value={badges.length} accent="#f59e0b" />
            </View>
          </View>
        </AnimatedCard>

        <AnimatedCard animation={badgesAnim}>
          <SectionCard title="Consistency Monitor">
            <ProgressBar label="Weekly attendance" value={weekly} total={7} color="#f97316" />
            <ProgressBar label="Monthly attendance" value={monthly} total={30} color="#38bdf8" />
            <View style={styles.coachBox}>
              <Text style={styles.coachTitle}>Coach insight</Text>
              <Text style={styles.coachText}>{coachMessage}</Text>
            </View>
          </SectionCard>
        </AnimatedCard>

        <AnimatedCard animation={consistencyAnim}>
          <SectionCard title="6-Day Plan">
            <View style={styles.planHeaderRow}>
              <View>
                <Text style={styles.planWeekLabel}>Week of {formatShortDate(weekStart)}</Text>
                <Text style={styles.planMeta}>Edit your 6-day routine and tick attendance.</Text>
              </View>
              <TouchableOpacity onPress={resetPlanWeek} style={styles.planResetButton}>
                <Text style={styles.planResetText}>Reset</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.planTable}>
              <View style={[styles.planRow, styles.planHeader]}>
                <Text style={[styles.planCell, styles.planHeaderText, styles.planDayCell]}>Day</Text>
                <Text style={[styles.planCell, styles.planHeaderText, styles.planWorkoutCell]}>Plan</Text>
                <Text style={[styles.planCell, styles.planHeaderText, styles.planCheckCell]}>Done</Text>
              </View>
              {planRows.map((row, index) => (
                <View key={row.id} style={styles.planRow}>
                  <View style={[styles.planCell, styles.planDayCell]}>
                    <Text style={styles.planDayText} numberOfLines={1} ellipsizeMode="tail">
                      {row.weekday}
                    </Text>
                    <Text style={styles.planDateText}>{formatShortDate(row.date)}</Text>
                  </View>
                  <View style={[styles.planCell, styles.planWorkoutCell]}>
                    <TouchableOpacity onPress={() => openPlanEditor(index)} style={styles.planInputButton}>
                      <View style={styles.planInputHeader}>
                        <Ionicons name="create-outline" size={14} color="#f97316" />
                      </View>
                      <Text
                        style={[styles.planInputText, row.plan ? null : styles.planInputPlaceholder]}
                        numberOfLines={2}
                      >
                        {row.plan ? row.plan : 'Add workout focus for this day'}
                      </Text>
                      <Text style={styles.planInputHint}>Tap to update</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.planCell, styles.planCheckCell]}>
                    <TouchableOpacity
                      onPress={() => handlePlanToggle(index)}
                      style={[styles.planCheckBox, row.done ? styles.planCheckBoxActive : null]}
                    >
                      {row.done ? <Text style={styles.planCheckMark}>✓</Text> : null}
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </SectionCard>
        </AnimatedCard>

        <AnimatedCard animation={statsAnim}>
          <SectionCard title="Achievement Wall">
            {badges.length ? (
              <View style={styles.badgeGrid}>
                {badges.map((badge, index) => (
                  <View key={`${badge}-${index}`} style={styles.badgeChip}>
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
    </AppGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingHorizontal: 12, paddingTop: 48, paddingBottom: 30 },
  hero: {
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#0b1322',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12
  },
  heroOverlay: {
    padding: 20,
    backgroundColor: 'rgba(7, 13, 26, 0.68)'
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10
  },
  heroWelcome: { color: '#94a3b8', fontSize: 14 },
  heroName: { color: '#f8fafc', fontSize: 30, fontWeight: '700', marginTop: 2 },
  readinessWrap: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(2, 6, 23, 0.9)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 10
  },
  readinessLabel: { color: '#a5b4fc', fontSize: 12 },
  readinessValue: { color: '#f8fafc', fontWeight: '700', fontSize: 20 },
  heroSub: { color: '#cbd5f5' },
  heroMetaRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  heroChip: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginRight: 10
  },
  heroChipLast: {
    marginRight: 0
  },
  galleryCard: {
    backgroundColor: '#0b1322',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#1f2c43',
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10
  },
  galleryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  galleryTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 16 },
  galleryRow: {
    alignItems: 'center'
  },
  galleryScroll: {
    alignSelf: 'center'
  },
  galleryImage: {
    height: 180,
    borderRadius: 18,
    overflow: 'hidden'
  },
  galleryImageInner: {
    borderRadius: 18
  },
  galleryOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
    backgroundColor: 'rgba(2, 6, 23, 0.45)'
  },
  galleryTag: {
    color: '#f97316',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4
  },
  galleryLabel: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700'
  },
  galleryDots: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'center'
  },
  galleryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#f8fafc',
    marginHorizontal: 4
  },
  heroChipLabel: { color: '#94a3b8', fontSize: 12 },
  heroChipValue: { color: '#f8fafc', fontWeight: '700', marginTop: 4 },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 4
  },
  panel: {
    backgroundColor: '#0b1322',
    borderWidth: 1,
    borderColor: '#1f2c43',
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.24,
    shadowRadius: 16,
    elevation: 10
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10
  },
  panelTitle: { color: '#f8fafc', fontWeight: '700', fontSize: 16 },
  panelMeta: { color: '#94a3b8', fontSize: 12 },
  statTile: {
    width: '49%',
    backgroundColor: '#0f172a',
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
  emptyText: { color: '#93a4be' },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  planWeekLabel: { color: '#f8fafc', fontWeight: '700', fontSize: 16 },
  planMeta: { color: '#93a4be', marginTop: 4 },
  planResetButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#26344d',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#0a1323'
  },
  planResetText: { color: '#f97316', fontWeight: '600' },
  planTable: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1f2c43',
    overflow: 'hidden'
  },
  planRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#1f2c43',
    backgroundColor: '#0b1322'
  },
  planHeader: {
    backgroundColor: '#0c1628'
  },
  planHeaderText: {
    color: '#a5b4fc',
    fontWeight: '700',
    textTransform: 'uppercase',
    fontSize: 11
  },
  planCell: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    justifyContent: 'center'
  },
  planDayCell: {
    width: 98
  },
  planWorkoutCell: {
    flex: 1
  },
  planCheckCell: {
    width: 62,
    alignItems: 'center'
  },
  planDayText: { color: '#f8fafc', fontWeight: '600', fontSize: 13 },
  planDateText: { color: '#93a4be', fontSize: 12, marginTop: 2 },
  planInput: {
    color: '#f8fafc',
    backgroundColor: '#0a1323',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#26344d',
    paddingHorizontal: 10,
    paddingVertical: 6,
    minHeight: 40
  },
  planInputButton: {
    minHeight: 42,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1f293b',
    backgroundColor: '#0b1222',
    paddingHorizontal: 10,
    paddingVertical: 6,
    justifyContent: 'center'
  },
  planInputHeader: {
    position: 'absolute',
    right: 8,
    bottom: 8
  },
  planInputText: { color: '#f8fafc', fontWeight: '600' },
  planInputPlaceholder: { color: '#64748b', fontWeight: '500' },
  planInputHint: { color: '#94a3b8', fontSize: 11, marginTop: 6 },
  planCheckBox: {
    width: 26,
    height: 26,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b1120'
  },
  planCheckBoxActive: {
    backgroundColor: '#22c55e',
    borderColor: '#22c55e'
  },
  planCheckMark: {
    color: '#0b1120',
    fontWeight: '900'
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 14, 0.86)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  confirmCard: {
    width: '100%',
    backgroundColor: '#05070f',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#141b2c',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 10
  },
  confirmHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  confirmDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
    backgroundColor: '#f97316',
    marginRight: 10
  },
  confirmTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  confirmMessage: { color: '#94a3b8', marginBottom: 16 },
  confirmActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  confirmButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1
  },
  confirmCancel: {
    borderColor: '#1f293b',
    backgroundColor: '#0b1120'
  },
  confirmCancelText: { color: '#cbd5f5', fontWeight: '600' },
  confirmPrimary: {
    borderColor: '#f97316',
    backgroundColor: '#f97316'
  },
  confirmDestructive: {
    borderColor: '#ef4444',
    backgroundColor: '#ef4444'
  },
  confirmConfirmText: { color: '#0b1120', fontWeight: '700' },
  planModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 14, 0.86)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20
  },
  planModalCard: {
    width: '100%',
    backgroundColor: '#05070f',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#141b2c',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.32,
    shadowRadius: 18,
    elevation: 10
  },
  planModalHeader: {
    marginBottom: 12
  },
  planModalTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '700' },
  planModalSubtitle: { color: '#93a4be', marginTop: 4 },
  planModalInput: {
    minHeight: 90,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f293b',
    backgroundColor: '#0b1120',
    color: '#f8fafc',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16
  },
  planModalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10
  },
  planModalButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1
  },
  planModalCancel: {
    borderColor: '#1f293b',
    backgroundColor: '#0b1120'
  },
  planModalCancelText: { color: '#cbd5f5', fontWeight: '600' },
  planModalSave: {
    borderColor: '#f97316',
    backgroundColor: '#f97316'
  },
  planModalSaveText: { color: '#0b1120', fontWeight: '700' }
});

export default DashboardScreen;
