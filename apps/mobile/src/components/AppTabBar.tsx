import React from 'react';
import { TouchableOpacity, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { lightTheme } from '../theme';

const ICON_BY_ROUTE: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap }> = {
  Bots: { active: 'grid', inactive: 'grid-outline' },
  Research: { active: 'search', inactive: 'search-outline' },
  Leaderboard: { active: 'trophy', inactive: 'trophy-outline' },
  Community: { active: 'people', inactive: 'people-outline' },
};

export function AppTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        backgroundColor: lightTheme.colors.background,
        height: 48 + Math.max(insets.bottom - 2, 0),
        paddingBottom: Math.max(insets.bottom - 2, 0),
        paddingTop: 2,
        paddingHorizontal: 6,
      }}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const iconMap = ICON_BY_ROUTE[route.name];
        const iconName = isFocused ? iconMap?.active : iconMap?.inactive;
        const color = isFocused ? lightTheme.colors.primary[900] : lightTheme.colors.wave[500];

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        const { options } = descriptors[route.key];

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              marginHorizontal: 4,
              marginVertical: 5,
              borderRadius: 10,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View
              style={{
                width: 36,
                height: 30,
                borderRadius: 9,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isFocused ? '#d6eefb' : 'transparent',
                borderWidth: isFocused ? 1 : 0,
                borderColor: lightTheme.colors.cardBorder,
              }}
            >
              <Ionicons name={iconName || 'ellipse'} size={21} color={color} />
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
