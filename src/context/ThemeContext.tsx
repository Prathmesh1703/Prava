import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { ColorPalette, lightPalette, darkPalette } from '../theme/colors';
import { ThemePreference } from '../types';

const THEME_STORAGE_KEY = 'prava_theme_preference';

interface ThemeContextType {
  theme: ThemePreference;
  isDark: boolean;
  colors: ColorPalette;
  setTheme: (theme: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemScheme = useSystemColorScheme();
  // Default to 'dark' for Prava's signature aesthetic
  const [themePreference, setThemePreference] = useState<ThemePreference>('dark');

  // Load persisted theme on mount
  useEffect(() => {
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync(THEME_STORAGE_KEY);
        if (saved === 'dark' || saved === 'light' || saved === 'system') {
          setThemePreference(saved as ThemePreference);
        }
      } catch {
        // fallback to default
      }
    })();
  }, []);

  const handleSetTheme = (theme: ThemePreference) => {
    setThemePreference(theme);
    SecureStore.setItemAsync(THEME_STORAGE_KEY, theme).catch(() => {});
  };

  const isDark =
    themePreference === 'system'
      ? systemScheme === 'dark'
      : themePreference === 'dark';

  const colors = isDark ? darkPalette : lightPalette;

  return (
    <ThemeContext.Provider
      value={{
        theme: themePreference,
        isDark,
        colors,
        setTheme: handleSetTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
