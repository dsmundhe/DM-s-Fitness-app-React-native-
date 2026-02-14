import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const SectionCard = ({ title, children }) => {
  return (
    <View style={styles.card}>
      {title ? <Text style={styles.title}>{title}</Text> : null}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0b1220',
    borderRadius: 18,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 8
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    marginBottom: 12,
    fontWeight: '600'
  }
});

export default SectionCard;
