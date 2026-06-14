import React, { useEffect, useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';

import GradientBackground from '../components/GradientBackground';
import PlatformPill from '../components/PlatformPill';
import { useQueue } from '../store/QueueContext';
import { colors, radii } from '../theme';
import { formatBytes, timeAgo } from '../utils/format';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const { history, historyLoading, refreshHistory } = useQueue();

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <MotiView
        from={{ opacity: 0, translateY: 14 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 320, delay: Math.min(index * 40, 400) }}
        style={styles.row}
      >
        <View style={styles.rowLeft}>
          <PlatformPill platform={item.platform} size="sm" />
          <Text numberOfLines={1} style={styles.rowTitle}>
            {item.title || item.source_url}
          </Text>
          <Text style={styles.rowMeta}>
            {item.quality} · {formatBytes(item.file_size)} · {timeAgo(item.created_at)}
          </Text>
        </View>
        <Ionicons
          name={item.status === 'failed' ? 'alert-circle' : 'checkmark-circle'}
          size={22}
          color={item.status === 'failed' ? colors.danger : colors.success}
        />
      </MotiView>
    ),
    []
  );

  return (
    <GradientBackground>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.title}>Library</Text>
        <Text style={styles.subtitle}>Your download history</Text>
      </View>

      {history.length === 0 && !historyLoading ? (
        <Empty />
      ) : (
        <FlatList
          data={history}
          keyExtractor={(it) => String(it.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          refreshControl={
            <RefreshControl refreshing={historyLoading} onRefresh={refreshHistory} tintColor={colors.primary} />
          }
        />
      )}
    </GradientBackground>
  );
}

function Empty() {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name="albums-outline" size={42} color={colors.textDim} />
      </View>
      <Text style={styles.emptyTitle}>No history yet</Text>
      <Text style={styles.emptyText}>
        Completed downloads appear here. Pull to refresh once you’ve grabbed something.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { paddingHorizontal: 22, paddingBottom: 14 },
  title: { color: colors.text, fontSize: 30, fontWeight: '900' },
  subtitle: { color: colors.textDim, fontSize: 13, marginTop: 2 },
  list: { paddingHorizontal: 22, paddingBottom: 130, paddingTop: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cardSolid,
    borderRadius: radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 12,
  },
  rowLeft: { flex: 1, gap: 6 },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '600' },
  rowMeta: { color: colors.textDim, fontSize: 12 },
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
