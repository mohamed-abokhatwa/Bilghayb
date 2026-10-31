import { useCallback } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, Loader, Ornament, Row, Txt } from '../../components/ui';
import { NeedCard } from '../../components/NeedCard';
import { colors, gradients, space } from '../../theme';
import { useApp, useLoad } from '../../lib/store';
import type { Need } from '../../lib/types';

export default function AnsweredScreen() {
  const { t, touch } = useApp();
  const insets = useSafeAreaInsets();
  const { data, loading } = useLoad((a) => a.answeredWall());

  const renderItem = useCallback(
    ({ item }: { item: Need }) => (
      <NeedCard
        need={item}
        showAnswer
        footer={
          <Row gap={6}>
            <Ionicons name="heart" size={13} color={colors.gold} />
            <Txt v="small" style={{ color: colors.gold }}>
              {t('prayedTimes', { n: item.prayedCount })}
            </Txt>
          </Row>
        }
      />
    ),
    [t],
  );

  return (
    <View style={styles.fill}>
      <LinearGradient colors={gradients.screen} style={StyleSheet.absoluteFill} />
      <FlatList
        data={data ?? []}
        keyExtractor={(n) => n.id}
        renderItem={renderItem}
        initialNumToRender={6}
        windowSize={7}
        removeClippedSubviews
        contentContainerStyle={{ paddingTop: insets.top + space.md, paddingBottom: insets.bottom + 130, paddingHorizontal: space.lg }}
        refreshControl={<RefreshControl tintColor={colors.gold} refreshing={false} onRefresh={touch} />}
        ListHeaderComponent={
          <View style={{ marginBottom: space.md }}>
            <Txt v="label">{t('tabAnswered')}</Txt>
            <Txt v="arabic" style={{ fontSize: 38, lineHeight: 64, textAlign: 'auto', marginTop: space.sm }}>
              الْحَمْدُ لِلَّهِ
            </Txt>
            <Txt v="small" center>
              {t('answeredSub')}
            </Txt>
            <Ornament />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <Loader />
          ) : (
            <Card>
              <Txt center v="small">
                {t('emptyAnswered')}
              </Txt>
            </Card>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: colors.bg } });
