import type { Category } from '../types';

export { ur } from './ur';
export { fa } from './fa';
export { tr } from './tr';
export { id } from './id';
export { ms } from './ms';
export { bn } from './bn';
export { fr } from './fr';
export { de } from './de';

type Extra = 'ur' | 'fa' | 'tr' | 'id' | 'ms' | 'bn' | 'fr' | 'de';

export const categoryExtra: Record<Extra, Record<Category, string>> = {
  ur: { health: 'صحت', rizq: 'رزق', marriage: 'نکاح', children: 'اولاد', exams: 'تعلیم', grief: 'غم', guidance: 'ہدایت', debt: 'قرض', family: 'خاندان', other: 'دیگر' },
  fa: { health: 'سلامتی', rizq: 'روزی', marriage: 'ازدواج', children: 'فرزند', exams: 'تحصیل', grief: 'اندوه', guidance: 'هدایت', debt: 'بدهی', family: 'خانواده', other: 'سایر' },
  tr: { health: 'Sağlık', rizq: 'Rızık', marriage: 'Evlilik', children: 'Evlat', exams: 'Eğitim', grief: 'Keder', guidance: 'Hidayet', debt: 'Borç', family: 'Aile', other: 'Diğer' },
  id: { health: 'Kesehatan', rizq: 'Rezeki', marriage: 'Pernikahan', children: 'Keturunan', exams: 'Studi', grief: 'Duka', guidance: 'Hidayah', debt: 'Utang', family: 'Keluarga', other: 'Lainnya' },
  ms: { health: 'Kesihatan', rizq: 'Rezeki', marriage: 'Perkahwinan', children: 'Zuriat', exams: 'Pelajaran', grief: 'Duka', guidance: 'Hidayah', debt: 'Hutang', family: 'Keluarga', other: 'Lain-lain' },
  bn: { health: 'স্বাস্থ্য', rizq: 'রিজিক', marriage: 'বিয়ে', children: 'সন্তান', exams: 'পড়াশোনা', grief: 'শোক', guidance: 'হেদায়েত', debt: 'ঋণ', family: 'পরিবার', other: 'অন্যান্য' },
  fr: { health: 'Santé', rizq: 'Subsistance', marriage: 'Mariage', children: 'Enfants', exams: 'Études', grief: 'Deuil', guidance: 'Guidée', debt: 'Dettes', family: 'Famille', other: 'Autre' },
  de: { health: 'Gesundheit', rizq: 'Versorgung', marriage: 'Ehe', children: 'Kinder', exams: 'Studium', grief: 'Trauer', guidance: 'Rechtleitung', debt: 'Schulden', family: 'Familie', other: 'Sonstiges' },
};
