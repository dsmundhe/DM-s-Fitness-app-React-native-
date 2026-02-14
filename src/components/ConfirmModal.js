import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const ConfirmModal = ({
  visible,
  title = 'Are you sure?',
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel
}) => (
  <Modal transparent visible={visible} animationType="fade" onRequestClose={onCancel}>
    <View style={styles.overlay}>
      <View style={styles.card}>
        <Text style={styles.title}>{title}</Text>
        {!!message && <Text style={styles.message}>{message}</Text>}
        <View style={styles.actions}>
          <Pressable style={[styles.button, styles.cancel]} onPress={onCancel}>
            <Text style={styles.cancelText}>{cancelText}</Text>
          </Pressable>
          <Pressable style={[styles.button, styles.confirm]} onPress={onConfirm}>
            <Text style={styles.confirmText}>{confirmText}</Text>
          </Pressable>
        </View>
      </View>
    </View>
  </Modal>
);

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    justifyContent: 'center',
    padding: 24
  },
  card: {
    backgroundColor: '#0b1220',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#1f2937'
  },
  title: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700'
  },
  message: {
    color: '#cbd5f5',
    marginTop: 8,
    marginBottom: 16
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12
  },
  cancel: {
    backgroundColor: '#111827'
  },
  confirm: {
    backgroundColor: '#f97316'
  },
  cancelText: {
    color: '#e2e8f0',
    fontWeight: '600'
  },
  confirmText: {
    color: '#0b1220',
    fontWeight: '700'
  }
});

export default ConfirmModal;
