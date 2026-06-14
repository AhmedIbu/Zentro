import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { brandGradient } from '../theme';

// A continuously rotating 3D-ish orb (rotateY + perspective) with a pulsing
// glow ring. Used as the hero element on the Home screen.
export default function LogoOrb({ size = 120 }) {
  const spin = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    spin.value = withRepeat(withTiming(1, { duration: 6000, easing: Easing.linear }), -1, false);
    pulse.value = withRepeat(withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }), -1, true);
  }, [spin, pulse]);

  const orbStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateY: `${spin.value * 360}deg` },
      { scale: 1 + pulse.value * 0.06 },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.4,
    transform: [{ scale: 1.1 + pulse.value * 0.25 }],
  }));

  return (
    <View style={[styles.wrap, { width: size * 1.6, height: size * 1.6 }]}>
      <Animated.View
        style={[
          styles.glow,
          { width: size, height: size, borderRadius: size },
          glowStyle,
        ]}
      >
        <LinearGradient colors={brandGradient} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View style={[{ width: size, height: size, borderRadius: size }, orbStyle]}>
        <LinearGradient
          colors={brandGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.orb, { borderRadius: size }]}
        >
          <Ionicons name="cloud-download" size={size * 0.42} color="#fff" />
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  glow: { position: 'absolute', overflow: 'hidden' },
  orb: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#7C5CFF',
    shadowOpacity: 0.6,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
});
