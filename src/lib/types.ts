export type Category =
  | 'health'
  | 'rizq'
  | 'marriage'
  | 'children'
  | 'exams'
  | 'grief'
  | 'guidance'
  | 'debt'
  | 'family'
  | 'other';

export const CATEGORIES: Category[] = [
  'health',
  'rizq',
  'marriage',
  'children',
  'exams',
  'grief',
  'guidance',
  'debt',
  'family',
  'other',
];

export type NeedKind = 'need' | 'janazah';

export interface Need {
  id: string;
  kind: NeedKind;
  firstName: string | null; // null = anonymous ("a sister" / "a brother")
  gender: 'f' | 'm' | null;
  country: string; // ISO-3166 alpha-2
  category: Category;
  body: string;
  deceasedName?: string | null;
  createdAt: string;
  prayedCount: number;
  status: 'open' | 'answered';
  answeredNote?: string | null;
  answeredAt?: string | null;
  isMine?: boolean;
}

export interface Today {
  day: string; // YYYY-MM-DD
  need: Need | null;
  prayed: boolean;
}

export interface Stats {
  prayedForMeWeek: number;
  prayedForMeTotal: number;
  countriesWeek: string[];
  myPrayersTotal: number;
  streak: number;
}

export interface PilgrimTrip {
  id: string;
  kind: 'umrah' | 'hajj';
  startsOn: string;
  endsOn: string;
  carrying: Need[];
}

export interface NewNeedInput {
  kind: NeedKind;
  firstName: string | null;
  gender: 'f' | 'm' | null;
  country: string;
  category: Category;
  body: string;
  deceasedName?: string | null;
  sendWithPilgrims: boolean;
}

export type SubmitResult =
  | { ok: true; need: Need }
  | { ok: false; reason: 'contact' | 'money' | 'link' | 'abuse' | 'too_short' | 'too_long' | 'rate' | 'network' };

export type ReportReason = 'spam' | 'money' | 'inappropriate' | 'personal_info' | 'other';
