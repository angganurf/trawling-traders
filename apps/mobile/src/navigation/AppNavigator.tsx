import React from 'react';
import { View } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItem } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { lightTheme } from '../theme';
import { AppHeader } from '../components/AppHeader';
import { AppTabBar } from '../components/AppTabBar';

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
import { DepositScreen } from '../screens/DepositScreen';
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
  Deposit: undefined;
};

export type MainDrawerParamList = {
  Home: undefined;
  Docs: undefined;
  Reports: undefined;
  Chat: undefined;
  Deposit: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Drawer = createDrawerNavigator<MainDrawerParamList>();
const ProfileDrawer = createDrawerNavigator<{ App: undefined }>();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <AppTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
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
      screenOptions={({ navigation }) => ({
        headerShown: true,
        drawerActiveTintColor: lightTheme.colors.primary[700],
        header: () => (
          <AppHeader
            title="Trawling Traders"
            onMenu={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            onProfile={() => navigation.getParent()?.getParent()?.dispatch(DrawerActions.toggleDrawer())}
          />
        ),
      })}
    >
      <Drawer.Screen
        name="Home"
        component={MainTabs}
        options={({ navigation }) => ({
          headerTransparent: true,
          header: () => (
            <AppHeader
              title="Trawling Traders"
              transparent
              onMenu={() => navigation.dispatch(DrawerActions.toggleDrawer())}
              onProfile={() => navigation.getParent()?.getParent()?.dispatch(DrawerActions.toggleDrawer())}
            />
          ),
        })}
      />
      <Drawer.Screen name="Docs" component={DocsScreen} />
      <Drawer.Screen name="Reports" component={ReportsScreen} />
      <Drawer.Screen name="Chat" component={ChatScreen} />
      <Drawer.Screen name="Deposit" component={DepositScreen} />
    </Drawer.Navigator>
  );
}

function AppStack() {
  return (
    <Stack.Navigator
      initialRouteName="Auth"
      screenOptions={{
        header: ({ navigation, route, options, back }) => (
          <AppHeader
            title={typeof options.title === 'string' ? options.title : route.name}
            showBack={!!back}
            transparent={Boolean(options.headerTransparent)}
            onBack={back ? navigation.goBack : undefined}
            onMenu={back ? undefined : () => navigation.dispatch(DrawerActions.toggleDrawer())}
            onProfile={() => navigation.getParent()?.dispatch(DrawerActions.toggleDrawer())}
          />
        ),
      }}
    >
      <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Subscribe" component={SubscribeScreen} options={{ title: 'Subscribe', headerRight: () => null }} />
      <Stack.Screen name="Main" component={MainDrawer} options={{ headerShown: false }} />
      <Stack.Screen
        name="CreateBot"
        component={CreateBotScreen}
        options={({ navigation }) => ({
          title: 'Create Boat',
          headerTransparent: true,
          header: () => (
            <AppHeader
              title="Create Boat"
              showBack
              transparent
              onBack={navigation.goBack}
              onProfile={() => navigation.getParent()?.dispatch(DrawerActions.toggleDrawer())}
            />
          ),
        })}
      />
      <Stack.Screen name="BotDetail" component={BotDetailScreen} options={{ title: 'Bot Details' }} />
      <Stack.Screen name="BotStrategyConfig" component={BotStrategyConfigScreen} options={{ title: 'Strategy Config' }} />
      <Stack.Screen name="BotBehaviorConfig" component={BotBehaviorConfigScreen} options={{ title: 'Behavior Config' }} />
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <Stack.Screen name="Billing" component={BillingScreen} options={{ title: 'Billing' }} />
      <Stack.Screen
        name="Deposit"
        component={DepositScreen}
        options={{ title: 'Fuel your fleet', headerTransparent: true }}
      />
    </Stack.Navigator>
  );
}

function ProfileDrawerContent(props: any) {
  const nav = props.navigation;
  return (
    <DrawerContentScrollView {...props}>
      <DrawerItem
        label="Profile"
        onPress={() => {
          nav.closeDrawer();
          nav.navigate('App', { screen: 'Profile' });
        }}
      />
      <DrawerItem
        label="Billing"
        onPress={() => {
          nav.closeDrawer();
          nav.navigate('App', { screen: 'Billing' });
        }}
      />
      <DrawerItem
        label="Settings"
        onPress={() => {
          nav.closeDrawer();
          nav.navigate('App', { screen: 'Settings' });
        }}
      />
      <DrawerItem
        label="Log out"
        onPress={() => {
          nav.closeDrawer();
          nav.navigate('App', { screen: 'Auth' });
        }}
      />
    </DrawerContentScrollView>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <ProfileDrawer.Navigator
        screenOptions={{
          headerShown: false,
          drawerPosition: 'right',
          drawerType: 'front',
          swipeEnabled: false,
        }}
        drawerContent={(props) => <ProfileDrawerContent {...props} />}
      >
        <ProfileDrawer.Screen name="App" component={AppStack} />
      </ProfileDrawer.Navigator>
    </NavigationContainer>
  );
}
