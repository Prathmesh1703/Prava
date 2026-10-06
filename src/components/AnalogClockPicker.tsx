import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  PanResponder,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../context/ThemeContext';
import { PrimaryButton, SecondaryButton } from './Buttons';
import { typography } from '../theme/typography';
import { radius, spacing } from '../theme/spacing';

interface AnalogClockPickerProps {
  initialTime?: string; // e.g. "07:30 PM"
  title: string;
  onSave: (formattedTime: string) => void;
  onCancel: () => void;
}

type Mode = 'hour' | 'minute';
type Period = 'AM' | 'PM';

export const AnalogClockPicker: React.FC<AnalogClockPickerProps> = ({
  initialTime = '07:00 PM',
  title,
  onSave,
  onCancel,
}) => {
  const { colors, isDark } = useTheme();

  // Parse initial time
  const parseInitial = () => {
    try {
      const parts = initialTime.trim().split(' ');
      const period: Period = parts[1]?.toUpperCase() === 'AM' ? 'AM' : 'PM';
      const [hStr, mStr] = parts[0].split(':');
      let h = parseInt(hStr, 10);
      if (isNaN(h) || h < 1 || h > 12) h = 7;
      let m = parseInt(mStr, 10);
      if (isNaN(m) || m < 0 || m > 59) m = 0;
      return { hour: h, minute: m, period };
    } catch (e) {
      return { hour: 7, minute: 0, period: 'PM' as Period };
    }
  };

  const initialParsed = parseInitial();
  const [selectedHour, setSelectedHour] = useState<number>(initialParsed.hour);
  const [selectedMinute, setSelectedMinute] = useState<number>(initialParsed.minute);
  const [period, setPeriod] = useState<Period>(initialParsed.period);
  const [mode, setMode] = useState<Mode>('hour');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [smoothAngle, setSmoothAngle] = useState<number>((initialParsed.hour % 12) * 30);

  const clockSize = 240;
  const radiusVal = clockSize / 2;
  const center = radiusVal;
  const numberRadius = radiusVal - 32;

  const clockFaceRef = useRef<View>(null);
  const clockCenterRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const lastTriggeredVal = useRef<number>(-1);
  const modeRef = useRef<Mode>(mode);
  modeRef.current = mode;

  const selectedHourRef = useRef<number>(selectedHour);
  selectedHourRef.current = selectedHour;
  const selectedMinuteRef = useRef<number>(selectedMinute);
  selectedMinuteRef.current = selectedMinute;

  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    };
  }, []);

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
  };

  const measureClock = () => {
    clockFaceRef.current?.measure((fx, fy, width, height, px, py) => {
      if (width > 0 && height > 0) {
        clockCenterRef.current = {
          x: px + width / 2,
          y: py + height / 2,
        };
      }
    });
  };

  const calculateFromTouch = (
    pageX: number,
    pageY: number,
    locX: number,
    locY: number,
    currentMode: Mode
  ) => {
    let dx: number;
    let dy: number;

    if (clockCenterRef.current.x > 0 && clockCenterRef.current.y > 0) {
      dx = pageX - clockCenterRef.current.x;
      dy = pageY - clockCenterRef.current.y;
    } else {
      dx = locX - center;
      dy = locY - center;
    }

    // Ignore tiny movements near dead center
    if (Math.hypot(dx, dy) < 8) return;

    // Clockwise angle from 12 o'clock (where 12 o'clock is dx=0, dy < 0)
    const rad = Math.atan2(dx, -dy);
    let deg = (rad * 180) / Math.PI;
    if (deg < 0) deg += 360;

    setSmoothAngle(deg);

    if (currentMode === 'hour') {
      let rawH = Math.round(deg / 30) % 12;
      const h = rawH === 0 ? 12 : rawH;
      if (lastTriggeredVal.current !== h) {
        lastTriggeredVal.current = h;
        setSelectedHour(h);
        selectedHourRef.current = h;
        triggerHaptic();
      }
    } else {
      const m = Math.round(deg / 6) % 60;
      if (lastTriggeredVal.current !== m) {
        lastTriggeredVal.current = m;
        setSelectedMinute(m);
        selectedMinuteRef.current = m;
        if (m % 5 === 0) {
          triggerHaptic();
        }
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        if (transitionTimer.current) clearTimeout(transitionTimer.current);

        measureClock();
        const { pageX, pageY, locationX, locationY } = evt.nativeEvent;
        calculateFromTouch(pageX, pageY, locationX, locationY, modeRef.current);
      },
      onPanResponderMove: (evt) => {
        const { pageX, pageY, locationX, locationY } = evt.nativeEvent;
        calculateFromTouch(pageX, pageY, locationX, locationY, modeRef.current);
      },
      onPanResponderRelease: () => {
        setIsDragging(false);
        lastTriggeredVal.current = -1;

        if (modeRef.current === 'hour') {
          // Snap angle to selected hour
          setSmoothAngle((selectedHourRef.current % 12) * 30);
          // Transition to minute mode after smooth delay
          transitionTimer.current = setTimeout(() => {
            setMode('minute');
            setSmoothAngle(selectedMinuteRef.current * 6);
          }, 300);
        } else {
          // Snap angle to selected minute
          setSmoothAngle(selectedMinuteRef.current * 6);
        }
      },
    })
  ).current;

  const handleModeSwitch = (newMode: Mode) => {
    triggerHaptic();
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    setMode(newMode);
    if (newMode === 'hour') {
      setSmoothAngle((selectedHour % 12) * 30);
    } else {
      setSmoothAngle(selectedMinute * 6);
    }
  };

  const handleSave = () => {
    const formattedH = String(selectedHour).padStart(2, '0');
    const formattedM = String(selectedMinute).padStart(2, '0');
    onSave(`${formattedH}:${formattedM} ${period}`);
  };

  // Hand angle calculation
  const getHandAngle = () => {
    if (isDragging) return smoothAngle;
    if (mode === 'hour') {
      return (selectedHour % 12) * 30;
    } else {
      return selectedMinute * 6;
    }
  };

  const angle = getHandAngle();

  const hours = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  const minutes = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  return (
    <View style={styles.container}>
      <Text style={[typography.title2, { color: colors.text, textAlign: 'center', marginBottom: spacing.xs }]}>
        {title}
      </Text>
      <Text style={[typography.caption, { color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.md }]}>
        {mode === 'hour' ? 'Tap or drag clockwise to pick hour' : 'Tap or drag clockwise to pick minute'}
      </Text>

      {/* Mode Switch & Digital Readout */}
      <View style={styles.digitalRow}>
        <View style={[styles.timeBox, { backgroundColor: colors.cardMuted }]}>
          <TouchableOpacity
            style={[
              styles.timeSegmentBtn,
              mode === 'hour' && {
                backgroundColor: colors.accentLight,
                borderColor: colors.accent,
              },
            ]}
            onPress={() => handleModeSwitch('hour')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                typography.metricLarge,
                {
                  color: mode === 'hour' ? (isDark ? colors.accentDark : colors.accent) : colors.text,
                },
              ]}
            >
              {String(selectedHour).padStart(2, '0')}
            </Text>
            <Text style={[typography.captionBold, { color: mode === 'hour' ? colors.accent : colors.textSecondary, fontSize: 10, marginTop: -2 }]}>
              HOUR
            </Text>
          </TouchableOpacity>

          <Text style={[typography.metricLarge, { color: colors.textSecondary, marginHorizontal: 4 }]}>
            :
          </Text>

          <TouchableOpacity
            style={[
              styles.timeSegmentBtn,
              mode === 'minute' && {
                backgroundColor: colors.accentLight,
                borderColor: colors.accent,
              },
            ]}
            onPress={() => handleModeSwitch('minute')}
            activeOpacity={0.7}
          >
            <Text
              style={[
                typography.metricLarge,
                {
                  color: mode === 'minute' ? (isDark ? colors.accentDark : colors.accent) : colors.text,
                },
              ]}
            >
              {String(selectedMinute).padStart(2, '0')}
            </Text>
            <Text style={[typography.captionBold, { color: mode === 'minute' ? colors.accent : colors.textSecondary, fontSize: 10, marginTop: -2 }]}>
              MIN
            </Text>
          </TouchableOpacity>
        </View>

        {/* AM / PM Selector */}
        <View style={[styles.periodToggleBox, { backgroundColor: colors.cardMuted }]}>
          <TouchableOpacity
            style={[
              styles.periodBtn,
              period === 'AM' && {
                backgroundColor: colors.accent,
              },
            ]}
            onPress={() => {
              triggerHaptic();
              setPeriod('AM');
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                typography.captionBold,
                { color: period === 'AM' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              AM
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.periodBtn,
              period === 'PM' && {
                backgroundColor: colors.accent,
              },
            ]}
            onPress={() => {
              triggerHaptic();
              setPeriod('PM');
            }}
            activeOpacity={0.7}
          >
            <Text
              style={[
                typography.captionBold,
                { color: period === 'PM' ? '#FFFFFF' : colors.textSecondary },
              ]}
            >
              PM
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Circular Analog Clock Face */}
      <View
        ref={clockFaceRef}
        onLayout={measureClock}
        style={[
          styles.clockFace,
          {
            width: clockSize,
            height: clockSize,
            borderRadius: radiusVal,
            backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
            borderColor: isDark ? colors.border : colors.borderSubtle,
          },
        ]}
      >
        {/* Subtle Dial Ring */}
        <View
          pointerEvents="none"
          style={[
            styles.dialRing,
            {
              width: clockSize - 16,
              height: clockSize - 16,
              borderRadius: (clockSize - 16) / 2,
              borderColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)',
            },
          ]}
        />

        {/* Center Pivot Dot */}
        <View
          pointerEvents="none"
          style={[
            styles.centerPivot,
            {
              left: center - 5,
              top: center - 5,
              backgroundColor: colors.accent,
            },
          ]}
        />

        {/* Interactive Smooth Rotating Clock Hand */}
        <View
          pointerEvents="none"
          style={[
            styles.handContainer,
            {
              height: numberRadius * 2,
              top: center - numberRadius,
              left: center - 1.5,
              transform: [{ rotate: `${angle}deg` }],
            },
          ]}
        >
          {/* Hand Line reaching from center to number circle */}
          <View
            style={[
              styles.handLine,
              {
                backgroundColor: colors.accent,
                height: numberRadius,
              },
            ]}
          />
          {/* Hand Knob Indicator positioned directly over the number center */}
          <View
            style={[
              styles.handHead,
              {
                backgroundColor: colors.accent,
                shadowColor: colors.accent,
              },
            ]}
          >
            <View style={styles.handInnerGlow} />
          </View>
        </View>

        {/* Numbers on the Clock Face */}
        {mode === 'hour'
          ? hours.map((h, i) => {
              const rad = (i * 30 - 90) * (Math.PI / 180);
              const x = center + numberRadius * Math.cos(rad) - 17;
              const y = center + numberRadius * Math.sin(rad) - 17;
              const isSelected = selectedHour === h;

              return (
                <View
                  key={h}
                  pointerEvents="none"
                  style={[
                    styles.clockNumberBtn,
                    {
                      left: x,
                      top: y,
                    },
                    isSelected && {
                      backgroundColor: colors.accent,
                      shadowColor: colors.accent,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.35,
                      shadowRadius: 4,
                      elevation: 3,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.callout,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {h}
                  </Text>
                </View>
              );
            })
          : minutes.map((m, i) => {
              const rad = (i * 30 - 90) * (Math.PI / 180);
              const x = center + numberRadius * Math.cos(rad) - 17;
              const y = center + numberRadius * Math.sin(rad) - 17;
              const isSelected = selectedMinute === m;

              return (
                <View
                  key={m}
                  pointerEvents="none"
                  style={[
                    styles.clockNumberBtn,
                    {
                      left: x,
                      top: y,
                    },
                    isSelected && {
                      backgroundColor: colors.accent,
                      shadowColor: colors.accent,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.35,
                      shadowRadius: 4,
                      elevation: 3,
                    },
                  ]}
                >
                  <Text
                    style={[
                      typography.captionBold,
                      {
                        color: isSelected ? '#FFFFFF' : colors.text,
                        fontWeight: isSelected ? '700' : '600',
                      },
                    ]}
                  >
                    {String(m).padStart(2, '0')}
                  </Text>
                </View>
              );
            })}

        {/* Transparent Touch Capture Overlay covering the entire clock face */}
        <View
          {...panResponder.panHandlers}
          style={StyleSheet.absoluteFill}
          pointerEvents="auto"
        />
      </View>

      {/* Action Buttons */}
      <View style={styles.modalBtnRow}>
        <SecondaryButton
          title="Cancel"
          onPress={onCancel}
          style={{ flex: 1, marginRight: spacing.sm }}
        />
        <PrimaryButton
          title="Set Time"
          onPress={handleSave}
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  digitalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  timeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    borderRadius: radius.lg,
  },
  timeSegmentBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  periodToggleBox: {
    flexDirection: 'column',
    padding: 3,
    borderRadius: radius.md,
    gap: 2,
  },
  periodBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  clockFace: {
    position: 'relative',
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  dialRing: {
    position: 'absolute',
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  centerPivot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    zIndex: 10,
  },
  handContainer: {
    position: 'absolute',
    width: 3,
    alignItems: 'center',
    justifyContent: 'flex-start',
    zIndex: 5,
  },
  handLine: {
    width: 2.5,
    borderRadius: 1.5,
  },
  handHead: {
    position: 'absolute',
    top: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    transform: [{ translateY: -17 }],
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 3,
  },
  handInnerGlow: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  clockNumberBtn: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 8,
  },
  modalBtnRow: {
    flexDirection: 'row',
    width: '100%',
    marginTop: spacing.xs,
  },
});
