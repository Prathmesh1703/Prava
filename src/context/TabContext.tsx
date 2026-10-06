import React, { createContext, useContext } from 'react';
import { useRouter } from 'expo-router';

export const TAB_ROUTES = {
  HOME: 0,
  HISTORY: 1,
  PROGRESS: 2,
  PROFILE: 3,
};

const TAB_PATH_MAP: Record<number, string> = {
  0: '/(tabs)',
  1: '/(tabs)/history',
  2: '/(tabs)/progress',
  3: '/(tabs)/profile',
};

interface TabContextType {
  navigateToTab: (index: number) => void;
}

const TabContext = createContext<TabContextType | null>(null);

export const TabNavigationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const router = useRouter();

  const navigateToTab = (index: number) => {
    const path = TAB_PATH_MAP[index];
    if (path) {
      router.navigate(path as any);
    }
  };

  return (
    <TabContext.Provider value={{ navigateToTab }}>
      {children}
    </TabContext.Provider>
  );
};

export const useTabNavigation = () => {
  const context = useContext(TabContext);
  const router = useRouter();

  if (context !== null) {
    return context;
  }

  return {
    navigateToTab: (index: number) => {
      const path = TAB_PATH_MAP[index];
      if (path) {
        router.navigate(path as any);
      }
    },
  };
};


