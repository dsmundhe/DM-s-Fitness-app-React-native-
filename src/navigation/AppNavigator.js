import React, { useContext } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import AuthContext from '../context/AuthContext';
import SplashScreen from '../screens/SplashScreen';
import AuthScreen from '../screens/AuthScreen';
import DashboardScreen from '../screens/DashboardScreen';
import AttendanceScreen from '../screens/AttendanceScreen';
import ProgressScreen from '../screens/ProgressScreen';
import StreakScreen from '../screens/StreakScreen';
import AchievementScreen from '../screens/AchievementScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const AuthStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Auth" component={AuthScreen} />
  </Stack.Navigator>
);

const AppTabs = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarStyle: { backgroundColor: '#0f172a', borderTopColor: '#1f2937', paddingBottom: 22, height: 86 },
      tabBarActiveTintColor: '#f97316',
      tabBarInactiveTintColor: '#94a3b8',
      tabBarIcon: ({ color, size, focused }) => {
        let iconName = 'ellipse';
        switch (route.name) {
          case 'Dashboard':
            iconName = focused ? 'grid' : 'grid-outline';
            break;
          case 'Attendance':
            iconName = focused ? 'checkbox' : 'checkbox-outline';
            break;
          case 'Progress':
            iconName = focused ? 'analytics' : 'analytics-outline';
            break;
          case 'Streak':
            iconName = focused ? 'flame' : 'flame-outline';
            break;
          case 'Achievements':
            iconName = focused ? 'trophy' : 'trophy-outline';
            break;
          case 'Profile':
            iconName = focused ? 'person' : 'person-outline';
            break;
          default:
            break;
        }
        return <Ionicons name={iconName} size={20} color={color} />;
      }
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Attendance" component={AttendanceScreen} />
    <Tab.Screen name="Progress" component={ProgressScreen} />
    <Tab.Screen name="Streak" component={StreakScreen} />
    <Tab.Screen name="Achievements" component={AchievementScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

const AppNavigator = () => {
  const { loading, token } = useContext(AuthContext);

  if (loading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      {token ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  );
};

export default AppNavigator;
