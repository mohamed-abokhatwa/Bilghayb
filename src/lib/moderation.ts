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
  /([0-9٠-٩۰-۹][\s\-.()/]*){6,}/, // 6+ digits (Latin, Arabic-Indic, Persian), spaces/dashes allowed
  /\+\s*[0-9٠-٩]{2,}/, // international prefix
  // messaging apps and social networks
  /(whats\s*app|wa\.me|watsap|telegram|t\.me|viber|snap\s*chat|snap\b|insta(gram)?\b|facebook|\bfb\b|messenger|tik\s*tok|twitter|\bx\.com|linkedin|discord|skype|wechat|line id)/i,
  /(واتس|واتساب|وتساب|تلغرام|تليجرام|تيليجرام|سناب|انستا|انستقرام|انستغرام|فيسبوك|فيس بوك|تويتر|تيك توك|ماسنجر)/,
  // asking to be contacted
  /(call me|text me|message me|dm me|contact me|reach me|my number|my phone|my email|my account|add me)/i,
  /(كلموني|كلمني|اتصلوا|اتصل بي|راسلوني|راسلني|تواصلوا|تواصل معي|رقمي|رقم جوالي|رقم هاتفي|ايميلي|بريدي|ضيفوني)/,
  // numbers written as words (e.g. "zero five five ..."), 5+ in a row
  /\b((zero|oh|one|two|three|four|five|six|seven|eight|nine)[\s,\-]+){4,}(zero|oh|one|two|three|four|five|six|seven|eight|nine)\b/i,
  /((صفر|واحد|اثنين|اثنان|ثلاثة|ثلاث|اربعة|أربعة|خمسة|ستة|سبعة|ثمانية|تسعة)[\s،,\-]+){4,}/,
];

const MONEY =
  /(paypal|western union|bank account|iban|venmo|cashapp|gofundme|donate|bitcoin|crypto|transfer money|send money|stc ?pay|تحويل|حساب بنكي|آيبان|ايبان|تبرع|ارسل(وا)? (لي )?(مال|فلوس))/i;
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
