import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import ProgressBar from './ProgressBar';
import PlatformPill from './PlatformPill';
import AnimatedPressable from './AnimatedPressable';
import { colors, radii } from '../theme';
import { formatBytes } from '../utils/format';

const STATUS = {
  queued: { label: 'Queued', color: colors.textDim, icon: 'time-outline' },
  processing: { label: 'Fetching…', color: colors.warning, icon: 'cog-outline' },
  downloading: { label: 'Downloading', color: colors.primary2, icon: 'cloud-download-outline' },
  saved: { label: 'Saved', color: colors.success, icon: 'checkmark-circle' },
  error: { label: 'Failed', color: colors.danger, icon: 'alert-circle' },
};

export default function QueueItem({ item, onRemove, onShare }) {
  const s = STATUS[item.status] || STATUS.queued;
  const showBar = item.status === 'processing' || item.status === 'downloading';
  const indeterminate = item.status === 'processing';

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16, scale: 0.97 }}
      animate={{ opacity: 1, translateY: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ type: 'spring', damping: 16 }}
      style={styles.card}
    >
      <View style={styles.topRow}>
        <PlatformPill platform={item.platform} size="sm" />
        <View style={styles.statusRow}>
          <Ionicons name={s.icon} size={14} color={s.color} />
          <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
        </View>
      </View>

      <Text numberOfLines={2} style={styles.title}>
        {item.title || item.url}
      </Text>

      {showBar && (
        <View style={styles.barWrap}>
          <ProgressBar progress={item.progress} indeterminate={indeterminate} />
          <Text style={styles.pct}>
            {indeterminate ? 'Preparing on server…' : `${Math.round(item.progress * 100)}%`}
          </Text>
        </View>
      )}

      {item.status === 'saved' && (
        <View style={styles.metaRow}>
          <Text style={styles.meta}>
            {formatBytes(item.fileSize)} · {item.savedTo}
          </Text>
          <View style={styles.actions}>
            {item.savedTo === 'Files' && (
              <AnimatedPressable onPress={() => onShare?.(item)} scaleTo={0.9}>
                <View style={styles.iconBtn}>
                  <Ionicons name="share-outline" size={18} color={colors.text} />
                </View>
              </AnimatedPressable>
            )}
            <AnimatedPressable onPress={() => onRemove?.(item.id)} scaleTo={0.9}>
              <View style={styles.iconBtn}>
                <Ionicons name="close" size={18} color={colors.textDim} />
              </View>
            </AnimatedPressable>
          </View>
        </View>
      )}

      {item.status === 'error' && (
        <View style={styles.metaRow}>
          <Text numberOfLines={2} style={[styles.meta, { color: colors.danger, flex: 1 }]}>
            {item.error}
          </Text>
          <AnimatedPressable onPress={() => onRemove?.(item.id)} scaleTo={0.9}>
            <View style={styles.iconBtn}>
              <Ionicons name="close" size={18} color={colors.textDim} />
            </View>
          </AnimatedPressable>
        </View>
      )}
    </MotiView>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardSolid,
    borderRadius: radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusText: { fontSize: 12, fontWeight: '700' },
  title: { color: colors.text, fontSize: 15, fontWeight: '600', lineHeight: 20 },
  barWrap: { gap: 6 },
  pct: { color: colors.textDim, fontSize: 11, fontWeight: '600' },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  meta: { color: colors.textDim, fontSize: 12 },
  actions: { flexDirection: 'row', gap: 8 },
  iconBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
