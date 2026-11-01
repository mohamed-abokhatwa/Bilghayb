// Edge function: sends push reminders via the Expo Push API.
// Schedule hourly with pg_cron (see supabase/migrations/0002_cron.sql).
// Each run targets users whose local time is ~06:00 (morning person)
// or ~03:00 on any night / 16:00 on Fridays (special times).
import { createClient } from 'npm:@supabase/supabase-js@2';

const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
const CRON_SECRET = Deno.env.get('CRON_SECRET');

type Kind = 'morning' | 'night' | 'friday';
type Msg = { title: string; body: string };

// Reminder texts in every app language (keep in sync with src/lib/locales).
const copy: Record<string, Record<Kind, Msg>> = {
  en: {
    morning: { title: 'Your person today 🤍', body: 'Someone is waiting for your dua. Open to meet them.' },
    night: { title: 'The last third of the night', body: 'Our Lord descends and asks: who is calling upon Me?' },
    friday: { title: 'The last hour of Friday', body: 'An hour in which no dua is turned away.' },
  },
  ar: {
    morning: { title: 'صاحبك اليوم 🤍', body: 'أحدهم ينتظر دعاءك. افتح لتتعرّف على حاجته.' },
    night: { title: 'الثلث الأخير من الليل', body: 'ينزل ربنا فيقول: من يدعوني فأستجيب له؟' },
    friday: { title: 'آخر ساعة من الجمعة', body: 'ساعة لا يُرد فيها الدعاء.' },
  },
  ur: {
    morning: { title: 'آج آپ کا شخص 🤍', body: 'کوئی آپ کی دعا کا منتظر ہے۔ کھول کر دیکھیں۔' },
    night: { title: 'رات کا آخری تہائی', body: 'ہمارا رب نازل ہوتا ہے: کون ہے جو مجھ سے دعا کرے؟' },
    friday: { title: 'جمعہ کی آخری گھڑی', body: 'وہ گھڑی جس میں کوئی دعا رد نہیں ہوتی۔' },
  },
  fa: {
    morning: { title: 'فرد امروز شما 🤍', body: 'کسی منتظر دعای شماست. باز کنید و او را ببینید.' },
    night: { title: 'ثلث آخر شب', body: 'پروردگار ما فرود می‌آید: کیست که مرا بخواند؟' },
    friday: { title: 'ساعت پایانی جمعه', body: 'ساعتی که هیچ دعایی رد نمی‌شود.' },
  },
  tr: {
    morning: { title: 'Bugünkü kişin 🤍', body: 'Biri duanı bekliyor. Açıp tanış.' },
    night: { title: 'Gecenin son üçte biri', body: 'Rabbimiz iner ve sorar: Bana dua eden yok mu?' },
    friday: { title: 'Cumanın son saati', body: 'Hiçbir duanın geri çevrilmediği saat.' },
  },
  id: {
    morning: { title: 'Orangmu hari ini 🤍', body: 'Seseorang menunggu doamu. Buka untuk mengenalnya.' },
    night: { title: 'Sepertiga malam terakhir', body: 'Tuhan kita turun dan bertanya: siapa yang berdoa kepada-Ku?' },
    friday: { title: 'Saat terakhir hari Jumat', body: 'Waktu ketika tidak ada doa yang ditolak.' },
  },
  ms: {
    morning: { title: 'Insan anda hari ini 🤍', body: 'Seseorang menanti doa anda. Buka untuk mengenalinya.' },
    night: { title: 'Sepertiga malam terakhir', body: 'Tuhan kita turun dan bertanya: siapakah yang berdoa kepada-Ku?' },
    friday: { title: 'Saat terakhir hari Jumaat', body: 'Waktu ketika tiada doa yang ditolak.' },
  },
  bn: {
    morning: { title: 'আজ আপনার মানুষ 🤍', body: 'কেউ আপনার দোয়ার অপেক্ষায়। খুলে দেখুন।' },
    night: { title: 'রাতের শেষ তৃতীয়াংশ', body: 'আমাদের রব নেমে আসেন: কে আছে যে আমাকে ডাকবে?' },
    friday: { title: 'জুমার শেষ সময়', body: 'যে সময় কোনো দোয়া ফিরিয়ে দেওয়া হয় না।' },
  },
  fr: {
    morning: { title: 'Votre personne du jour 🤍', body: 'Quelqu’un attend votre dua. Ouvrez pour le découvrir.' },
    night: { title: 'Le dernier tiers de la nuit', body: 'Notre Seigneur descend et demande : qui M’invoque ?' },
    friday: { title: 'La dernière heure du vendredi', body: 'Une heure où aucune dua n’est rejetée.' },
  },
  de: {
    morning: { title: 'Dein Mensch für heute 🤍', body: 'Jemand wartet auf dein Bittgebet. Öffne, um ihn kennenzulernen.' },
    night: { title: 'Das letzte Drittel der Nacht', body: 'Unser Herr steigt herab und fragt: Wer ruft Mich an?' },
    friday: { title: 'Die letzte Stunde des Freitags', body: 'Eine Stunde, in der kein Gebet abgewiesen wird.' },
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
      const lang = copy[p.locale] ? p.locale : 'en';
      let kind: Kind | null = null;
      if (p.notif_morning && t.hour === 6) kind = 'morning';
      else if (p.notif_special && t.weekday === 'Fri' && t.hour === 17) kind = 'friday';
      else if (p.notif_special && t.hour === 3 && t.weekday !== 'Fri') kind = 'night';
      if (!kind) continue;
      messages.push({ to: p.push_token, sound: 'default', ...copy[lang][kind], data: { route: '/' } });
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
