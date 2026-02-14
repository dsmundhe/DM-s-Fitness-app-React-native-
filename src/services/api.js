import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

const resolvedApiUrl =
  process.env.EXPO_PUBLIC_API_URL ||
  Constants.expoConfig?.extra?.apiUrl ||
  'http://localhost:4000/api';

const apiUrl =
  Platform.OS === 'android' && resolvedApiUrl.includes('localhost')
    ? resolvedApiUrl.replace('localhost', '10.0.2.2')
    : resolvedApiUrl;

const api = axios.create({
  baseURL: apiUrl,
  timeout: 10000
});

export default api;
