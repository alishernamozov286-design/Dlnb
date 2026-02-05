// O'zbekcha lotin → kirill transliteratsiya
const latinToCyrillicMap: Record<string, string> = {
  // Maxsus harflar (2 belgili)
  "O'": "Ў", "o'": "ў",
  "G'": "Ғ", "g'": "ғ",
  "SH": "Ш", "Sh": "Ш", "sh": "ш",
  "CH": "Ч", "Ch": "Ч", "ch": "ч",
  "NG": "Нг", "Ng": "Нг", "ng": "нг",
  "YA": "Я", "Ya": "Я", "ya": "я",
  "YO": "Ё", "Yo": "Ё", "yo": "ё",
  "YU": "Ю", "Yu": "Ю", "yu": "ю",
  "YE": "Е", "Ye": "Е", "ye": "е",
  
  // Oddiy harflar
  "A": "А", "a": "а",
  "B": "Б", "b": "б",
  "D": "Д", "d": "д",
  "E": "Э", "e": "э",
  "F": "Ф", "f": "ф",
  "G": "Г", "g": "г",
  "H": "Ҳ", "h": "ҳ",
  "I": "И", "i": "и",
  "J": "Ж", "j": "ж",
  "K": "К", "k": "к",
  "L": "Л", "l": "л",
  "M": "М", "m": "м",
  "N": "Н", "n": "н",
  "O": "О", "o": "о",
  "P": "П", "p": "п",
  "Q": "Қ", "q": "қ",
  "R": "Р", "r": "р",
  "S": "С", "s": "с",
  "T": "Т", "t": "т",
  "U": "У", "u": "у",
  "V": "В", "v": "в",
  "X": "Х", "x": "х",
  "Y": "Й", "y": "й",
  "Z": "З", "z": "з",
};

// O'zbekcha kirill → lotin transliteratsiya
const cyrillicToLatinMap: Record<string, string> = {
  "Ў": "O'", "ў": "o'",
  "Ғ": "G'", "ғ": "g'",
  "Ш": "Sh", "ш": "sh",
  "Ч": "Ch", "ч": "ch",
  "Я": "Ya", "я": "ya",
  "Ё": "Yo", "ё": "yo",
  "Ю": "Yu", "ю": "yu",
  "Е": "Ye", "е": "ye",
  
  "А": "A", "а": "a",
  "Б": "B", "б": "b",
  "Д": "D", "д": "d",
  "Э": "E", "э": "e",
  "Ф": "F", "ф": "f",
  "Г": "G", "г": "g",
  "Ҳ": "H", "ҳ": "h",
  "И": "I", "и": "i",
  "Ж": "J", "ж": "j",
  "К": "K", "к": "k",
  "Л": "L", "л": "l",
  "М": "M", "м": "m",
  "Н": "N", "н": "n",
  "О": "O", "о": "o",
  "П": "P", "п": "p",
  "Қ": "Q", "қ": "q",
  "Р": "R", "р": "r",
  "С": "S", "с": "s",
  "Т": "T", "т": "t",
  "У": "U", "у": "u",
  "В": "V", "в": "v",
  "Х": "X", "х": "x",
  "Й": "Y", "й": "y",
  "З": "Z", "з": "z",
};

/**
 * Lotin harflarini kirillga o'giradi
 * @param text - Lotin harflaridagi matn
 * @returns Kirill harflaridagi matn
 */
export function latinToCyrillic(text: string): string {
  if (!text) return '';
  
  // Barcha apostrophe variantlarini standart apostrophe ga o'zgartirish
  let result = text
    .replace(/'/g, "'")  // Right single quotation mark → apostrophe
    .replace(/'/g, "'")  // Left single quotation mark → apostrophe
    .replace(/`/g, "'")  // Backtick → apostrophe
    .replace(/ʻ/g, "'")  // Modifier letter turned comma → apostrophe
    .replace(/ʼ/g, "'"); // Modifier letter apostrophe → apostrophe
  
  // Avval 2 belgili harflarni almashtirish (o', g', sh, ch, ng)
  // MUHIM: Tartib muhim! Katta harfli variantlarni birinchi tekshirish kerak
  const twoCharPatterns = [
    'CH', 'Ch', 'ch', 
    'SH', 'Sh', 'sh', 
    "O'", "o'", "O'", "o'", "O`", "o`",  // Barcha apostrof turlari
    "G'", "g'", "G'", "g'", "G`", "g`",  // Barcha apostrof turlari
    'NG', 'Ng', 'ng', 
    'YA', 'Ya', 'ya', 
    'YO', 'Yo', 'yo', 
    'YU', 'Yu', 'yu', 
    'YE', 'Ye', 'ye'
  ];
  
  for (const pattern of twoCharPatterns) {
    if (latinToCyrillicMap[pattern]) {
      // Global replace using regex to avoid partial replacements
      const regex = new RegExp(pattern.replace(/'/g, "\\'"), 'g');
      result = result.replace(regex, latinToCyrillicMap[pattern]);
    }
  }
  
  // Keyin 1 belgili harflarni almashtirish
  result = result.split('').map(char => latinToCyrillicMap[char] || char).join('');
  
  return result;
}

/**
 * Kirill harflarini lotinga o'giradi
 * @param text - Kirill harflaridagi matn
 * @returns Lotin harflaridagi matn
 */
export function cyrillicToLatin(text: string): string {
  if (!text) return '';
  
  let result = text;
  
  // Har bir kirill harfni lotin harfga almashtirish
  result = result.split('').map(char => cyrillicToLatinMap[char] || char).join('');
  
  return result;
}

/**
 * Matnning qaysi alifboda ekanligini aniqlaydi
 * @param text - Tekshiriladigan matn
 * @returns 'latin' | 'cyrillic' | 'mixed'
 */
export function detectScript(text: string): 'latin' | 'cyrillic' | 'mixed' {
  if (!text) return 'latin';
  
  const cyrillicChars = text.match(/[а-яА-ЯўғҳқўҒҲҚЎёЁ]/g);
  const latinChars = text.match(/[a-zA-Z]/g);
  
  const hasCyrillic = cyrillicChars && cyrillicChars.length > 0;
  const hasLatin = latinChars && latinChars.length > 0;
  
  if (hasCyrillic && hasLatin) return 'mixed';
  if (hasCyrillic) return 'cyrillic';
  return 'latin';
}

/**
 * Avtomatik transliteratsiya - matn alifbosini aniqlaydi va o'giradi
 * @param text - Transliteratsiya qilinadigan matn
 * @returns Transliteratsiya qilingan matn
 */
export function autoTransliterate(text: string): string {
  const script = detectScript(text);
  
  if (script === 'cyrillic') {
    return cyrillicToLatin(text);
  } else if (script === 'latin') {
    return latinToCyrillic(text);
  }
  
  return text; // mixed yoki bo'sh bo'lsa o'zgartirmaslik
}

/**
 * Helper funksiya - matnni til bo'yicha qaytaradi
 * @param latinText - Lotin harflaridagi matn
 * @param language - 'latin' yoki 'cyrillic'
 * @returns Tanlangan tildagi matn
 */
export function t(latinText: string, language: 'latin' | 'cyrillic'): string {
  // Maxsus tarjimalar
  const translations: Record<string, string> = {
    'Offline rejim': 'Оффлайн режим',
    'Faqat avtomobillar sahifasi ishlaydi': 'Фақат автомобиллар саҳифаси ишлайди',
    'Faqat kassa va avtomobillar sahifalari ishlaydi': 'Фақат касса ва автомобиллар саҳифалари ишлайди',
    'Sinxronlashtirilmoqda...': 'Синхронлаштирилмоқда...',
    'Sinxronlash': 'Синхронлаш',
    'Noma\'lum': 'Номаълум',
    'Vazifalar bo\'limi offline rejimda mavjud emas': 'Вазифалар бўлими оффлайн режимда мавжуд эмас',
    // Car status translations
    'Kutilmoqda': 'Кутилмоқда',
    'Jarayonda': 'Жараёнда',
    'Tayyor': 'Тайёр',
    'Topshirilgan': 'Топширилган',
    // Payment status translations
    'To\'lanmagan': 'Тўланмаган',
    'Qisman': 'Қисман',
    'To\'langan': 'Тўланган',
    // Task status translations (lowercase for CarCard)
    'berilgan': 'берилган',
    'jarayonda': 'жараёнда',
    'tugallangan': 'тугалланган',
    // Task status translations (capitalized)
    'Berilgan': 'Берилган',
    'Tugallangan vazifalar ustiga bosing': 'Тугалланган вазифалар устига босинг',
    // Cashier page translations
    'Oylik Reset': 'Ойлик ресет',
    'Reset': 'ресет',
    'Oylik reset qilganingizdan keyin tarix paydo bo\'ladi': 'Ойлик ресет қилганингиздан кейин тарих пайдо бўлади',
    'Oylik reset amalga oshirildi': 'Ойлик ресет амалга оширилди',
    'Reset qilish': 'ресет қилиш',
    'Barcha daromadlarni 0 ga qaytarish': 'Барча даромадларни 0 га қайтариш',
    'Tarix': 'Тарих',
    'Oylik tarix': 'Ойлик тарих',
    'Tarix mavjud emas': 'Тарих мавжуд эмас',
    'Ma\'lumotlar tarixga saqlanadi va statistika 0 ga qaytariladi': 'Маълумотлар тарихга сақланади ва статистика 0 га қайтарилади',
  };

  if (language === 'cyrillic') {
    // Agar maxsus tarjima mavjud bo'lsa, uni qaytarish
    if (translations[latinText]) {
      return translations[latinText];
    }
    // Aks holda oddiy transliteratsiya
    return latinToCyrillic(latinText);
  }
  return latinText;
}

// Test funksiyasi
export function testTransliteration() {
  const tests = [
    { input: "salom", expected: "салом" },
    { input: "kitob", expected: "китоб" },
    { input: "o'qituvchi", expected: "ўқитувчи" },
    { input: "maktab", expected: "мактаб" },
    { input: "O'zbekiston", expected: "Ўзбекистон" },
    { input: "sho'rva", expected: "шўрва" },
    { input: "choyxona", expected: "чойхона" },
    { input: "g'alaba", expected: "ғалаба" },
  ];
  
  tests.forEach(({ input, expected }) => {
    const result = latinToCyrillic(input);
    // Test result check
    if (result !== expected) {
      console.warn(`Translation mismatch: ${input} -> ${result} (expected: ${expected})`);
    }
  });
}
