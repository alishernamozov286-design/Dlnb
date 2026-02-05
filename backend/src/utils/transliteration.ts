// Lotin -> Kirill transliteratsiya
const latinToCyrillic: { [key: string]: string } = {
  'A': 'А', 'a': 'а',
  'B': 'Б', 'b': 'б',
  'D': 'Д', 'd': 'д',
  'E': 'Е', 'e': 'е',
  'F': 'Ф', 'f': 'ф',
  'G': 'Г', 'g': 'г',
  'H': 'Ҳ', 'h': 'ҳ',
  'I': 'И', 'i': 'и',
  'J': 'Ж', 'j': 'ж',
  'K': 'К', 'k': 'к',
  'L': 'Л', 'l': 'л',
  'M': 'М', 'm': 'м',
  'N': 'Н', 'n': 'н',
  'O': 'О', 'o': 'о',
  'P': 'П', 'p': 'п',
  'Q': 'Қ', 'q': 'қ',
  'R': 'Р', 'r': 'р',
  'S': 'С', 's': 'с',
  'T': 'Т', 't': 'т',
  'U': 'У', 'u': 'у',
  'V': 'В', 'v': 'в',
  'X': 'Х', 'x': 'х',
  'Y': 'Й', 'y': 'й',
  'Z': 'З', 'z': 'з',
  "'": 'ъ',
  "G'": 'Ғ', "g'": 'ғ',
  "O'": 'Ў', "o'": 'ў',
  'Sh': 'Ш', 'sh': 'ш',
  'Ch': 'Ч', 'ch': 'ч',
  'Yo': 'Ё', 'yo': 'ё',
  'Yu': 'Ю', 'yu': 'ю',
  'Ya': 'Я', 'ya': 'я',
  'Ye': 'Е', 'ye': 'е',
};

export function transliterate(text: string, targetScript: 'latin' | 'cyrillic'): string {
  if (targetScript === 'latin') {
    // Agar lotin kerak bo'lsa, o'zgartirmasdan qaytaramiz
    return text;
  }

  // Kirill uchun transliteratsiya
  let result = text;

  // Ikki harfli kombinatsiyalarni birinchi navbatda almashtirish
  const twoLetterPatterns = ['Sh', 'sh', 'Ch', 'ch', 'Yo', 'yo', 'Yu', 'yu', 'Ya', 'ya', 'Ye', 'ye', "G'", "g'", "O'", "o'"];
  
  twoLetterPatterns.forEach(pattern => {
    if (latinToCyrillic[pattern]) {
      const regex = new RegExp(pattern.replace(/'/g, "\\'"), 'g');
      result = result.replace(regex, latinToCyrillic[pattern]);
    }
  });

  // Bir harfli almashtirish
  result = result.split('').map(char => {
    return latinToCyrillic[char] || char;
  }).join('');

  return result;
}
