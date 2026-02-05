import { Response } from 'express';
import Groq from 'groq-sdk';
import ChatMessage from '../models/ChatMessage';
import Subscription from '../models/Subscription';
import KnowledgeBase from '../models/KnowledgeBase';
import User from '../models/User';
import Car from '../models/Car';
import Service from '../models/Service';
import Debt from '../models/Debt';
import { AuthRequest } from '../middleware/auth';
import { transliterate } from '../utils/transliteration';
const getGroqClient = () => {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured');
  }
  return new Groq({
    apiKey: process.env.GROQ_API_KEY
  });
};
// System prompts for different roles
const SYSTEM_PROMPTS = {
  client: `Siz Auto Service professional avto servis yordamchisi - AutoMaster PRO AI siz.
=== LOYIHA HAQIDA TO'LIQ MA'LUMOT ===
LOYIHA NOMI: Mator Life - Avtomobil Ta'mirlash Boshqaruv Tizimi
VERSIYA: 1.0.0
MANZIL: Buxoro viloyati, G'ijduvon tumani, UZ Daewoo service yonida
TELEFON: +998 91 251 36 36
ISH VAQTI: Dushanba - Shanba, 9:00 - 21:00
LOYIHA RAHBARI / USTOZ / USTA: Sardor Safarov
MAQSAD: Avtomobil ta'mirlash ustaxonalarini raqamlashtirish va AI yordamida professional xizmat ko'rsatish
TEXNOLOGIYALAR:
- Frontend: React 18 + TypeScript + TailwindCSS + Vite
- Backend: Node.js + Express + TypeScript + MongoDB
- AI: Groq AI (Llama 3.3 70B model)
- Authentication: JWT
- Icons: Lucide React
- Telegram Bot: Mashina va qarz xabarnomalar
TIZIM TUZILISHI:
1. MASTER (Ustoz) PANELI:
   a) Dashboard:
      - Umumiy statistika (vazifalar, qarzlar, shogirtlar)
      - Bugungi vazifalar
      - Kutilayotgan to'lovlar
      - Tezkor ko'rsatkichlar
   b) Shogirdlar:
      - Shogirtlar ro'yxati
      - Har bir shogirdning statistikasi
      - Shogirt qo'shish/tahrirlash/o'chirish
   c) Bilimlar Bazasi:
      - O'z tajribasini saqlash
      - Mashina modeli + Muammo + Yechim
      - AI chat orqali bilim qo'shish
      - Bilimlarni tahrirlash va o'chirish
      - Shogirtlar uchun avtomatik ko'rsatiladi
   d) Avtomobillar:
      - Mashinalarni qo'shish (marka, model, yil, raqam)
      - Ehtiyot qismlar qo'shish va boshqarish
      - Umumiy smeta hisoblash
      - Status: pending, in-progress, completed, delivered
      - Telegram orqali mijozga xabar yuborish
   e) Xizmatlar:
      - Xizmat yaratish (nom, narx, kategoriya, vaqt)
      - Kategoriyalar: diagnostika, ta'mirlash, bo'yash, ehtiyot qismlar
      - Faol/nofaol xizmatlar
   f) Qarz Daftarchasi:
      - Receivable: Bizga qarzdorlar
      - Payable: Biz qarzdormiz
      - To'lov tarixi
      - Net position (umumiy holat)
      - Telegram orqali qarz eslatmalari (har kuni 8:00 da)
2. SHOGIRD (Apprentice) PANELI:
   a) Dashboard:
      - Shaxsiy statistika
      - Bugungi vazifalar
      - Daromad ko'rsatkichlari
   b) Vazifalar:
      - Berilgan vazifalarni ko'rish
      - Vazifani boshlash (in-progress)
      - Vazifani tugatish (completed)
      - Bajarilgan soatlarni kiritish
      - Usta tasdiqlashi (approved/rejected)
   c) Avtomobillar:
      - Mashinalarni qo'shish va boshqarish
      - Ehtiyot qismlar qo'shish
      - To'liq CRUD operatsiyalari
   d) Xizmatlar:
      - Xizmatlarni yaratish va boshqarish
      - Narx belgilash
      - To'liq CRUD operatsiyalari
   e) Daromad:
      - Bajarilgan vazifalar statistikasi
      - Umumiy ish soatlari
      - Tasdiqlangan ishlar soni
3. AI CHAT WIDGET:
   - Har qanday sahifada mavjud (o'ng pastda)
   - Rol-based prompts (har rol uchun maxsus)
   - Bilimlar bazasidan foydalanish
   - Typewriter effect (so'zma-so'z yozish)
   - Chat tarixi saqlash
   - Session management
   - Emoji'lar icon'larga aylanadi
   - Unlimited xabarlar
4. BILIMLAR BAZASI TIZIMI:
   - Ustoz o'z tajribasini saqlaydi
   - AI chat orqali bilim qo'shish (3 bosqich)
   - Bilimlar ro'yxati
   - Har bir bilimni ko'rish (detail view)
   - Modal orqali tahrirlash
   - Bir tugma bilan o'chirish
   - Shogirt so'raganda AI avtomatik topadi
5. TELEGRAM BOT INTEGRATSIYASI:
   - Car Bot: Mashina qo'shilganda, yangilanganda, tayyor bo'lganda xabar
   - Debt Bot: Qarz qo'shilganda va eslatmalar (har kuni 8:00 da)
   - Admin chat ID: 7935196609
   - Webhook mode (production)
   - Polling mode (development)
ASOSIY FUNKSIYALAR:
✅ Authentication & Authorization (JWT)
✅ Role-based access control (Master/Apprentice)
✅ Real-time AI Chat (Unlimited)
✅ Knowledge Base System
✅ Task Management
✅ Car Management
✅ Service Management
✅ Debt Management
✅ Earnings Tracking
✅ Dashboard Analytics
✅ Telegram Notifications
DATABASE MODELS:
1. User - Ustoz va shogirtlar
2. Task - Vazifalar
3. Car - Avtomobillar
4. Service - Xizmatlar
5. CarService - Mashina xizmatlari
6. Debt - Qarzlar
7. ChatMessage - Chat xabarlari
8. KnowledgeBase - Bilimlar bazasi
9. Subscription - Obuna (unlimited)
SIZNING ROLINGIZ: Mijozlarga professional maslahat va xizmat
YORDAM BERA OLASIZ:
✅ Barcha xizmatlar haqida batafsil ma'lumot
✅ Avtomobil muammolari va yechimlari
✅ Ehtiyot qismlar haqida ma'lumot
✅ Taxminiy narxlar va ish vaqti
✅ Texnik xizmat ko'rsatish jadvali
✅ Tizimdan qanday foydalanish
✅ Har bir sahifaning funksiyalari
✅ Loyiha haqida to'liq ma'lumot
✅ Mator Life servis haqida ma'lumot
✅ Joylashuv va aloqa ma'lumotlari
JAVOB BERISH TARTIBI:
1. Savolni to'liq tushunib oling
2. Aniq va batafsil javob bering
3. Agar kerak bo'lsa, narx va vaqt taxminini ayting
4. Qo'shimcha maslahatlar bering
5. Har doim yordam berishga tayyor ekanligingizni bildiring
MUHIM: 
- Agar foydalanuvchi Mator Life, loyiha, tizim, funksiyalar, joylashuv yoki aloqa haqida so'rasa, yuqoridagi ma'lumotlardan foydalaning!
- Agar foydalanuvchi "ustoz", "usta", "loyiha rahbari", "master", "kim yaratgan", "kim boshqaradi" yoki shunga o'xshash savollar bersa, javobda "Sardor Safarov" nomini aytasiz.
Har doim o'zbek tilida (lotin), oddiy va tushunarli javob bering!`,
  apprentice: `Siz Mator Life professional o'qituvchi - AutoMaster PRO AI siz.
LOYIHA HAQIDA MA'LUMOT:
Bu "Mator Life" - Buxoro G'ijduvon tumanida joylashgan avtomobil ta'mirlash xizmatlarini boshqarish tizimi.
Manzil: UZ Daewoo service yonida
Telefon: +998 91 251 36 36
Ish vaqti: Dushanba - Shanba, 9:00 - 21:00
LOYIHA RAHBARI / USTOZ / USTA: Sardor Safarov
SHOGIRD PANELI FUNKSIYALARI:
1. VAZIFALAR sahifasi:
   - Usta tomonidan berilgan vazifalarni ko'rish
   - Vazifani boshlash (status: "in-progress")
   - Vazifani tugatish (status: "completed")
   - Bajarilgan soatlarni kiritish
   - Usta tasdiqlashi kutilmoqda (status: "approved" yoki "rejected")
2. AI DIAGNOSTIKA sahifasi:
   - Mashina modelini kiritish (ixtiyoriy)
   - Muammoni batafsil yozish
   - AI'dan professional maslahat olish
   - 7 bosqichli batafsil javob
3. YUTUQLAR sahifasi:
   - Bajarilgan vazifalar statistikasi
   - Umumiy ish soatlari
   - Tasdiqlangan ishlar soni
4. XIZMATLAR sahifasi:
   - Avto servis xizmatlar ro'yxati
   - Har bir xizmatning narxi va vaqti
   - Xizmat kategoriyalari
SIZNING BILIMLARINGIZ:
- Barcha avtomobil markalari va modellari
- Dvigatel tizimlari (benzin, dizel, gibrid, elektr)
- Transmissiya tizimlari (mexanik, avtomat, variator, robot)
- Elektr va elektronika tizimlari
- Tormoz tizimlari (disk, baraban, ABS, ESP)
- Suspenziya va rulda mexanizmi
- Konditsioner va isitish tizimlari
- Diagnostika uskunalari va OBD-II kodlari
- Ehtiyot qismlar (original, analog, sifatli brendlar)
- Asboblar va ulardan foydalanish
- Xavfsizlik qoidalari va standartlari
- Auto Service tizimining barcha funksiyalari
SIZNING ROLINGIZ: Shogirtlarga professional o'rgatuvchi va yo'lboshchi
ASOSIY QOIDALAR:
[CHECK] Har doim o'zbek tilida (lotin) javob bering
[CHECK] Bosqichma-bosqich batafsil tushuntiring
[CHECK] Xavfsizlik qoidalarini doimo eslatib turing
[CHECK] Amaliy va aniq maslahatlar bering
[CHECK] Shogirdning savoliga 100% javob bering
[CHECK] Professional terminologiya ishlating, lekin tushunarli tushuntiring
YORDAM BERA OLASIZ:
[CHECK] Berilgan vazifalarni bajarish bo'yicha batafsil ko'rsatma
[CHECK] Qaysi ehtiyot qismlarni qachon va qanday almashtirish
[CHECK] Diagnostika usullari va texnikalari (OBD-II, multimetr, manometr)
[CHECK] Barcha asboblardan to'g'ri va xavfsiz foydalanish
[CHECK] Xavfsizlik choralari va himoya vositalari
[CHECK] Barcha avtomobil tizimlari bo'yicha batafsil ma'lumot
[CHECK] Muammolarni aniqlash va bartaraf etish
[CHECK] Ehtiyot qismlar haqida (original vs analog, narxlar, brendlar)
[CHECK] Sifatli ish bajarish bo'yicha maslahatlar
[CHECK] Texnik xizmat ko'rsatish jadvallari
[CHECK] Ish vaqti va narx taxminlari
[CHECK] Tizimdan qanday foydalanish (vazifalarni qanday boshlash, tugatish)
[CHECK] AI Diagnostika sahifasidan qanday foydalanish
YORDAM BERA OLMAYSIZ:
[X] Moliyaviy hisobotlar va ish haqi masalalari
[X] Vazifa berish (faqat usta qila oladi)
[X] Boshqa shogirtlar haqida shaxsiy ma'lumot
[X] Avto servisdan tashqari mavzular
JAVOB BERISH STRUKTURASI:
1. [CLIPBOARD] Muammoni/savolni professional tahlil qiling
2. [SEARCH] Aniq diagnostika yoki tekshirish usullari
3. [WRENCH] Bosqichma-bosqich bajarish tartibi (aniq qadamlar)
4. [LIGHTBULB] Kerakli ehtiyot qismlar va asboblar (narxlar bilan)
5. [WARNING] Xavfsizlik choralari (majburiy!)
6. [LIGHTBULB] Qo'shimcha maslahatlar va oldini olish
MUHIM: 
- Har doim aniq, texnik jihatdan to'g'ri va amaliy javob bering. Xavfsizlikni birinchi o'ringa qo'ying!
- Agar shogird "ustoz", "usta", "loyiha rahbari", "master", "kim o'rgatadi" yoki shunga o'xshash savollar bersa, javobda "Sardor Safarov" nomini aytasiz.`,
  master: `Siz Mator Life professional boshqaruv maslahatchisi - AutoMaster PRO AI siz.
LOYIHA HAQIDA MA'LUMOT:
Bu "Mator Life" - Buxoro G'ijduvon tumanida joylashgan avtomobil ta'mirlash xizmatlarini boshqarish tizimi.
Manzil: UZ Daewoo service yonida
Telefon: +998 91 251 36 36
Ish vaqti: Dushanba - Shanba, 9:00 - 21:00
LOYIHA RAHBARI / USTOZ / USTA: Sardor Safarov (Siz)
MASTER PANELI FUNKSIYALARI:
1. DASHBOARD:
   - Umumiy statistika (vazifalar, qarzlar, shogirtlar)
   - Bugungi vazifalar
   - Kutilayotgan to'lovlar
   - Tezkor ko'rsatkichlar
2. VAZIFALAR sahifasi:
   - Yangi vazifa yaratish (shogirtga tayinlash)
   - Vazifalarni filtrlash (status, prioritet, shogirt)
   - Bajarilgan ishlarni tasdiqlash yoki rad etish
   - Vazifa tafsilotlarini ko'rish va tahrirlash
3. MASHINALAR sahifasi:
   - Yangi mashina qo'shish (marka, model, yil, raqam)
   - Ehtiyot qismlar qo'shish va boshqarish
   - Umumiy smeta hisoblash
   - Mashina statusini yangilash (pending, in-progress, completed, delivered)
4. XIZMATLAR sahifasi:
   - Yangi xizmat yaratish (nom, narx, kategoriya, vaqt)
   - Xizmatlarni tahrirlash va o'chirish
   - Xizmat kategoriyalarini boshqarish
   - Faol/nofaol xizmatlar
5. QARZLAR sahifasi:
   - Qabul qilinadigan qarzlar (receivable - bizga qarzdorlar)
   - To'lanadigan qarzlar (payable - biz qarzdormiz)
   - To'lov tarixi
   - Qarz statusini yangilash (pending, partial, paid)
6. SHOGIRTLAR sahifasi:
   - Barcha shogirtlar ro'yxati
   - Har bir shogirdning statistikasi
   - Shogird tafsilotlarini ko'rish
SIZNING BILIMLARINGIZ:
- Avtomobil ta'mirlash biznesini boshqarish
- Ish jarayonlarini optimallashtirish
- Sifat nazorati va standartlar
- Xodimlar bilan ishlash va o'qitish
- Moliyaviy boshqaruv va hisobotlar
- Mijozlar bilan ishlash
- Ehtiyot qismlar bozori va narxlar
- Zamonaviy diagnostika uskunalari
- Barcha avtomobil tizimlari bo'yicha chuqur bilim
- Auto Service tizimining barcha funksiyalari
SIZNING ROLINGIZ: Ustaga boshqaruv, tahlil va qaror qabul qilishda yordam
ASOSIY QOIDALAR:
[CHECK] Har doim o'zbek tilida (lotin) javob bering
[CHECK] Professional, qisqa va aniq javob bering
[CHECK] Boshqaruvga yo'naltirilgan amaliy maslahatlar bering
[CHECK] Ustaning savoliga 100% javob bering
[CHECK] Ma'lumotlarga asoslangan tahlil va tavsiyalar bering
YORDAM BERA OLASIZ:
[CHECK] Shogirtlarga kunlik vazifalar berish bo'yicha professional tavsiyalar
[CHECK] Bajarilgan ishlarni tekshirish mezonlari va sifat nazorati
[CHECK] Hisobotlarni tasdiqlash yoki rad etish uchun aniq sabablar
[CHECK] Qarz daftarchasi va moliyaviy boshqaruv
[CHECK] Xizmat statistikasi tahlili va hisobotlar
[CHECK] Ish jarayonini optimallashtirish va samaradorlikni oshirish
[CHECK] Resurslarni to'g'ri taqsimlash
[CHECK] Muammoli vaziyatlarni hal qilish bo'yicha maslahatlar
[CHECK] Xodimlar bilan ishlash va motivatsiya
[CHECK] Narxlarni belgilash va rentabellik tahlili
[CHECK] Ehtiyot qismlar sotib olish strategiyasi
[CHECK] Mijozlar bilan ishlash va xizmat sifati
[CHECK] Tizimdan qanday foydalanish (vazifa yaratish, tasdiqlash, qarz boshqarish)
[CHECK] Har bir sahifada qanday funksiyalar bor
YORDAM BERA OLMAYSIZ:
[X] Avto servisdan mutlaqo tashqari mavzular
[X] Shaxsiy va moliyaviy maslahatlar
[X] Huquqiy maslahatlar (faqat umumiy ma'lumot)
JAVOB BERISH STRUKTURASI:
1. [CHART] Vaziyatni professional tahlil qilish
2. [LIGHTBULB] Aniq tavsiya yoki yechim
3. [ZAPLIGHTNING] Amaliy qadamlar
4. [TRENDING] Kutilayotgan natija va foyda
MUHIM:
- Javoblaringiz qisqa, aniq, amaliy va samarali bo'lsin. Ustaning vaqtini tejang va eng muhim ma'lumotni bering.
- Agar ustoz o'zi haqida yoki loyiha rahbari haqida so'rasa, "Sardor Safarov" nomini eslatib o'ting.`
};
export const sendChatMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { message, sessionId, language } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'Xabar bo\'sh bo\'lishi mumkin emas' });
    }
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID kerak' });
    }
    // Get user's preferred language (default to latin)
    const userLanguage: 'latin' | 'cyrillic' = language || 'latin';
    // Determine user role
    let userRole: 'client' | 'apprentice' | 'master' = 'client';
    let masterId = null;
    if (req.user) {
      userRole = req.user.role === 'master' ? 'master' : 'apprentice';
      // If apprentice, find their master
      if (userRole === 'apprentice') {
        // For now, get the first master (you can improve this logic)
        const master = await User.findOne({ role: 'master' });
        if (master) {
          masterId = master._id;
        }
      } else if (userRole === 'master') {
        masterId = req.user._id;
      }
    }
    // Build dynamic project context from database
    let projectContext = '\n\n=== LOYIHA REAL MA\'LUMOTLARI ===\n';
    try {
      // Get all active services
      const services = await Service.find({ isActive: true })
        .select('name description basePrice category estimatedHours')
        .limit(50)
        .lean();
      if (services.length > 0) {
        projectContext += '\n--- MAVJUD XIZMATLAR ---\n';
        services.forEach((service: any, index: number) => {
          projectContext += `${index + 1}. ${service.name}\n`;
          projectContext += `   Tavsif: ${service.description}\n`;
          projectContext += `   Narx: ${service.basePrice.toLocaleString()} so'm\n`;
          projectContext += `   Kategoriya: ${service.category}\n`;
          projectContext += `   Taxminiy vaqt: ${service.estimatedHours} soat\n\n`;
        });
      }
      // Get recent cars (last 20)
      const cars = await Car.find()
        .select('make carModel year licensePlate ownerName ownerPhone status totalEstimate')
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      if (cars.length > 0) {
        projectContext += '\n--- OXIRGI MASHINALAR ---\n';
        cars.forEach((car: any, index: number) => {
          projectContext += `${index + 1}. ${car.make} ${car.carModel} (${car.year})\n`;
          projectContext += `   Raqam: ${car.licensePlate}\n`;
          projectContext += `   Egasi: ${car.ownerName} (${car.ownerPhone})\n`;
          projectContext += `   Status: ${car.status}\n`;
          projectContext += `   Smeta: ${car.totalEstimate.toLocaleString()} so'm\n\n`;
        });
      }
      // Get pending debts
      const debts = await Debt.find({ status: { $in: ['pending', 'partial'] } })
        .select('type amount creditorName creditorPhone description status paidAmount')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean();
      if (debts.length > 0) {
        projectContext += '\n--- QARZLAR ---\n';
        const receivables = debts.filter((d: any) => d.type === 'receivable');
        const payables = debts.filter((d: any) => d.type === 'payable');
        if (receivables.length > 0) {
          projectContext += 'Bizga qarzdorlar:\n';
          receivables.forEach((debt: any, index: number) => {
            const remaining = debt.amount - debt.paidAmount;
            projectContext += `${index + 1}. ${debt.creditorName} (${debt.creditorPhone || 'telefon yo\'q'})\n`;
            projectContext += `   Qarz: ${debt.amount.toLocaleString()} so'm\n`;
            projectContext += `   To\'langan: ${debt.paidAmount.toLocaleString()} so'm\n`;
            projectContext += `   Qolgan: ${remaining.toLocaleString()} so'm\n`;
            projectContext += `   Tavsif: ${debt.description || 'Tavsif yo\'q'}\n\n`;
          });
        }
        if (payables.length > 0) {
          projectContext += 'Biz qarzdormiz:\n';
          payables.forEach((debt: any, index: number) => {
            const remaining = debt.amount - debt.paidAmount;
            projectContext += `${index + 1}. ${debt.creditorName} (${debt.creditorPhone || 'telefon yo\'q'})\n`;
            projectContext += `   Qarz: ${debt.amount.toLocaleString()} so'm\n`;
            projectContext += `   To\'langan: ${debt.paidAmount.toLocaleString()} so'm\n`;
            projectContext += `   Qolgan: ${remaining.toLocaleString()} so'm\n`;
            projectContext += `   Tavsif: ${debt.description || 'Tavsif yo\'q'}\n\n`;
          });
        }
      }
      // Get all users (masters and apprentices)
      const users = await User.find()
        .select('name username role earnings')
        .lean();
      if (users.length > 0) {
        projectContext += '\n--- JAMOA A\'ZOLARI ---\n';
        const masters = users.filter((u: any) => u.role === 'master');
        const apprentices = users.filter((u: any) => u.role === 'apprentice');
        if (masters.length > 0) {
          projectContext += 'Ustalar:\n';
          masters.forEach((user: any, index: number) => {
            projectContext += `${index + 1}. ${user.name} (@${user.username})\n`;
            projectContext += `   Daromad: ${user.earnings.toLocaleString()} so'm\n\n`;
          });
        }
        if (apprentices.length > 0) {
          projectContext += 'Shogirtlar:\n';
          apprentices.forEach((user: any, index: number) => {
            projectContext += `${index + 1}. ${user.name} (@${user.username})\n`;
            projectContext += `   Daromad: ${user.earnings.toLocaleString()} so'm\n\n`;
          });
        }
      }
      projectContext += '=== REAL MA\'LUMOTLAR TUGADI ===\n\n';
      projectContext += 'MUHIM: Yuqoridagi ma\'lumotlar loyihadagi real ma\'lumotlar. Foydalanuvchi bu ma\'lumotlar haqida so\'rasa, aniq javob bering!\n\n';
    } catch (error) {
      // Continue without project context if fetch fails
    }
    // Search knowledge base if user is apprentice or master
    let knowledgeContext = '';
    if (masterId) {
      try {
        const knowledgeResults = await KnowledgeBase.find({
          master: masterId,
          isActive: true,
          $text: { $search: message.trim() }
        })
        .select('carModel problem solution category')
        .limit(3)
        .lean();
        if (knowledgeResults.length > 0) {
          knowledgeContext = '\n\n=== USTOZ BILIMLAR BAZASI ===\n';
          knowledgeContext += 'Ustoz tomonidan qo\'shilgan ma\'lumotlar:\n\n';
          knowledgeResults.forEach((kb: any, index: number) => {
            knowledgeContext += `${index + 1}. MASHINA: ${kb.carModel}\n`;
            knowledgeContext += `   MUAMMO: ${kb.problem}\n`;
            knowledgeContext += `   YECHIM: ${kb.solution}\n`;
            if (kb.category) {
              knowledgeContext += `   KATEGORIYA: ${kb.category}\n`;
            }
            knowledgeContext += '\n';
          });
          knowledgeContext += 'MUHIM: Agar foydalanuvchi savoli yuqoridagi ma\'lumotlarga mos kelsa, ustoz bergan yechimni ishlatib javob bering. Ustoz tajribasiga asoslangan ma\'lumot ekanligini ta\'kidlang.\n';
          knowledgeContext += '=== BILIMLAR BAZASI TUGADI ===\n\n';
        }
      } catch (error) {
        // Continue without knowledge base if search fails
      }
    }
    // Get conversation history (last 10 messages)
    const history = await ChatMessage.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();
    // Save user message
    const userMessage = new ChatMessage({
      user: req.user?._id,
      sessionId,
      role: 'user',
      content: message.trim(),
      userRole
    });
    await userMessage.save();
    // Prepare messages for AI
    const messages: any[] = [
      {
        role: 'system',
        content: SYSTEM_PROMPTS[userRole] + projectContext + knowledgeContext
      }
    ];
    // Add history in reverse order (oldest first)
    history.reverse().forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
    // Add current message
    messages.push({
      role: 'user',
      content: message.trim()
    });
    // Call Groq AI
    const groq = getGroqClient();
    const chatCompletion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.15, // Juda past - maksimal aniqlik, izchillik va professional javoblar
      max_tokens: 3000, // Yetarli uzun va batafsil javoblar
      top_p: 0.9, // Yuqori sifat va aniqlik
      frequency_penalty: 0.5, // Takrorlanishni sezilarli kamaytirish
      presence_penalty: 0.3, // Yangi ma'lumot va turli mavzularni qamrab olish
    });
    const aiResponse = chatCompletion.choices[0]?.message?.content || 
      'Kechirasiz, javob olishda xatolik yuz berdi.';
    // Har bir jumlaning birinchi harfini katta qilish
    const capitalizeFirstLetter = (text: string): string => {
      // Har bir yangi qatordan keyin birinchi harfni katta qilish
      return text.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed.length === 0) return line;
        // Agar qator belgi bilan boshlansa (•, -, *, raqam, [TAG]), undan keyingi birinchi harfni katta qilish
        const match = trimmed.match(/^(\[[\w]+\]\s*|[•\-*\d.]+\s*)/);
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
    const formattedResponse = capitalizeFirstLetter(aiResponse);
    // Transliterate response based on user's language preference
    const transliteratedResponse = transliterate(formattedResponse, userLanguage);
    // Save AI response
    const assistantMessage = new ChatMessage({
      user: req.user?._id,
      sessionId,
      role: 'assistant',
      content: transliteratedResponse,
      userRole
    });
    await assistantMessage.save();
    // UNLIMITED MESSAGES - No subscription tracking
    res.json({
      success: true,
      message: transliteratedResponse,
      userRole,
      subscription: null // No subscription limits
    });
  } catch (error: any) {
    console.error('Chat error:', error);
    
    if (error.status === 401) {
      return res.status(500).json({ 
        success: false,
        message: 'AI xizmati sozlanmagan' 
      });
    }
    
    // Groq API error
    if (error.error?.message) {
      return res.status(500).json({ 
        success: false,
        message: 'AI xizmatida xatolik',
        error: error.error.message 
      });
    }
    
    res.status(500).json({ 
      success: false,
      message: 'Xabar yuborishda xatolik',
      error: error.message 
    });
  }
};
export const getChatHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { limit = 50 } = req.query;
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID kerak' });
    }
    const messages = await ChatMessage.find({ sessionId })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean();
    res.json({
      success: true,
      messages: messages.reverse(),
      count: messages.length
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Tarix olishda xatolik',
      error: error.message 
    });
  }
};
export const clearChatHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId) {
      return res.status(400).json({ message: 'Session ID kerak' });
    }
    await ChatMessage.deleteMany({ sessionId });
    res.json({
      success: true,
      message: 'Chat tarixi tozalandi'
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Tarixni tozalashda xatolik',
      error: error.message 
    });
  }
};
export const getSubscriptionStatus = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.json({
        plan: 'free',
        status: 'active',
        messageLimit: 10,
        messagesUsed: 0,
        remaining: 10
      });
    }
    let subscription = await Subscription.findOne({ user: req.user._id });
    if (!subscription) {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      subscription = new Subscription({
        user: req.user._id,
        plan: 'free',
        status: 'active',
        endDate,
        messageLimit: 10,
        messagesUsed: 0
      });
      await subscription.save();
    }
    res.json({
      plan: subscription.plan,
      status: subscription.status,
      messageLimit: subscription.messageLimit,
      messagesUsed: subscription.messagesUsed,
      remaining: subscription.plan === 'pro' 
        ? 'unlimited' 
        : subscription.messageLimit - subscription.messagesUsed,
      endDate: subscription.endDate
    });
  } catch (error: any) {
    res.status(500).json({ 
      message: 'Obuna ma\'lumotini olishda xatolik',
      error: error.message 
    });
  }
};
