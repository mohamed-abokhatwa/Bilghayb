// Edge function: validates, moderates and stores a new need.
// Deploy: supabase functions deploy submit-need
// Secrets: supabase secrets set ANTHROPIC_API_KEY=... (optional MODERATION_MODEL)
import { createClient } from 'npm:@supabase/supabase-js@2';
import Anthropic from 'npm:@anthropic-ai/sdk';

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
import { checkNeedText, isValidName } from '../_shared/moderation.ts';
import { detectLang } from '../_shared/language.ts';

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

  return json({ ok: true, need, selfHarm: verdict === 'SELF_HARM' });
});
