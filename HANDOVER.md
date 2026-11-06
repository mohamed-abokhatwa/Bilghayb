# Bil-Ghayb: handover

Everything a new conversation (or developer) needs to continue Bil-Ghayb. No secrets are in this file.

## 1. What it is

**Bil-Ghayb · بالغيب**: "Pray for a stranger. A stranger prays for you." A free mobile app (Android and iOS, Expo /
React Native) built on the hadith (Sahih Muslim 2733): each day you get one stranger and their need, you make dua for
them in secret, someone else does the same for you, and neither ever learns who the other was. No chat, no money, no ads.

- Repository: `github.com/mohamed-abokhatwa/bilghayb` (public; `main`)
- Package / bundle ID: **com.abokhatwa.bilghayb**
- Expo project: `@abokhatwa/bilghayb` (Expo account **abokhatwa**)
- Database: Supabase project **bilghayb**, ref `gbwauitktbtiwsmozvhr` (eu-west-1), with two Edge Functions
- Public pages (GitHub Pages from `docs/`): https://abokhatwa.com/Bilghayb/ (privacy, terms, support)
- Support e-mail: mohamed.abokhatwa@hotmail.com
- Commit identity: `git -c user.email=mohamed.abokhatwa@hotmail.com -c user.name="Mohamed"`
- Current version: **1.0.0** (Android build 3, `.aab` from commit 6b4d425; nothing in the app changed after it)

## 2. Features

| Feature | What it does |
|---|---|
| Your person today | One stranger a day (first name or "a sister / a brother", country, need); press and hold to confirm the dua |
| Ask for dua | Post a need in 10 categories, named or anonymous; phone numbers, links and money requests are blocked |
| Prayed for you | Weekly count and country flags; who prayed is never shown |
| Suggested dua | Authentic Quran / hadith dua matched to the need, with its reference |
| Answered wall | Mark a need answered with a thank-you note ("Alhamdulillah" stories) |
| Pilgrim Mode | People going for Umrah / Hajj carry up to 40 duas |
| Janazah | Ask for and give dua for the deceased |
| Reminders | After Fajr, last third of the night, Friday's last hour (on the phone, plus hourly server pushes) |
| Private streak | Only you see it; no leaderboards (to avoid showing off) |
| 10 languages | Arabic, English, Urdu, Indonesian, Turkish, Bengali, French, Malay, Persian, German; right-to-left for Arabic, Urdu, Persian |
| Guide | Onboarding: language → hadith → how it works → rules → profile; reopen from Me |
| Safety | Filters on the phone and server, optional AI moderation, 3 reports hide a need, report and block |
| Privacy | Anonymous sign-in; one tap deletes everything |

## 3. Backend

- `supabase/migrations/0001_init.sql`: tables `profiles, needs, assignments, prayers, pilgrim_trips, pilgrim_carries,
  pilgrim_queue, reports, blocks` with row-level security; functions for the daily person, prayers, streaks, answered,
  janazah, pilgrim trips, reports, blocks, account deletion and cleanup.
- `0002_cron.sql`: hourly reminder job and daily cleanup (needs the project ref and `CRON_SECRET`).
- Edge Functions (deployed): `submit-need` (validation, optional AI moderation with `ANTHROPIC_API_KEY`) and
  `daily-push` (reminders; protected by `CRON_SECRET`). Settings in `supabase/config.toml`.
- A filter fix made sure innocent words (عكس، انعكاس، زبون، skill) are not blocked.

## 4. Builds and stores

- EAS build: `npx eas-cli@latest build --platform android --profile production` (needs `EXPO_TOKEN`; versionCode is
  managed remotely). EAS env vars hold the Supabase URL and anon key; store builds refuse to run without them.
- GitHub workflow **iOS release** (EAS build + TestFlight; needs `EXPO_TOKEN` and Apple API-key secrets).
- Store text in both languages, Data safety, content rating (Teen / 12+, target audience 13+), screenshots:
  `store/STORE_LISTING.md`, `store/screenshots/` (android-phone, iphone-6.9, ipad-13).
- Full publishing guide: `PUBLISHING.md`.
- Google Play: new personal accounts need a **closed test with 12 testers for 14 days** before production.

## 5. Tests

`npx tsx tests/run.ts`: 53 checks (filters, duas, languages, scheduling). Also `npx tsc --noEmit` and `npx expo lint`.

## 6. Layout

```
src/app/        onboarding, guide, tabs (Today, Ask, Answered, Me), pilgrim, janazah
src/            data layer (Supabase + offline demo), i18n (10 languages), filters, notifications, theme
supabase/       migrations, functions (submit-need, daily-push), config.toml
docs/           public pages; store/ listing and screenshots
```

## 7. Open items

- Google Play: internal test → closed test (12 testers, 14 days) → production (see the overview file).
- iOS: Apple Developer account and secrets, then the iOS release workflow.
- Optional: turn on AI moderation (`ANTHROPIC_API_KEY` secret in Supabase).
