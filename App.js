import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { initializeNotifications } from './src/services/notificationService';

export default function App() {
  useEffect(() => {
    // Initialize notifications on app start
    initializeNotifications();
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="light" translucent backgroundColor="transparent" />
    </SafeAreaProvider>
  );
}
