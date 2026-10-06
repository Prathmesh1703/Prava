export interface ColorPalette {
  background: string;
  card: string;
  cardElevated: string;
  cardMuted: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textTertiary: string;
  accent: string;
  accentLight: string;
  accentDark: string;
  maroon: string;
  amber: string;
  orange: string;
  brandDark: string;
  brandLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  dangerLight: string;
  pillBackground: string;
  pillBorder: string;
  modalBackdrop: string;
}

/**
 * Prava Refined Color System:
 * Sleek, athletic, minimal obsidian with the subtlest whisper of maroon.
 * Neutral, high-contrast, premium dark and light modes with zero hospital tint.
 */

export const brandColors = {
  maroon: '#7A1E2D',
  orange: '#FF6A1F',
  amber: '#FFA647',
  dark: '#0D0D10',
  light: '#F8F9FA',
};

export const lightPalette: ColorPalette = {
  background: '#F8F9FA', // Clean, crisp, neutral off-white
  card: '#FFFFFF',
  cardElevated: '#FFFFFF',
  cardMuted: '#F1F3F5',
  border: '#E5E7EB',
  borderSubtle: '#F3F4F6',
  text: '#0F172A', // Deep slate for high contrast
  textSecondary: '#475569',
  textTertiary: '#94A3B8',
  accent: '#7A1E2D', // Subtle Prava Maroon
  accentLight: 'rgba(122, 30, 45, 0.08)',
  accentDark: '#54121E',
  maroon: '#7A1E2D',
  amber: '#D97706',
  orange: '#EA580C',
  brandDark: '#0D0D10',
  brandLight: '#F8F9FA',
  success: '#10B981',
  successLight: '#ECFDF5',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  pillBackground: 'rgba(255, 255, 255, 0.94)',
  pillBorder: 'rgba(229, 231, 235, 0.9)',
  modalBackdrop: 'rgba(15, 23, 42, 0.52)',
};

export const darkPalette: ColorPalette = {
  background: '#0D0D10', // Deep obsidian midnight with faint, subtle cool maroon undertone
  card: '#161519', // Elevated slate-charcoal card
  cardElevated: '#1D1C22',
  cardMuted: '#111013',
  border: '#28252C', // Subtle, minimal dark border
  borderSubtle: '#1E1C22',
  text: '#FFFFFF', // Pure, crisp white
  textSecondary: '#9CA3AF', // Clean neutral silver-gray
  textTertiary: '#6B7280',
  accent: '#8B1E2E', // Subtle athletic Maroon
  accentLight: 'rgba(139, 30, 46, 0.16)',
  accentDark: '#F43F5E', // High-contrast readable crimson for dark backgrounds
  maroon: '#7A1E2D',
  amber: '#FFA647',
  orange: '#FF6A1F',
  brandDark: '#0D0D10',
  brandLight: '#F8F9FA',
  success: '#10B981',
  successLight: 'rgba(16, 185, 129, 0.16)',
  warning: '#F59E0B',
  warningLight: 'rgba(245, 158, 11, 0.16)',
  danger: '#EF4444',
  dangerLight: 'rgba(239, 68, 68, 0.16)',
  pillBackground: 'rgba(13, 13, 16, 0.94)',
  pillBorder: 'rgba(40, 37, 44, 0.85)',
  modalBackdrop: 'rgba(0, 0, 0, 0.80)',
};
