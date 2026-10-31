import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, gradients, goldGlow } from '../theme';
import { useApp } from '../lib/store';
import { haptic } from './ui';

const HOLD_MS = 1400;
const SIZE = 132;

/**
 * Press-and-hold to confirm a dua. Holding fills a golden halo,
 * which keeps the gesture intentional instead of a casual tap.
 */
export function PrayButton({ done, onComplete }: { done: boolean; onComplete: () => void }) {
  const { t, rtl } = useApp();
  const progress = useState(() => new Animated.Value(done ? 1 : 0))[0];
  const pulse = useState(() => new Animated.Value(0))[0];
  const [holding, setHolding] = useState(false);
  const anim = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (done) {
      progress.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [done, progress, pulse]);

  const start = () => {
    if (done) return;
    setHolding(true);
    haptic.light();
    anim.current = Animated.timing(progress, {
      toValue: 1,
      duration: HOLD_MS,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: true,
    });
    anim.current.start(({ finished }) => {
      setHolding(false);
      if (finished) {
        haptic.success();
        onComplete();
      }
    });
  };

  const cancel = () => {
    if (done) return;
    anim.current?.stop();
    setHolding(false);
    Animated.timing(progress, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };

  const haloScale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
  const haloOpacity = progress.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.6, 1] });
  const pulseScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.45] });
  const pulseOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 0] });

  return (
    <View style={styles.wrap}>
      <Pressable
        onPressIn={start}
        onPressOut={cancel}
        accessibilityRole="button"
        accessibilityLabel={done ? t('duaMade') : t('iMadeDua')}
        accessibilityHint={t('holdToPray')}
        accessibilityActions={[{ name: 'activate' }]}
        onAccessibilityAction={() => !done && onComplete()}
        style={styles.press}
      >
        {!done && (
          <Animated.View
            pointerEvents="none"
            style={[styles.pulse, { opacity: pulseOpacity, transform: [{ scale: pulseScale }] }]}
          />
        )}
        <View style={[styles.base, goldGlow]}>
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: haloOpacity, transform: [{ scale: haloScale }] }]}>
            <LinearGradient colors={gradients.gold} style={styles.fill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
          </Animated.View>
          <Ionicons name={done ? 'heart' : 'heart-outline'} size={40} color={done || holding ? colors.bgDeep : colors.gold} />
        </View>
      </Pressable>
      <Text
        style={[
          styles.caption,
          { fontFamily: rtl ? fonts.arabic : fonts.bodyMedium, fontSize: rtl ? 15 : 13 },
          done && { color: colors.goldBright },
        ]}
      >
        {done ? t('duaMade') : t('holdToPray')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', gap: 14 },
  press: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  pulse: {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 1,
    borderColor: colors.gold,
  },
  base: {
    width: SIZE - 20,
    height: SIZE - 20,
    borderRadius: (SIZE - 20) / 2,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surfaceRaised,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  fill: { flex: 1, borderRadius: SIZE },
  caption: { color: colors.textMuted, letterSpacing: 0.3 },
});
