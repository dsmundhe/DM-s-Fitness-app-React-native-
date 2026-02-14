import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';

const PrimaryButton = ({ label, onPress, disabled }) => {
  return (
    <Pressable
      style={({ pressed }) => [styles.button, disabled ? styles.disabled : null, pressed ? styles.pressed : null]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#f97316',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8
  },
  pressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.18
  },
  disabled: {
    opacity: 0.6
  },
  label: {
    color: '#0f172a',
    fontWeight: '700',
    fontSize: 16
  }
});

export default PrimaryButton;
