import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { platformMeta, radii } from '../theme';

export default function PlatformPill({ platform = 'unknown', size = 'md' }) {
  const meta = platformMeta[platform] || platformMeta.unknown;
  const small = size === 'sm';

  return (
    <MotiView
      key={platform}
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 14 }}
    >
      <LinearGradient
        colors={meta.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.pill, small && styles.pillSm]}
      >
        <Ionicons name={meta.icon} size={small ? 13 : 16} color="#fff" />
        <Text style={[styles.label, small && styles.labelSm]}>{meta.label}</Text>
      </LinearGradient>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
    gap: 6,
  },
  pillSm: { paddingHorizontal: 9, paddingVertical: 4, gap: 4 },
  label: { color: '#fff', fontWeight: '700', fontSize: 13 },
  labelSm: { fontSize: 11 },
});
