import React, { useContext, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import AppGradient from '../components/AppGradient';
import AuthContext from '../context/AuthContext';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLoader from '../components/ScreenLoader';
import { useToast } from '../context/ToastContext';

const SignupScreen = ({ navigation }) => {
  const { signup } = useContext(AuthContext);
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    if (!name.trim() || !email.trim() || !password) {
      showToast({ type: 'warning', title: 'Signup failed', message: 'Please fill in all fields.' });
      return;
    }
    try {
      setLoading(true);
      await signup(name.trim(), email.trim(), password);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        (error?.code === 'ECONNABORTED' ? 'Request timed out. Check your API URL and backend status.' : null) ||
        (error?.response?.status === 400 ? 'Please check your details and try again.' : null) ||
        (error?.message?.includes('Network') ? 'Cannot reach server. Check API URL and backend status.' : null) ||
        'Please try again with valid details.';
      showToast({ type: 'error', title: 'Signup failed', message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppGradient style={styles.container}>
      <ScreenLoader visible={loading} message="Creating account..." />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Start tracking your progress today.</Text>

        <InputField label="Full Name" value={name} onChangeText={setName} placeholder="Your name" />
        <InputField label="Email" value={email} onChangeText={setEmail} placeholder="you@email.com" keyboardType="email-address" />
        <InputField label="Password" value={password} onChangeText={setPassword} placeholder="Create password" secureTextEntry />

        <PrimaryButton label={loading ? 'Creating...' : 'Sign Up'} onPress={handleSignup} disabled={loading} />

        <TouchableOpacity style={styles.link} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.linkText}>Already have an account? Sign in</Text>
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

export default SignupScreen;
