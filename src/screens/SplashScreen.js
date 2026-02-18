import React, { useEffect, useRef } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import AppGradient from '../components/AppGradient';

const SplashScreen = () => {
  const pulse = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 800, useNativeDriver: true })
      ])
    );
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(glow, { toValue: 0, duration: 1200, useNativeDriver: false })
      ])
    );
    pulseLoop.start();
    glowLoop.start();
    return () => {
      pulseLoop.stop();
      glowLoop.stop();
    };
  }, [pulse, glow]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.06]
  });
  const glowOpacity = glow.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.42]
  });

  return (
    <AppGradient style={styles.container}>
      <View style={styles.logoWrap}>
        <Animated.View style={[styles.logoGlow, { opacity: glowOpacity }]} />
        <Animated.Image source={require('../../assets/icon.png')} style={[styles.logo, { transform: [{ scale }] }]} />
      </View>
      <Text style={styles.title}>DM's Fitness Tracker</Text>
      <Text style={styles.subtitle}>Track. Improve. Repeat.</Text>
      <View style={styles.loadingRow}>
        <Animated.View style={[styles.loadingDot, styles.loadingDotPrimary, { opacity: glowOpacity }]} />
        <View style={styles.loadingDot} />
        <View style={styles.loadingDot} />
      </View>
    </AppGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logoWrap: {
    width: 130,
    height: 130,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 18
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: 24
  },
  logoGlow: {
    position: 'absolute',
    width: 118,
    height: 118,
    borderRadius: 999,
    backgroundColor: 'rgba(249, 115, 22, 0.38)',
    shadowColor: '#f97316',
    shadowOpacity: 0.45,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.5
  },
  subtitle: {
    color: '#94a3b8',
    marginTop: 8,
    fontSize: 16
  },
  loadingRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 18
  },
  loadingDot: {
    width: 6,
    height: 6,
    borderRadius: 999,
    backgroundColor: '#334155'
  },
  loadingDotPrimary: {
    backgroundColor: '#f97316'
  }
});

export default SplashScreen;
