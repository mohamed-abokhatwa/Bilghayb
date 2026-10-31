// Fast on-device checks. The server repeats these and adds AI moderation,
// so this is only for instant feedback while typing.

export type ModerationIssue = 'contact' | 'money' | 'link' | 'abuse' | 'too_short' | 'too_long';

export const MIN_LEN = 12;
export const MAX_LEN = 280;

const LINK = /(https?:\/\/|www\.|\b[a-z0-9-]+\.(com|net|org|io|me|ly|co|link|app)\b)/i;
const EMAIL = /[^\s@]+@[^\s@]+\.[^\s@]+/;
const HANDLE = /(^|\s)@[a-z0-9_.]{3,}/i;
// 7+ digits, allowing spaces/dashes, in Latin or Arabic-Indic numerals.
const PHONE = /([0-9٠-٩][\s\-.]?){7,}/;
const MONEY =
  /(paypal|western union|bank account|iban|venmo|cashapp|gofundme|donate|bitcoin|crypto|transfer money|send money|تحويل|حساب بنكي|تبرع|ارسل(وا)? (لي )?(مال|فلوس))/i;
const ABUSE = /(kill|fuck|shit|bitch|كس|زب|شرموط)/i;

export function checkNeedText(text: string): ModerationIssue | null {
  const t = text.trim();
  if (t.length < MIN_LEN) return 'too_short';
  if (t.length > MAX_LEN) return 'too_long';
  if (LINK.test(t)) return 'link';
  if (EMAIL.test(t) || HANDLE.test(t) || PHONE.test(t)) return 'contact';
  if (MONEY.test(t)) return 'money';
  if (ABUSE.test(t)) return 'abuse';
  return null;
}
