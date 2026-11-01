import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Switch, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Chip, GoldButton, Ornament, Row, Screen, Txt, haptic } from '../../components/ui';
import { colors, fonts, radius, space } from '../../theme';
import { useApp } from '../../lib/store';
import { CATEGORIES, type Category, type NeedKind, type SubmitResult } from '../../lib/types';
import { MAX_LEN, checkNeedText, isValidName } from '../../lib/moderation';
import { ExternalLink } from '../../components/ExternalLink';
import { LINKS } from '../../lib/links';
import type { StringKey } from '../../lib/i18n';

const ERR: Record<Exclude<SubmitResult, { ok: true }>['reason'], StringKey> = {
  contact: 'errContact',
  money: 'errMoney',
  link: 'errLink',
  abuse: 'errAbuse',
  too_short: 'errShort',
  too_long: 'errLong',
  rate: 'errRate',
  network: 'errNetwork',
};

export default function AskScreen() {
  const { t, cat, api, prefs, touch, rtl } = useApp();
  const [kind, setKind] = useState<NeedKind>('need');
  const [category, setCategory] = useState<Category>('health');
  const [body, setBody] = useState('');
  const [deceased, setDeceased] = useState('');
  const [byName, setByName] = useState(!!prefs.profile.firstName);
  const [pilgrims, setPilgrims] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<StringKey | null>(null);
  const [done, setDone] = useState(false);
  const [needsHelp, setNeedsHelp] = useState(false);

  // Instant feedback for contact info / links while typing (length errors only on submit).
  const liveIssue = useMemo(() => {
    if (kind === 'janazah' && !isValidName(deceased)) return 'errName' as StringKey;
    const i = checkNeedText(body);
    return i && i !== 'too_short' ? ERR[i] : null;
  }, [body, deceased, kind]);

  const submit = async () => {
    setError(null);
    setBusy(true);
    const res = await api
      .submitNeed({
        kind,
        category: kind === 'janazah' ? 'grief' : category,
        body,
        deceasedName: kind === 'janazah' ? deceased.trim() || null : null,
        firstName: byName ? prefs.profile.firstName : null,
        gender: prefs.profile.gender,
        country: prefs.profile.country,
        sendWithPilgrims: pilgrims,
      })
      .catch((): SubmitResult => ({ ok: false, reason: 'network' }));
    setBusy(false);
    if (!res.ok) {
      haptic.medium();
      setError(ERR[res.reason]);
      return;
    }
    haptic.success();
    setNeedsHelp(!!res.selfHarm);
    setDone(true);
    setBody('');
    setDeceased('');
    touch();
  };

  if (done) {
    return (
      <Screen contentStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <View style={{ alignItems: 'center' }}>
          <View style={styles.doneIcon}>
            <Ionicons name="paper-plane-outline" size={36} color={colors.gold} />
          </View>
          <Txt v="title" center style={{ marginTop: space.lg }}>
            {t('submitted')}
          </Txt>
          <Ornament style={{ width: 160 }} />
          <Txt v="quote" center>
            {t('submittedBody')}
          </Txt>
          {needsHelp && (
            <Card glow style={{ marginTop: space.xl, alignSelf: 'stretch' }}>
              <Txt v="heading" center>
                {t('selfHarmTitle')}
              </Txt>
              <Txt v="small" center style={{ marginTop: space.sm }}>
                {t('selfHarmBody')}
              </Txt>
              <View style={{ alignItems: 'center', marginTop: space.md }}>
                <ExternalLink href={LINKS.helplines} label={t('findHelp')}>
                  <View style={styles.helpBtn}>
                    <Txt style={{ color: colors.bgDeep, fontSize: 15 }}>{t('findHelp')}</Txt>
                  </View>
                </ExternalLink>
              </View>
            </Card>
          )}
          <GoldButton label={t('continue')} variant="outline" onPress={() => setDone(false)} style={{ marginTop: space.xl }} />
        </View>
      </Screen>
    );
  }

  const inputStyle = { textAlign: (rtl ? 'right' : 'left') as 'right' | 'left', fontFamily: rtl ? fonts.arabic : fonts.body };

  return (
    <Screen>
      <Txt v="label">{t('tabAsk')}</Txt>
      <Txt v="title" style={{ marginTop: 4 }}>
        {kind === 'need' ? t('askTitle') : t('janazahAsk')}
      </Txt>
      <Txt v="small" style={{ marginTop: space.sm }}>
        {t('askSub')}
      </Txt>

      <Row style={{ marginTop: space.lg }}>
        <Segment label={t('askTitle')} active={kind === 'need'} onPress={() => setKind('need')} />
        <Segment label={t('janazah')} active={kind === 'janazah'} onPress={() => setKind('janazah')} />
      </Row>

      <Card style={{ marginTop: space.lg }}>
        {kind === 'need' ? (
          <>
            <Txt v="label" style={{ marginBottom: space.sm }}>
              {t('category')}
            </Txt>
            <View style={[styles.wrap, { flexDirection: rtl ? 'row-reverse' : 'row' }]}>
              {CATEGORIES.map((c) => (
                <Chip key={c} label={cat(c)} active={category === c} onPress={() => setCategory(c)} />
              ))}
            </View>
          </>
        ) : (
          <>
            <Txt v="label" style={{ marginBottom: space.sm }}>
              {t('deceasedName')}
            </Txt>
            <TextInput
              value={deceased}
              onChangeText={setDeceased}
              maxLength={80}
              style={[styles.input, inputStyle]}
              placeholderTextColor={colors.textFaint}
              placeholder="—"
            />
          </>
        )}

        <Txt v="label" style={{ marginTop: space.lg, marginBottom: space.sm }}>
          {t('yourWords')}
        </Txt>
        <TextInput
          value={body}
          onChangeText={(v) => {
            setBody(v);
            if (error) setError(null);
          }}
          multiline
          maxLength={MAX_LEN + 20}
          placeholder={kind === 'need' ? t('placeholderNeed') : t('janazahPlaceholder')}
          placeholderTextColor={colors.textFaint}
          style={[styles.input, styles.area, inputStyle]}
          textAlignVertical="top"
        />
        <Row style={{ justifyContent: 'space-between', marginTop: 6 }}>
          <Txt v="small" style={{ color: liveIssue || error ? colors.danger : colors.textFaint, flex: 1 }}>
            {error ? t(error) : liveIssue ? t(liveIssue) : t('rules')}
          </Txt>
          <Txt v="small" style={{ color: body.length > MAX_LEN ? colors.danger : colors.textFaint }}>
            {body.length}/{MAX_LEN}
          </Txt>
        </Row>

        {prefs.profile.firstName ? (
          <>
            <Txt v="label" style={{ marginTop: space.lg, marginBottom: space.sm }}>
              {t('shareAs')}
            </Txt>
            <Row style={{ flexWrap: 'wrap' }}>
              <Chip label={`${t('shareByName')} · ${prefs.profile.firstName}`} active={byName} onPress={() => setByName(true)} />
              <Chip label={t('shareAnon')} active={!byName} onPress={() => setByName(false)} />
            </Row>
          </>
        ) : null}

        {kind === 'need' && (
          <Row style={{ justifyContent: 'space-between', marginTop: space.lg }}>
            <Row gap={10} style={{ flex: 1 }}>
              <Ionicons name="airplane-outline" size={18} color={colors.gold} />
              <Txt style={{ flex: 1, fontSize: 15 }}>{t('alsoPilgrims')}</Txt>
            </Row>
            <Switch
              value={pilgrims}
              onValueChange={setPilgrims}
              trackColor={{ true: colors.goldDeep, false: colors.surfaceRaised }}
              thumbColor={pilgrims ? colors.goldBright : colors.textMuted}
            />
          </Row>
        )}
      </Card>

      <GoldButton
        label={busy ? t('submitting') : t('submit')}
        onPress={submit}
        loading={busy}
        disabled={!body.trim() || !!liveIssue}
        style={{ marginTop: space.lg }}
      />
    </Screen>
  );
}

function Segment({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const { rtl } = useApp();
  return (
    <Pressable
      onPress={() => {
        haptic.select();
        onPress();
      }}
      style={[styles.segment, active && styles.segmentActive]}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
    >
      <Txt
        center
        style={{
          fontFamily: rtl ? fonts.arabicBold : fonts.bodySemi,
          fontSize: 14,
          color: active ? colors.bgDeep : colors.textMuted,
        }}
      >
        {label}
      </Txt>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flexWrap: 'wrap', gap: 8 },
  input: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: 'rgba(0,0,0,0.18)',
    color: colors.ivory,
    paddingHorizontal: space.md,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 52,
  },
  area: { minHeight: 140, lineHeight: 24 },
  segment: {
    flex: 1,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
  },
  segmentActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  helpBtn: {
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.gold,
  },
  doneIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(214,186,124,0.06)',
  },
});
