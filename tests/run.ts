// Run with: npm test
// Checks the safety filters and language detection that protect users.
import { checkNeedText, checkShortText, isValidName, suggestsSelfHarm } from '../src/lib/moderation';
import { detectLang } from '../src/lib/detectLang';

let failed = 0;
let passed = 0;
function expect(name: string, ok: boolean) {
  if (ok) passed++;
  else {
    failed++;
    console.log('FAIL', name);
  }
}

// Contact details and money requests must be blocked, in every app language.
const blocked = [
  'Please pray for my mother, call 0551234567',
  'Pray for me, my number is 055 123 4567',
  'Pray for me +966 55 123 4567',
  'ادعوا لي رقمي ٠٥٥١٢٣٤٥٦٧',
  'Pray for me, zero five five one two three four',
  'Pray for me, whatsapp me please',
  'ادعوا لي وتواصلوا معي على الواتساب',
  'Email me at ali at gmail dot com please pray',
  'Pray for me @ali_123 on insta',
  'Lütfen dua edin, numaram 0532 123 45 67',
  'Mohon doakan saya, hubungi saya di WA ya',
  'دعا کریں، میرا نمبر ہے ۰۳۰۰۱۲۳۴۵۶۷',
  'আমার জন্য দোয়া করুন, আমার নম্বর ০১৭১২৩৪৫৬৭৮',
  'Priez pour moi, appelez-moi au 06 12 34 56 78',
  'Betet für mich, meine Nummer ist null eins sieben zwei drei vier',
  'برای من دعا کنید، با من تماس بگیرید',
  'Please pray for me and send money to my paypal',
  'ادعوا لي وأرسلوا لي تحويل على حسابي البنكي',
  'Visit www.example.com and pray for me',
];
for (const t of blocked) expect(`blocks: ${t}`, checkNeedText(t) !== null);

// Sincere duas must go through, including ones with small numbers.
const allowed = [
  'My mother has surgery on Thursday, please pray for her recovery',
  'ادعوا لأمي بالشفاء فعمليتها يوم الخميس',
  'Pray for my 3 children and 2 parents in 2026',
  'Annem için dua edin, yarın ameliyat olacak',
  'Doakan ibu saya yang sedang sakit, semoga Allah menyembuhkannya',
  'میری والدہ کے لیے دعا کریں، ان کا آپریشن ہے',
  'আমার মায়ের জন্য দোয়া করুন, তিনি অসুস্থ',
  'Priez pour ma mère qui est malade depuis deux mois',
  'Betet für meinen Vater, er hat morgen eine Operation',
  'Saya punya dua anak dan satu cucu, doakan kami',
  'Please pray for my exams on the 14th of June',
];
for (const t of allowed) expect(`allows: ${t}`, checkNeedText(t) === null);

// Arabic words that contain swear-word letters must not be blocked.
expect('allows عكس / انعكاس / زبون', checkNeedText('ادعوا لي، كل شيء يسير عكس ما أريد وزبوني الوحيد غادر') === null);
expect('still blocks whole-word abuse', checkNeedText('هذا كلام سيء يا شرموط لا يقال') === 'abuse');

// Length limits.
expect('too short', checkNeedText('pray') === 'too_short');
expect('too long', checkNeedText('a'.repeat(281)) === 'too_long');

// Short fields (thank-you note, names).
expect('note with contact blocked', checkShortText('thanks, whatsapp me', 280) === 'contact');
expect('normal note allowed', checkShortText('Alhamdulillah, she is home now', 280) === null);
expect('name ok', isValidName('Ali'));
expect('arabic name ok', isValidName('عبد الله'));
expect('name with digits blocked', !isValidName('Ali0551'));
expect('empty name ok (anonymous)', isValidName(''));

// Self-harm signals show helpline resources.
for (const t of ['I want to die, please pray for me', 'أريد أن أموت ادعوا لي', 'ölmek istiyorum dua edin', 'saya ingin mati tolong doakan']) {
  expect(`self-harm: ${t}`, suggestsSelfHarm(t));
}
expect('no false self-harm', !suggestsSelfHarm('Please pray for my grandmother who passed away'));

// Language detection for cross-language matching.
const langs: [string, string, string][] = [
  ['Please pray for my mother', 'en', 'en'],
  ['Please pray for my mother', 'ar', 'en'],
  ['Annem için dua edin', 'tr', 'tr'],
  ['ادعوا لأمي بالشفاء', 'en', 'ar'],
  ['میری والدہ کے لیے دعا کریں', 'en', 'ur'],
  ['برای مادرم دعا کنید', 'en', 'fa'],
  ['আমার মায়ের জন্য দোয়া করুন', 'en', 'bn'],
  ['Doakan ibu saya', 'id', 'id'],
];
for (const [t, author, want] of langs) expect(`lang ${want}: ${t}`, detectLang(t, author) === want);

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
