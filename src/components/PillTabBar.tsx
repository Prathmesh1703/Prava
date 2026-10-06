import React, { useCallback, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  Platform,
  PanResponder,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { radius, shadows, spacing } from '../theme/spacing';

export interface PillTabBarProps {
  state: {
    index: number;
    routes: Array<{
      key: string;
      name: string;
      params?: any;
    }>;
  };
  descriptors: Record<string, any>;
  navigation: {
    emit: (options: any) => any;
    navigate: (name: string, params?: any) => void;
  };
}

export const PillTabBar: React.FC<PillTabBarProps> = ({
  state,
  descriptors,
  navigation,
}) => {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();

  const numTabs = state.routes.length || 4;
  const barPadding = 6;
  const maxBarWidth = Math.min(286, windowWidth - spacing.lg * 2);
  const availableContentWidth = maxBarWidth - barPadding * 2;
  const tabWidth = availableContentWidth / numTabs;

  // ── Animated Physics Shared Values ─────────────────────────────────────────
  const activePosition = useSharedValue(state.index * tabWidth);
  const scaleX = useSharedValue(1.0);
  const scaleY = useSharedValue(1.0);
  const skewX = useSharedValue(0);
  const tailPosition = useSharedValue(state.index * tabWidth);
  const tailScale = useSharedValue(0);
  const tailOpacity = useSharedValue(0);
  const glossSheen = useSharedValue(0);

  // References for gesture tracking
  const stateIndexRef = useRef(state.index);
  stateIndexRef.current = state.index;
  const lastHoverIndex = useRef(state.index);
  const isDragging = useRef(false);

  // Trigger crisp haptics
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  // ── Sync with external route change (or initial render) ────────────────────
  useEffect(() => {
    if (!isDragging.current) {
      const targetX = state.index * tabWidth;
      const jumpDistance = Math.abs(state.index * tabWidth - activePosition.value);

      if (jumpDistance > 5) {
        // Fluid stretch-and-snap when changing tabs
        const stretchAmount = Math.min(1.45, 1.0 + (jumpDistance / tabWidth) * 0.22);
        const squashAmount = Math.max(0.78, 1.0 / Math.sqrt(stretchAmount));

        // Anchor trailing drop at origin
        tailPosition.value = activePosition.value;
        tailScale.value = 0.85;
        tailOpacity.value = 0.75;
        tailScale.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.quad) });
        tailOpacity.value = withTiming(0, { duration: 200, easing: Easing.out(Easing.quad) });

        // Stretch body, spring into target position, then wobble-settle
        scaleX.value = withSequence(
          withTiming(stretchAmount, { duration: 110, easing: Easing.out(Easing.cubic) }),
          withSpring(0.88, { damping: 10, stiffness: 280, mass: 0.5 }),
          withSpring(1.0, { damping: 12, stiffness: 220, mass: 0.5 })
        );

        scaleY.value = withSequence(
          withTiming(squashAmount, { duration: 110, easing: Easing.out(Easing.cubic) }),
          withSpring(1.12, { damping: 10, stiffness: 280, mass: 0.5 }),
          withSpring(1.0, { damping: 12, stiffness: 220, mass: 0.5 })
        );

        activePosition.value = withSpring(targetX, {
          damping: 14,
          stiffness: 220,
          mass: 0.65,
        });
      } else {
        activePosition.value = targetX;
      }
    }
  }, [state.index, tabWidth]);

  // ── Pan Responder for Pill Slime Dragging ──────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 4;
      },
      onPanResponderGrant: () => {
        isDragging.current = true;
        lastHoverIndex.current = stateIndexRef.current;
        const startX = stateIndexRef.current * tabWidth;

        // Anchor trailing slime droplet at the source tab
        tailPosition.value = startX;
        tailScale.value = 0.95;
        tailOpacity.value = 0.8;
      },
      onPanResponderMove: (_, gestureState) => {
        const startX = stateIndexRef.current * tabWidth;
        const rawX = startX + gestureState.dx;
        const maxPos = (numTabs - 1) * tabWidth;

        // Elastic rubber resistance at borders
        let clampedX = rawX;
        if (rawX < 0) {
          clampedX = rawX * 0.25;
        } else if (rawX > maxPos) {
          clampedX = maxPos + (rawX - maxPos) * 0.25;
        }

        activePosition.value = clampedX;

        // Fluid stretch calculation (stretches like slime as you pull away)
        const pullDistance = Math.abs(gestureState.dx);
        const stretchFactor = 1.0 + Math.min(0.55, (pullDistance / (tabWidth * 1.4)) * 0.55);
        const squashFactor = Math.max(0.75, 1.0 / Math.sqrt(stretchFactor));

        scaleX.value = stretchFactor;
        scaleY.value = squashFactor;

        // Dynamic tilt/shear in moving direction
        const dir = gestureState.dx > 0 ? 1 : -1;
        const velocityShear = Math.min(6, (pullDistance / tabWidth) * 4) * dir;
        skewX.value = velocityShear;

        // Slime neck / trailing droplet detachment logic
        const detachDistance = tabWidth * 0.52;
        if (pullDistance < detachDistance) {
          const progress = pullDistance / detachDistance;
          tailScale.value = 0.95 * (1 - progress * 0.7);
          tailOpacity.value = 0.8 * (1 - progress * 0.8);
        } else {
          // Detached from old tab
          tailScale.value = withTiming(0, { duration: 90 });
          tailOpacity.value = withTiming(0, { duration: 90 });
        }

        // Magnetic haptic tick on crossing tab zones
        const hoverIdx = Math.min(numTabs - 1, Math.max(0, Math.round(clampedX / tabWidth)));
        if (hoverIdx !== lastHoverIndex.current) {
          lastHoverIndex.current = hoverIdx;
          triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        isDragging.current = false;
        const startX = stateIndexRef.current * tabWidth;
        const rawX = startX + gestureState.dx;
        const maxPos = (numTabs - 1) * tabWidth;

        // Factor in flick velocity for fluid fling feel
        const projectedX = rawX + gestureState.vx * 35;
        const targetIdx = Math.min(
          numTabs - 1,
          Math.max(0, Math.round(projectedX / tabWidth))
        );
        const targetX = targetIdx * tabWidth;

        // Snap into target tab with juicy rubber spring
        activePosition.value = withSpring(targetX, {
          damping: 13,
          stiffness: 240,
          mass: 0.6,
        });

        // Settle scale with organic gel squash & bounce
        scaleX.value = withSequence(
          withSpring(0.86, { damping: 10, stiffness: 300, mass: 0.5 }),
          withSpring(1.0, { damping: 12, stiffness: 220, mass: 0.5 })
        );

        scaleY.value = withSequence(
          withSpring(1.14, { damping: 10, stiffness: 300, mass: 0.5 }),
          withSpring(1.0, { damping: 12, stiffness: 220, mass: 0.5 })
        );

        skewX.value = withSpring(0, { damping: 14, stiffness: 280 });
        tailScale.value = withTiming(0, { duration: 100 });
        tailOpacity.value = withTiming(0, { duration: 100 });

        if (targetIdx !== stateIndexRef.current) {
          triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
          navigation.navigate(state.routes[targetIdx].name);
        }
      },
      onPanResponderTerminate: () => {
        isDragging.current = false;
        const targetX = stateIndexRef.current * tabWidth;
        activePosition.value = withSpring(targetX, {
          damping: 14,
          stiffness: 240,
          mass: 0.6,
        });
        scaleX.value = withSpring(1.0);
        scaleY.value = withSpring(1.0);
        skewX.value = withSpring(0);
        tailScale.value = withTiming(0);
        tailOpacity.value = withTiming(0);
      },
    })
  ).current;

  // ── Animated Styles ────────────────────────────────────────────────────────
  const activeLensStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: activePosition.value },
        { scaleX: scaleX.value },
        { scaleY: scaleY.value },
        { skewX: `${skewX.value}deg` },
      ],
      width: tabWidth,
    };
  });

  const trailingSlimeStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: tailPosition.value },
        { scale: tailScale.value },
      ],
      opacity: tailOpacity.value,
      width: tabWidth,
    };
  });

  const getTabIcon = (routeName: string, focused: boolean) => {
    switch (routeName) {
      case 'index':
        return focused ? 'home' : 'home-outline';
      case 'history':
        return focused ? 'calendar' : 'calendar-outline';
      case 'progress':
        return focused ? 'trending-up' : 'trending-up-outline';
      case 'profile':
        return focused ? 'person' : 'person-outline';
      default:
        return 'ellipse';
    }
  };

  const getTabLabel = (routeName: string) => {
    switch (routeName) {
      case 'index':
        return 'Home';
      case 'history':
        return 'History';
      case 'progress':
        return 'Progress';
      case 'profile':
        return 'Profile';
      default:
        return routeName;
    }
  };

  const bottomInset = insets.bottom + 36;

  return (
    <View style={[styles.floatingContainer, { bottom: bottomInset }]}>
      <View
        {...panResponder.panHandlers}
        style={[
          styles.glassOuterShell,
          {
            width: maxBarWidth,
            borderColor: isDark
              ? 'rgba(255, 255, 255, 0.18)'
              : 'rgba(255, 255, 255, 0.92)',
            shadowColor: '#000000',
            shadowOpacity: isDark ? 0.42 : 0.12,
          },
          shadows.floating,
        ]}
      >
        <BlurView
          intensity={Platform.OS === 'ios' ? 88 : 100}
          tint={isDark ? 'dark' : 'light'}
          style={[
            styles.blurLayer,
            {
              backgroundColor: isDark
                ? 'rgba(13, 15, 17, 0.88)'
                : 'rgba(255, 255, 255, 0.90)',
            },
          ]}
        >
          {/* ── Trailing Slime Meniscus Droplet (Detaches organically) ── */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.trailingDroplet,
              {
                height: 44,
                backgroundColor: isDark
                  ? 'rgba(255, 106, 0, 0.18)'
                  : 'rgba(255, 106, 0, 0.12)',
                borderColor: isDark
                  ? 'rgba(255, 125, 26, 0.35)'
                  : 'rgba(255, 106, 0, 0.22)',
              },
              trailingSlimeStyle,
            ]}
          />

          {/* ── Active Liquid Slime / Rubber Glass Lens ── */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.liquidActiveLens,
              {
                height: 44,
                backgroundColor: isDark
                  ? 'rgba(255, 106, 31, 0.24)'
                  : 'rgba(255, 106, 31, 0.14)',
                borderColor: isDark
                  ? 'rgba(255, 125, 31, 0.50)'
                  : 'rgba(255, 106, 31, 0.32)',
              },
              activeLensStyle,
            ]}
          >
            {/* Top Specular Gloss Highlight for Glass Refraction */}
            <View
              style={[
                styles.specularGloss,
                {
                  backgroundColor: isDark
                    ? 'rgba(255, 255, 255, 0.16)'
                    : 'rgba(255, 255, 255, 0.55)',
                },
              ]}
            />
          </Animated.View>

          {/* ── Tab Items Row ── */}
          <View style={styles.tabsRow}>
            {state.routes.map((route, index: number) => {
              const descriptor = descriptors[route.key];
              const options = descriptor?.options || {};
              const isFocused = state.index === index;

              const onPress = () => {
                const event = navigation.emit({
                  type: 'tabPress',
                  target: route.key,
                  canPreventDefault: true,
                });

                if (!isFocused && !event?.defaultPrevented) {
                  triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                  navigation.navigate(route.name);
                }
              };

              const iconName = getTabIcon(route.name, isFocused) as keyof typeof Ionicons.glyphMap;
              const label = getTabLabel(route.name);

              return (
                <TouchableOpacity
                  key={route.key}
                  accessibilityRole="button"
                  accessibilityState={isFocused ? { selected: true } : {}}
                  accessibilityLabel={options.tabBarAccessibilityLabel || label}
                  onPress={onPress}
                  style={styles.tabTouchArea}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={iconName}
                    size={23}
                    color={
                      isFocused
                        ? colors.accent
                        : colors.textSecondary
                    }
                  />
                </TouchableOpacity>
              );
            })}
          </View>
        </BlurView>
      </View>
    </View>
  );
};

export const LiquidPillTabBar = PillTabBar;

const styles = StyleSheet.create({
  floatingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 999,
  },
  glassOuterShell: {
    borderRadius: radius.full,
    overflow: 'hidden',
    borderWidth: 1.2,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 22,
    elevation: 12,
  },
  blurLayer: {
    paddingHorizontal: 6,
    paddingVertical: 5,
    borderRadius: radius.full,
    position: 'relative',
    justifyContent: 'center',
  },
  liquidActiveLens: {
    position: 'absolute',
    top: 5,
    left: 6,
    borderRadius: radius.full,
    borderWidth: 1.2,
    zIndex: 2,
    shadowColor: '#FF6A1F',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.32,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden',
  },
  trailingDroplet: {
    position: 'absolute',
    top: 5,
    left: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    zIndex: 1,
    shadowColor: '#FF6A1F',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.20,
    shadowRadius: 6,
  },
  specularGloss: {
    height: '42%',
    marginHorizontal: 5,
    marginTop: 2,
    borderRadius: radius.full,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 44,
    zIndex: 4,
  },
  tabTouchArea: {
    flex: 1,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

