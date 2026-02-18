import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AppGradient from '../components/AppGradient';
import AuthContext from '../context/AuthContext';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLoader from '../components/ScreenLoader';
import { useToast } from '../context/ToastContext';

const LoginScreen = ({ navigation }) => {
  const { login } = useContext(AuthContext);
  const { showToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      showToast({ type: 'warning', title: 'Login failed', message: 'Please fill in all fields.' });
      return;
    }
    try {
      setLoading(true);
      await login(email.trim(), password);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (error?.code === 'ECONNABORTED' ? 'Request timed out. Check your API URL and backend status.' : null) ||
        (error?.response?.status === 400 ? 'Please check your details and try again.' : null) ||
        (error?.message?.includes('Network') ? 'Cannot reach server. Check API URL and backend status.' : null) ||
        'Please check your credentials.';
      showToast({ type: 'error', title: 'Login failed', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppGradient style={styles.container}>
      <ScreenLoader visible={loading} message="Signing in..." />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue your streak.</Text>

        <InputField label="Email" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" />
        <InputField label="Password" value={password} onChangeText={setPassword} placeholder="••••••" secureTextEntry />

        <PrimaryButton label={loading ? 'Signing in...' : 'Login'} onPress={handleLogin} disabled={loading} />

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.linkText}>New here? Create an account</Text>
        </TouchableOpacity>
      </ScrollView>
    </AppGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: 24,
    flexGrow: 1,
    justifyContent: 'center'
  },
  title: {
    color: '#f8fafc',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8
  },
  subtitle: {
    color: '#94a3b8',
    marginBottom: 24
  },
  link: {
    marginTop: 16,
    alignItems: 'center'
  },
  linkText: {
    color: '#f97316',
    fontWeight: '600'
  }
});

export default LoginScreen;
