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
