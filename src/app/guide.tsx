import { BackHeader } from '../components/BackHeader';
import { HowSteps, RulesList } from '../components/Guide';
import { Card, Ornament, Screen, Txt } from '../components/ui';
import { space } from '../theme';
import { useApp } from '../lib/store';

/** "How Bil-Ghayb works": the same guide as onboarding, reachable any time from the Me tab. */
export default function GuideScreen() {
  const { t, locale } = useApp();
  return (
    <Screen>
      <BackHeader />
      <Txt v="label">{t('appName')}</Txt>
      <Txt v="title" style={{ marginTop: 4 }}>
        {t('howTitle')}
      </Txt>
      <Ornament />
      <Card glow>
        <Txt v="arabic">مَا مِنْ عَبْدٍ مُسْلِمٍ يَدْعُو لِأَخِيهِ بِظَهْرِ الْغَيْبِ إِلَّا قَالَ الْمَلَكُ: وَلَكَ بِمِثْلٍ</Txt>
        {locale !== 'ar' && (
          <Txt v="quote" center style={{ marginTop: space.sm, fontSize: 18, lineHeight: 27 }}>
            {t('ob1Body')}
          </Txt>
        )}
        <Txt v="small" center style={{ marginTop: space.sm }}>
          {t('ob1Source')}
        </Txt>
      </Card>
      <Card style={{ marginTop: space.lg }}>
        <HowSteps />
      </Card>
      <Txt v="heading" style={{ marginTop: space.xl, marginBottom: space.md }}>
        {t('ob3Title')}
      </Txt>
      <RulesList />
    </Screen>
  );
}
