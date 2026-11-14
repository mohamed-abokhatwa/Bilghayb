import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Card, GoldButton, Ornament, Row, Txt } from '../components/ui';
import { ExternalLink } from '../components/ExternalLink';
import { colors, column, gradients, space } from '../theme';
import { useApp } from '../lib/store';
import { LINKS, SUPPORT_EMAIL } from '../lib/links';

/** Shown once to people who joined before the Terms had to be accepted explicitly. */
export default function AcceptTerms() {
  const { t, rtl, acceptTerms } = useApp();
  const insets = useSafeAreaInsets();
  const [agreed, setAgreed] = useState(false);

  const accept = async () => {
    await acceptTerms();
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.fill}>
      <LinearGradient colors={gradients.screen} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={[{ paddingTop: insets.top + space.xl, paddingHorizontal: space.lg, paddingBottom: space.lg }, column]}>
        <Txt v="label">{t('terms')}</Txt>
        <Txt v="heading" style={{ marginTop: space.sm }}>{t('termsGateTitle')}</Txt>
        <Ornament />
        <Card>
          <Txt>{t('termsGateBody')}</Txt>
          <Txt v="small" style={{ marginTop: space.md }}>{t('supportBody')} {SUPPORT_EMAIL}</Txt>
          <Row gap={space.md} style={{ marginTop: space.md }}>
            <ExternalLink href={LINKS.terms} label={t('terms')}>
              <Txt v="small" style={{ color: colors.gold, textDecorationLine: 'underline' }}>{t('terms')}</Txt>
            </ExternalLink>
            <ExternalLink href={LINKS.privacy} label={t('privacyPolicy')}>
              <Txt v="small" style={{ color: colors.gold, textDecorationLine: 'underline' }}>{t('privacyPolicy')}</Txt>
            </ExternalLink>
          </Row>
        </Card>
      </ScrollView>
      <View style={[{ padding: space.lg, paddingBottom: insets.bottom + space.lg }, column]}>
        <Pressable
          onPress={() => setAgreed(!agreed)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          style={{ flexDirection: rtl ? 'row-reverse' : 'row', alignItems: 'flex-start', gap: 10, marginBottom: space.md }}
        >
          <Ionicons name={agreed ? 'checkbox' : 'square-outline'} size={22} color={colors.gold} />
          <Txt v="small" style={{ flex: 1, fontSize: 12, lineHeight: 18 }}>{t('iAgreeTerms')}</Txt>
        </Pressable>
        <GoldButton label={t('acceptContinue')} onPress={accept} disabled={!agreed} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({ fill: { flex: 1, backgroundColor: colors.bg } });
