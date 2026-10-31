import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Api, Profile } from './api';
import type { Need, NewNeedInput, PilgrimTrip, ReportReason, Stats, SubmitResult, Today } from '../lib/types';
import { checkNeedText, checkShortText } from '../lib/moderation';

// Row shape of the needs_public view / RPC results.
interface NeedRow {
  id: string;
  kind: 'need' | 'janazah';
  first_name: string | null;
  gender: 'f' | 'm' | null;
  country: string;
  category: Need['category'];
  body: string;
  deceased_name: string | null;
  status?: 'open' | 'answered';
  answered_note?: string | null;
  answered_at?: string | null;
  prayed_count: number;
  created_at: string;
  is_mine?: boolean;
}

const NEED_COLS =
  'id, kind, first_name, gender, country, category, body, deceased_name, status, answered_note, answered_at, prayed_count, created_at, is_mine';

const toNeed = (r: NeedRow): Need => ({
  id: r.id,
  kind: r.kind,
  firstName: r.first_name,
  gender: r.gender,
  country: r.country,
  category: r.category,
  body: r.body,
  deceasedName: r.deceased_name,
  status: r.status ?? 'open',
  answeredNote: r.answered_note ?? null,
  answeredAt: r.answered_at ?? null,
  prayedCount: r.prayed_count,
  createdAt: r.created_at,
  isMine: r.is_mine ?? false,
});

export class SupabaseApi implements Api {
  readonly mode = 'live' as const;
  private sb: SupabaseClient;

  constructor(url: string, anonKey: string) {
    this.sb = createClient(url, anonKey, {
      auth: { storage: AsyncStorage, persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
    });
  }

  private async uid() {
    const { data } = await this.sb.auth.getSession();
    if (data.session) return data.session.user.id;
    const { data: signed, error } = await this.sb.auth.signInAnonymously();
    if (error || !signed.user) throw error ?? new Error('auth failed');
    return signed.user.id;
  }

  async init(p: Profile) {
    const id = await this.uid();
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
    const { error } = await this.sb.from('profiles').upsert({
      id,
      first_name: p.firstName,
      gender: p.gender,
      country: p.country,
      locale: p.locale,
      tz,
    });
    if (error) throw error;
  }

  async updateProfile(p: Partial<Profile> & { pushToken?: string | null; tz?: string }) {
    const id = await this.uid();
    const row: Record<string, unknown> = {};
    if (p.firstName !== undefined) row.first_name = p.firstName;
    if (p.gender !== undefined) row.gender = p.gender;
    if (p.country !== undefined) row.country = p.country;
    if (p.locale !== undefined) row.locale = p.locale;
    if (p.pushToken !== undefined) row.push_token = p.pushToken;
    if (p.tz !== undefined) row.tz = p.tz;
    if (Object.keys(row).length) await this.sb.from('profiles').update(row).eq('id', id);
  }

  async getToday(): Promise<Today> {
    await this.uid();
    const { data, error } = await this.sb.rpc('get_daily_person');
    if (error) throw error;
    const a = (data as { day: string; need_id: string | null; prayed: boolean }[])[0];
    if (!a?.need_id) return { day: a?.day ?? '', need: null, prayed: false };
    const { data: row } = await this.sb.from('needs_public').select(NEED_COLS).eq('id', a.need_id).single();
    return { day: a.day, need: row ? toNeed(row as NeedRow) : null, prayed: a.prayed };
  }

  async markPrayed(needId: string) {
    const { error } = await this.sb.rpc('mark_prayed', { p_need: needId });
    if (error) throw error;
  }

  async getStats(): Promise<Stats> {
    await this.uid();
    const { data, error } = await this.sb.rpc('my_stats');
    if (error) throw error;
    return data as Stats;
  }

  async submitNeed(input: NewNeedInput): Promise<SubmitResult> {
    const issue = checkNeedText(input.body);
    if (issue) return { ok: false, reason: issue };
    await this.uid();
    const { data, error } = await this.sb.functions.invoke('submit-need', { body: input });
    if (error || !data) return { ok: false, reason: 'network' };
    if (!data.ok) return { ok: false, reason: data.reason };
    return { ok: true, need: toNeed({ ...data.need, is_mine: true }) };
  }

  async myNeeds() {
    const id = await this.uid();
    const { data } = await this.sb
      .from('needs')
      .select('id, kind, first_name, gender, country, category, body, deceased_name, status, answered_note, answered_at, prayed_count, created_at')
      .eq('author_id', id)
      .order('created_at', { ascending: false })
      .limit(100);
    return ((data ?? []) as NeedRow[]).map((r) => toNeed({ ...r, is_mine: true }));
  }

  async markAnswered(needId: string, note: string | null) {
    if (note && checkShortText(note, 280)) throw new Error('contact');
    const { error } = await this.sb.rpc('mark_answered', { p_need: needId, p_note: note ?? '' });
    if (error) throw error;
  }

  async answeredWall(before?: string) {
    await this.uid();
    let q = this.sb
      .from('needs_public')
      .select(NEED_COLS)
      .eq('status', 'answered')
      .order('answered_at', { ascending: false })
      .limit(30);
    if (before) q = q.lt('answered_at', before);
    const { data } = await q;
    return ((data ?? []) as NeedRow[]).map(toNeed);
  }

  async janazahList() {
    await this.uid();
    const { data } = await this.sb.rpc('janazah_list');
    return ((data ?? []) as (NeedRow & { prayed_by_me: boolean })[]).map((r) => ({
      ...toNeed({ ...r, kind: 'janazah' }),
      prayedByMe: r.prayed_by_me,
    }));
  }

  async prayJanazah(needId: string) {
    await this.markPrayed(needId);
  }

  async activeTrip(): Promise<PilgrimTrip | null> {
    const id = await this.uid();
    const { data: t } = await this.sb
      .from('pilgrim_trips')
      .select('id, kind, starts_on, ends_on')
      .eq('user_id', id)
      .eq('ended', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!t) return null;
    const { data: carries } = await this.sb.from('pilgrim_carries').select('need_id').eq('trip_id', t.id);
    const ids = (carries ?? []).map((c: { need_id: string }) => c.need_id);
    const { data: rows } = ids.length
      ? await this.sb.from('needs_public').select(NEED_COLS).in('id', ids)
      : { data: [] };
    return {
      id: t.id,
      kind: t.kind,
      startsOn: t.starts_on,
      endsOn: t.ends_on,
      carrying: ((rows ?? []) as NeedRow[]).map(toNeed),
    };
  }

  async startTrip(kind: 'umrah' | 'hajj', startsOn: string, endsOn: string) {
    const { error } = await this.sb.rpc('start_trip', { p_kind: kind, p_starts: startsOn, p_ends: endsOn });
    if (error) throw error;
    return (await this.activeTrip())!;
  }

  async markTripRead(tripId: string) {
    await this.sb.rpc('mark_trip_read', { p_trip: tripId });
  }

  async endTrip(tripId: string) {
    await this.sb.rpc('end_trip', { p_trip: tripId });
  }

  async report(needId: string, reason: ReportReason) {
    await this.sb.rpc('report_need', { p_need: needId, p_reason: reason });
  }

  async deleteAccount() {
    await this.sb.rpc('delete_my_account');
    await this.sb.auth.signOut();
  }
}
