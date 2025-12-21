import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeNotifications } from './src/services/notificationService';

export default function App() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Initialize notifications on app start
    initializeNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} translucent backgroundColor="transparent" />
    </SafeAreaProvider>
  );
}
