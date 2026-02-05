import { Request, Response } from 'express';
import Groq from 'groq-sdk';
// Lazy initialization - API key yuklanadi faqat funksiya chaqirilganda
const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  return new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
};
export const getCarDiagnosticAdvice = async (req: Request, res: Response) => {
  try {
    const { carModel, problem } = req.body;
    if (!problem || problem.trim().length === 0) {
      return res.status(400).json({ 
        message: 'Mashina muammosini kiriting' 
      });
    }
    const prompt = `Siz 25+ yillik tajribaga ega PROFESSIONAL AVTOMOBIL MUTAXASSISI va MASTER DIAGNOSTsiz. 
SIZNING BILIMLARINGIZ:
- Barcha avtomobil markalari va modellari (Toyota, Mercedes, BMW, Chevrolet, Hyundai, Kia, Nexia, Matiz, Lacetti, Cobalt, Spark, Gentra va boshqalar)
- Dvigatel tizimlari (benzin, dizel, gibrid, elektr)
- Transmissiya tizimlari (mexanik, avtomat, variator, robot)
- Elektr tizimlari va elektronika
- Tormoz tizimlari (disk, baraban, ABS, ESP)
- Suspenziya va rulda mexanizmi
- Konditsioner va isitish tizimlari
- Ehtiyot qismlar va ularning sifati
- Zamonaviy diagnostika uskunalari
- OBD-II diagnostika kodlari
${carModel ? `[CAR] MASHINA: ${carModel}` : '[CAR] MASHINA: Noma\'lum model'}
[ALERT] MUAMMO: ${problem}
SIZNING VAZIFANGIZ:
1. Muammoni professional darajada tahlil qiling
2. Aniq diagnostika va yechim taklif qiling
3. Ehtiyot qismlar haqida batafsil ma'lumot bering
4. Narx va vaqt taxminini ayting
5. Xavfsizlik qoidalarini eslatib o'ting
JAVOB BERISH TARTIBI:
[CLIPBOARD] 1. MUAMMONI PROFESSIONAL TAHLIL
   • Muammoning texnik tavsifi
   • Ehtimoliy sabablar (eng katta ehtimoldan boshlab, foizda)
   • Qo'shimcha simptomlar va belgilar
   • Qaysi tizim yoki qism ishlamayapti
   • Muammoning jiddiylik darajasi (past/o'rta/yuqori/kritik)
[SEARCH] 2. BATAFSIL DIAGNOSTIKA JARAYONI
   • Bosqichma-bosqich diagnostika tartibi
   • Kerakli diagnostika asboblari (multimetr, skanер, manometr va h.k.)
   • Har bir qismni qanday tekshirish (aniq parametrlar)
   • Normal ko'rsatkichlar va xato ko'rsatkichlar
   • OBD-II xato kodlari (agar mavjud bo'lsa)
   • Vizual tekshirish nuqtalari
[WRENCH] 3. TUZATISH VA TA'MIRLASH JARAYONI
   • Aniq ish bosqichlari (1, 2, 3, 4...)
   • Har bir bosqichda bajariladigan ishlar
   • Kerakli asboblar va uskunalar
   • Taxminiy ish vaqti (soat/daqiqa)
   • Qiyinchilik darajasi (oson/o'rta/qiyin/juda qiyin)
   • Maxsus ko'nikmalar kerakmi?
[LIGHTBULB] 4. EHTIYOT QISMLAR VA MATERIALLAR
   • Kerakli ehtiyot qismlar ro'yxati
   • Har bir qismning aniq nomi va kodi
   • Original vs Analog qismlar (qaysi yaxshi?)
   • Taxminiy narxlar (so'm yoki dollar)
   • Qayerdan sotib olish mumkin
   • Sifatli brendlar tavsiyasi
   • Kerakli suyuqliklar (moy, antifreeze, tormoz suyuqligi va h.k.)
[WARNING] 5. XAVFSIZLIK VA MUHIM OGOHLANTIRISHLAR
   • Xavfsizlik choralari (majburiy!)
   • Himoya vositalari (qo'lqop, ko'zoynak va h.k.)
   • Qanday xatolarga yo'l qo'ymaslik
   • Xavfli vaziyatlar va ulardan qochish
   • Agar ishonch bo'lmasa, ustadan so'rash
   • Kafolat va mas'uliyat masalalari
[LIGHTBULB] 6. OLDINI OLISH VA PARVARISH
   • Kelajakda bunday muammolarning oldini olish
   • Muntazam texnik xizmat ko'rsatish jadvali
   • Qaysi qismlarni qachon almashtirish kerak
   • Haydovchilik maslahatlari
   • Tejamkor foydalanish usullari
   • Qo'shimcha tekshirish kerak bo'lgan qismlar
[LIGHTBULB] 7. NARX VA VAQT TAXMINI
   • Umumiy ta'mirlash narxi (minimal va maksimal)
   • Ehtiyot qismlar narxi
   • Ish haqi taxmini
   • Umumiy vaqt (diagnostika + ta'mirlash)
   • Tejash imkoniyatlari
MUHIM QOIDALAR:
- Har doim aniq va texnik jihatdan to'g'ri javob bering
- Agar ma'lumot yetarli bo'lmasa, qo'shimcha savol bering
- Professional terminologiya ishlating, lekin tushunarli tushuntiring
- Haqiqiy narxlar va vaqt ko'rsating (O'zbekiston bozori uchun)
- Alternativ yechimlar taklif qiling (agar mavjud bo'lsa)
- Har doim xavfsizlikni birinchi o'ringa qo'ying
- Javobingiz strukturali, tartibli va to'liq bo'lishi kerak
- Har bir bosqichni raqamlab, aniq tushuntiring
- Ehtiyot qismlar uchun original va analog variantlarni taqqoslang
- Ish vaqti va narxlarni minimal va maksimal ko'rsating
JAVOB SIFATI:
- 100% aniq va ishonchli ma'lumot
- Batafsil va tushunarli tushuntirishlar
- Amaliy va qo'llanilishi oson maslahatlar
- Professional lekin oddiy til
- Har bir qadamni aniq ko'rsatish
Javobingiz PROFESSIONAL, BATAFSIL, STRUKTURALI va 100% AMALIY bo'lishi kerak!`;
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'Siz 25+ yillik tajribaga ega professional avtomobil mutaxassisi va master diagnostsiz. Barcha avtomobil markalari, ehtiyot qismlar, ta\'mirlash usullari va texnik ma\'lumotlar bo\'yicha chuqur bilimga egasiz. Har doim aniq, batafsil, strukturali va amaliy javoblar berasiz. Javoblaringiz professional, tushunarli va to\'liq bo\'lishi kerak. Har bir bosqichni batafsil tushuntirasiz va xavfsizlik qoidalarini eslatib turasiz.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1, // Juda past - maksimal aniqlik va izchillik
      max_tokens: 4096, // Maksimal token - eng batafsil javoblar
      top_p: 0.9, // Yuqori sifat
      frequency_penalty: 0.5, // Takrorlanishni sezilarli kamaytirish
      presence_penalty: 0.3, // Yangi ma'lumot va turli mavzularni qamrab olish
    });
    const advice = chatCompletion.choices[0]?.message?.content || 'Javob olinmadi';
    // Har bir jumlaning birinchi harfini katta qilish
    const capitalizeFirstLetter = (text: string): string => {
      // Har bir yangi qatordan keyin birinchi harfni katta qilish
      return text.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed.length === 0) return line;
        // Agar qator belgi bilan boshlansa (•, -, *, raqam), undan keyingi birinchi harfni katta qilish
        const match = trimmed.match(/^([•\-*\d.]+\s*)/);
        if (match) {
          const prefix = match[1];
          const rest = trimmed.substring(prefix.length);
          if (rest.length > 0) {
            return line.replace(trimmed, prefix + rest.charAt(0).toUpperCase() + rest.slice(1));
          }
        }
        // Oddiy qator uchun birinchi harfni katta qilish
        return line.replace(trimmed, trimmed.charAt(0).toUpperCase() + trimmed.slice(1));
      }).join('\n');
    };
    const formattedAdvice = capitalizeFirstLetter(advice);
    res.json({
      success: true,
      advice: formattedAdvice,
      carModel: carModel || null,
      problem
    });
  } catch (error: any) {
    if (error.status === 401) {
      return res.status(500).json({ 
        message: 'AI xizmati sozlanmagan. GROQ_API_KEY ni .env fayliga qo\'shing' 
      });
    }
    res.status(500).json({ 
      message: 'AI maslahat olishda xatolik yuz berdi',
      error: error.message 
    });
  }
};
