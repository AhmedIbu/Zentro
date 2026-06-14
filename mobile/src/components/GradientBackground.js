import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { colors } from '../theme';

// Dark base with two slowly drifting, blurred color blobs for depth.
export default function GradientBackground({ children }) {
  return (
    <View style={styles.root}>
      <LinearGradient
        colors={['#0B0B12', '#0E0E1A', '#0B0B12']}
        style={StyleSheet.absoluteFill}
      />

      <MotiView
        from={{ opacity: 0.35, translateX: -40, translateY: -20, scale: 1 }}
        animate={{ opacity: 0.55, translateX: 40, translateY: 30, scale: 1.2 }}
        transition={{ type: 'timing', duration: 6000, loop: true, repeatReverse: true }}
        style={[styles.blob, { backgroundColor: colors.primary, top: -80, left: -60 }]}
      />
      <MotiView
        from={{ opacity: 0.25, translateX: 30, translateY: 20, scale: 1.1 }}
        animate={{ opacity: 0.45, translateX: -30, translateY: -30, scale: 0.9 }}
        transition={{ type: 'timing', duration: 7000, loop: true, repeatReverse: true }}
        style={[styles.blob, { backgroundColor: colors.primary2, bottom: -60, right: -50 }]}
      />
      <MotiView
        from={{ opacity: 0.18, scale: 0.8 }}
        animate={{ opacity: 0.32, scale: 1.15 }}
        transition={{ type: 'timing', duration: 8000, loop: true, repeatReverse: true }}
        style={[styles.blob, { backgroundColor: colors.accent, top: '40%', right: -70 }]}
      />

      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg, overflow: 'hidden' },
  content: { flex: 1 },
  blob: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 260,
    // Soft glow without a blur view (cheap + Expo Go friendly).
    opacity: 0.4,
  },
});
