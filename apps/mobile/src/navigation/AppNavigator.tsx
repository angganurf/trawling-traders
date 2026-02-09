import React from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
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
};

export type MainDrawerParamList = {
  Home: undefined;
  Docs: undefined;
  Reports: undefined;
  Chat: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<MainDrawerParamList>();

function PlaceholderScreen({ title }: { title: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: lightTheme.colors.background }}>
      <Text style={{ fontSize: 20, fontWeight: '700', color: lightTheme.colors.wave[800] }}>{title}</Text>
      <Text style={{ marginTop: 6, color: lightTheme.colors.wave[500] }}>This section is staged next.</Text>
    </View>
  );
}

function MainDrawer() {
  return (
    <Drawer.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: lightTheme.colors.primary[900] },
        headerTintColor: '#fff',
        headerTitleStyle: { fontFamily: lightTheme.typography.families.display },
        drawerActiveTintColor: lightTheme.colors.primary[700],
      }}
    >
      <Drawer.Screen name="Home" component={HomeOverviewScreen} />
      <Drawer.Screen name="Docs" children={() => <PlaceholderScreen title="Docs" />} />
      <Drawer.Screen name="Reports" component={ReportsScreen} />
      <Drawer.Screen name="Chat" component={ChatScreen} />
    </Drawer.Navigator>
  );
}

function profileMenu(onNavigateProfile: () => void, onLogout: () => void) {
  Alert.alert('Profile Menu', 'Choose an option', [
    { text: 'Profile', onPress: onNavigateProfile },
    { text: 'Billing', onPress: () => Alert.alert('Billing', 'Billing page is staged next.') },
    { text: 'Settings', onPress: () => Alert.alert('Settings', 'Settings page is staged next.') },
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
