import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const SplashScreen = () => {
  return (
    <LinearGradient colors={['#0f172a', '#020617']} style={styles.container}>
      <View>
        <Text style={styles.title}>DM's Fitness Tracker</Text>
        <Text style={styles.subtitle}>Track. Improve. Repeat.</Text>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
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
  }
});

export default SplashScreen;
