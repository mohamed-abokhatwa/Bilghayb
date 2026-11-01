import { LANGUAGES } from './i18n';
export { detectLang } from './detectLang';

const names = new Map<string, Intl.DisplayNames | null>();

/** Name of a language, written in the reader's language ("Turkish", "التركية"…). */
export function languageName(code: string, readerLocale: string): string {
  if (!names.has(readerLocale)) {
    try {
      names.set(readerLocale, new Intl.DisplayNames([readerLocale], { type: 'language' }));
    } catch {
      names.set(readerLocale, null);
    }
  }
  try {
    const n = names.get(readerLocale)?.of(code);
    if (n && n !== code) return n;
  } catch {}
  return LANGUAGES.find((l) => l.code === code)?.english ?? code;
}

/** Free translation: opens Google Translate with the text, into the reader's language. */
export function translateUrl(text: string, to: string): string {
  return `https://translate.google.com/?sl=auto&tl=${encodeURIComponent(to)}&text=${encodeURIComponent(text)}&op=translate`;
}
