import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useState } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Card, Loader, Ornament, PressableScale, Row, Txt, quoted } from '../../components/ui';
import { PrayButton } from '../../components/PrayButton';
import { ReportSheet } from '../../components/ReportSheet';
import { LangBar } from '../../components/LangBar';
import { personName } from '../../components/NeedCard';
import { colors, gradients, radius, space } from '../../theme';
import { useApp, useLoad } from '../../lib/store';
import { countryFlag, countryName, duaByCategory } from '../../lib/content';
import type { Stats, Today } from '../../lib/types';

function greetingKey() {
  const h = new Date().getHours();
  if (h >= 4 && h < 11) return 'greetingFajr' as const;
  if (h >= 11 && h < 19) return 'greetingDay' as const;
  return 'greetingNight' as const;
}

/** Last third of the night (≈ 01:00–04:30) or Friday afternoon. */
function isSpecialTime() {
  const d = new Date();
  const h = d.getHours() + d.getMinutes() / 60;
  return (h >= 1 && h < 4.5) || (d.getDay() === 5 && h >= 15 && h < 19);
}

export default function TodayScreen() {
  const { t, locale, cat, api, prefs, touch, rtl } = useApp();
  const insets = useSafeAreaInsets();
  const today = useLoad<Today>((a) => a.getToday());
  const stats = useLoad<Stats>((a) => a.getStats());
  const [justPrayed, setJustPrayed] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);
  const reveal = useState(() => new Animated.Value(0))[0];
  const thanks = useState(() => new Animated.Value(0))[0];

  useEffect(() => {
    if (today.data) {
      thanks.setValue(today.data.prayed ? 1 : 0);
      Animated.timing(reveal, { toValue: 1, duration: 700, useNativeDriver: true }).start();
    }
  }, [today.data, reveal, thanks]);

  const onPrayed = useCallback(async () => {
    const need = today.data?.need;
    if (!need) return;
    setJustPrayed(true);
    Animated.spring(thanks, { toValue: 1, useNativeDriver: true, bounciness: 8 }).start();
    try {
      await api.markPrayed(need.id);
    } finally {
      stats.reload();
    }
  }, [api, today.data, thanks, stats]);

  const need = today.data?.need ?? null;
  const prayed = justPrayed || !!today.data?.prayed;
  const dua = need ? duaByCategory[need.category] : null;
  const s = stats.data;
  const firstName = prefs.profile.firstName;

  return (
    <View style={styles.fill}>
      <LinearGradient colors={gradients.screen} style={StyleSheet.absoluteFill} />
      <LinearGradient
        pointerEvents="none"
        colors={['rgba(214,186,124,0.14)', 'rgba(214,186,124,0)']}
        style={styles.halo}
      />
      <ScrollView
        contentContainerStyle={{ paddingTop: insets.top + space.md, paddingBottom: insets.bottom + 130, paddingHorizontal: space.lg }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            tintColor={colors.gold}
            refreshing={false}
            onRefresh={() => {
              touch();
            }}
          />
        }
      >
        {api.mode === 'demo' && (
          <View style={styles.demo}>
            <Txt v="small" center style={{ fontSize: 11, color: colors.textFaint }}>
              {t('demoBanner')}
            </Txt>
          </View>
        )}

        {/* Header */}
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Txt v="label">{t(greetingKey())}</Txt>
            <Txt v="title" style={{ marginTop: 4 }}>
              {firstName ? (rtl ? `${firstName}` : `${firstName}`) : t('appName')}
            </Txt>
          </View>
          <View style={styles.streak}>
            <Txt v="number" center style={{ fontSize: 20, lineHeight: 24 }}>
              {s?.streak ?? 0}
            </Txt>
            <Txt v="small" center style={{ fontSize: 10, lineHeight: 13 }}>
              {t('streak')}
            </Txt>
          </View>
        </Row>

        {isSpecialTime() && (
          <View style={styles.special}>
            <Ionicons name="moon" size={14} color={colors.goldBright} />
            <Txt v="small" style={{ color: colors.goldBright }}>
              {t('specialTime')}
            </Txt>
          </View>
        )}

        {/* Person of the day */}
        <Animated.View
          style={{
            marginTop: space.lg,
            opacity: reveal,
            transform: [{ translateY: reveal.interpolate({ inputRange: [0, 1], outputRange: [24, 0] }) }],
          }}
        >
          {today.loading && !today.data ? (
            <Card>
              <Loader />
            </Card>
          ) : need ? (
            <Card glow>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt v="label">{t('yourPersonToday')}</Txt>
                <Pressable hitSlop={12} onPress={() => setReportId(need.id)} accessibilityLabel={t('report')}>
                  <Ionicons name="ellipsis-horizontal" size={18} color={colors.textFaint} />
                </Pressable>
              </Row>

              <View style={{ alignItems: 'center', marginTop: space.lg }}>
                <View style={styles.flagRing}>
                  <Txt style={{ fontSize: 34, lineHeight: 42 }}>{countryFlag(need.country)}</Txt>
                </View>
                <Txt v="display" center style={{ marginTop: space.md }}>
                  {personName(need, t)}
                </Txt>
                <Txt v="small" center>
                  {t('fromCountry', { country: countryName(need.country, locale) })} · {cat(need.category)}
                </Txt>
              </View>

              <Ornament />

              <Txt v="quote" center auto>
                {quoted(need.body)}
              </Txt>
              <LangBar text={need.body} lang={need.lang} showNote />

              <View style={{ marginTop: space.xl }}>
                <PrayButton done={prayed} onComplete={onPrayed} />
              </View>

              <Animated.View
                style={{
                  opacity: thanks,
                  transform: [{ scale: thanks.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
                }}
                pointerEvents={prayed ? 'auto' : 'none'}
              >
                {prayed && (
                  <View style={{ marginTop: space.lg }}>
                    <Txt v="arabic" style={{ fontSize: 24 }}>
                      وَلَكَ بِمِثْلٍ
                    </Txt>
                    <Txt v="small" center>
                      {t('duaMadeBody')}
                    </Txt>
                    {need.prayedCount > 0 && (
                      <Txt v="small" center style={{ marginTop: 6, color: colors.gold }}>
                        {t('prayedByOthers', { n: need.prayedCount })}
                      </Txt>
                    )}
                    <Txt v="small" center style={{ marginTop: space.md, color: colors.textFaint }}>
                      {t('nextPerson')}
                    </Txt>
                  </View>
                )}
              </Animated.View>
            </Card>
          ) : (
            <Card glow>
              <Txt v="heading" center>
                {t('noPersonTitle')}
              </Txt>
              <Txt v="small" center style={{ marginTop: space.sm }}>
                {t('noPersonBody')}
              </Txt>
            </Card>
          )}
        </Animated.View>

        {/* Suggested dua */}
        {need && dua && (
          <Card style={{ marginTop: space.md }}>
            <Txt v="label" center>
              {t('suggestedDua')}
            </Txt>
            <Txt v="arabic" style={{ marginTop: space.md }}>
              {dua.ar}
            </Txt>
            {locale !== 'ar' && (
              <Txt v="small" center style={{ marginTop: space.sm, fontStyle: 'italic' }}>
                {dua.en}
              </Txt>
            )}
            <Txt v="small" center style={{ marginTop: 6, fontSize: 11, color: colors.textFaint }}>
              {dua.ref}
            </Txt>
          </Card>
        )}

        {/* Prayed for you */}
        <Card style={{ marginTop: space.md }}>
          <Row gap={space.md}>
            <View style={styles.bigNum}>
              <Txt v="number" center>
                {s?.prayedForMeWeek ?? 0}
              </Txt>
            </View>
            <View style={{ flex: 1 }}>
              <Txt v="heading" style={{ fontSize: 19, lineHeight: 24 }}>
                {t('prayedForYou')}
              </Txt>
              <Txt v="small">
                {t('inCountries', { n: s?.countriesWeek.length ?? 0 })}{' '}
                {(s?.countriesWeek ?? []).slice(0, 8).map(countryFlag).join(' ')}
              </Txt>
            </View>
          </Row>
        </Card>

        {/* Features */}
        <Row style={{ marginTop: space.md }} gap={space.md}>
          <Feature
            icon="airplane-outline"
            title={t('pilgrimMode')}
            sub={t('pilgrimModeSub')}
            onPress={() => router.push('/pilgrim')}
          />
          <Feature icon="leaf-outline" title={t('janazah')} sub={t('janazahSub')} onPress={() => router.push('/janazah')} />
        </Row>
      </ScrollView>

      <ReportSheet
        needId={reportId}
        onClose={() => {
          setReportId(null);
        }}
      />
    </View>
  );
}

function Feature({
  icon,
  title,
  sub,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  sub: string;
  onPress: () => void;
}) {
  return (
    <PressableScale onPress={onPress} containerStyle={{ flex: 1 }} accessibilityLabel={title}>
      <Card style={{ minHeight: 150 }}>
        <View style={styles.featureIcon}>
          <Ionicons name={icon} size={20} color={colors.gold} />
        </View>
        <Txt v="heading" style={{ marginTop: space.md, fontSize: 19, lineHeight: 24 }}>
          {title}
        </Txt>
        <Txt v="small" style={{ marginTop: 4 }}>
          {sub}
        </Txt>
      </Card>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  halo: { position: 'absolute', top: 0, left: 0, right: 0, height: 380 },
  demo: {
    alignSelf: 'center',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.line,
    marginBottom: space.md,
  },
  streak: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(214,186,124,0.06)',
  },
  special: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    marginTop: space.md,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(214,186,124,0.12)',
  },
  flagRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  bigNum: {
    minWidth: 76,
    height: 76,
    borderRadius: 38,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
