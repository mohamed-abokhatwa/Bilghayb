import type { Category } from './types';

// Short, authentic duas matched to each need category.
export const duaByCategory: Record<Category, { ar: string; en: string; ref: string }> = {
  health: {
    ar: 'اللَّهُمَّ رَبَّ النَّاسِ، أَذْهِبِ الْبَأْسَ، اشْفِ أَنْتَ الشَّافِي، لَا شِفَاءَ إِلَّا شِفَاؤُكَ',
    en: 'O Allah, Lord of mankind, remove the harm and heal, You are the Healer. There is no healing but Yours.',
    ref: 'Bukhari 5743',
  },
  rizq: {
    ar: 'اللَّهُمَّ اكْفِهِ بِحَلَالِكَ عَنْ حَرَامِكَ، وَأَغْنِهِ بِفَضْلِكَ عَمَّنْ سِوَاكَ',
    en: 'O Allah, suffice them with what is lawful against what is unlawful, and enrich them by Your grace from all besides You.',
    ref: 'Tirmidhi 3563',
  },
  marriage: {
    ar: 'رَبَّنَا هَبْ لَنَا مِنْ أَزْوَاجِنَا وَذُرِّيَّاتِنَا قُرَّةَ أَعْيُنٍ',
    en: 'Our Lord, grant us from our spouses and offspring comfort to our eyes.',
    ref: 'Al-Furqan 25:74',
  },
  children: {
    ar: 'رَبِّ هَبْ لِي مِنْ لَدُنْكَ ذُرِّيَّةً طَيِّبَةً إِنَّكَ سَمِيعُ الدُّعَاءِ',
    en: 'My Lord, grant me from Yourself a good offspring. Indeed, You are the Hearer of supplication.',
    ref: 'Aal-Imran 3:38',
  },
  exams: {
    ar: 'رَبِّ اشْرَحْ لِي صَدْرِي، وَيَسِّرْ لِي أَمْرِي',
    en: 'My Lord, expand for me my chest, and ease for me my task.',
    ref: 'Taha 20:25-26',
  },
  grief: {
    ar: 'اللَّهُمَّ أْجُرْهُ فِي مُصِيبَتِهِ وَأَخْلِفْ لَهُ خَيْرًا مِنْهَا',
    en: 'O Allah, reward them in their affliction and replace it with something better.',
    ref: 'Muslim 918',
  },
  guidance: {
    ar: 'يَا مُقَلِّبَ الْقُلُوبِ ثَبِّتْ قَلْبَهُ عَلَى دِينِكَ',
    en: 'O Turner of hearts, make their heart firm upon Your religion.',
    ref: 'Tirmidhi 2140',
  },
  debt: {
    ar: 'اللَّهُمَّ إِنِّي أَعُوذُ بِكَ مِنْ غَلَبَةِ الدَّيْنِ وَقَهْرِ الرِّجَالِ',
    en: 'O Allah, protect them from the burden of debt and from being overpowered by men.',
    ref: 'Nasa’i 5475',
  },
  family: {
    ar: 'رَبِّ اجْعَلْنِي مُقِيمَ الصَّلَاةِ وَمِنْ ذُرِّيَّتِي رَبَّنَا وَتَقَبَّلْ دُعَاءِ',
    en: 'My Lord, make me an establisher of prayer, and from my descendants. Our Lord, accept my supplication.',
    ref: 'Ibrahim 14:40',
  },
  other: {
    ar: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ',
    en: 'Our Lord, give us good in this world and good in the Hereafter, and protect us from the Fire.',
    ref: 'Al-Baqarah 2:201',
  },
};

export const COUNTRIES: { code: string; en: string; ar: string; flag: string }[] = [
  { code: 'SA', en: 'Saudi Arabia', ar: 'السعودية', flag: '🇸🇦' },
  { code: 'EG', en: 'Egypt', ar: 'مصر', flag: '🇪🇬' },
  { code: 'AE', en: 'UAE', ar: 'الإمارات', flag: '🇦🇪' },
  { code: 'KW', en: 'Kuwait', ar: 'الكويت', flag: '🇰🇼' },
  { code: 'QA', en: 'Qatar', ar: 'قطر', flag: '🇶🇦' },
  { code: 'BH', en: 'Bahrain', ar: 'البحرين', flag: '🇧🇭' },
  { code: 'OM', en: 'Oman', ar: 'عُمان', flag: '🇴🇲' },
  { code: 'JO', en: 'Jordan', ar: 'الأردن', flag: '🇯🇴' },
  { code: 'PS', en: 'Palestine', ar: 'فلسطين', flag: '🇵🇸' },
  { code: 'LB', en: 'Lebanon', ar: 'لبنان', flag: '🇱🇧' },
  { code: 'SY', en: 'Syria', ar: 'سوريا', flag: '🇸🇾' },
  { code: 'IQ', en: 'Iraq', ar: 'العراق', flag: '🇮🇶' },
  { code: 'YE', en: 'Yemen', ar: 'اليمن', flag: '🇾🇪' },
  { code: 'SD', en: 'Sudan', ar: 'السودان', flag: '🇸🇩' },
  { code: 'LY', en: 'Libya', ar: 'ليبيا', flag: '🇱🇾' },
  { code: 'TN', en: 'Tunisia', ar: 'تونس', flag: '🇹🇳' },
  { code: 'DZ', en: 'Algeria', ar: 'الجزائر', flag: '🇩🇿' },
  { code: 'MA', en: 'Morocco', ar: 'المغرب', flag: '🇲🇦' },
  { code: 'SO', en: 'Somalia', ar: 'الصومال', flag: '🇸🇴' },
  { code: 'TR', en: 'Türkiye', ar: 'تركيا', flag: '🇹🇷' },
  { code: 'PK', en: 'Pakistan', ar: 'باكستان', flag: '🇵🇰' },
  { code: 'IN', en: 'India', ar: 'الهند', flag: '🇮🇳' },
  { code: 'BD', en: 'Bangladesh', ar: 'بنغلاديش', flag: '🇧🇩' },
  { code: 'ID', en: 'Indonesia', ar: 'إندونيسيا', flag: '🇮🇩' },
  { code: 'MY', en: 'Malaysia', ar: 'ماليزيا', flag: '🇲🇾' },
  { code: 'NG', en: 'Nigeria', ar: 'نيجيريا', flag: '🇳🇬' },
  { code: 'SN', en: 'Senegal', ar: 'السنغال', flag: '🇸🇳' },
  { code: 'GB', en: 'United Kingdom', ar: 'المملكة المتحدة', flag: '🇬🇧' },
  { code: 'US', en: 'United States', ar: 'الولايات المتحدة', flag: '🇺🇸' },
  { code: 'CA', en: 'Canada', ar: 'كندا', flag: '🇨🇦' },
  { code: 'FR', en: 'France', ar: 'فرنسا', flag: '🇫🇷' },
  { code: 'DE', en: 'Germany', ar: 'ألمانيا', flag: '🇩🇪' },
  { code: 'NL', en: 'Netherlands', ar: 'هولندا', flag: '🇳🇱' },
  { code: 'SE', en: 'Sweden', ar: 'السويد', flag: '🇸🇪' },
  { code: 'AU', en: 'Australia', ar: 'أستراليا', flag: '🇦🇺' },
  { code: 'ZA', en: 'South Africa', ar: 'جنوب أفريقيا', flag: '🇿🇦' },
  { code: 'XX', en: 'Elsewhere', ar: 'مكان آخر', flag: '🌍' },
];

export function countryName(code: string, locale: 'en' | 'ar') {
  const c = COUNTRIES.find((x) => x.code === code) ?? COUNTRIES[COUNTRIES.length - 1];
  return locale === 'ar' ? c.ar : c.en;
}

export function countryFlag(code: string) {
  return (COUNTRIES.find((x) => x.code === code) ?? COUNTRIES[COUNTRIES.length - 1]).flag;
}
