import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const typeStyles = {
  success: { border: '#22c55e', title: '#dcfce7' },
  error: { border: '#ef4444', title: '#fee2e2' },
  warning: { border: '#f59e0b', title: '#fef3c7' },
  info: { border: '#38bdf8', title: '#e0f2fe' }
};

const ToastHost = ({ toast, onHide }) => {
  const slide = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  const colors = useMemo(() => typeStyles[toast.type] || typeStyles.info, [toast.type]);

  useEffect(() => {
    if (toast.visible) {
      Animated.parallel([
        Animated.timing(slide, {
          toValue: 0,
          duration: 220,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slide, {
          toValue: -120,
          duration: 200,
          useNativeDriver: true
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [toast.visible, slide, opacity]);

  if (!toast.title && !toast.message) {
    return null;
  }

  return (
    <Animated.View style={[styles.wrapper, { transform: [{ translateY: slide }], opacity }]}>
      <TouchableOpacity activeOpacity={0.9} onPress={onHide}>
        <View style={[styles.card, { borderColor: colors.border }]}>
          <Text style={[styles.title, { color: colors.title }]}>{toast.title || 'Notice'}</Text>
          {!!toast.message && <Text style={styles.message}>{toast.message}</Text>}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    top: 44,
    left: 16,
    right: 16,
    zIndex: 999
  },
  card: {
    backgroundColor: '#0b1220',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10
  },
  title: {
    fontWeight: '700',
    fontSize: 14,
    marginBottom: 4
  },
  message: {
    color: '#cbd5f5',
    fontSize: 13
  }
});

export default ToastHost;
