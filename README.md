# Bil-Ghayb · بالغيب

**Pray for a stranger. A stranger prays for you.**

A free iOS and Android app built on the hadith:

> "No Muslim servant supplicates for his brother in his absence except that the angel says: *'And for you the same.'*" (Sahih Muslim 2733)

Each morning you get one stranger and their need. You pray for them, someone else prays for you, and neither of you ever learns who the other was. There is no chat, no money and no ads.

## Features

| Feature | What it does |
|---|---|
| **Your person today** | One stranger per day (first name or "a sister / a brother", country, need). You press and hold to confirm you made dua. |
| **Ask for dua** | Post a need in 10 categories, by first name or anonymously. Phone numbers, links and money requests are blocked. |
| **Prayed for you** | Weekly count plus country flags. Who prayed is never shown. |
| **Suggested dua** | An authentic Quran or hadith dua matched to the need, with its reference. |
| **Answered wall** | Mark a need as answered with a note of thanks. Everyone sees "Alhamdulillah" stories. |
| **Pilgrim Mode** | People going for Umrah or Hajj carry up to 40 duas (people who asked first, then the least-prayed needs). |
| **Janazah** | Request and give dua for the deceased. |
| **Reminders** | After Fajr, the last third of the night, and Friday's last hour. Works on the device, plus server pushes in live mode. |
| **Private streak** | A streak only you can see. There are no leaderboards, to avoid showing off (riya). |
| **English + Arabic** | Full right-to-left layout and Amiri font for Arabic. Language switches instantly with no restart. |
| **Safety** | On-device rules, server rules, AI moderation, and 3 community reports auto-hide a need. |
| **Privacy** | Anonymous sign-in with no email or phone. One tap deletes everything. |

## Run it now (demo mode)

With no backend configured, the app runs fully on the device with sample data.

```bash
npm install
npx expo start
```

Scan the QR code with a development build, or press `w` for web. The app uses native modules such as notifications and haptics, so for the full experience build a dev client:

```bash
npx eas-cli@latest build --profile development --platform android   # or ios
```

## Go live (Supabase backend, free tier is enough to start)

1. Create a project at supabase.com.
2. **Auth → Providers:** enable **Anonymous sign-ins**.
3. Run the schema:
   ```bash
   npx supabase link --project-ref <ref>
   npx supabase db push        # applies supabase/migrations/0001_init.sql
   ```
4. Deploy the functions and set secrets:
   ```bash
   npx supabase functions deploy submit-need
   npx supabase functions deploy daily-push --no-verify-jwt
   npx supabase secrets set ANTHROPIC_API_KEY=sk-ant-...   # optional: AI moderation
   npx supabase secrets set CRON_SECRET=<random-string>
   ```
5. Edit `supabase/migrations/0002_cron.sql` (project ref + secret) and run it in the SQL editor. This sends the hourly reminders.
6. Copy `.env.example` to `.env` and fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY`.
7. Run `npx eas-cli@latest init` to get an EAS project ID for push notifications, then put it in `app.json → extra.eas.projectId`.

The app detects the keys and switches from demo to live automatically. The version label in the Me tab shows which mode it's in.

## Publish to the stores

```bash
npx eas-cli@latest build --profile production --platform all
npx eas-cli@latest submit --platform ios
npx eas-cli@latest submit --platform android
```

Before you submit:
- Change `ios.bundleIdentifier` and `android.package` in `app.json` (currently `app.bilghayb`).
- Add a privacy policy URL in both store listings. The app collects only a first name (optional), country and the needs people write.
- Apple requires apps with user content to offer reporting and blocking (done: the ⋯ menu on each need) and to state a moderation policy.

## Architecture

```
src/
  app/                 Expo Router screens
    (tabs)/            Today · Ask · Answered · Me
    onboarding.tsx     Hadith intro + optional name/country
    pilgrim.tsx        Pilgrim Mode
    janazah.tsx        Janazah requests
  components/          UI kit (Card, GoldButton, Txt, Sheet…), PrayButton, NeedCard
  data/
    api.ts             One interface for both backends
    demoApi.ts         Offline backend (AsyncStorage)
    supabaseApi.ts     Live backend
  lib/                 i18n, store, moderation rules, notifications, duas content
  theme.ts             Colors, fonts, spacing
supabase/
  migrations/          Tables, row-level security, all server logic (RPCs)
  functions/           submit-need (moderation), daily-push (reminders)
```

**Why it stays fast and reliable**
- No heavy UI libraries. Animations use React Native's built-in native driver. Lists are virtualized.
- Server logic runs inside Postgres functions, with one round trip per action.
- Who-prayed-for-whom rows never leave the database. Clients only get counts and country codes.
- Every write goes through security-definer functions or an edge function. Row-level security blocks everything else.
- Screens that crash show a friendly retry screen instead of a blank page.
- Demo mode means the app never shows an empty screen while you set up the backend.

## Checks

```bash
npx tsc --noEmit     # types
npx expo lint        # lint
npx expo-doctor      # config + dependencies
```

All three pass.
