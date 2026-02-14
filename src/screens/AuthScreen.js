import React, { useContext, useEffect, useRef, useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AuthContext from '../context/AuthContext';
import InputField from '../components/InputField';
import PrimaryButton from '../components/PrimaryButton';
import ScreenLoader from '../components/ScreenLoader';
import { useToast } from '../context/ToastContext';

const AuthScreen = () => {
  const { login, signup } = useContext(AuthContext);
  const { showToast } = useToast();

  const [mode, setMode] = useState('login');
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [name, setName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');

  const formAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const next = mode === 'login' ? 0 : 1;
    Animated.timing(formAnim, {
      toValue: next,
      duration: 220,
      useNativeDriver: true
    }).start();
  }, [mode, formAnim]);

  const handleLogin = async () => {
    if (!loginEmail.trim() || !loginPassword) {
      showToast({ type: 'warning', title: 'Login failed', message: 'Please fill in all fields.' });
      return;
    }
    try {
      setLoading(true);
      await login(loginEmail.trim(), loginPassword);
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

  const handleSignup = async () => {
    if (!name.trim() || !signupEmail.trim() || !signupPassword) {
      showToast({ type: 'warning', title: 'Signup failed', message: 'Please fill in all fields.' });
      return;
    }
    try {
      setLoading(true);
      await signup(name.trim(), signupEmail.trim(), signupPassword);
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

  const loginOpacity = formAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0]
  });
  const signupOpacity = formAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1]
  });

  const loginShift = formAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -16]
  });
  const signupShift = formAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0]
  });

  return (
    <LinearGradient colors={['#070d1a', '#0a1220', '#020617']} style={styles.container}>
      <View style={styles.bgOrbA} />
      <View style={styles.bgOrbB} />
      <ScreenLoader visible={loading} message={mode === 'login' ? 'Signing in...' : 'Creating account...'} />
      <KeyboardAvoidingView
        style={styles.keyboardWrap}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.brand}>DM Fitness</Text>
          <Text style={styles.subtitle}>
            {mode === 'login' ? 'Welcome back. Continue your streak.' : 'Create your account and start tracking daily.'}
          </Text>

          <View style={styles.formCard}>
            <Animated.View
              pointerEvents={mode === 'login' ? 'auto' : 'none'}
              style={[styles.formLayer, { opacity: loginOpacity, transform: [{ translateX: loginShift }] }]}
            >
              <InputField label="Email" value={loginEmail} onChangeText={setLoginEmail} placeholder="you@email.com" keyboardType="email-address" />
              <InputField
                label="Password"
                value={loginPassword}
                onChangeText={setLoginPassword}
                placeholder="Password"
                secureTextEntry
                showPasswordToggle
              />
              <PrimaryButton label="Login" onPress={handleLogin} disabled={loading || mode !== 'login'} />
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>New here?</Text>
                <TouchableOpacity onPress={() => setMode('signup')}>
                  <Text style={styles.switchLink}>Create an account</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>

            <Animated.View
              pointerEvents={mode === 'signup' ? 'auto' : 'none'}
              style={[styles.formLayer, { opacity: signupOpacity, transform: [{ translateX: signupShift }] }]}
            >
              <InputField label="Full Name" value={name} onChangeText={setName} placeholder="Your name" />
              <InputField label="Email" value={signupEmail} onChangeText={setSignupEmail} placeholder="you@email.com" keyboardType="email-address" />
              <InputField
                label="Password"
                value={signupPassword}
                onChangeText={setSignupPassword}
                placeholder="Create password"
                secureTextEntry
                showPasswordToggle
              />
              <PrimaryButton label="Create Account" onPress={handleSignup} disabled={loading || mode !== 'signup'} />
              <View style={styles.switchRow}>
                <Text style={styles.switchText}>Already have an account?</Text>
                <TouchableOpacity onPress={() => setMode('login')}>
                  <Text style={styles.switchLink}>Sign in</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgOrbA: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(249,115,22,0.14)',
    top: -70,
    right: -40
  },
  bgOrbB: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(56,189,248,0.10)',
    bottom: -50,
    left: -30
  },
  keyboardWrap: {
    flex: 1
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 24
  },
  brand: {
    color: '#f8fafc',
    fontSize: 30,
    fontWeight: '700',
    marginBottom: 8
  },
  subtitle: {
    color: '#94a3b8',
    marginBottom: 20
  },
  formCard: {
    backgroundColor: '#0b1322',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#22344f',
    padding: 16,
    minHeight: 360
  },
  formLayer: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: 16
  },
  switchRow: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6
  },
  switchText: {
    color: '#94a3b8'
  },
  switchLink: {
    color: '#f97316',
    fontWeight: '700'
  }
});

export default AuthScreen;
