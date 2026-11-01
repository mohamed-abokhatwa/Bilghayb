import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { I18nManager } from 'react-native';
import { getLocales } from 'expo-localization';
import Constants from 'expo-constants';
import type { Api, Profile } from '../data/api';
import { DemoApi } from '../data/demoApi';
import { SupabaseApi } from '../data/supabaseApi';
import { RTL_LOCALES, categoryLabels, format, isLocale, strings, type Locale, type StringKey } from './i18n';
import type { Category } from './types';

const PREFS_KEY = 'bg.prefs.v1';

export interface Prefs {
  onboarded: boolean;
  profile: Profile;
  notifMorning: boolean;
  notifSpecial: boolean;
}

function createApi(): Api {
  const extra = (Constants.expoConfig?.extra ?? {}) as { supabaseUrl?: string; supabaseAnonKey?: string };
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL || extra.supabaseUrl;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || extra.supabaseAnonKey;
  return url && key ? new SupabaseApi(url, key) : new DemoApi();
}

// Use the phone's language when we support it, otherwise English.
const deviceLocale = (): Locale => {
  for (const l of getLocales()) if (isLocale(l.languageCode)) return l.languageCode;
  return 'en';
};

const defaults = (): Prefs => ({
  onboarded: false,
  profile: { firstName: null, gender: null, country: 'XX', locale: deviceLocale() },
  notifMorning: true,
  notifSpecial: true,
});

interface Ctx {
  ready: boolean;
  prefs: Prefs;
  api: Api;
  locale: Locale;
  rtl: boolean;
  t: (k: StringKey, vars?: Record<string, string | number>) => string;
  cat: (c: Category) => string;
  setPrefs: (p: Partial<Prefs>) => Promise<void>;
  setProfile: (p: Partial<Profile>) => Promise<void>;
  completeOnboarding: (p: Profile) => Promise<void>;
  reset: () => Promise<void>;
  /** Bumped whenever data changes so screens can refetch. */
  version: number;
  touch: () => void;
}

// Layout direction is handled by our own components (Row, Txt) so the language can
// switch instantly without a restart. Keep the native layer LTR to avoid double-flipping.
I18nManager.allowRTL(false);
I18nManager.forceRTL(false);

const AppContext = createContext<Ctx | null>(null);
const api = createApi();

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [prefs, setPrefsState] = useState<Prefs>(defaults);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(PREFS_KEY);
        if (raw) {
          const saved = { ...defaults(), ...JSON.parse(raw) } as Prefs;
          if (!isLocale(saved.profile.locale)) saved.profile.locale = 'en';
          setPrefsState(saved);
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  const persist = useCallback((next: Prefs) => {
    setPrefsState(next);
    AsyncStorage.setItem(PREFS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const setPrefs = useCallback(
    async (p: Partial<Prefs>) => persist({ ...prefs, ...p }),
    [prefs, persist],
  );

  const setProfile = useCallback(
    async (p: Partial<Profile>) => {
      persist({ ...prefs, profile: { ...prefs.profile, ...p } });
      api.updateProfile(p).catch(() => {});
    },
    [prefs, persist],
  );

  const completeOnboarding = useCallback(
    async (profile: Profile) => {
      await api.init(profile).catch(() => {});
      persist({ ...prefs, profile, onboarded: true });
    },
    [prefs, persist],
  );

  const reset = useCallback(async () => {
    await api.deleteAccount().catch(() => {});
    await AsyncStorage.removeItem(PREFS_KEY);
    setPrefsState(defaults());
  }, []);

  const locale = prefs.profile.locale;
  const rtl = RTL_LOCALES.includes(locale);

  const value = useMemo<Ctx>(
    () => ({
      ready,
      prefs,
      api,
      locale,
      rtl,
      t: (k, vars) => (vars ? format(strings[locale][k], vars) : strings[locale][k]),
      cat: (c) => categoryLabels[locale][c],
      setPrefs,
      setProfile,
      completeOnboarding,
      reset,
      version,
      touch: () => setVersion((v) => v + 1),
    }),
    [ready, prefs, locale, rtl, setPrefs, setProfile, completeOnboarding, reset, version],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const c = useContext(AppContext);
  if (!c) throw new Error('useApp outside AppProvider');
  return c;
}

/** Small data hook: loads on mount and whenever app data changes. */
export function useLoad<T>(fn: (api: Api) => Promise<T>) {
  const { api, version } = useApp();
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);
  const fnRef = useRef(fn);
  useEffect(() => {
    fnRef.current = fn;
  });

  useEffect(() => {
    let alive = true;
    fnRef
      .current(api)
      .then((d) => alive && (setData(d), setError(null)))
      .catch((e) => alive && setError(e))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [api, version, nonce]);

  const reload = useCallback(() => setNonce((n) => n + 1), []);
  return { data, error, loading, reload, setData };
}
