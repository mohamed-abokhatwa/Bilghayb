// SINGLE-FILE VERSION for the Supabase dashboard editor (Edge Functions → Deploy new function → Via editor).
// Generated from supabase/functions/submit-need + _shared. Edit those, then regenerate.
import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk@1';

// ── shared: moderation ──
// Fast on-device checks. The server repeats these (supabase/functions/submit-need
// and the SQL has_contact_info function), so this is only for instant feedback.

export type ModerationIssue = 'contact' | 'money' | 'link' | 'abuse' | 'too_short' | 'too_long';

export const MIN_LEN = 12;
export const MAX_LEN = 280;

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\s*(\.|dot|نقطة)\s*(com|net|org|io|me|ly|co|link|app|sa|eg|ae)\b)/i;

// Contact details of any kind are never allowed.
const CONTACT: RegExp[] = [
  /[^\s@]+@[^\s@]+\.[^\s@]+/, // email
  /[^\s]+\s*(\(at\)|\[at\]| at )\s*[^\s]+\s*(\.|dot)\s*[a-z]{2,}/i, // "name at gmail dot com"
  /(^|\s)@[\p{L}0-9_.]{2,}/u, // @handle
  /([0-9٠-٩۰-۹০-৯०-९][\s\-.()/]*){6,}/, // 6+ digits (Latin, Arabic-Indic, Persian, Bengali, Hindi), spaces/dashes allowed
  /\+\s*[0-9٠-٩۰-۹০-৯]{2,}/, // international prefix
  // messaging apps and social networks
  /(whats\s*app|wa\.me|watsap|telegram|t\.me|viber|snap\s*chat|snap\b|insta(gram)?\b|facebook|\bfb\b|messenger|tik\s*tok|twitter|\bx\.com|linkedin|discord|skype|wechat|line id)/i,
  /(واتس|واتساب|وتساب|تلغرام|تليجرام|تيليجرام|سناب|انستا|انستقرام|انستغرام|فيسبوك|فيس بوك|تويتر|تيك توك|ماسنجر)/,
  // asking to be contacted
  /(call me|text me|message me|dm me|contact me|reach me|my number|my phone|my email|my account|add me)/i,
  /(كلموني|كلمني|اتصلوا|اتصل بي|راسلوني|راسلني|تواصلوا|تواصل معي|رقمي|رقم جوالي|رقم هاتفي|ايميلي|بريدي|ضيفوني)/,
  // the same, in the other app languages
  /(میرا نمبر|میرے نمبر|رابطہ کریں|مجھ سے رابطہ|فون کریں|کال کریں|شماره من|شماره‌ام|با من تماس|تماس بگیرید|پیام بدهید)/, // Urdu, Persian
  /(numaram|numaramı|beni ara|bana ulaş|bana yaz|iletişime geç|hubungi saya|nomor saya|nomorku|nombor saya|telefon saya|chat saya|japri|\bwa\b|appelez[- ]moi|mon numéro|contactez[- ]moi|écrivez[- ]moi|ruf mich an|meine nummer|schreib mir|kontaktiere mich|meine handynummer)/i,
  /(আমার নম্বর|আমার নাম্বার|যোগাযোগ করুন|ফোন করুন|কল করুন|মেসেজ করুন)/, // Bengali
  // numbers written as words (e.g. "zero five five ..."), 5+ in a row
  /\b((zero|oh|one|two|three|four|five|six|seven|eight|nine)[\s,\-]+){4,}(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/i,
  /((صفر|واحد|اثنين|اثنان|ثلاثة|ثلاث|اربعة|أربعة|خمسة|ستة|سبعة|ثمانية|تسعة)[\s،,\-]+){4,}/,
  /\b((sıfır|bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|nol|kosong|satu|dua|tiga|empat|lima|enam|tujuh|delapan|lapan|sembilan|zéro|un|deux|trois|quatre|cinq|six|sept|huit|neuf|null|eins|zwei|drei|vier|fünf|sechs|sieben|acht|neun)[\s,\-]+){5,}/i,
];

const MONEY =
  /(paypal|western union|bank account|iban|venmo|cashapp|gofundme|donate|bitcoin|crypto|transfer money|send money|stc ?pay|easypaisa|jazzcash|bkash|bikash|nagad|gopay|papara|iban'?ım|kirim uang|transfer uang|virement|überweisung|spende|پیسے بھیجیں|پول بفرستید|টাকা পাঠান|تحويل|حساب بنكي|آيبان|ايبان|تبرع|ارسل(وا)? (لي )?(مال|فلوس))/i;
const ABUSE = /(kill|fuck|shit|bitch|كس|زب|شرموط)/i;

export function hasContactInfo(text: string): boolean {
  const t = text.normalize('NFKC');
  return CONTACT.some((r) => r.test(t)) || LINK.test(t);
}

export function checkNeedText(text: string): ModerationIssue | null {
  const t = text.trim().normalize('NFKC');
  if (t.length < MIN_LEN) return 'too_short';
  if (t.length > MAX_LEN) return 'too_long';
  if (LINK.test(t)) return 'link';
  if (CONTACT.some((r) => r.test(t))) return 'contact';
  if (MONEY.test(t)) return 'money';
  if (ABUSE.test(t)) return 'abuse';
  return null;
}

/** Short free-text fields (first name, deceased name, thank-you note). */
export function checkShortText(text: string, max: number): ModerationIssue | null {
  const t = text.trim().normalize('NFKC');
  if (t.length > max) return 'too_long';
  if (!t) return null;
  if (hasContactInfo(t)) return 'contact';
  if (MONEY.test(t)) return 'money';
  if (ABUSE.test(t)) return 'abuse';
  return null;
}

/** Names: letters, spaces, apostrophes and hyphens only — no digits or symbols. */
export function isValidName(text: string): boolean {
  const t = text.trim();
  return t === '' || (/^[\p{L}\p{M}' .\-]{1,80}$/u.test(t) && !hasContactInfo(t));
}

// Signs the writer may be thinking of harming themselves. These needs are still shared
// (they deserve dua most), but the writer is shown helpline resources right away.
const SELF_HARM = [
  /(suicid|kill myself|end my life|want to die|don'?t want to live|no reason to live|self[- ]?harm|hurt myself)/i,
  /(انتحار|انتحر|أنتحر|اقتل نفسي|أقتل نفسي|أنهي حياتي|انهي حياتي|أريد أن أموت|اريد ان اموت|لا أريد أن أعيش|لا اريد ان اعيش)/,
  /(خودکشی|خود کشی|مرنا چاہتا|مرنا چاہتی|جینا نہیں چاہتا|جینا نہیں چاہتی)/, // Urdu
  /(خودکشی|می‌خواهم بمیرم|میخواهم بمیرم|نمی‌خواهم زندگی کنم)/, // Persian
  /(intihar|kendimi öldür|ölmek istiyorum|yaşamak istemiyorum)/i,
  /(bunuh diri|ingin mati|mau mati|tidak ingin hidup|nak mati|membunuh diri)/i,
  /(আত্মহত্যা|মরে যেতে চাই|বাঁচতে চাই না)/,
  /(me suicider|me tuer|envie de mourir|veux mourir|plus envie de vivre)/i,
  /(selbstmord|suizid|mich umbringen|sterben will|nicht mehr leben)/i,
];

export function suggestsSelfHarm(text: string): boolean {
  const t = text.normalize('NFKC');
  return SELF_HARM.some((r) => r.test(t));
}

// ── shared: language detection ──
// No imports: this file is also copied to supabase/functions/_shared/ for the server.

const ARABIC_SCRIPT = /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/g;
const BENGALI_SCRIPT = /[ঀ-৿]/g;
const LATIN = /[A-Za-zÀ-ɏ]/g;
const URDU_ONLY = /[ٹڈڑںےۓھ]/; // letters used in Urdu but not Arabic
const PERSIAN_HINTS = /[پچژگ]|‌|ی/; // Persian letters / zero-width joiner
const LATIN_LOCALES = ['en', 'tr', 'id', 'ms', 'fr', 'de'];

/**
 * Which language a need is written in. The script decides first; within a script,
 * the author's app language breaks the tie (Latin text from a Turkish user = Turkish).
 */
export function detectLang<L extends string>(text: string, authorLocale: L): L | 'en' | 'ar' | 'ur' | 'fa' | 'bn' {
  const ar = text.match(ARABIC_SCRIPT)?.length ?? 0;
  const bn = text.match(BENGALI_SCRIPT)?.length ?? 0;
  const la = text.match(LATIN)?.length ?? 0;
  if (bn > ar && bn > la) return 'bn';
  if (ar > la) {
    if (authorLocale === 'ur' || URDU_ONLY.test(text)) return 'ur';
    if (authorLocale === 'fa' || (PERSIAN_HINTS.test(text) && !/[ة]/.test(text))) return 'fa';
    return 'ar';
  }
  return LATIN_LOCALES.includes(authorLocale) ? authorLocale : 'en';
}

// ── function ──
// Edge function: validates, moderates and stores a new need.
// Deploy: supabase functions deploy submit-need
// Secrets: supabase secrets set ANTHROPIC_API_KEY=... (optional MODERATION_MODEL)

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
const MODEL = Deno.env.get('MODERATION_MODEL') ?? 'claude-opus-5-5';
const anthropic = Deno.env.get('ANTHROPIC_API_KEY') ? new Anthropic() : null;

const CATEGORIES = ['health', 'rizq', 'marriage', 'children', 'exams', 'grief', 'guidance', 'debt', 'family', 'other'];
const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Same rules as the app (copied from src/lib/moderation.ts). Never trust the client.

function ruleCheck(text: string): string | null {
  return checkNeedText(text);
}

const SYSTEM = `You moderate short prayer (dua) requests for a Muslim app where strangers pray for each other anonymously.
ALLOW: sincere requests about health, family, work, studies, grief, faith, marriage, debt relief, the deceased. Sad or heavy topics are fine.
BLOCK: any contact details or ways to reach the writer (phone numbers in any form including spelled out, emails, usernames, messaging apps, social media, "contact me"); requests for money; advertising; hate, insults, sexual content; mocking religion; personal data that identifies someone (full name + location, addresses, IDs); requests to curse or harm someone.
If the message suggests the writer may harm themselves, reply SELF_HARM (it will still be shown, with support resources).
Reply with exactly one word: ALLOW, BLOCK, or SELF_HARM.`;

async function aiCheck(text: string): Promise<'ALLOW' | 'BLOCK' | 'SELF_HARM'> {
  if (!anthropic) return 'ALLOW';
  try {
    const res = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 2000,
      output_config: { effort: 'low' },
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system: SYSTEM,
      messages: [{ role: 'user', content: `<request>${text}</request>` }],
    } as never);
    // deno-lint-ignore no-explicit-any
    const r = res as any;
    if (r.stop_reason === 'refusal') return 'BLOCK';
    const out = (r.content ?? [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('')
      .trim()
      .toUpperCase();
    if (out.startsWith('BLOCK')) return 'BLOCK';
    if (out.startsWith('SELF_HARM')) return 'SELF_HARM';
    return 'ALLOW';
  } catch (e) {
    // Rules already passed and community reports remain as a backstop.
    console.error('moderation unavailable', e);
    return 'ALLOW';
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ ok: false, reason: 'method' }, 405);

  // Identify the caller from their JWT.
  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } },
  });
  const { data: auth } = await userClient.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return json({ ok: false, reason: 'auth' }, 401);

  const body = await req.json().catch(() => null);
  if (!body || typeof body.body !== 'string') return json({ ok: false, reason: 'too_short' }, 400);

  const kind = body.kind === 'janazah' ? 'janazah' : 'need';
  const category = CATEGORIES.includes(body.category) ? body.category : 'other';
  const text = String(body.body).trim();
  const firstName = typeof body.firstName === 'string' ? body.firstName.trim().slice(0, 40) || null : null;
  const deceased = kind === 'janazah' && typeof body.deceasedName === 'string' ? body.deceasedName.trim().slice(0, 80) : null;

  const rule =
    ruleCheck(text) ??
    (firstName && !isValidName(firstName) ? 'contact' : null) ??
    (deceased && !isValidName(deceased) ? 'contact' : null);
  if (rule) return json({ ok: false, reason: rule });

  const admin = createClient(SUPABASE_URL, SERVICE_KEY);

  // 3 needs per user per day.
  const since = new Date(Date.now() - 864e5).toISOString();
  const { count } = await admin
    .from('needs')
    .select('id', { count: 'exact', head: true })
    .eq('author_id', uid)
    .gte('created_at', since);
  if ((count ?? 0) >= 3) return json({ ok: false, reason: 'rate' });

  const verdict = await aiCheck(`${deceased ? `Deceased: ${deceased}\n` : ''}${text}`);
  if (verdict === 'BLOCK') return json({ ok: false, reason: 'abuse' });

  const { data: profile } = await admin.from('profiles').select('country, gender, locale').eq('id', uid).single();

  const { data: need, error } = await admin
    .from('needs')
    .insert({
      author_id: uid,
      kind,
      first_name: firstName,
      gender: profile?.gender ?? null,
      country: profile?.country ?? 'XX',
      category,
      body: text,
      lang: detectLang(text, profile?.locale ?? 'en'),
      deceased_name: deceased,
    })
    .select('id, kind, first_name, gender, country, category, body, lang, deceased_name, status, prayed_count, created_at')
    .single();
  if (error || !need) return json({ ok: false, reason: 'network' }, 500);

  if (body.sendWithPilgrims) await admin.from('pilgrim_queue').insert({ need_id: need.id });

  return json({ ok: true, need, selfHarm: verdict === 'SELF_HARM' || suggestsSelfHarm(text) });
});
