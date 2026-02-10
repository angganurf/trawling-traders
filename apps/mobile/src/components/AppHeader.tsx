import React from 'react';
import { Image, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { lightTheme } from '../theme';

const LOB_AVATAR = require('../../assets/lob-avatar.png');

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  onMenu?: () => void;
  onProfile?: () => void;
}

export function AppHeader({
  title,
  showBack = false,
  onBack,
  onMenu,
  onProfile,
}: AppHeaderProps) {
  return (
    <View
      style={{
        height: 56,
        backgroundColor: lightTheme.colors.background,
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
          fontWeight: '700',
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
  );
}
