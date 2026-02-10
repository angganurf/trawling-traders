import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme } from '../theme';

const LOB_AVATAR = require('../../assets/lob-avatar.png');

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  transparent?: boolean;
  onBack?: () => void;
  onMenu?: () => void;
  onProfile?: () => void;
}

export function AppHeader({
  title,
  showBack = false,
  transparent = false,
  onBack,
  onMenu,
  onProfile,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        backgroundColor: transparent ? 'transparent' : lightTheme.colors.background,
      }}
    >
    <View
      style={{
        height: 56,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 10,
      }}
    >
      <TouchableOpacity
        onPress={showBack ? onBack : onMenu}
        style={{ paddingHorizontal: 8, paddingVertical: 6 }}
        accessibilityLabel={showBack ? 'Go back' : 'Open menu'}
      >
        <Ionicons
          name={showBack ? 'arrow-back' : 'menu'}
          size={24}
          color={lightTheme.colors.wave[800]}
        />
      </TouchableOpacity>

      <Text
        style={{
          color: lightTheme.colors.wave[900],
          fontSize: 20,
          fontFamily: lightTheme.typography.families.display,
        }}
      >
        {title}
      </Text>

      <TouchableOpacity onPress={onProfile} style={{ paddingHorizontal: 2 }}>
        <Image
          source={LOB_AVATAR}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: 1.5,
            borderColor: lightTheme.colors.cardBorder,
          }}
        />
      </TouchableOpacity>
    </View>
    </View>
  );
}
