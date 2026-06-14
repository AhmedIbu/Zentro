import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { brandGradient, colors } from '../theme';

// Smoothly animating progress bar. `progress` is 0..1.
export default function ProgressBar({ progress = 0, height = 8, indeterminate = false }) {
  const fillStyle = useAnimatedStyle(() => ({
    width: withTiming(`${Math.max(0, Math.min(1, progress)) * 100}%`, { duration: 250 }),
  }));

  return (
    <View style={[styles.track, { height, borderRadius: height }]}>
      <Animated.View style={[styles.fill, { borderRadius: height }, fillStyle]}>
        <LinearGradient
          colors={indeterminate ? [colors.textDim, colors.primary] : brandGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { width: '100%', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' },
  fill: { height: '100%', overflow: 'hidden' },
});
