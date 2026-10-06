import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  View,
  Animated,
  PanResponder,
  Image,
  ImageSourcePropType,
  StyleProp,
  ImageStyle,
  ViewStyle,
  GestureResponderEvent,
} from 'react-native';

interface PinchZoomImageProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  minScale?: number;
  maxScale?: number;
}

export const PinchZoomImage: React.FC<PinchZoomImageProps> = ({
  uri,
  style,
  containerStyle,
  minScale = 1,
  maxScale = 4,
}) => {
  const scale = useRef(new Animated.Value(1)).current;
  const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;

  const currentScale = useRef(1);
  const currentPan = useRef({ x: 0, y: 0 });
  const initialDistance = useRef<number | null>(null);
  const initialScale = useRef(1);
  const lastTap = useRef<number>(0);

  const calcDistance = (touches: GestureResponderEvent['nativeEvent']['touches']) => {
    if (touches.length < 2) return 0;
    const [t1, t2] = touches;
    const dx = t1.pageX - t2.pageX;
    const dy = t1.pageY - t2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const resetZoom = () => {
    currentScale.current = 1;
    currentPan.current = { x: 0, y: 0 };
    Animated.parallel([
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        bounciness: 4,
      }),
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: true,
        bounciness: 4,
      }),
    ]).start();
  };

  const zoomTo = (targetScale: number) => {
    currentScale.current = targetScale;
    Animated.spring(scale, {
      toValue: targetScale,
      useNativeDriver: true,
      bounciness: 4,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return evt.nativeEvent.touches.length === 2 || currentScale.current > 1.05;
      },
      onPanResponderGrant: (evt) => {
        const now = Date.now();
        if (now - lastTap.current < 300) {
          // Double tap detected
          if (currentScale.current > 1.2) {
            resetZoom();
          } else {
            zoomTo(2.2);
          }
          lastTap.current = 0;
          return;
        }
        lastTap.current = now;

        if (evt.nativeEvent.touches.length === 2) {
          initialDistance.current = calcDistance(evt.nativeEvent.touches);
          initialScale.current = currentScale.current;
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        if (evt.nativeEvent.touches.length === 2) {
          // Pinch Zooming
          const dist = calcDistance(evt.nativeEvent.touches);
          if (initialDistance.current && initialDistance.current > 0) {
            let nextScale = (dist / initialDistance.current) * initialScale.current;
            nextScale = Math.max(minScale * 0.8, Math.min(maxScale * 1.2, nextScale));
            currentScale.current = nextScale;
            scale.setValue(nextScale);
          }
        } else if (evt.nativeEvent.touches.length === 1 && currentScale.current > 1.05) {
          // Panning when zoomed
          const maxPanX = (currentScale.current - 1) * 120;
          const maxPanY = (currentScale.current - 1) * 160;
          const nextX = Math.max(-maxPanX, Math.min(maxPanX, currentPan.current.x + gestureState.dx * 0.7));
          const nextY = Math.max(-maxPanY, Math.min(maxPanY, currentPan.current.y + gestureState.dy * 0.7));
          pan.setValue({ x: nextX, y: nextY });
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        initialDistance.current = null;
        if (currentScale.current < 1.05) {
          resetZoom();
        } else if (currentScale.current > maxScale) {
          currentScale.current = maxScale;
          Animated.spring(scale, {
            toValue: maxScale,
            useNativeDriver: true,
          }).start();
        } else {
          currentPan.current = {
            x: Math.max(-(currentScale.current - 1) * 100, Math.min((currentScale.current - 1) * 100, currentPan.current.x + gestureState.dx * 0.5)),
            y: Math.max(-(currentScale.current - 1) * 120, Math.min((currentScale.current - 1) * 120, currentPan.current.y + gestureState.dy * 0.5)),
          };
        }
      },
      onPanResponderTerminate: () => {
        initialDistance.current = null;
        if (currentScale.current < 1.05) {
          resetZoom();
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, containerStyle]}>
      <Animated.View
        {...panResponder.panHandlers}
        style={[
          styles.imageWrapper,
          {
            transform: [
              { scale: scale },
              { translateX: pan.x },
              { translateY: pan.y },
            ],
          },
        ]}
      >
        <Image
          source={{ uri }}
          style={[styles.image, style]}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  imageWrapper: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
