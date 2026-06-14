import React, { useMemo, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';

import GradientBackground from '../components/GradientBackground';
import LogoOrb from '../components/LogoOrb';
import PlatformPill from '../components/PlatformPill';
import QualityPicker from '../components/QualityPicker';
import AnimatedPressable from '../components/AnimatedPressable';
import { useQueue } from '../store/QueueContext';
import { detectPlatform, looksLikeUrl } from '../utils/platform';
import { brandGradient, colors, radii } from '../theme';

export default function HomeScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { enqueue } = useQueue();
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('best');

  const platform = useMemo(() => detectPlatform(url), [url]);
  const valid = looksLikeUrl(url);

  const paste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      setUrl(text.trim());
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
  };

  const startDownload = () => {
    if (!valid) return;
    enqueue(url, quality);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setUrl('');
    Keyboard.dismiss();
    navigation.navigate('Queue');
  };

  return (
    <GradientBackground>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 12 }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <MotiView
              from={{ opacity: 0, translateY: -10 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'timing', duration: 500 }}
              style={styles.header}
            >
              <LogoOrb size={104} />
              <Text style={styles.brand}>Zentro</Text>
              <Text style={styles.tagline}>Paste a link. Keep the media.</Text>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 16, delay: 150 }}
              style={styles.inputCard}
            >
              <View style={styles.inputTop}>
                <Text style={styles.label}>MEDIA URL</Text>
                {url.length > 0 && <PlatformPill platform={platform} size="sm" />}
              </View>

              <View style={styles.inputRow}>
                <Ionicons name="link" size={18} color={colors.textDim} />
                <TextInput
                  value={url}
                  onChangeText={setUrl}
                  placeholder="https://…"
                  placeholderTextColor={colors.textDim}
                  style={styles.input}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  returnKeyType="go"
                  onSubmitEditing={startDownload}
                />
                {url.length > 0 ? (
                  <AnimatedPressable onPress={() => setUrl('')} scaleTo={0.85}>
                    <Ionicons name="close-circle" size={20} color={colors.textDim} />
                  </AnimatedPressable>
                ) : (
                  <AnimatedPressable onPress={paste} scaleTo={0.9}>
                    <View style={styles.pasteBtn}>
                      <Ionicons name="clipboard-outline" size={14} color={colors.text} />
                      <Text style={styles.pasteText}>Paste</Text>
                    </View>
                  </AnimatedPressable>
                )}
              </View>
            </MotiView>

            <MotiView
              from={{ opacity: 0, translateY: 24 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', damping: 16, delay: 250 }}
              style={{ marginTop: 24 }}
            >
              <QualityPicker value={quality} onChange={setQuality} />
            </MotiView>

            <MotiView
              from={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', damping: 14, delay: 350 }}
              style={{ marginTop: 32 }}
            >
              <AnimatedPressable onPress={startDownload} disabled={!valid} scaleTo={0.96}>
                <LinearGradient
                  colors={valid ? brandGradient : ['#3A3A48', '#3A3A48']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.cta}
                >
                  <Ionicons name="arrow-down-circle" size={22} color="#fff" />
                  <Text style={styles.ctaText}>Download</Text>
                </LinearGradient>
              </AnimatedPressable>
            </MotiView>

            <View style={styles.supportRow}>
              {['youtube', 'instagram', 'tiktok', 'twitter', 'reddit'].map((p, i) => (
                <MotiView
                  key={p}
                  from={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 12, delay: 450 + i * 70 }}
                >
                  <View style={styles.supportIcon}>
                    <Ionicons
                      name={
                        { youtube: 'logo-youtube', instagram: 'logo-instagram', tiktok: 'logo-tiktok', twitter: 'logo-twitter', reddit: 'logo-reddit' }[p]
                      }
                      size={20}
                      color={colors.textDim}
                    />
                  </View>
                </MotiView>
              ))}
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </GradientBackground>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 22, paddingBottom: 140 },
  header: { alignItems: 'center', marginBottom: 28 },
  brand: { color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: 1, marginTop: 8 },
  tagline: { color: colors.textDim, fontSize: 14, marginTop: 4 },
  inputCard: {
    backgroundColor: colors.cardSolid,
    borderRadius: radii.lg,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, minHeight: 24 },
  label: { color: colors.textDim, fontSize: 12, fontWeight: '700', letterSpacing: 1.5 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: radii.md,
    paddingHorizontal: 14,
    height: 52,
  },
  input: { flex: 1, color: colors.text, fontSize: 15 },
  pasteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(124,92,255,0.18)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.pill,
  },
  pasteText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  cta: {
    height: 58,
    borderRadius: radii.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    shadowColor: '#7C5CFF',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '800' },
  supportRow: { flexDirection: 'row', justifyContent: 'center', gap: 18, marginTop: 34 },
  supportIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
