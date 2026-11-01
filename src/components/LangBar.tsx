import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Row, Txt, haptic } from './ui';
import { colors, fonts, radius, space } from '../theme';
import { useApp } from '../lib/store';
import { languageName, translateUrl } from '../lib/language';

/**
 * Shown when a need is written in another language than the reader's:
 * a "Written in …" tag and a free Translate button (Google Translate).
 */
export function LangBar({ text, lang, showNote }: { text: string; lang: string; showNote?: boolean }) {
  const { t, locale, rtl } = useApp();
  if (!lang || lang === locale) return null;
  const url = translateUrl(text, locale);
  const label = (
    <Row gap={6} style={styles.btn}>
      <Ionicons name="language-outline" size={15} color={colors.goldBright} />
      <Text style={[styles.btnText, { fontFamily: rtl ? fonts.arabicBold : fonts.bodySemi }]}>{t('translate')}</Text>
    </Row>
  );

  return (
    <View style={{ marginTop: space.md }}>
      <Row style={{ justifyContent: 'space-between', flexWrap: 'wrap' }} gap={space.sm}>
        <View style={styles.tag}>
          <Txt v="small" style={{ fontSize: 12, lineHeight: 16 }}>
            {t('writtenIn', { lang: languageName(lang, locale) })}
          </Txt>
        </View>
        {Platform.OS === 'web' ? (
          // A real link: the web preview blocks pop-up windows but allows links.
          <Text
            accessibilityRole="link"
            {...({ href: url, hrefAttrs: { target: '_blank', rel: 'noopener noreferrer' } } as object)}
          >
            {label}
          </Text>
        ) : (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('translate')}
            onPress={() => {
              haptic.light();
              WebBrowser.openBrowserAsync(url, {
                toolbarColor: colors.bg,
                controlsColor: colors.gold,
                presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
              }).catch(() => {});
            }}
          >
            {label}
          </Pressable>
        )}
      </Row>
      {showNote && (
        <View style={styles.note}>
          <Txt v="small" center>
            {t('foreignNote')}
          </Txt>
          <Txt v="arabic" style={{ fontSize: 20, lineHeight: 34, marginTop: 4 }}>
            اللَّهُمَّ أَعْطِهِ سُؤْلَهُ وَاقْضِ حَاجَتَهُ
          </Txt>
          {locale !== 'ar' && (
            <Txt v="small" center style={{ fontStyle: 'italic', fontSize: 12 }}>
              O Allah, grant them what they ask and fulfil their need.
            </Txt>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  btn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
  },
  btnText: { color: colors.goldBright, fontSize: 13 },
  note: {
    marginTop: space.md,
    paddingTop: space.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.line,
  },
});
