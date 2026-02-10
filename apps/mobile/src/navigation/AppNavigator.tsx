import React from 'react';
import { ImageBackground, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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

const SHIP_LOCKER_BG = require('../../../../assets/branding/tt-panel.png');
const PANEL_BUTTON_OFF = require('../../../../assets/branding/tt-panel-button-off.png');

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
      drawerContent={(props) => <MainDrawerContent {...props} />}
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
    </Drawer.Navigator>
  );
}

function MainDrawerContent(props: any) {
  const insets = useSafeAreaInsets();
  const nav = props.navigation;
  const activeRoute = props.state?.routeNames?.[props.state?.index] ?? 'Home';
  const items: { key: string; label: string; active?: boolean; onPress: () => void }[] = [
    {
      key: 'home',
      label: 'Home',
      active: activeRoute === 'Home',
      onPress: () => {
        nav.closeDrawer();
        nav.navigate('Home');
      },
    },
    {
      key: 'docs',
      label: 'Docs',
      active: activeRoute === 'Docs',
      onPress: () => {
        nav.closeDrawer();
        nav.navigate('Docs');
      },
    },
    {
      key: 'reports',
      label: 'Reports',
      active: activeRoute === 'Reports',
      onPress: () => {
        nav.closeDrawer();
        nav.navigate('Reports');
      },
    },
    {
      key: 'chat',
      label: 'Chat',
      active: activeRoute === 'Chat',
      onPress: () => {
        nav.closeDrawer();
        nav.navigate('Chat');
      },
    },
    {
      key: 'fuel',
      label: 'Fuel your fleet',
      onPress: () => {
        nav.closeDrawer();
        nav.getParent()?.navigate('Deposit');
      },
    },
  ];
  return (
    <DrawerContentScrollView
      {...props}
      style={styles.drawerScrollContainer}
      contentContainerStyle={styles.drawerScroll}
    >
      <ImageBackground source={SHIP_LOCKER_BG} style={styles.drawerBg} resizeMode="cover">
        <View style={[styles.drawerItemsWrap, { paddingTop: insets.top + 128 }]}>
          {items.map((item) => (
            <DrawerLabelButton
              key={item.key}
              label={item.label}
              active={item.active}
              onPress={item.onPress}
            />
          ))}
        </View>
      </ImageBackground>
    </DrawerContentScrollView>
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
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', headerTransparent: true }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings', headerTransparent: true }} />
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
  const insets = useSafeAreaInsets();
  const nav = props.navigation;
  const items: { key: string; label: string; onPress: () => void }[] = [
    {
      key: 'profile',
      label: 'Profile',
      onPress: () => {
        nav.closeDrawer();
        nav.navigate('App', { screen: 'Profile' });
      },
    },
    {
      key: 'billing',
      label: 'Billing',
      onPress: () => {
        nav.closeDrawer();
        nav.navigate('App', { screen: 'Billing' });
      },
    },
    {
      key: 'settings',
      label: 'Settings',
      onPress: () => {
        nav.closeDrawer();
        nav.navigate('App', { screen: 'Settings' });
      },
    },
    {
      key: 'logout',
      label: 'Log out',
      onPress: () => {
        nav.closeDrawer();
        nav.navigate('App', { screen: 'Auth' });
      },
    },
  ];
  return (
    <DrawerContentScrollView
      {...props}
      style={styles.drawerScrollContainer}
      contentContainerStyle={styles.drawerScroll}
    >
      <ImageBackground source={SHIP_LOCKER_BG} style={styles.drawerBg} resizeMode="cover">
        <View style={[styles.drawerItemsWrap, { paddingTop: insets.top + 128 }]}>
          {items.map((item) => (
            <DrawerLabelButton
              key={item.key}
              label={item.label}
              onPress={item.onPress}
            />
          ))}
        </View>
      </ImageBackground>
    </DrawerContentScrollView>
  );
}

function DrawerLabelButton({
  label,
  onPress,
  active = false,
}: {
  label: string;
  onPress: () => void;
  active?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.drawerLabel, active ? styles.drawerLabelActive : undefined]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <ImageBackground source={PANEL_BUTTON_OFF} style={styles.drawerLabelBg} resizeMode="stretch" />
      {active ? <View style={styles.drawerActiveMarker} /> : null}
      <Text style={[styles.drawerLabelText, active ? styles.drawerLabelTextActive : undefined]}>
        {label}
      </Text>
    </TouchableOpacity>
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

const styles = StyleSheet.create({
  drawerScrollContainer: {
    marginTop: 0,
    paddingTop: 0,
  },
  drawerScroll: {
    flexGrow: 1,
    paddingTop: 0,
  },
  drawerBg: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingHorizontal: 0,
  },
  drawerItemsWrap: {
    gap: 16,
    paddingBottom: 20,
  },
  drawerLabel: {
    marginHorizontal: 18,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  drawerLabelBg: {
    ...StyleSheet.absoluteFillObject,
  },
  drawerLabelActive: {
    shadowColor: '#0a1a2d',
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  drawerLabelText: {
    color: '#eef6ff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'left',
    letterSpacing: 0.25,
  },
  drawerLabelTextActive: {
    color: '#ffffff',
  },
  drawerActiveMarker: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -20,
    width: 10,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#ffc53d',
    shadowColor: '#ffca45',
    shadowOpacity: 0.62,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
});
