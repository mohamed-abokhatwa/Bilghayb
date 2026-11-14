import { Redirect } from 'expo-router';
import { useApp } from '../lib/store';

export default function Index() {
  const { prefs } = useApp();
  if (!prefs.onboarded) return <Redirect href="/onboarding" />;
  return <Redirect href={prefs.termsAccepted ? '/(tabs)' : '/accept-terms'} />;
}
