import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { getLocales } from 'expo-localization';
import { Chip, GoldButton, Ornament, Row, Txt } from '../components/ui';
import { colors, fonts, gradients, radius, space } from '../theme';
import { useApp } from '../lib/store';
import { COUNTRIES, countryName } from '../lib/content';
import { Ionicons } from '@expo/vector-icons';
import { HowSteps, LanguageGrid, RulesList } from '../components/Guide';
import { scheduleReminders } from '../lib/notifications';
import { isValidName } from '../lib/moderation';

const STEPS = 5; // language · hadith · how it works · rules · profile

export default function Onboarding() {
  const { t, prefs, completeOnboarding, locale, rtl } = useApp();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [name, setName] = useState(prefs.profile.firstName ?? '');
  const [gender, setGender] = useState<'f' | 'm' | null>(prefs.profile.gender);
  const [country, setCountry] = useState(() => {
    const region = getLocales()[0]?.regionCode;
    return COUNTRIES.some((c) => c.code === region) ? region! : prefs.profile.country;
  });
  const [busy, setBusy] = useState(false);
  const fade = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    fade.setValue(0);
    Animated.timing(fade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [step, fade]);

  const next = async () => {
    if (step < STEPS - 1) return setStep(step + 1);
    setBusy(true);
    await completeOnboarding({ firstName: name.trim() || null, gender, country, locale });
    scheduleReminders(locale, true, true).catch(() => {});
    router.replace('/(tabs)');
  };

  const translateY = fade.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <View style={styles.fill}>
      <LinearGradient colors={gradients.screen} style={StyleSheet.absoluteFill} />
      <LinearGradient
        colors={['rgba(214,186,124,0.16)', 'rgba(214,186,124,0)']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 420 }}
      />
      <View style={[styles.top, { paddingTop: insets.top + space.md }]}>
        <Pressable
          onPress={() => step > 0 && setStep(step - 1)}
          disabled={step === 0}
          style={[styles.iconBtn, step === 0 && { opacity: 0 }]}
          accessibilityRole="button"
          accessibilityLabel={t('back')}
          hitSlop={8}
        >
          <Ionicons name={rtl ? 'chevron-forward' : 'chevron-back'} size={18} color={colors.gold} />
        </Pressable>
        <Row gap={6}>
          {Array.from({ length: STEPS }).map((_, i) => (
            <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
          ))}
        </Row>
        <Pressable
          onPress={() => setStep(0)}
          disabled={step === 0}
          style={[styles.iconBtn, step === 0 && { opacity: 0 }]}
          accessibilityRole="button"
          accessibilityLabel={t('language')}
          hitSlop={8}
        >
          <Ionicons name="globe-outline" size={18} color={colors.gold} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: space.lg }} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ flex: 1, justifyContent: 'center', opacity: fade, transform: [{ translateY }] }}>
          {step === 0 && (
            <View style={{ alignItems: 'center' }}>
              <Txt v="arabic" style={{ fontSize: 56, lineHeight: 90, fontFamily: fonts.arabicBold }}>
                بالغيب
              </Txt>
              <Txt v="label" center style={{ marginTop: 4 }}>
                Bil-Ghayb
              </Txt>
              <Ornament style={{ width: 160 }} />
              <Txt v="title" center style={{ marginBottom: 4 }}>
                {t('chooseLanguage')}
              </Txt>
              <Txt v="small" center style={{ marginBottom: space.lg }}>
                {t('langSub')}
              </Txt>
              <LanguageGrid />
            </View>
          )}

          {step === 1 && (
            <View style={{ alignItems: 'center' }}>
              <Txt v="arabic" style={{ fontSize: 64, lineHeight: 100, fontFamily: fonts.arabicBold }}>
                بالغيب
              </Txt>
              <Txt v="label" center style={{ marginTop: space.sm }}>
                Bil-Ghayb
              </Txt>
              <Ornament style={{ width: 180 }} />
              <Txt v="title" center>
                {t('ob1Title')}
              </Txt>
              <Txt v="arabic" style={{ marginTop: space.lg, fontSize: 21 }}>
                مَا مِنْ عَبْدٍ مُسْلِمٍ يَدْعُو لِأَخِيهِ بِظَهْرِ الْغَيْبِ إِلَّا قَالَ الْمَلَكُ: وَلَكَ بِمِثْلٍ
              </Txt>
              {locale !== 'ar' && (
                <Txt v="quote" center style={{ marginTop: space.md }}>
                  {t('ob1Body')}
                </Txt>
              )}
              <Txt v="small" center style={{ marginTop: space.md }}>
                {t('ob1Source')}
              </Txt>
            </View>
          )}

          {step === 2 && (
            <View>
              <Txt v="title" center>
                {t('howTitle')}
              </Txt>
              <Ornament style={{ width: 160, alignSelf: 'center' }} />
              <HowSteps />
            </View>
          )}

          {step === 3 && (
            <View>
              <Txt v="title" center>
                {t('ob3Title')}
              </Txt>
              <Ornament style={{ width: 160, alignSelf: 'center' }} />
              <Txt v="quote" center style={{ marginBottom: space.lg }}>
                {t('ob3Body')}
              </Txt>
              <RulesList />
            </View>
          )}

          {step === 4 && (
            <View>
              <Txt v="title" center style={{ marginBottom: space.xl }}>
                {t('tagline')}
              </Txt>

              <Txt v="label" style={{ marginBottom: space.sm }}>
                {t('yourName')}
              </Txt>
              <TextInput
                value={name}
                onChangeText={setName}
                maxLength={40}
                placeholder="—"
                placeholderTextColor={colors.textFaint}
                style={[styles.input, { textAlign: rtl ? 'right' : 'left', fontFamily: rtl ? fonts.arabic : fonts.body }]}
                autoCapitalize="words"
                autoCorrect={false}
                returnKeyType="done"
              />
              <Txt v="small" style={{ marginTop: 6, marginBottom: space.lg, color: isValidName(name) ? colors.textMuted : colors.danger }}>
                {isValidName(name) ? t('yourNameHint') : t('errName')}
              </Txt>

              <Txt v="label" style={{ marginBottom: space.sm }}>
                {t('iAm')}
              </Txt>
              <Row style={{ flexWrap: 'wrap', marginBottom: space.lg }}>
                <Chip label={t('sister')} active={gender === 'f'} onPress={() => setGender('f')} />
                <Chip label={t('brother')} active={gender === 'm'} onPress={() => setGender('m')} />
                <Chip label={t('preferNot')} active={gender === null} onPress={() => setGender(null)} />
              </Row>

              <Txt v="label" style={{ marginBottom: space.sm }}>
                {t('yourCountry')}
              </Txt>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {COUNTRIES.map((c) => (
                  <Chip
                    key={c.code}
                    label={`${c.flag}  ${countryName(c.code, locale)}`}
                    active={country === c.code}
                    onPress={() => setCountry(c.code)}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={{ padding: space.lg, paddingBottom: insets.bottom + space.lg }}>
        <GoldButton
          label={step === STEPS - 1 ? t('begin') : t('continue')}
          onPress={next}
          loading={busy}
          disabled={step === STEPS - 1 && !isValidName(name)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: space.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.lineStrong },
  dotActive: { width: 22, backgroundColor: colors.gold },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    height: 54,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(255,255,255,0.03)',
    color: colors.ivory,
    paddingHorizontal: space.md,
    fontSize: 16,
  },
});
