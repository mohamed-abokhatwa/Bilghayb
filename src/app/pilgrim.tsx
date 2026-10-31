import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BackHeader } from '../components/BackHeader';
import { Card, Chip, GoldButton, Loader, Ornament, Row, Screen, Txt, haptic } from '../components/ui';
import { NeedCard } from '../components/NeedCard';
import { colors, radius, space } from '../theme';
import { useApp, useLoad } from '../lib/store';

const addDays = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
};

const DEPART_OPTIONS = [0, 3, 7, 14, 30];
const LENGTH_OPTIONS = [5, 10, 14, 21];

export default function PilgrimScreen() {
  const { t, api, touch, locale } = useApp();
  const trip = useLoad((a) => a.activeTrip());
  const [kind, setKind] = useState<'umrah' | 'hajj'>('umrah');
  const [depart, setDepart] = useState(7);
  const [length, setLength] = useState(10);
  const [busy, setBusy] = useState(false);
  const [readDone, setReadDone] = useState(false);

  const start = async () => {
    setBusy(true);
    await api.startTrip(kind, addDays(depart), addDays(depart + length)).catch(() => {});
    haptic.success();
    setBusy(false);
    trip.reload();
  };

  const markRead = async () => {
    if (!trip.data) return;
    setBusy(true);
    await api.markTripRead(trip.data.id).catch(() => {});
    haptic.success();
    setBusy(false);
    setReadDone(true);
    touch();
  };

  const end = async () => {
    if (!trip.data) return;
    await api.endTrip(trip.data.id).catch(() => {});
    setReadDone(false);
    trip.reload();
  };

  const dayLabel = (n: number) => (n === 0 ? t('today') : t('daysFromNow', { n }));
  const fmt = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === 'ar' ? 'ar' : 'en', { day: 'numeric', month: 'short' });

  return (
    <Screen bottomInset>
      <BackHeader />
      <Txt v="label">{t('pilgrimMode')}</Txt>
      <Txt v="title" style={{ marginTop: 4 }}>
        {t('pilgrimTitle')}
      </Txt>
      <Txt v="arabic" style={{ marginTop: space.md }}>
        وَأَذِّن فِي النَّاسِ بِالْحَجِّ
      </Txt>
      <Txt v="small" style={{ marginTop: space.sm }}>
        {t('pilgrimIntro')}
      </Txt>
      <Ornament />

      {trip.loading && !trip.data ? (
        <Loader />
      ) : trip.data ? (
        <>
          <Card glow>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt v="label">{trip.data.kind === 'hajj' ? t('hajj') : t('umrah')}</Txt>
              <Txt v="small">
                {fmt(trip.data.startsOn)} → {fmt(trip.data.endsOn)}
              </Txt>
            </Row>
            <Txt v="number" center style={{ marginTop: space.lg, fontSize: 48, lineHeight: 56 }}>
              {trip.data.carrying.length}
            </Txt>
            <Txt v="heading" center>
              {t('carrying', { n: trip.data.carrying.length })}
            </Txt>
            <Txt v="small" center style={{ marginTop: 4 }}>
              {t('carryingSub')}
            </Txt>
            <GoldButton
              label={readDone ? t('duaMade') : t('readAll')}
              onPress={markRead}
              loading={busy}
              disabled={readDone}
              style={{ marginTop: space.lg }}
            />
          </Card>

          <View style={{ marginTop: space.lg }}>
            {trip.data.carrying.map((n) => (
              <NeedCard key={n.id} need={n} />
            ))}
          </View>

          <Pressable onPress={end} style={{ paddingVertical: space.lg }}>
            <Txt v="small" center style={{ color: colors.textMuted }}>
              {t('endTrip')}
            </Txt>
          </Pressable>
        </>
      ) : (
        <Card>
          <Row>
            {(['umrah', 'hajj'] as const).map((k) => (
              <Pressable
                key={k}
                onPress={() => {
                  haptic.select();
                  setKind(k);
                }}
                style={[styles.kind, kind === k && styles.kindActive]}
              >
                <Ionicons name={k === 'hajj' ? 'people-outline' : 'moon-outline'} size={22} color={kind === k ? colors.bgDeep : colors.gold} />
                <Txt center style={{ marginTop: 6, color: kind === k ? colors.bgDeep : colors.text }}>
                  {k === 'hajj' ? t('hajj') : t('umrah')}
                </Txt>
              </Pressable>
            ))}
          </Row>

          <Txt v="label" style={{ marginTop: space.lg, marginBottom: space.sm }}>
            {t('departs')}
          </Txt>
          <Row style={{ flexWrap: 'wrap' }}>
            {DEPART_OPTIONS.map((d) => (
              <Chip key={d} label={dayLabel(d)} active={depart === d} onPress={() => setDepart(d)} />
            ))}
          </Row>

          <Txt v="label" style={{ marginTop: space.lg, marginBottom: space.sm }}>
            {t('returns')}
          </Txt>
          <Row style={{ flexWrap: 'wrap' }}>
            {LENGTH_OPTIONS.map((l) => (
              <Chip key={l} label={fmt(addDays(depart + l))} active={length === l} onPress={() => setLength(l)} />
            ))}
          </Row>

          <GoldButton label={t('startCarrying')} onPress={start} loading={busy} style={{ marginTop: space.xl }} />
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kind: {
    flex: 1,
    paddingVertical: space.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
  },
  kindActive: { backgroundColor: colors.gold, borderColor: colors.gold },
});
