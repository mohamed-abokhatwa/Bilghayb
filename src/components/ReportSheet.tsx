import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Sheet } from './Sheet';
import { Txt, haptic } from './ui';
import { colors, space } from '../theme';
import { useApp } from '../lib/store';
import type { ReportReason } from '../lib/types';

const REASONS: { r: ReportReason; k: 'reportSpam' | 'reportMoney' | 'reportInappropriate' | 'reportPersonal' | 'reportOther' }[] = [
  { r: 'spam', k: 'reportSpam' },
  { r: 'money', k: 'reportMoney' },
  { r: 'inappropriate', k: 'reportInappropriate' },
  { r: 'personal_info', k: 'reportPersonal' },
  { r: 'other', k: 'reportOther' },
];

export function ReportSheet({ needId, onClose }: { needId: string | null; onClose: () => void }) {
  const { t, api, touch } = useApp();
  const [sent, setSent] = useState<false | 'reported' | 'blocked'>(false);

  const send = async (r: ReportReason) => {
    if (!needId) return;
    haptic.medium();
    await api.report(needId, r).catch(() => {});
    setSent('reported');
    setTimeout(() => {
      setSent(false);
      onClose();
      touch();
    }, 1200);
  };

  const block = async () => {
    if (!needId) return;
    haptic.medium();
    await api.block(needId).catch(() => {});
    setSent('blocked');
    setTimeout(() => {
      setSent(false);
      onClose();
      touch();
    }, 1400);
  };

  return (
    <Sheet visible={!!needId} onClose={onClose} title={t('reportTitle')}>
      {sent ? (
        <Txt center style={{ paddingVertical: space.xl }}>
          {sent === 'blocked' ? t('blockedDone') : t('reported')}
        </Txt>
      ) : (
        <View>
          {REASONS.map(({ r, k }) => (
            <Pressable key={r} onPress={() => send(r)} style={styles.row} accessibilityRole="button">
              <Txt>{t(k)}</Txt>
            </Pressable>
          ))}
          <Pressable onPress={block} style={[styles.row, { borderBottomWidth: 0 }]} accessibilityRole="button">
            <Txt style={{ color: colors.danger }}>{t('blockPerson')}</Txt>
          </Pressable>
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
});
