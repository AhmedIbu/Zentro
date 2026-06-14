import React from 'react';
import { Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

const AReanimated = Animated.createAnimatedComponent(Pressable);

// Pressable that springs down + tilts slightly in 3D when pressed.
export default function AnimatedPressable({
  children,
  onPress,
  style,
  disabled,
  haptic = true,
  scaleTo = 0.95,
  ...rest
}) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 600 },
      { scale: withSpring(1 - pressed.value * (1 - scaleTo), { damping: 15, stiffness: 220 }) },
      { rotateX: withSpring(`${pressed.value * 6}deg`, { damping: 15, stiffness: 220 }) },
    ],
    opacity: withSpring(disabled ? 0.5 : 1),
  }));

  return (
    <AReanimated
      onPressIn={() => {
        pressed.value = 1;
      }}
      onPressOut={() => {
        pressed.value = 0;
      }}
      onPress={() => {
        if (disabled) return;
        if (haptic) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress && onPress();
      }}
      disabled={disabled}
      style={[animatedStyle, style]}
      {...rest}
    >
      {children}
    </AReanimated>
  );
}
