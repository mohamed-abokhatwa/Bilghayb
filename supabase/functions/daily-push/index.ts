// Edge function: sends push reminders via the Expo Push API.
// Schedule hourly with pg_cron (see supabase/migrations/0002_cron.sql).
// Each run targets users whose local time is ~06:00 (morning person)
// or ~03:00 on any night / 16:00 on Fridays (special times).
import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const CRON_SECRET = Deno.env.get('CRON_SECRET');

const copy = {
  morning: {
    en: { title: 'Your person today 🤍', body: 'Someone is waiting for your dua. Open to meet them.' },
    ar: { title: 'صاحبك اليوم 🤍', body: 'أحدهم ينتظر دعاءك. افتح لتتعرّف على حاجته.' },
  },
  night: {
    en: { title: 'The last third of the night', body: 'Our Lord descends and asks: who is calling upon Me?' },
    ar: { title: 'الثلث الأخير من الليل', body: 'ينزل ربنا فيقول: من يدعوني فأستجيب له؟' },
  },
  friday: {
    en: { title: 'The last hour of Friday', body: 'An hour in which no dua is turned away.' },
    ar: { title: 'آخر ساعة من الجمعة', body: 'ساعة لا يُرد فيها الدعاء.' },
  },
  forYou: {
    en: { title: 'Someone prayed for you', body: 'A stranger just made dua for you. And for them the same.' },
    ar: { title: 'دعا لك أحدهم', body: 'غريبٌ دعا لك الآن. ولهم بمثل.' },
  },
};

function localParts(tz: string) {
  try {
    const f = new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', weekday: 'short', hour12: false });
    const p = Object.fromEntries(f.formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { hour: Number(p.hour) % 24, weekday: p.weekday as string };
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (CRON_SECRET && req.headers.get('x-cron-secret') !== CRON_SECRET) return new Response('forbidden', { status: 403 });

  const messages: object[] = [];
  let from = 0;
  const page = 1000;
  for (;;) {
    const { data, error } = await admin
      .from('profiles')
      .select('push_token, tz, locale, notif_morning, notif_special')
      .not('push_token', 'is', null)
      .range(from, from + page - 1);
    if (error || !data?.length) break;
    for (const p of data) {
      const t = localParts(p.tz);
      if (!t) continue;
      const lang = p.locale === 'ar' ? 'ar' : 'en';
      let kind: keyof typeof copy | null = null;
      if (p.notif_morning && t.hour === 6) kind = 'morning';
      else if (p.notif_special && t.weekday === 'Fri' && t.hour === 17) kind = 'friday';
      else if (p.notif_special && t.hour === 3 && t.weekday !== 'Fri') kind = 'night';
      if (!kind) continue;
      messages.push({ to: p.push_token, sound: 'default', ...copy[kind][lang], data: { route: '/' } });
    }
    if (data.length < page) break;
    from += page;
  }

  // Expo accepts up to 100 messages per request.
  for (let i = 0; i < messages.length; i += 100) {
    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(messages.slice(i, i + 100)),
    }).catch((e) => console.error('push failed', e));
  }
  return new Response(JSON.stringify({ sent: messages.length }), { headers: { 'Content-Type': 'application/json' } });
});
