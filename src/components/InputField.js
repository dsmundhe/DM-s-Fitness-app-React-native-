import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  showPasswordToggle
}) => {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));

  useEffect(() => {
    if (showPasswordToggle) {
      setHidden(Boolean(secureTextEntry));
    }
  }, [secureTextEntry, showPasswordToggle]);

  const useSecure = showPasswordToggle ? hidden : secureTextEntry;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View>
        <TextInput
          style={[styles.input, showPasswordToggle ? styles.inputWithIcon : null]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#64748b"
          secureTextEntry={useSecure}
          keyboardType={keyboardType}
          selectionColor="#f97316"
        />
        {showPasswordToggle ? (
          <TouchableOpacity style={styles.iconButton} onPress={() => setHidden((prev) => !prev)}>
            <Ionicons name={hidden ? 'eye-off-outline' : 'eye-outline'} size={20} color="#94a3b8" />
          </TouchableOpacity>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 14
  },
  label: {
    color: '#cbd5f5',
    marginBottom: 6,
    fontWeight: '600'
  },
  input: {
    backgroundColor: '#0b1120',
    borderColor: '#1e293b',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#f8fafc',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4
  },
  inputWithIcon: {
    paddingRight: 42
  },
  iconButton: {
    position: 'absolute',
    right: 12,
    top: 11
  }
});

export default InputField;
