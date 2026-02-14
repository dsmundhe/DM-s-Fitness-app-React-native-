import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const EmptyState = ({ title = 'No data yet', message = 'Start logging workouts to see progress.' }) => (
  <View style={styles.container}>
    <View style={styles.dot} />
    <Text style={styles.title}>{title}</Text>
    <Text style={styles.message}>{message}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0b1220',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1f2937',
    padding: 14,
    alignItems: 'center'
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#f97316',
    marginBottom: 10
  },
  title: {
    color: '#f8fafc',
    fontWeight: '700',
    marginBottom: 4
  },
  message: {
    color: '#94a3b8',
    textAlign: 'center'
  }
});

export default EmptyState;
