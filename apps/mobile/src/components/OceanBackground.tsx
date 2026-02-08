import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  useColorScheme,
} from 'react-native';
import { lightTheme, darkTheme } from '../theme';

interface OceanBackgroundProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function OceanBackground({ children, style }: OceanBackgroundProps) {
  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;

  return (
    <View style={[styles.background, { backgroundColor: theme.colors.background }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
});
