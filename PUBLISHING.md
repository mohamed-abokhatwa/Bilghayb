# Publishing Bil-Ghayb: step by step

The code, database, legal pages, store text and screenshots are ready. These are the steps that need **your** accounts. Do them in order. Total hands-on time is about 3–4 hours, spread over a few days while the stores verify you.

Commands run in a terminal on your computer (Mac, Windows or Linux), after you install Node.js 20+ and download this repository:

```bash
git clone https://github.com/mohamed-abokhatwa/Bilghayb.git
```

```bash
cd Bilghayb
```

```bash
npm install
```

---

## Step 1. Create the accounts (start today: verification takes days)

| Account | Cost | Link | Notes |
|---|---|---|---|
| Apple Developer Program | $99 / year | developer.apple.com/programs | Enrol as an individual. Verification takes 1–3 days. |
| Google Play Console | $25 once | play.google.com/console | Identity verification takes 1–3 days. |
| Expo (builds) | Free | expo.dev/signup | Builds the app in the cloud, so you don't need a Mac. |
| Supabase (database) | Free | supabase.com | Sign in with GitHub. |

New **personal** Google Play accounts must run a closed test with **12 testers for 14 days** before the app can go public. Start recruiting friends and family now (they need Android phones and a Gmail address).

---

## Step 2. Publish the legal pages (5 minutes)

The stores need public links to the privacy policy, terms and support page. They are already written in the `docs/` folder.

1. On GitHub, open the repository → **Settings → General → Danger Zone → Change visibility → Public**. GitHub Pages is free only for public repositories. There are no secrets in the code: the database key the app uses is designed to be public, and the database is protected by its security rules.
2. **Settings → Pages** → Source: **Deploy from a branch** → Branch: `main`, folder: `/docs` → **Save**.
3. After about a minute, check these open:
   - https://mohamed-abokhatwa.github.io/Bilghayb/
   - https://mohamed-abokhatwa.github.io/Bilghayb/privacy.html
   - https://mohamed-abokhatwa.github.io/Bilghayb/terms.html

If you prefer to keep the repository private, put the three pages on any free host (Netlify Drop, Google Sites) and change the links in `src/lib/links.ts` and `store/STORE_LISTING.md`.

---

## Step 3. Set up the database (30 minutes)

1. Supabase → **New project**. Name: `bilghayb`. Region: closest to most users (e.g. Frankfurt or Mumbai). Save the database password somewhere safe.
2. **Authentication → Sign In / Providers → Anonymous sign-ins → Enable.**
3. **SQL Editor → New query** → paste the whole of `supabase/migrations/0001_init.sql` → **Run**. It should finish with "Success".
4. Install the Supabase tool and link the project (the project ref is in Settings → General):
   ```bash
   npx supabase login
   ```
   ```bash
   npx supabase init
   ```
   (`init` only adds a settings file; answer **N** to the optional questions. It does not change the existing files.)
   ```bash
   npx supabase link --project-ref YOUR_PROJECT_REF
   ```
5. Deploy the two server functions:
   ```bash
   npx supabase functions deploy submit-need
   ```
   ```bash
   npx supabase functions deploy daily-push --no-verify-jwt
   ```
6. Set a random secret that protects the reminder job (any long random text):
   ```bash
   npx supabase secrets set CRON_SECRET=PUT-A-LONG-RANDOM-TEXT-HERE
   ```
   AI moderation is optional and off by default. To turn it on later: `npx supabase secrets set ANTHROPIC_API_KEY=...`
7. Open `supabase/migrations/0002_cron.sql`, replace `<PROJECT_REF>` and `<CRON_SECRET>`, then run it in the **SQL Editor**. This schedules the hourly reminders and the daily cleanup that keeps the database inside the free plan.
8. **Settings → API**: copy the **Project URL** and the **anon public** key. You need them in step 4.

---

## Step 4. Connect the app to Expo (15 minutes)

```bash
npx eas-cli@latest login
```

```bash
npx eas-cli@latest init
```

`init` writes your Expo project ID into `app.json` (needed for push notifications). Then store the database keys for the builds:

```bash
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_URL --value YOUR_PROJECT_URL --environment production --environment preview --visibility plaintext
```

```bash
npx eas-cli@latest env:create --name EXPO_PUBLIC_SUPABASE_ANON_KEY --value YOUR_ANON_KEY --environment production --environment preview --visibility plaintext
```

Store builds refuse to run without these keys and show a "Setup incomplete" screen instead of demo data, so you can't ship sample content by mistake.

---

## Step 5. Test on real phones (1–2 days)

Build a test version:

```bash
npx eas-cli@latest build --profile preview --platform android
```

Install the APK link it gives you on an Android phone. For iPhone, the simplest route is TestFlight (step 6 builds and uploads it).

Test with two phones (or a friend):
- [ ] Phone A posts a need → phone B receives it as "your person today" the next day (or after a fresh install)
- [ ] B holds the heart → A sees "prayed for you" go up
- [ ] Contact details and phone numbers are rejected
- [ ] Report and block from the ⋯ menu work
- [ ] Reminders arrive after Fajr (allow notifications when asked)
- [ ] Switch language, including Arabic and Urdu (right-to-left)
- [ ] Me → Delete my account & data works
- [ ] iPad (if you have one): the layout stays centred and readable

---

## Step 6. Submit to the App Store

1. Build and upload (Expo asks you to sign in to Apple and creates the certificates for you):
   ```bash
   npx eas-cli@latest build --profile production --platform ios
   ```
   ```bash
   npx eas-cli@latest submit --platform ios
   ```
2. App Store Connect → your app → **TestFlight**: install it on your iPhone and do a final check.
3. Fill in the listing from `store/STORE_LISTING.md`: name, subtitle, description, keywords, support and privacy URLs, category, age rating, **App Privacy** answers, and the **reviewer notes**.
4. Screenshots:
   - **iPhone 6.9"**: `store/screenshots/iphone-6.9/en/` (add `ar/` under the Arabic localization)
   - **iPad 13"**: `store/screenshots/ipad-13/en/` (required because the app supports iPad)
5. **Add for Review → Submit.** Review usually takes 1–3 days.

To add Arabic: App Store Connect → App Information → **Add language → Arabic**, then paste the Arabic text and the `ar/` screenshots.

---

## Step 7. Submit to Google Play

1. Play Console → **Create app** → name, default language, Free, App.
2. Build:
   ```bash
   npx eas-cli@latest build --profile production --platform android
   ```
3. The first upload must be manual: download the `.aab` file from the Expo build page and upload it to **Testing → Closed testing → Create release**. Later updates can use `npx eas-cli@latest submit --platform android` (it needs a Google service account key; see docs.expo.dev/submit/android).
4. **Grow → Store presence → Main store listing**: paste the text from `store/STORE_LISTING.md`. Upload `store/assets/feature-graphic.png` as the feature graphic, `store/assets/icon-512.png` as the app icon, and `store/screenshots/android-phone/en/` as phone screenshots. Add Arabic under **Manage translations**.
5. **Policy → App content**: privacy policy URL, ads (none), app access (no login needed), content rating questionnaire, target audience (13+), **Data safety** (answers in `STORE_LISTING.md`).
6. Closed test with 12 testers for 14 days, then **Apply for production access** and publish.

---

## After launch: moderation (5 minutes a day)

Apple requires you to act on reports within 24 hours. Once a day, open Supabase → **SQL Editor** and run:

```sql
select * from moderation_queue;
```

Then, for each reported need:

```sql
-- remove it
update needs set hidden = true where id = 'NEED-ID';
-- or restore it if the report was wrong
update needs set hidden = false, report_count = 0 where id = 'NEED-ID';
-- ban the author and delete everything they wrote
delete from auth.users where id = (select author_id from needs where id = 'NEED-ID');
```

Needs reported by 3 people are hidden automatically even before you look.

---

## Shipping updates later

Build and submit again (steps 6 and 7). The build number goes up automatically.

(Optional, later: Expo's over-the-air updates can push text and design fixes without store review. It needs one extra setup step, `npx expo install expo-updates` then `npx eas-cli@latest update:configure`, and a new store build before it works.)

Before every release:

```bash
npm test
```

```bash
npx tsc --noEmit
```

```bash
npx expo lint
```
