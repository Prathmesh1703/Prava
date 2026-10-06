import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { PillTabBar } from '../../src/components/PillTabBar';
import { useApp } from '../../src/context/AppContext';

export default function TabLayout() {
  const { isLoading, hasOnboarded } = useApp();

  if (!isLoading && !hasOnboarded) {
    return <Redirect href={'/onboarding' as any} />;
  }

  return (
    <Tabs
      tabBar={(props) => <PillTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarLabel: 'History',
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: 'Progress',
          tabBarLabel: 'Progress',
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
        }}
      />
    </Tabs>
  );
}

