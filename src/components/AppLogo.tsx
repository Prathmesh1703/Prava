import React from 'react';
import { StyleSheet, View, Image, Text, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { fontFamilies } from '../theme/typography';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | number;
  showWordmark?: boolean;
  showTagline?: boolean;
  variant?: 'icon' | 'horizontal' | 'stacked';
  style?: ViewStyle;
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'lg',
  showWordmark = false,
  showTagline = false,
  variant = 'icon',
  style,
}) => {
  const { colors } = useTheme();

  let dimension = 68;
  if (typeof size === 'number') {
    dimension = size;
  } else if (size === 'sm') {
    dimension = 40;
  } else if (size === 'md') {
    dimension = 54;
  } else if (size === 'lg') {
    dimension = 68;
  } else if (size === 'xl') {
    dimension = 84;
  }

  if (!showWordmark) {
    return (
      <View style={[styles.container, { width: dimension, height: dimension }, style]}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  const isStacked = variant === 'stacked';

  return (
    <View
      style={[
        isStacked ? styles.stackedContainer : styles.horizontalContainer,
        style,
      ]}
    >
      <Image
        source={require('../../assets/images/logo.png')}
        style={{ width: dimension, height: dimension }}
        resizeMode="contain"
      />
      <View style={isStacked ? styles.stackedTextCol : styles.horizontalTextCol}>
        <Text
          style={[
            styles.brandText,
            {
              color: colors.text,
              fontSize: Math.round(dimension * 0.42),
            },
          ]}
        >
          PRAVA
        </Text>
        {showTagline && (
          <Text
            style={[
              styles.taglineText,
              {
                color: colors.amber,
                fontSize: Math.max(9, Math.round(dimension * 0.16)),
              },
            ]}
          >
            TRACK YOUR PROGRESS
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  horizontalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  horizontalTextCol: {
    marginLeft: 12,
    justifyContent: 'center',
  },
  stackedContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackedTextCol: {
    alignItems: 'center',
    marginTop: 8,
  },
  brandText: {
    fontFamily: fontFamilies.logo,
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  taglineText: {
    fontFamily: fontFamilies.regular,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginTop: 2,
    textTransform: 'uppercase',
  },
});
