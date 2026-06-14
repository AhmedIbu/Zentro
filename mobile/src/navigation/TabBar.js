import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MotiView } from 'moti';
import AnimatedPressable from '../components/AnimatedPressable';
import { useQueue } from '../store/QueueContext';
import { colors } from '../theme';

const ICONS = {
  Home: ['home', 'home-outline'],
  Queue: ['layers', 'layers-outline'],
  Library: ['albums', 'albums-outline'],
};

export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { activeCount } = useQueue();

  return (
    <View style={[styles.wrap, { paddingBottom: insets.bottom || 12 }]}>
      <BlurView intensity={40} tint="dark" style={styles.bar}>
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          const [active, inactive] = ICONS[route.name] || ['ellipse', 'ellipse-outline'];

          const onPress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
          };

          return (
            <AnimatedPressable key={route.key} onPress={onPress} scaleTo={0.85} style={styles.tab}>
              <View style={styles.tabInner}>
                <View>
                  <Ionicons
                    name={focused ? active : inactive}
                    size={24}
                    color={focused ? colors.primary : colors.textDim}
                  />
                  {route.name === 'Queue' && activeCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{activeCount}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.label, { color: focused ? colors.text : colors.textDim }]}>
                  {route.name}
                </Text>
                {focused && (
                  <MotiView
                    from={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    transition={{ type: 'spring', damping: 14 }}
                    style={styles.indicator}
                  />
                )}
              </View>
            </AnimatedPressable>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    marginHorizontal: 22,
    marginBottom: 4,
    paddingVertical: 10,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(20,20,30,0.6)',
    width: '88%',
  },
  tab: { flex: 1 },
  tabInner: { alignItems: 'center', gap: 4, paddingVertical: 2 },
  label: { fontSize: 11, fontWeight: '700' },
  indicator: {
    position: 'absolute',
    bottom: -6,
    width: 22,
    height: 3,
    borderRadius: 3,
    backgroundColor: colors.primary,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 4,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
