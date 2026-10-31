import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { memo, type ReactNode, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
  type StyleProp,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, gradients, radius, shadow, space } from '../theme';
import { useApp } from '../lib/store';

export const haptic = {
  light: () => Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {}),
  medium: () => Platform.OS !== 'web' && Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {}),
  success: () =>
    Platform.OS !== 'web' && Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {}),
  select: () => Platform.OS !== 'web' && Haptics.selectionAsync().catch(() => {}),
};

type Variant = 'display' | 'title' | 'heading' | 'body' | 'small' | 'label' | 'arabic' | 'quote' | 'number';

const variantStyle: Record<Variant, TextStyle> = {
  display: { fontFamily: fonts.display, fontSize: 40, lineHeight: 46, color: colors.ivory, letterSpacing: 0.2 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 36, color: colors.ivory },
  heading: { fontFamily: fonts.display, fontSize: 22, lineHeight: 28, color: colors.ivory },
  quote: { fontFamily: fonts.displayItalic, fontSize: 22, lineHeight: 32, color: colors.text },
  body: { fontFamily: fonts.body, fontSize: 16, lineHeight: 25, color: colors.text },
  small: { fontFamily: fonts.body, fontSize: 13, lineHeight: 19, color: colors.textMuted },
  label: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.gold,
  },
  arabic: { fontFamily: fonts.arabic, fontSize: 22, lineHeight: 40, color: colors.goldBright, textAlign: 'center' },
  number: { fontFamily: fonts.body, fontSize: 30, lineHeight: 36, color: colors.goldBright, letterSpacing: -0.5 },
};

// Arabic UI: swap Latin display/body fonts for Amiri so the whole screen reads naturally.
const arabicOverride: Partial<Record<Variant, TextStyle>> = {
  display: { fontFamily: fonts.arabicBold, fontSize: 36, lineHeight: 56 },
  title: { fontFamily: fonts.arabicBold, fontSize: 28, lineHeight: 46 },
  heading: { fontFamily: fonts.arabicBold, fontSize: 21, lineHeight: 34 },
  quote: { fontFamily: fonts.arabic, fontSize: 21, lineHeight: 38 },
  body: { fontFamily: fonts.arabic, fontSize: 17, lineHeight: 30 },
  small: { fontFamily: fonts.arabic, fontSize: 14, lineHeight: 24 },
  label: { fontFamily: fonts.arabicBold, fontSize: 13, lineHeight: 20, letterSpacing: 0, textTransform: 'none' },
};

export const Txt = memo(function Txt({
  v = 'body',
  style,
  center,
  color,
  ...rest
}: TextProps & { v?: Variant; center?: boolean; color?: string }) {
  const { rtl } = useApp();
  return (
    <RNText
      {...rest}
      style={[
        variantStyle[v],
        rtl && arabicOverride[v],
        { writingDirection: rtl ? 'rtl' : 'ltr', textAlign: center ? 'center' : rtl ? 'right' : 'left' },
        v === 'arabic' && { textAlign: 'center', writingDirection: 'rtl' },
        color ? { color } : null,
        style,
      ]}
    />
  );
});

export function Screen({
  children,
  scroll = true,
  padded = true,
  bottomInset = true,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  padded?: boolean;
  bottomInset?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const pad: ViewStyle = {
    paddingTop: insets.top + space.md,
    paddingBottom: (bottomInset ? insets.bottom : 0) + 120,
    paddingHorizontal: padded ? space.lg : 0,
  };
  return (
    <View style={styles.fill}>
      <LinearGradient colors={gradients.screen} style={StyleSheet.absoluteFill} />
      <Glow />
      {scroll ? (
        <ScrollView
          contentContainerStyle={[pad, contentStyle]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.fill, pad, contentStyle]}>{children}</View>
      )}
    </View>
  );
}

/** Soft golden halo at the top of every screen. */
function Glow() {
  return (
    <LinearGradient
      pointerEvents="none"
      colors={['rgba(214,186,124,0.10)', 'rgba(214,186,124,0)']}
      style={styles.glow}
    />
  );
}

export function Card({
  children,
  style,
  glow,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  glow?: boolean;
}) {
  return (
    <View style={[styles.cardWrap, shadow, style]}>
      <LinearGradient colors={gradients.card} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
        {glow && (
          <LinearGradient
            pointerEvents="none"
            colors={gradients.goldSoft}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 0.6 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {children}
      </LinearGradient>
    </View>
  );
}

export function PressableScale({
  children,
  onPress,
  style,
  disabled,
  accessibilityLabel,
  containerStyle,
}: {
  children: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
  containerStyle?: StyleProp<ViewStyle>;
}) {
  const scale = useState(() => new Animated.Value(1))[0];
  const to = (v: number) =>
    Animated.spring(scale, { toValue: v, useNativeDriver: true, speed: 40, bounciness: 6 }).start();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      style={containerStyle}
      onPressIn={() => to(0.97)}
      onPressOut={() => to(1)}
      onPress={() => {
        haptic.light();
        onPress?.();
      }}
    >
      <Animated.View style={[{ transform: [{ scale }] }, disabled && { opacity: 0.5 }, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export function GoldButton({
  label,
  onPress,
  loading,
  disabled,
  style,
  variant = 'solid',
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  variant?: 'solid' | 'outline' | 'ghost';
}) {
  const { rtl } = useApp();
  const textStyle: TextStyle = {
    fontFamily: rtl ? fonts.arabicBold : fonts.bodySemi,
    fontSize: rtl ? 17 : 15,
    letterSpacing: rtl ? 0 : 0.6,
    color: variant === 'solid' ? colors.bgDeep : colors.gold,
    textAlign: 'center',
  };
  return (
    <PressableScale onPress={onPress} disabled={disabled || loading} style={style} accessibilityLabel={label}>
      {variant === 'solid' ? (
        <LinearGradient colors={gradients.gold} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
          {loading ? <ActivityIndicator color={colors.bgDeep} /> : <RNText numberOfLines={1} adjustsFontSizeToFit style={textStyle}>{label}</RNText>}
        </LinearGradient>
      ) : (
        <View style={[styles.btn, variant === 'outline' && styles.btnOutline]}>
          {loading ? <ActivityIndicator color={colors.gold} /> : <RNText style={textStyle}>{label}</RNText>}
        </View>
      )}
    </PressableScale>
  );
}

export function Chip({ label, active, onPress }: { label: string; active?: boolean; onPress: () => void }) {
  const { rtl } = useApp();
  return (
    <Pressable
      onPress={() => {
        haptic.select();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityState={{ selected: !!active }}
      style={[styles.chip, active && styles.chipActive]}
    >
      <RNText
        style={{
          fontFamily: rtl ? fonts.arabic : fonts.bodyMedium,
          fontSize: rtl ? 15 : 13,
          color: active ? colors.bgDeep : colors.text,
        }}
      >
        {label}
      </RNText>
    </Pressable>
  );
}

/** Thin gold rule with a small eight-point star, used as an ornament between sections. */
export function Ornament({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.ornament, style]}>
      <View style={styles.rule} />
      <View style={styles.starWrap}>
        <View style={styles.star} />
        <View style={[styles.star, { transform: [{ rotate: '45deg' }] }]} />
      </View>
      <View style={styles.rule} />
    </View>
  );
}

export function Row({ children, style, gap = space.sm }: { children: ReactNode; style?: StyleProp<ViewStyle>; gap?: number }) {
  const { rtl } = useApp();
  return <View style={[{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginVertical: space.md }} />;
}

export function Loader() {
  return (
    <View style={{ paddingVertical: space.xxl, alignItems: 'center' }}>
      <ActivityIndicator color={colors.gold} />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 320 },
  cardWrap: { borderRadius: radius.lg },
  card: {
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    overflow: 'hidden',
  },
  btn: {
    height: 56,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.xl,
  },
  btnOutline: { borderWidth: 1, borderColor: colors.lineStrong },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  chipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  ornament: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: space.lg },
  rule: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.lineStrong },
  starWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  star: { position: 'absolute', width: 8, height: 8, borderWidth: 1, borderColor: colors.gold },
});
