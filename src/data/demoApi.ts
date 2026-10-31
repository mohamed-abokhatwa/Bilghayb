import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Api, Profile } from './api';
import { localDay } from './api';
import type { Need, NewNeedInput, PilgrimTrip, Stats, SubmitResult, Today } from '../lib/types';
import { checkNeedText, checkShortText, isValidName } from '../lib/moderation';
import { SEED_NEEDS } from './seed';

// Fully working offline backend so the app is usable before Supabase is set up.
// Data stays on the device.

const KEY = 'bg.demo.v1';

interface DemoState {
  profile: Profile | null;
  needs: Need[];
  prayedIds: string[];
  prayedDays: string[];
  assignments: Record<string, { needId: string | null; prayed: boolean }>;
  janazahPrayed: string[];
  trip: PilgrimTrip | null;
  hidden: string[];
  submissions: Record<string, number>;
  forMeLog: { at: string; country: string }[];
}

const empty = (): DemoState => ({
  profile: null,
  needs: SEED_NEEDS,
  prayedIds: [],
  prayedDays: [],
  assignments: {},
  janazahPrayed: [],
  trip: null,
  hidden: [],
  submissions: {},
  forMeLog: [],
});

const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export class DemoApi implements Api {
  readonly mode = 'demo' as const;
  private state: DemoState = empty();
  private loaded: Promise<void> | null = null;
  private saveTimer: ReturnType<typeof setTimeout> | null = null;

  private load() {
    if (!this.loaded) {
      this.loaded = (async () => {
        try {
          const raw = await AsyncStorage.getItem(KEY);
          if (raw) this.state = { ...empty(), ...JSON.parse(raw) };
        } catch {
          this.state = empty();
        }
      })();
    }
    return this.loaded;
  }

  private save() {
    if (this.saveTimer) clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(this.state)).catch(() => {});
    }, 150);
  }

  private visible(n: Need) {
    return !this.state.hidden.includes(n.id);
  }

  async init(profile: Profile) {
    await this.load();
    this.state.profile = profile;
    this.save();
  }

  async updateProfile(p: Partial<Profile>) {
    await this.load();
    if (this.state.profile) this.state.profile = { ...this.state.profile, ...p };
    this.save();
  }

  async getToday(): Promise<Today> {
    await this.load();
    const day = localDay();
    let a = this.state.assignments[day];
    if (!a) {
      // Prefer the least-prayed open need the user hasn't prayed for yet.
      const pool = this.state.needs
        .filter((n) => n.kind === 'need' && n.status === 'open' && !n.isMine && this.visible(n))
        .filter((n) => !this.state.prayedIds.includes(n.id))
        .sort((x, y) => x.prayedCount - y.prayedCount || (hash(day + x.id) % 7) - (hash(day + y.id) % 7));
      a = { needId: pool[0]?.id ?? null, prayed: false };
      this.state.assignments[day] = a;
      this.save();
    }
    const found = this.state.needs.find((n) => n.id === a!.needId);
    // Copy, and exclude the user's own prayer from "others".
    const need = found
      ? { ...found, prayedCount: Math.max(0, found.prayedCount - (a.prayed ? 1 : 0)) }
      : null;
    return { day, need, prayed: a.prayed };
  }

  async markPrayed(needId: string) {
    await this.load();
    const day = localDay();
    const n = this.state.needs.find((x) => x.id === needId);
    if (n && !this.state.prayedIds.includes(needId)) {
      n.prayedCount += 1;
      this.state.prayedIds.push(needId);
    }
    const a = this.state.assignments[day];
    if (a && a.needId === needId) a.prayed = true;
    if (!this.state.prayedDays.includes(day)) this.state.prayedDays.push(day);
    this.save();
  }

  async getStats(): Promise<Stats> {
    await this.load();
    // Simulate strangers praying for the user's own open needs.
    const mine = this.state.needs.filter((n) => n.isMine);
    const now = Date.now();
    const weekAgo = now - 7 * 864e5;
    const countries = ['ID', 'MY', 'PK', 'TR', 'GB', 'NG', 'MA', 'EG', 'SA', 'BD', 'US', 'FR'];
    for (const n of mine) {
      if (n.status !== 'open') continue;
      const ageH = (now - new Date(n.createdAt).getTime()) / 36e5;
      const target = Math.min(120, Math.floor(ageH * 1.6) + 3);
      while (n.prayedCount < target) {
        n.prayedCount += 1;
        this.state.forMeLog.push({
          at: new Date(now - Math.random() * Math.min(ageH, 168) * 36e5).toISOString(),
          country: countries[hash(n.id + n.prayedCount) % countries.length],
        });
      }
    }
    this.save();
    const week = this.state.forMeLog.filter((x) => new Date(x.at).getTime() > weekAgo);
    return {
      prayedForMeWeek: week.length,
      prayedForMeTotal: this.state.forMeLog.length,
      countriesWeek: [...new Set(week.map((x) => x.country))],
      myPrayersTotal: this.state.prayedIds.length + this.state.janazahPrayed.length,
      streak: computeStreak(this.state.prayedDays),
    };
  }

  async submitNeed(input: NewNeedInput): Promise<SubmitResult> {
    await this.load();
    const issue =
      checkNeedText(input.body) ??
      (input.firstName && !isValidName(input.firstName) ? 'contact' : null) ??
      (input.deceasedName && !isValidName(input.deceasedName) ? 'contact' : null);
    if (issue) return { ok: false, reason: issue };
    const day = localDay();
    const count = this.state.submissions[day] ?? 0;
    if (count >= 3) return { ok: false, reason: 'rate' };
    this.state.submissions[day] = count + 1;
    const need: Need = {
      id: uid(),
      kind: input.kind,
      firstName: input.firstName,
      gender: input.gender,
      country: input.country,
      category: input.category,
      body: input.body.trim(),
      deceasedName: input.deceasedName ?? null,
      createdAt: new Date().toISOString(),
      prayedCount: 0,
      status: 'open',
      isMine: true,
    };
    this.state.needs.unshift(need);
    if (input.sendWithPilgrims && this.state.trip) this.state.trip.carrying.unshift(need);
    this.save();
    return { ok: true, need };
  }

  async myNeeds() {
    await this.load();
    await this.getStats();
    return this.state.needs.filter((n) => n.isMine).map((n) => ({ ...n }));
  }

  async markAnswered(needId: string, note: string | null) {
    await this.load();
    if (note && checkShortText(note, 280)) throw new Error('contact');
    const n = this.state.needs.find((x) => x.id === needId && x.isMine);
    if (n) {
      n.status = 'answered';
      n.answeredNote = note?.trim() || null;
      n.answeredAt = new Date().toISOString();
    }
    this.save();
  }

  async answeredWall() {
    await this.load();
    return this.state.needs
      .filter((n) => n.status === 'answered' && this.visible(n))
      .sort((a, b) => (b.answeredAt ?? '').localeCompare(a.answeredAt ?? ''));
  }

  async janazahList() {
    await this.load();
    return this.state.needs
      .filter((n) => n.kind === 'janazah' && this.visible(n))
      .map((n) => ({ ...n, prayedByMe: this.state.janazahPrayed.includes(n.id) }));
  }

  async prayJanazah(needId: string) {
    await this.load();
    if (this.state.janazahPrayed.includes(needId)) return;
    this.state.janazahPrayed.push(needId);
    const n = this.state.needs.find((x) => x.id === needId);
    if (n) n.prayedCount += 1;
    const day = localDay();
    if (!this.state.prayedDays.includes(day)) this.state.prayedDays.push(day);
    this.save();
  }

  async activeTrip() {
    await this.load();
    return this.state.trip;
  }

  async startTrip(kind: 'umrah' | 'hajj', startsOn: string, endsOn: string) {
    await this.load();
    const carrying = this.state.needs
      .filter((n) => n.kind === 'need' && n.status === 'open' && !n.isMine && this.visible(n))
      .sort((a, b) => a.prayedCount - b.prayedCount)
      .slice(0, 40);
    this.state.trip = { id: uid(), kind, startsOn, endsOn, carrying };
    this.save();
    return this.state.trip;
  }

  async markTripRead() {
    await this.load();
    if (!this.state.trip) return;
    for (const c of this.state.trip.carrying) {
      const n = this.state.needs.find((x) => x.id === c.id);
      if (n && !this.state.prayedIds.includes(n.id)) {
        n.prayedCount += 1;
        this.state.prayedIds.push(n.id);
      }
    }
    const day = localDay();
    if (!this.state.prayedDays.includes(day)) this.state.prayedDays.push(day);
    this.save();
  }

  async endTrip() {
    await this.load();
    this.state.trip = null;
    this.save();
  }

  async report(needId: string) {
    await this.load();
    this.state.hidden.push(needId);
    const day = localDay();
    if (this.state.assignments[day]?.needId === needId) delete this.state.assignments[day];
    this.save();
  }

  async deleteAccount() {
    this.state = empty();
    await AsyncStorage.removeItem(KEY);
  }
}

export function computeStreak(days: string[]) {
  const set = new Set(days);
  let streak = 0;
  const d = new Date();
  // Today not done yet doesn't break the streak.
  if (!set.has(localDay(d))) d.setDate(d.getDate() - 1);
  while (set.has(localDay(d))) {
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}
