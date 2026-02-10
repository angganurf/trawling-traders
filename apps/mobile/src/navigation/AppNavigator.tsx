import React from 'react';
import { Alert, Image, Text, TouchableOpacity } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { NavigationContainer, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme } from '../theme';

import { AuthScreen } from '../screens/AuthScreen';
import { SubscribeScreen } from '../screens/SubscribeScreen';
import { HomeOverviewScreen } from '../screens/HomeOverviewScreen';
import { CreateBotScreen } from '../screens/CreateBotScreen';
import { BotDetailScreen } from '../screens/BotDetailScreen';
import { BotStrategyConfigScreen } from '../screens/BotStrategyConfigScreen';
import { BotBehaviorConfigScreen } from '../screens/BotBehaviorConfigScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { ChatScreen } from '../screens/ChatScreen';
import { ReportsScreen } from '../screens/ReportsScreen';
import { DocsScreen } from '../screens/DocsScreen';
import { SettingsScreen } from '../screens/SettingsScreen';
import { BillingScreen } from '../screens/BillingScreen';
import { ResearchScreen } from '../screens/ResearchScreen';
import { LeaderboardScreen } from '../screens/LeaderboardScreen';
import { CommunityScreen } from '../screens/CommunityScreen';

export type RootStackParamList = {
  Auth: undefined;
  Subscribe: undefined;
  Main: undefined;
  CreateBot: undefined;
  BotDetail: { botId: string };
  BotStrategyConfig: { botId: string };
  BotBehaviorConfig: { botId: string };
  BotSettings: { botId: string };
  Profile: undefined;
  Settings: undefined;
  Billing: undefined;
};

export type MainDrawerParamList = {
  Home: undefined;
  Docs: undefined;
  Reports: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<MainDrawerParamList>();
const Tab = createBottomTabNavigator();
const LOB_AVATAR = require('../../assets/lob-avatar.png');

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: lightTheme.colors.primary[900],
        tabBarInactiveTintColor: lightTheme.colors.wave[500],
        tabBarActiveBackgroundColor: '#d6eefb',
        tabBarShowLabel: false,
        tabBarIcon: ({ color, focused, size }) => {
          const iconSize = focused ? size : Math.max(size - 1, 18);
          const iconByRoute: Record<string, keyof typeof Ionicons.glyphMap> = {
            Bots: focused ? 'grid' : 'grid-outline',
            Research: focused ? 'search' : 'search-outline',
            Leaderboard: focused ? 'trophy' : 'trophy-outline',
            Community: focused ? 'people' : 'people-outline',
          };
          return <Ionicons name={iconByRoute[route.name] || 'ellipse'} size={iconSize} color={color} />;
        },
        tabBarItemStyle: {
          borderRadius: 8,
          marginHorizontal: 0,
          marginVertical: 6,
          paddingVertical: 0,
          borderRightWidth: route.name === 'Community' ? 0 : 1,
          borderRightColor: lightTheme.colors.cardBorder,
        },
        tabBarStyle: {
          backgroundColor: lightTheme.colors.surface,
          borderTopColor: lightTheme.colors.cardBorder,
          borderTopWidth: 1,
          height: 50,
          paddingHorizontal: 0,
          paddingBottom: 4,
          paddingTop: 2,
        },
      })}
    >
      <Tab.Screen name="Bots" component={HomeOverviewScreen} />
      <Tab.Screen name="Research" component={ResearchScreen} />
      <Tab.Screen name="Leaderboard" component={LeaderboardScreen} />
      <Tab.Screen name="Community" component={CommunityScreen} />
    </Tab.Navigator>
  );
}

function MainDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={({ navigation, route }) => ({
        headerShown: true,
        headerStyle: {
          backgroundColor: lightTheme.colors.primary[900],
          height: 58,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontFamily: lightTheme.typography.families.display,
          fontSize: 22,
        },
        headerStatusBarHeight: 0,
        drawerActiveTintColor: lightTheme.colors.primary[700],
        headerTitle:
          route.name === 'Home'
            ? getFocusedRouteNameFromRoute(route) || 'Bots'
            : route.name,
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            style={{ marginLeft: 12, paddingHorizontal: 8, paddingVertical: 6 }}
            accessibilityLabel="Open menu"
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
        ),
        headerRight: () => (
          <TouchableOpacity
            onPress={() =>
              profileMenu(
                () => navigation.getParent()?.navigate('Profile'),
                () => navigation.getParent()?.navigate('Billing'),
                () => navigation.getParent()?.navigate('Settings'),
                () => navigation.getParent()?.navigate('Auth')
              )
            }
            style={{ marginRight: 12, paddingHorizontal: 2 }}
          >
            <Image
              source={LOB_AVATAR}
              style={{ width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: '#fff' }}
            />
          </TouchableOpacity>
        ),
      })}
    >
      <Drawer.Screen name="Home" component={MainTabs} />
      <Drawer.Screen name="Docs" component={DocsScreen} />
      <Drawer.Screen name="Reports" component={ReportsScreen} />
      <Drawer.Screen name="Chat" component={ChatScreen} />
    </Drawer.Navigator>
  );
}

function profileMenu(
  onNavigateProfile: () => void,
  onNavigateBilling: () => void,
  onNavigateSettings: () => void,
  onLogout: () => void
) {
  Alert.alert('Profile Menu', 'Choose an option', [
    { text: 'Profile', onPress: onNavigateProfile },
    { text: 'Billing', onPress: onNavigateBilling },
    { text: 'Settings', onPress: onNavigateSettings },
    { text: 'Log out', style: 'destructive', onPress: onLogout },
    { text: 'Cancel', style: 'cancel' },
  ]);
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Auth"
        screenOptions={({ navigation }) => ({
          headerStyle: { backgroundColor: lightTheme.colors.primary[900] },
          headerTintColor: '#fff',
          headerTitleStyle: { fontWeight: '600', fontFamily: lightTheme.typography.families.display },
          headerRight: () => (
            <TouchableOpacity
              onPress={() =>
                profileMenu(
                  () => navigation.navigate('Profile'),
                  () => navigation.navigate('Billing'),
                  () => navigation.navigate('Settings'),
                  () => navigation.navigate('Auth')
                )
              }
              style={{ paddingHorizontal: 10, paddingVertical: 6 }}
            >
              <Text style={{ fontSize: 18, color: '#fff' }}>👤</Text>
            </TouchableOpacity>
          ),
        })}
      >
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Subscribe" component={SubscribeScreen} options={{ title: 'Subscribe', headerRight: () => null }} />
        <Stack.Screen name="Main" component={MainDrawer} options={{ headerShown: false }} />
        <Stack.Screen name="CreateBot" component={CreateBotScreen} options={{ title: 'Create Bot' }} />
        <Stack.Screen name="BotDetail" component={BotDetailScreen} options={{ title: 'Bot Details' }} />
        <Stack.Screen name="BotStrategyConfig" component={BotStrategyConfigScreen} options={{ title: 'Strategy Config' }} />
        <Stack.Screen name="BotBehaviorConfig" component={BotBehaviorConfigScreen} options={{ title: 'Behavior Config' }} />
        <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
        <Stack.Screen name="Billing" component={BillingScreen} options={{ title: 'Billing' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
