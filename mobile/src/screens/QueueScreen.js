import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';

import GradientBackground from '../components/GradientBackground';
import QueueItem from '../components/QueueItem';
import AnimatedPressable from '../components/AnimatedPressable';
import { useQueue } from '../store/QueueContext';
import { colors } from '../theme';

export default function QueueScreen() {
  const insets = useSafeAreaInsets();
  const { items, removeItem, clearFinished, shareItem } = useQueue();
  const hasFinished = items.some((it) => it.status === 'saved');

  return (
    <GradientBackground>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View>
          <Text style={styles.title}>Queue</Text>
          <Text style={styles.subtitle}>
            {items.length === 0 ? 'Nothing in the queue' : `${items.length} item${items.length > 1 ? 's' : ''}`}
          </Text>
        </View>
        {hasFinished && (
          <AnimatedPressable onPress={clearFinished} scaleTo={0.92}>
            <View style={styles.clearBtn}>
              <Ionicons name="checkmark-done" size={16} color={colors.text} />
              <Text style={styles.clearText}>Clear done</Text>
            </View>
          </AnimatedPressable>
        )}
      </View>

      {items.length === 0 ? (
        <Empty />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <AnimatePresence>
              <QueueItem item={item} onRemove={removeItem} onShare={shareItem} />
            </AnimatePresence>
          )}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </GradientBackground>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <MotiView
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', damping: 14 }}
      >
        <View style={styles.emptyIcon}>
          <Ionicons name="layers-outline" size={42} color={colors.textDim} />
        </View>
      </MotiView>
      <Text style={styles.emptyTitle}>Your queue is empty</Text>
      <Text style={styles.emptyText}>Paste a link on the Home tab to start a download.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 22,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  clearBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  clearText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  list: { paddingHorizontal: 22, paddingBottom: 130, paddingTop: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 40, gap: 12 },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  emptyText: { color: colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 20 },
});
