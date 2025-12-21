import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../utils/useTheme';

// Import screens
import DashboardScreen from '../screens/DashboardScreen';
import PortfolioScreen from '../screens/PortfolioScreen';
import ReportsScreen from '../screens/ReportsScreen';
import AddInvestmentScreen from '../screens/AddInvestmentScreen';
import InvestmentDetailScreen from '../screens/InvestmentDetailScreen';
import EditInvestmentScreen from '../screens/EditInvestmentScreen';
import AddPostOfficeRDScreen from '../screens/AddPostOfficeRDScreen';
import AddInvestmentFormScreen from '../screens/AddInvestmentFormScreen';
import SettingsScreen from '../screens/SettingsScreen';
import YearlyReturnsBreakdownScreen from '../screens/YearlyReturnsBreakdownScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

// Tab Navigator for main screens
const MainTabs = () => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Dashboard') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Portfolio') {
            iconName = focused ? 'briefcase' : 'briefcase-outline';
          } else if (route.name === 'Reports') {
            iconName = focused ? 'bar-chart' : 'bar-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: colors.tabActiveColor,
        tabBarInactiveTintColor: colors.tabInactiveColor,
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.cardBackground,
          paddingBottom: insets.bottom + 8,
          paddingTop: 8,
          height: 70 + insets.bottom,
          borderTopWidth: 1,
          borderTopColor: colors.borderLight
        }
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Portfolio" component={PortfolioScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
};

// Main Stack Navigator
const AppNavigator = () => {
  const { colors } = useTheme();

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.headerBackground,
          },
          headerTintColor: colors.iconColor,
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="AddInvestment"
          component={AddInvestmentScreen}
          options={{ title: 'Add Investment' }}
        />
        <Stack.Screen
          name="InvestmentDetail"
          component={InvestmentDetailScreen}
          options={{ title: 'Investment Details' }}
        />
        <Stack.Screen
          name="EditInvestment"
          component={EditInvestmentScreen}
          options={{ title: 'Edit Investment' }}
        />
        <Stack.Screen
          name="AddPostOfficeRD"
          component={AddPostOfficeRDScreen}
          options={{ title: 'Add Post Office RD' }}
        />
        <Stack.Screen
          name="AddInvestmentForm"
          component={AddInvestmentFormScreen}
          options={({ route }) => ({
            title: `Add ${route.params?.investmentType ? 'Investment' : 'Investment'}`
          })}
        />
        <Stack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="YearlyReturnsBreakdown"
          component={YearlyReturnsBreakdownScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
