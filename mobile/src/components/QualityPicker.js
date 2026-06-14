import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import AnimatedPressable from './AnimatedPressable';
import { QUALITIES } from '../config';
import { brandGradient, colors, radii } from '../theme';

export default function QualityPicker({ value, onChange }) {
  return (
    <View>
      <Text style={styles.heading}>QUALITY</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {QUALITIES.map((q, i) => {
          const active = value === q.key;
          return (
            <MotiView
              key={q.key}
              from={{ opacity: 0, translateY: 12 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 320, delay: i * 60 }}
            >
              <AnimatedPressable onPress={() => onChange(q.key)} scaleTo={0.92}>
                <View style={styles.chipShadow}>
                  {active ? (
                    <LinearGradient
                      colors={brandGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.chip}
                    >
                      <Ionicons name={q.icon} size={18} color="#fff" />
                      <Text style={styles.chipLabel}>{q.label}</Text>
                      <Text style={styles.chipSub}>{q.sub}</Text>
                    </LinearGradient>
                  ) : (
                    <View style={[styles.chip, styles.chipIdle]}>
                      <Ionicons name={q.icon} size={18} color={colors.textDim} />
                      <Text style={[styles.chipLabel, { color: colors.text }]}>{q.label}</Text>
                      <Text style={styles.chipSub}>{q.sub}</Text>
                    </View>
                  )}
                </View>
              </AnimatedPressable>
            </MotiView>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: { color: colors.textDim, fontSize: 12, fontWeight: '700', letterSpacing: 1.5, marginBottom: 10, marginLeft: 4 },
  row: { gap: 12, paddingRight: 12, paddingVertical: 2 },
  chipShadow: {
    shadowColor: '#7C5CFF',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
  },
  chip: {
    width: 96,
    borderRadius: radii.md,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
  },
  chipIdle: { backgroundColor: colors.cardSolid, borderWidth: 1, borderColor: colors.border },
  chipLabel: { color: '#fff', fontWeight: '800', fontSize: 15 },
  chipSub: { color: 'rgba(255,255,255,0.7)', fontSize: 10 },
});
