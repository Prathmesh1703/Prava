import { TextStyle } from 'react-native';

export const fontFamilies = {
  regular: 'Manrope',
  logo: 'Audiowide',
};

export const typography: Record<string, TextStyle> = {
  logo: {
    fontFamily: fontFamilies.logo,
    fontSize: 24,
    letterSpacing: 2,
  },
  logoLarge: {
    fontFamily: fontFamilies.logo,
    fontSize: 30,
    letterSpacing: 3,
  },
  logoSmall: {
    fontFamily: fontFamilies.logo,
    fontSize: 18,
    letterSpacing: 1.5,
  },
  largeTitle: {
    fontFamily: fontFamilies.regular,
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: -0.6,
    lineHeight: 34,
  },
  title1: {
    fontFamily: fontFamilies.regular,
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.4,
    lineHeight: 28,
  },
  title2: {
    fontFamily: fontFamilies.regular,
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: -0.3,
    lineHeight: 24,
  },
  headline: {
    fontFamily: fontFamilies.regular,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  body: {
    fontFamily: fontFamilies.regular,
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.1,
    lineHeight: 21,
  },
  callout: {
    fontFamily: fontFamilies.regular,
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: -0.1,
    lineHeight: 19,
  },
  subhead: {
    fontFamily: fontFamilies.regular,
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0,
    lineHeight: 18,
  },
  caption: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  captionBold: {
    fontFamily: fontFamilies.regular,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.1,
    lineHeight: 16,
  },
  metricLarge: {
    fontFamily: fontFamilies.regular,
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: -0.8,
    lineHeight: 40,
  },
  metricMedium: {
    fontFamily: fontFamilies.regular,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
};
