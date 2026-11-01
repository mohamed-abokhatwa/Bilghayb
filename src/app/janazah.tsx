import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BackHeader } from '../components/BackHeader';
import { Card, GoldButton, Loader, Ornament, Row, Screen, Txt, haptic } from '../components/ui';
import { NeedCard } from '../components/NeedCard';
import { colors, radius, space } from '../theme';
import { useApp, useLoad } from '../lib/store';

export default function JanazahScreen() {
  const { t, api, locale } = useApp();
  const list = useLoad((a) => a.janazahList());
  const [prayedNow, setPrayedNow] = useState<Record<string, true>>({});

  const pray = async (id: string) => {
    haptic.success();
    setPrayedNow((p) => ({ ...p, [id]: true }));
    await api.prayJanazah(id).catch(() => {});
  };

  return (
    <Screen>
      <BackHeader />
      <Txt v="label">{t('janazah')}</Txt>
      <Txt v="title" style={{ marginTop: 4 }}>
        {t('janazahTitle')}
      </Txt>
      <Txt v="arabic" style={{ marginTop: space.md }}>
        إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ
      </Txt>
      <Txt v="small" center>
        {t('janazahIntro')}
      </Txt>
      <Ornament />

      <Card style={{ marginBottom: space.lg }}>
        <Txt v="label" center>
          {t('suggestedDua')}
        </Txt>
        <Txt v="arabic" style={{ marginTop: space.sm }}>
          {t('janazahDuaAr')}
        </Txt>
        {locale !== 'ar' && (
          <Txt v="small" center style={{ fontStyle: 'italic' }}>
            {t('janazahDua')}
          </Txt>
        )}
      </Card>

      {list.loading && !list.data ? (
        <Loader />
      ) : (
        (list.data ?? []).map((n) => {
          const done = n.prayedByMe || !!prayedNow[n.id];
          const count = n.prayedCount + (prayedNow[n.id] && !n.prayedByMe ? 1 : 0);
          return (
            <NeedCard
              key={n.id}
              need={n}
              footer={
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt v="small" style={{ color: colors.gold }}>
                    {t('prayedJanazah', { n: count })}
                  </Txt>
                  <Pressable
                    disabled={done}
                    onPress={() => pray(n.id)}
                    style={[styles.btn, done && styles.btnDone]}
                    accessibilityRole="button"
                  >
                    <Row gap={6}>
                      <Ionicons name={done ? 'checkmark' : 'hand-left-outline'} size={14} color={done ? colors.bgDeep : colors.gold} />
                      <Txt v="small" style={{ color: done ? colors.bgDeep : colors.goldBright }}>
                        {done ? t('duaMade') : t('prayJanazah')}
                      </Txt>
                    </Row>
                  </Pressable>
                </Row>
              }
            />
          );
        })
      )}

      <GoldButton label={t('janazahAsk')} variant="outline" onPress={() => router.navigate('/(tabs)/ask')} style={{ marginTop: space.md }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  btn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.lineStrong },
  btnDone: { backgroundColor: colors.gold, borderColor: colors.gold },
});
