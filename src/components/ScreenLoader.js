import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

const ScreenLoader = ({ visible, message = 'Loading...' }) => {
  if (!visible) {
    return null;
  }

  return (
    <View style={styles.overlay}>
      <View style={styles.card}>
        <ActivityIndicator size="large" color="#f97316" />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(2, 6, 23, 0.72)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 500
  },
  card: {
    backgroundColor: '#0b1220',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: '#1f2937',
    alignItems: 'center'
  },
  text: {
    marginTop: 12,
    color: '#e2e8f0',
    fontWeight: '600'
  }
});

export default ScreenLoader;
