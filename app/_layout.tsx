import React, { useEffect, useState, useRef } from 'react';
import { View, Image, StyleSheet, Animated, Text } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';
import { ThemeProvider as CustomThemeProvider } from '../src/context/ThemeContext';
import { AppProvider } from '../src/context/AppContext';
import { getDatabase } from '../src/db/database';
import { initEncryptionKeys } from '../src/crypto/encryption';

export {
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    Audiowide: require('../assets/fonts/Audiowide-Regular.ttf'),
    Manrope: require('../assets/fonts/Manrope.ttf'),
  });

  const [dbReady, setDbReady] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const splashScale = useRef(new Animated.Value(0.95)).current;

  // Bootstrap DB and encryption keys first — before AppProvider mounts
  useEffect(() => {
    (async () => {
      try {
        await getDatabase();
        await initEncryptionKeys();
      } catch (e) {
        console.error('Prava bootstrap error:', e);
      } finally {
        setDbReady(true);
      }
    })();
  }, []);

  useEffect(() => {
    if ((loaded || error) && dbReady) {
      SplashScreen.hideAsync().catch(() => {});

      // Smooth startup splash transition with logo.png
      Animated.parallel([
        Animated.timing(splashScale, {
          toValue: 1.04,
          duration: 950,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(700),
          Animated.timing(splashOpacity, {
            toValue: 0,
            duration: 450,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => {
        setShowSplash(false);
      });
    }
  }, [loaded, error, dbReady]);

  if ((!loaded && !error) || !dbReady) {
    return null;
  }

  return (
    <CustomThemeProvider>
      <AppProvider>
        <View style={styles.root}>
          <RootLayoutNav />

          {/* Startup Splash Overlay with logo.png */}
          {showSplash && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.splashOverlay,
                {
                  opacity: splashOpacity,
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.splashContainer,
                  {
                    transform: [{ scale: splashScale }],
                  },
                ]}
              >
                <Image
                  source={require('../assets/images/logo.png')}
                  style={styles.splashLogo}
                  resizeMode="contain"
                />
                <Text style={styles.splashBrand}>PRAVA</Text>
                <Text style={styles.splashTagline}>TRACK YOUR PROGRESS</Text>
              </Animated.View>
            </Animated.View>
          )}
        </View>
      </AppProvider>
    </CustomThemeProvider>
  );
}

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="onboarding"
        options={{
          headerShown: false,
          animation: 'fade',
        }}
      />
      <Stack.Screen
        name="workout/new"
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="settings/notifications"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="settings/backup"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="private/index"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="private/questions"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="legal/privacy"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="legal/terms"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="legal/datasafety"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="private/checkin"
        options={{
          presentation: 'modal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#1B0F0F',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  splashContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashLogo: {
    width: 140,
    height: 120,
    marginBottom: 16,
  },
  splashBrand: {
    fontFamily: 'Audiowide',
    color: '#FFF7F2',
    fontSize: 26,
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  splashTagline: {
    fontFamily: 'Manrope',
    color: '#FFA647',
    fontSize: 10,
    fontWeight: '600',
    letterSpacing: 3,
    marginTop: 8,
    textTransform: 'uppercase',
  },
});
