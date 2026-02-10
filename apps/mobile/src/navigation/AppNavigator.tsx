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
        <View style={[styles.drawerItemsWrap, { paddingTop: insets.top + 18 }]}>
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
        <View style={[styles.drawerItemsWrap, { paddingTop: insets.top + 18 }]}>
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
      {active ? <View style={styles.drawerActiveMarker} /> : null}
      <View style={[styles.drawerRivet, styles.drawerRivetTopLeft]} />
      <View style={[styles.drawerRivet, styles.drawerRivetTopRight]} />
      <View style={[styles.drawerRivet, styles.drawerRivetBottomLeft]} />
      <View style={[styles.drawerRivet, styles.drawerRivetBottomRight]} />
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
    gap: 14,
    paddingBottom: 20,
  },
  drawerLabel: {
    marginHorizontal: 18,
    borderWidth: 1,
    borderColor: 'rgba(156, 184, 217, 0.42)',
    borderRadius: 18,
    backgroundColor: 'rgba(63, 95, 138, 0.42)',
    paddingVertical: 18,
    paddingHorizontal: 26,
    shadowColor: '#081526',
    shadowOpacity: 0.45,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  drawerLabelActive: {
    borderColor: 'rgba(219, 235, 255, 0.7)',
    backgroundColor: 'rgba(84, 115, 155, 0.6)',
  },
  drawerLabelText: {
    color: '#eef6ff',
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'left',
    letterSpacing: 0.4,
  },
  drawerLabelTextActive: {
    color: '#ffffff',
  },
  drawerActiveMarker: {
    position: 'absolute',
    left: 8,
    top: '50%',
    marginTop: -18,
    width: 12,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ffc53d',
    shadowColor: '#ffca45',
    shadowOpacity: 0.7,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 0 },
  },
  drawerRivet: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(17, 27, 42, 0.65)',
    backgroundColor: 'rgba(126, 152, 184, 0.65)',
  },
  drawerRivetTopLeft: {
    left: 8,
    top: 8,
  },
  drawerRivetTopRight: {
    right: 8,
    top: 8,
  },
  drawerRivetBottomLeft: {
    left: 8,
    bottom: 8,
  },
  drawerRivetBottomRight: {
    right: 8,
    bottom: 8,
  },
});
