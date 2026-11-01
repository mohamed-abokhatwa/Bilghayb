import { memo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card, Row, Txt, quoted } from './ui';
import { colors, radius, space } from '../theme';
import { useApp } from '../lib/store';
import { countryFlag, countryName } from '../lib/content';
import type { Need } from '../lib/types';
import { LangBar } from './LangBar';

export function personName(n: Pick<Need, 'firstName' | 'gender'>, t: ReturnType<typeof useApp>['t']) {
  if (n.firstName) return n.firstName;
  return n.gender === 'f' ? t('anonSister') : n.gender === 'm' ? t('anonBrother') : t('anonPerson');
}

export function timeAgo(iso: string, locale: string) {
  const s = Math.max(1, (Date.now() - new Date(iso).getTime()) / 1000);
  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
  ];
  try {
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
    for (const [u, sec] of units) if (s >= sec) return rtf.format(-Math.floor(s / sec), u);
    return rtf.format(0, 'minute');
  } catch {
    const h = Math.floor(s / 3600);
    return h >= 24 ? `${Math.floor(h / 24)}d` : `${h}h`;
  }
}

/** Compact need card used in lists (answered wall, my needs, janazah, pilgrim). */
export const NeedCard = memo(function NeedCard({
  need,
  footer,
  showAnswer,
  onReport,
}: {
  need: Need;
  footer?: React.ReactNode;
  showAnswer?: boolean;
  /** Shows a ⋯ menu to report or block (for other people's needs). */
  onReport?: (needId: string) => void;
}) {
  const { t, cat, locale } = useApp();
  return (
    <Card style={{ marginBottom: space.md }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Row gap={10} style={{ flex: 1, minWidth: 0 }}>
          <View style={styles.flag}>
            <Txt style={{ fontSize: 18, lineHeight: 22 }}>{countryFlag(need.country)}</Txt>
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt v="heading" numberOfLines={1} style={{ fontSize: 19, lineHeight: 24 }}>
              {need.kind === 'janazah' && need.deceasedName ? need.deceasedName : personName(need, t)}
            </Txt>
            <Txt v="small" numberOfLines={1}>
              {countryName(need.country, locale)} · {timeAgo(need.createdAt, locale)}
            </Txt>
          </View>
        </Row>
        <Row gap={8}>
          <View style={styles.tag}>
            <Txt v="label" style={{ fontSize: 10, letterSpacing: 1.2 }}>
              {cat(need.category)}
            </Txt>
          </View>
          {onReport && !need.isMine && (
            <Pressable hitSlop={12} onPress={() => onReport(need.id)} accessibilityRole="button" accessibilityLabel={t('report')}>
              <Ionicons name="ellipsis-horizontal" size={16} color={colors.textFaint} />
            </Pressable>
          )}
        </Row>
      </Row>
      <Txt auto style={{ marginTop: space.md }}>{need.body}</Txt>
      {!need.isMine && <LangBar text={need.answeredNote ? `${need.body}\n\n${need.answeredNote}` : need.body} lang={need.lang} />}
      {showAnswer && need.answeredNote ? (
        <View style={styles.answer}>
          <Txt v="label" style={{ marginBottom: 6 }}>
            {t('alhamdulillah')}
          </Txt>
          <Txt v="quote" auto style={{ fontSize: 19, lineHeight: 28 }}>
            {quoted(need.answeredNote)}
          </Txt>
        </View>
      ) : null}
      {footer ? <View style={{ marginTop: space.md }}>{footer}</View> : null}
    </Card>
  );
});

const styles = StyleSheet.create({
  flag: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.line,
  },
  answer: {
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.lineStrong,
  },
});
