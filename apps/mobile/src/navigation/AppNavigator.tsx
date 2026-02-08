import React from 'react';
import { Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { lightTheme } from '../theme';

// Screens
import { AuthScreen } from '../screens/AuthScreen';
import { SubscribeScreen } from '../screens/SubscribeScreen';
import { BotsListScreen } from '../screens/BotsListScreen';
import { CreateBotScreen } from '../screens/CreateBotScreen';
import { BotDetailScreen } from '../screens/BotDetailScreen';
import { BotSettingsScreen } from '../screens/BotSettingsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';

// Types
export type RootStackParamList = {
  Auth: undefined;
  Subscribe: undefined;
  Main: { refresh?: boolean } | undefined;
  CreateBot: undefined;
  BotDetail: { botId: string };
  BotSettings: { botId: string };
};

export type MainTabParamList = {
  Bots: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Main tab navigator (after auth)
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: lightTheme.colors.primary[900],
          borderTopWidth: 0,
          paddingBottom: 4,
          height: 56,
        },
        tabBarActiveTintColor: lightTheme.colors.accent,
        tabBarInactiveTintColor: lightTheme.colors.primary[400],
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Bots"
        component={BotsListScreen}
        options={{
          title: 'My Trawlers',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>🦞</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20, color }}>⚓</Text>,
        }}
      />
    </Tab.Navigator>
  );
}

// Root navigator with auth flow
export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={{
          headerStyle: {
            backgroundColor: lightTheme.colors.primary[900],
          },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600', fontFamily: lightTheme.typography.families.display },
        }}
      >
        <Stack.Screen
          name="Auth"
          component={AuthScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Subscribe"
          component={SubscribeScreen}
          options={{ title: 'Subscribe' }}
        />
        
        <Stack.Screen 
          name="Main" 
          component={MainTabs}
          options={{ headerShown: false }}
        />
        
        <Stack.Screen 
          name="CreateBot" 
          component={CreateBotScreen}
          options={{ title: 'Create Bot' }}
        />
        
        <Stack.Screen 
          name="BotDetail" 
          component={BotDetailScreen}
          options={{ title: 'Bot Details' }}
        />
        
        <Stack.Screen 
          name="BotSettings" 
          component={BotSettingsScreen}
          options={{ title: 'Bot Settings' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
