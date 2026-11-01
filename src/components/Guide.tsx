import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';
import { Card, Row, Txt, haptic } from './ui';
import { colors, fonts, radius, space } from '../theme';
import { useApp } from '../lib/store';
import { LANGUAGES, type Locale } from '../lib/i18n';

/** Grid of languages, each written in its own script. */
export function LanguageGrid({ onPick }: { onPick?: (l: Locale) => void }) {
  const { locale, setProfile } = useApp();
  return (
    <View style={styles.grid}>
      {LANGUAGES.map((l) => {
        const active = l.code === locale;
        return (
          <Pressable
            key={l.code}
            onPress={() => {
              haptic.select();
              setProfile({ locale: l.code });
              onPick?.(l.code);
            }}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            accessibilityLabel={`${l.native} (${l.english})`}
            style={[styles.lang, active && styles.langActive]}
          >
            <Txt
              center
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                fontFamily: l.rtl ? fonts.arabicBold : fonts.bodySemi,
                fontSize: l.rtl ? 19 : 15,
                lineHeight: l.rtl ? 30 : 20,
                color: active ? colors.bgDeep : colors.ivory,
              }}
            >
              {l.native}
            </Txt>
            <Txt center style={{ fontFamily: fonts.body, fontSize: 11, lineHeight: 14, color: active ? colors.emerald : colors.textFaint }}>
              {l.english}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}

const STEPS: { icon: keyof typeof Ionicons.glyphMap; title: 'how1Title' | 'how2Title' | 'how3Title' | 'how4Title'; body: 'how1Body' | 'how2Body' | 'how3Body' | 'how4Body' }[] = [
  { icon: 'sunny-outline', title: 'how1Title', body: 'how1Body' },
  { icon: 'heart-outline', title: 'how2Title', body: 'how2Body' },
  { icon: 'add-circle-outline', title: 'how3Title', body: 'how3Body' },
  { icon: 'sparkles-outline', title: 'how4Title', body: 'how4Body' },
];

/** The four steps of how the app works, numbered and connected by a thin gold line. */
export function HowSteps() {
  const { t } = useApp();
  return (
    <View>
      {STEPS.map((s, i) => (
        <Row key={s.title} gap={space.md} style={{ alignItems: 'flex-start', marginBottom: i < STEPS.length - 1 ? space.md : 0 }}>
          <View style={{ alignItems: 'center' }}>
            <View style={styles.stepIcon}>
              <Ionicons name={s.icon} size={20} color={colors.gold} />
            </View>
            {i < STEPS.length - 1 && <View style={styles.stepLine} />}
          </View>
          <View style={{ flex: 1, paddingTop: 2 }}>
            <Txt v="label" style={{ marginBottom: 2 }}>
              {String(i + 1).padStart(2, '0')}
            </Txt>
            <Txt v="heading" style={{ fontSize: 20, lineHeight: 26 }}>
              {t(s.title)}
            </Txt>
            <Txt v="small" style={{ marginTop: 4 }}>
              {t(s.body)}
            </Txt>
          </View>
        </Row>
      ))}
    </View>
  );
}

/** The four promises: no names, no contact, no money, free. */
export function RulesList() {
  const { t } = useApp();
  const rules: { icon: keyof typeof Ionicons.glyphMap; k: 'rule1' | 'rule2' | 'rule3' | 'rule4' }[] = [
    { icon: 'eye-off-outline', k: 'rule1' },
    { icon: 'call-outline', k: 'rule2' },
    { icon: 'cash-outline', k: 'rule3' },
    { icon: 'gift-outline', k: 'rule4' },
  ];
  return (
    <Card>
      {rules.map((r, i) => (
        <Row key={r.k} gap={space.md} style={{ paddingVertical: 10, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderTopColor: colors.line }}>
          <View style={styles.ruleIcon}>
            <Ionicons name={r.icon} size={18} color={colors.gold} />
            {r.k !== 'rule4' && <View style={styles.strike} />}
          </View>
          <Txt style={{ flex: 1, fontSize: 15 }}>{t(r.k)}</Txt>
        </Row>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'center' },
  lang: {
    width: '47%',
    minHeight: 64,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  langActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  stepIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(214,186,124,0.06)',
  },
  stepLine: { width: 1, flex: 1, minHeight: 24, backgroundColor: colors.line, marginTop: 6 },
  ruleIcon: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  strike: { position: 'absolute', width: 26, height: 1.5, backgroundColor: colors.danger, transform: [{ rotate: '-45deg' }] },
});
