import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, StyleSheet, Switch, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Divider, GoldButton, Loader, Row, Screen, Txt, haptic } from '../../components/ui';
import { NeedCard } from '../../components/NeedCard';
import { Sheet } from '../../components/Sheet';
import { colors, fonts, radius, space } from '../../theme';
import { useApp, useLoad } from '../../lib/store';
import { scheduleReminders } from '../../lib/notifications';
import { checkShortText } from '../../lib/moderation';
import { LANGUAGES } from '../../lib/i18n';
import { LanguageGrid } from '../../components/Guide';
import type { Need } from '../../lib/types';

export default function MeScreen() {
  const { t, api, prefs, setPrefs, reset, locale, touch, rtl } = useApp();
  const needs = useLoad((a) => a.myNeeds());
  const stats = useLoad((a) => a.getStats());
  const [answering, setAnswering] = useState<Need | null>(null);
  const [note, setNote] = useState('');
  const [langOpen, setLangOpen] = useState(false);

  const toggle = async (key: 'notifMorning' | 'notifSpecial', v: boolean) => {
    await setPrefs({ [key]: v });
    const m = key === 'notifMorning' ? v : prefs.notifMorning;
    const s = key === 'notifSpecial' ? v : prefs.notifSpecial;
    scheduleReminders(locale, m, s).catch(() => {});
  };

  const confirmDelete = () => {
    const run = async () => {
      await reset();
      router.replace('/onboarding');
    };
    if (Platform.OS === 'web') {
      if (globalThis.confirm?.(t('deleteConfirm'))) run();
      return;
    }
    Alert.alert(t('deleteAccount'), t('deleteConfirm'), [
      { text: t('cancel'), style: 'cancel' },
      { text: t('delete'), style: 'destructive', onPress: run },
    ]);
  };

  const noteIssue = note ? checkShortText(note, 280) : null;
  const saveAnswered = async () => {
    if (!answering || noteIssue) return;
    haptic.success();
    await api.markAnswered(answering.id, note);
    setAnswering(null);
    setNote('');
    touch();
  };

  const s = stats.data;

  return (
    <Screen>
      <Txt v="label">{t('tabMe')}</Txt>
      <Txt v="title" style={{ marginTop: 4 }}>
        {t('meTitle')}
      </Txt>

      <Row style={{ marginTop: space.lg }} gap={space.md}>
        <Stat n={s?.myPrayersTotal ?? 0} label={t('totalPrayers')} />
        <Stat n={s?.prayedForMeTotal ?? 0} label={t('totalForYou')} />
        <Stat n={s?.streak ?? 0} label={t('streak')} />
      </Row>
      <Txt v="small" center style={{ marginTop: space.sm, fontSize: 11, color: colors.textFaint }}>
        {t('streakPrivate')}
      </Txt>

      <Txt v="heading" style={{ marginTop: space.xl, marginBottom: space.md }}>
        {t('myNeeds')}
      </Txt>
      {needs.loading && !needs.data ? (
        <Loader />
      ) : needs.data?.length ? (
        needs.data.map((n) => (
          <NeedCard
            key={n.id}
            need={n}
            showAnswer
            footer={
              <Row style={{ justifyContent: 'space-between' }}>
                <Row gap={6}>
                  <Ionicons name={n.status === 'answered' ? 'checkmark-circle' : 'heart'} size={14} color={colors.gold} />
                  <Txt v="small" style={{ color: colors.gold }}>
                    {n.status === 'answered' ? t('answered') : t('prayedTimes', { n: n.prayedCount })}
                  </Txt>
                </Row>
                {n.status === 'open' && n.kind === 'need' && (
                  <Pressable onPress={() => setAnswering(n)} style={styles.smallBtn} accessibilityRole="button">
                    <Txt v="small" style={{ color: colors.goldBright }}>
                      {t('markAnswered')}
                    </Txt>
                  </Pressable>
                )}
              </Row>
            }
          />
        ))
      ) : (
        <Card>
          <Txt v="small" center>
            {t('noNeeds')}
          </Txt>
          <GoldButton label={t('askTitle')} variant="outline" onPress={() => router.navigate('/(tabs)/ask')} style={{ marginTop: space.md }} />
        </Card>
      )}

      <Txt v="heading" style={{ marginTop: space.xl, marginBottom: space.md }}>
        {t('settings')}
      </Txt>
      <Card>
        <Pressable onPress={() => setLangOpen(true)} accessibilityRole="button">
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap={10}>
              <Ionicons name="globe-outline" size={18} color={colors.gold} />
              <Txt>{t('language')}</Txt>
            </Row>
            <Row gap={6}>
              <Txt style={{ color: colors.goldBright }}>{LANGUAGES.find((l) => l.code === locale)?.native}</Txt>
              <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.textFaint} />
            </Row>
          </Row>
        </Pressable>
        <Divider />
        <Pressable onPress={() => router.push('/guide')} accessibilityRole="button">
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap={10}>
              <Ionicons name="book-outline" size={18} color={colors.gold} />
              <Txt>{t('howItWorks')}</Txt>
            </Row>
            <Ionicons name={rtl ? 'chevron-back' : 'chevron-forward'} size={16} color={colors.textFaint} />
          </Row>
        </Pressable>
        <Divider />
        <Txt v="label" style={{ marginBottom: space.sm }}>
          {t('notifications')}
        </Txt>
        <ToggleRow label={t('notifMorning')} value={prefs.notifMorning} onChange={(v) => toggle('notifMorning', v)} />
        <ToggleRow label={t('notifSpecial')} value={prefs.notifSpecial} onChange={(v) => toggle('notifSpecial', v)} />
        <Divider />
        <Txt v="label" style={{ marginBottom: space.sm }}>
          {t('privacy')}
        </Txt>
        <Txt v="small">{t('privacyBody')}</Txt>
        <Divider />
        <Txt v="label" style={{ marginBottom: space.sm }}>
          {t('about')}
        </Txt>
        <Txt v="small">{t('aboutBody')}</Txt>
      </Card>

      <Pressable onPress={confirmDelete} style={{ paddingVertical: space.lg }} accessibilityRole="button">
        <Txt v="small" center style={{ color: colors.danger }}>
          {t('deleteAccount')}
        </Txt>
      </Pressable>
      <Txt v="small" center style={{ fontSize: 11, color: colors.textFaint }}>
        {t('appName')} · v1.0 · {api.mode}
      </Txt>

      <Sheet visible={langOpen} onClose={() => setLangOpen(false)} title={t('chooseLanguage')}>
        <LanguageGrid
          onPick={(l) => {
            scheduleReminders(l, prefs.notifMorning, prefs.notifSpecial).catch(() => {});
            setTimeout(() => setLangOpen(false), 250);
          }}
        />
      </Sheet>

      <Sheet visible={!!answering} onClose={() => setAnswering(null)} title={t('alhamdulillah')}>
        <Txt v="small" center style={{ marginBottom: space.md }}>
          {answering?.body}
        </Txt>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t('answeredNotePlaceholder')}
          placeholderTextColor={colors.textFaint}
          maxLength={280}
          multiline
          style={[styles.input, { textAlign: rtl ? 'right' : 'left', fontFamily: rtl ? fonts.arabic : fonts.body }]}
        />
        {noteIssue ? (
          <Txt v="small" style={{ color: colors.danger, marginTop: 6 }}>
            {noteIssue === 'contact' || noteIssue === 'link' ? t('errContact') : t('errAbuse')}
          </Txt>
        ) : null}
        <GoldButton label={t('confirm')} onPress={saveAnswered} disabled={!!noteIssue} style={{ marginTop: space.md }} />
      </Sheet>
    </Screen>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <Card style={{ flex: 1 }}>
      <Txt v="number" center style={{ fontSize: 26, lineHeight: 32 }}>
        {n}
      </Txt>
      <Txt v="small" center style={{ fontSize: 11, lineHeight: 15 }}>
        {label}
      </Txt>
    </Card>
  );
}

function ToggleRow({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <Row style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
      <Txt style={{ flex: 1, fontSize: 15 }}>{label}</Txt>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: colors.goldDeep, false: colors.surfaceRaised }}
        thumbColor={value ? colors.goldBright : colors.textMuted}
      />
    </Row>
  );
}

const styles = StyleSheet.create({
  smallBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  lang: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.line },
  langActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  input: {
    minHeight: 90,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.ivory,
    padding: space.md,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
