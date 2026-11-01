import type { Locale } from '../lib/i18n';
import type {
  Need,
  NewNeedInput,
  PilgrimTrip,
  ReportReason,
  Stats,
  SubmitResult,
  Today,
} from '../lib/types';

export interface Profile {
  firstName: string | null;
  gender: 'f' | 'm' | null;
  country: string;
  locale: Locale;
}

export interface Api {
  readonly mode: 'demo' | 'live';
  init(profile: Profile): Promise<void>;
  updateProfile(profile: Partial<Profile> & { pushToken?: string | null; tz?: string }): Promise<void>;

  getToday(): Promise<Today>;
  markPrayed(needId: string): Promise<void>;
  getStats(): Promise<Stats>;

  submitNeed(input: NewNeedInput): Promise<SubmitResult>;
  myNeeds(): Promise<Need[]>;
  markAnswered(needId: string, note: string | null): Promise<void>;

  answeredWall(before?: string): Promise<Need[]>;

  janazahList(): Promise<(Need & { prayedByMe: boolean })[]>;
  prayJanazah(needId: string): Promise<void>;

  activeTrip(): Promise<PilgrimTrip | null>;
  startTrip(kind: 'umrah' | 'hajj', startsOn: string, endsOn: string): Promise<PilgrimTrip>;
  markTripRead(tripId: string): Promise<void>;
  endTrip(tripId: string): Promise<void>;

  report(needId: string, reason: ReportReason): Promise<void>;
  /** Hide everything from the author of this need (they are never revealed). */
  block(needId: string): Promise<void>;
  deleteAccount(): Promise<void>;
}

export function localDay(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
