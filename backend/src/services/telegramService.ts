import TelegramBot from 'node-telegram-bot-api';
import fs from 'fs';
import path from 'path';
import cron from 'node-cron';

class TelegramService {
  private carBot: TelegramBot | null = null; // Avtomobil uchun bot
  private debtBot: TelegramBot | null = null; // Qarz uchun bot
  private phoneNumbersFilePath: string;
  private carPhoneNumbersFilePath: string;
  private phoneNumbersToChatId: Map<string, string> = new Map(); // Qarz bot uchun
  private carPhoneNumbersToChatId: Map<string, string> = new Map(); // Car bot uchun

  constructor() {
    this.phoneNumbersFilePath = path.join(__dirname, '../../telegram-phone-numbers.json');
    this.carPhoneNumbersFilePath = path.join(__dirname, '../../telegram-car-phone-numbers.json');
    
    const carToken = process.env.TELEGRAM_BOT_TOKEN_CAR;
    const debtToken = process.env.TELEGRAM_BOT_TOKEN_DEBT;
    const isProduction = process.env.NODE_ENV === 'production';
    const webhookUrl = process.env.WEBHOOK_URL; // e.g., https://biznes.uz/api/telegram

    // Avtomobil bot
    if (carToken) {
      try {
        if (isProduction && webhookUrl) {
          this.carBot = new TelegramBot(carToken, { webHook: false });
          this.setupWebhook(this.carBot, `${webhookUrl}/car`);
        } else {
          this.carBot = new TelegramBot(carToken, { polling: { interval: 1000, autoStart: true } });
        }
        this.loadCarPhoneNumbers();
        this.setupCarBot();
      } catch (error: any) {
        console.error('⚠️ Car Telegram bot initialization failed:', error.message);
        this.carBot = null;
      }
    }

    // Qarz bot
    if (debtToken) {
      try {
        if (isProduction && webhookUrl) {
          this.debtBot = new TelegramBot(debtToken, { webHook: false });
          this.setupWebhook(this.debtBot, `${webhookUrl}/debt`);
        } else {
          this.debtBot = new TelegramBot(debtToken, { polling: { interval: 1000, autoStart: true } });
        }
        this.loadPhoneNumbers();
        this.setupDebtBot();
        this.setupDebtReminders();
      } catch (error: any) {
        console.error('⚠️ Debt Telegram bot initialization failed:', error.message);
        this.debtBot = null;
      }
    }
  }

  private async setupWebhook(bot: TelegramBot, webhookPath: string) {
    try {
      try {
        await bot.deleteWebHook();
      } catch {
        // Ignore errors
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      await bot.setWebHook(webhookPath);
    } catch {
      // Ignore errors
    }
  }

  private loadCarPhoneNumbers() {
    try {
      if (fs.existsSync(this.carPhoneNumbersFilePath)) {
        const data = fs.readFileSync(this.carPhoneNumbersFilePath, 'utf-8');
        const phoneData = JSON.parse(data);
        this.carPhoneNumbersToChatId = new Map(Object.entries(phoneData));
      }
    } catch {
      this.saveCarPhoneNumbers();
    }
  }

  private saveCarPhoneNumbers() {
    try {
      const phoneData = Object.fromEntries(this.carPhoneNumbersToChatId);
      fs.writeFileSync(this.carPhoneNumbersFilePath, JSON.stringify(phoneData, null, 2));
    } catch {
      // Ignore errors
    }
  }

  private loadPhoneNumbers() {
    try {
      if (fs.existsSync(this.phoneNumbersFilePath)) {
        const data = fs.readFileSync(this.phoneNumbersFilePath, 'utf-8');
        const phoneData = JSON.parse(data);
        this.phoneNumbersToChatId = new Map(Object.entries(phoneData));
      }
    } catch {
      this.savePhoneNumbers();
    }
  }

  private savePhoneNumbers() {
    try {
      const phoneData = Object.fromEntries(this.phoneNumbersToChatId);
      fs.writeFileSync(this.phoneNumbersFilePath, JSON.stringify(phoneData, null, 2));
    } catch {
      // Ignore errors
    }
  }

  // Avtomobil bot setup
  private setupCarBot() {
    if (!this.carBot) return;

    this.carBot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id.toString();
      const adminChatId = process.env.ADMIN_CHAT_ID;
      
      // Admin tekshiruvi
      if (adminChatId && chatId === adminChatId) {
        this.carBot?.sendMessage(chatId, `
� <b>tSalom Admin!</b> 👋

✅ <b>Mator Life Car Bot - Admin Panel</b>
📱 Admin Chat ID: <code>${chatId}</code>

━━━━━━━━━━━━━━━━━━━━
🎛️ <b>Admin Imkoniyatlari:</b>

• 🚗 Yangi mashina qo'shilganda xabar olasiz
• 📊 Barcha mashina ma'lumotlarini ko'rasiz
• 👥 Mijozlar bilan bog'lanish ma'lumotlari
• 💰 Narx va xizmat ma'lumotlari
• 📈 Tizim statistikalari

━━━━━━━━━━━━━━━━━━━━
� <b>Xab ar Turlari:</b>
• Yangi mashina qo'shildi
• Mashina ma'lumotlari yangilandi
• Mashina tayyor bo'ldi
• Mashina topshirildi

🎯 <b>Siz barcha admin xabarlarini avtomatik olasiz!</b>
        `.trim(), { 
          parse_mode: 'HTML'
        });
      } else {
        // Oddiy foydalanuvchi uchun
        this.carBot?.sendMessage(chatId, `
🎉 <b>Xush kelibsiz Mator Life Car Bot'ga!</b>

✅ Bot muvaffaqiyatli ulandi!
📱 Chat ID: <code>${chatId}</code>

<b>Mashina xabarnomalarini olish uchun:</b>
Telefon raqamingizni yuboring (pastdagi tugmani bosing yoki raqamni yozing)

<b>Format:</b> +998901234567 yoki 998901234567

Endi:
• Sizning mashinangiz qo'shilganda xabar olasiz
• Mashina va qismlar haqida ma'lumot olasiz
        `.trim(), { 
          parse_mode: 'HTML',
          reply_markup: {
            keyboard: [
              [{ text: '📱 Telefon raqamni yuborish', request_contact: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }
    });

    this.carBot.on('contact', (msg) => {
      const chatId = msg.chat.id.toString();
      const phoneNumber = msg.contact?.phone_number;
      const adminChatId = process.env.ADMIN_CHAT_ID;

      if (phoneNumber) {
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        
        // Admin tekshiruvi
        if (adminChatId && chatId === adminChatId) {
          this.carBot?.sendMessage(chatId, `
🔥 <b>Salom Admin!</b> 👋

✅ <b>Admin telefon raqami saqlandi!</b>
📱 Admin Chat ID: <code>${chatId}</code>
📞 Admin telefon: <code>+${cleanPhone}</code>

━━━━━━━━━━━━━━━━━━━━
🎛️ <b>Admin sifatida siz:</b>
• Barcha xabarlarni avtomatik olasiz
• Mijozlar bilan bog'lanish imkoniyati
• To'liq admin paneli
• Tizim statistikalari

🎯 <b>Admin huquqlari faollashtirildi!</b>
          `.trim(), { 
            parse_mode: 'HTML',
            reply_markup: {
              remove_keyboard: true
            }
          });
        } else {
          // Oddiy foydalanuvchi uchun
          this.carBot?.sendMessage(chatId, `
✅ <b>Telefon raqam muvaffaqiyatli saqlandi!</b>

📱 Raqam: <code>+${cleanPhone}</code>
💬 Chat ID: <code>${chatId}</code>

Endi sizning mashinangiz qo'shilganda xabar olasiz! 🎉
          `.trim(), { 
            parse_mode: 'HTML',
            reply_markup: {
              remove_keyboard: true
            }
          });
        }
        
        this.carPhoneNumbersToChatId.set(cleanPhone, chatId);
        this.saveCarPhoneNumbers();
      }
    });

    this.carBot.on('text', (msg) => {
      const chatId = msg.chat.id.toString();
      const text = msg.text;
      const adminChatId = process.env.ADMIN_CHAT_ID;

      if (!text || text.startsWith('/')) return;

      const phoneRegex = /^(\+?998)?[0-9]{9}$/;
      const cleanText = text.replace(/[\s\-\(\)]/g, '');

      if (phoneRegex.test(cleanText)) {
        let cleanPhone = cleanText.replace(/[^0-9]/g, '');
        
        if (!cleanPhone.startsWith('998')) {
          cleanPhone = '998' + cleanPhone;
        }

        // Admin tekshiruvi
        if (adminChatId && chatId === adminChatId) {
          this.carBot?.sendMessage(chatId, `
🔥 <b>Salom Admin!</b> 👋

✅ <b>Admin telefon raqami saqlandi!</b>
� CAdmin Chat ID: <code>${chatId}</code>
📞 Admin telefon: <code>+${cleanPhone}</code>

━━━━━━━━━━━━━━━━━━━━
🎛️ <b>Admin sifatida siz:</b>
• Barcha xabarlarni avtomatik olasiz
• Mijozlar bilan bog'lanish imkoniyati
• To'liq admin paneli
• Tizim statistikalari

🎯 <b>Admin huquqlari faollashtirildi!</b>
          `.trim(), { parse_mode: 'HTML' });
        } else {
          // Oddiy foydalanuvchi uchun
          this.carBot?.sendMessage(chatId, `
✅ <b>Telefon raqam muvaffaqiyatli saqlandi!</b>

📱 Raqam: <code>+${cleanPhone}</code>
💬 Chat ID: <code>${chatId}</code>

Endi sizning mashinangiz qo'shilganda xabar olasiz! 🎉
          `.trim(), { parse_mode: 'HTML' });
        }

        this.carPhoneNumbersToChatId.set(cleanPhone, chatId);
        this.saveCarPhoneNumbers();
      }
    });

    this.carBot.on('polling_error', () => {
      // Ignore polling errors
    });
  }

  // Qarz bot setup
  private setupDebtBot() {
    if (!this.debtBot) return;

    this.debtBot.onText(/\/start/, (msg) => {
      const chatId = msg.chat.id.toString();
      const adminChatId = process.env.ADMIN_CHAT_ID;
      
      // Admin tekshiruvi
      if (adminChatId && chatId === adminChatId) {
        this.debtBot?.sendMessage(chatId, `
� <b>SalDom Admin!</b> 👋

✅ <b>Mator Life Debt Bot - Admin Panel</b>
📱 Admin Chat ID: <code>${chatId}</code>

━━━━━━━━━━━━━━━━━━━━
🎛️ <b>Admin Imkoniyatlari:</b>

• 💰 Yangi qarz qo'shilganda xabar olasiz
• 💳 To'lovlar haqida ma'lumot olasiz
• 👥 Mijozlar bilan bog'lanish ma'lumotlari
• 📊 Qarz statistikalari
• ⏰ Eslatmalar tizimi

━━━━━━━━━━━━━━━━━━━━
� <b>Xabar Turlari:</b>
• Yangi qarz qo'shildi
• To'lov qabul qilindi
• Qarz eslatmalari
• Qarz holati o'zgarishi

━━━━━━━━━━━━━━━━━━━━
⏰ <b>Avtomatik Eslatmalar:</b>
Har kuni soat 8:00 da qarz eslatmalari yuboriladi

🎯 <b>Siz barcha admin xabarlarini avtomatik olasiz!</b>
        `.trim(), { 
          parse_mode: 'HTML'
        });
      } else {
        // Oddiy foydalanuvchi uchun
        this.debtBot?.sendMessage(chatId, `
🎉 <b>Xush kelibsiz Mator Life Debt Bot'ga!</b>

✅ Bot muvaffaqiyatli ulandi!
📱 Chat ID: <code>${chatId}</code>

<b>Qarz xabarnomalarini olish uchun:</b>
Telefon raqamingizni yuboring (pastdagi tugmani bosing yoki raqamni yozing)

<b>Format:</b> +998901234567 yoki 998901234567

Endi:
• Sizga qarz qo'yilganda xabar olasiz
• Har kuni ertalab soat 8:00 da qarz eslatmalari keladi
        `.trim(), { 
          parse_mode: 'HTML',
          reply_markup: {
            keyboard: [
              [{ text: '📱 Telefon raqamni yuborish', request_contact: true }]
            ],
            resize_keyboard: true,
            one_time_keyboard: true
          }
        });
      }
    });

    this.debtBot.on('contact', (msg) => {
      const chatId = msg.chat.id.toString();
      const phoneNumber = msg.contact?.phone_number;
      const adminChatId = process.env.ADMIN_CHAT_ID;

      if (phoneNumber) {
        const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
        
        // Admin tekshiruvi
        if (adminChatId && chatId === adminChatId) {
          this.debtBot?.sendMessage(chatId, `
🔥 <b>Salom Admin!</b> 👋

✅ <b>Admin telefon raqami saqlandi!</b>
📱 Admin Chat ID: <code>${chatId}</code>
📞 Admin telefon: <code>+${cleanPhone}</code>

━━━━━━━━━━━━━━━━━━━━
🎛️ <b>Admin sifatida siz:</b>
• Barcha qarz xabarlarini avtomatik olasiz
• To'lov ma'lumotlarini olasiz
• Mijozlar bilan bog'lanish imkoniyati
• Qarz statistikalari
• Eslatmalar tizimi

🎯 <b>Admin huquqlari faollashtirildi!</b>
          `.trim(), { 
            parse_mode: 'HTML',
            reply_markup: {
              remove_keyboard: true
            }
          });
        } else {
          // Oddiy foydalanuvchi uchun
          this.debtBot?.sendMessage(chatId, `
✅ <b>Telefon raqam muvaffaqiyatli saqlandi!</b>

📱 Raqam: <code>+${cleanPhone}</code>
💬 Chat ID: <code>${chatId}</code>

Endi sizga qarz qo'yilganda xabar olasiz! 🎉
          `.trim(), { 
            parse_mode: 'HTML',
            reply_markup: {
              remove_keyboard: true
            }
          });
        }
        
        this.phoneNumbersToChatId.set(cleanPhone, chatId);
        this.savePhoneNumbers();
      }
    });

    this.debtBot.on('text', (msg) => {
      const chatId = msg.chat.id.toString();
      const text = msg.text;
      const adminChatId = process.env.ADMIN_CHAT_ID;

      if (!text || text.startsWith('/')) return;

      const phoneRegex = /^(\+?998)?[0-9]{9}$/;
      const cleanText = text.replace(/[\s\-\(\)]/g, '');

      if (phoneRegex.test(cleanText)) {
        let cleanPhone = cleanText.replace(/[^0-9]/g, '');
        
        if (!cleanPhone.startsWith('998')) {
          cleanPhone = '998' + cleanPhone;
        }

        // Admin tekshiruvi
        if (adminChatId && chatId === adminChatId) {
          this.debtBot?.sendMessage(chatId, `
🔥 <b>Salom Admin!</b> 👋

✅ <b>Admin telefon raqami saqlandi!</b>
�  Admin Chat ID: <code>${chatId}</code>
📞 Admin telefon: <code>+${cleanPhone}</code>

━━━━━━━━━━━━━━━━━━━━
🎛️ <b>Admin sifatida siz:</b>
• Barcha qarz xabarlarini avtomatik olasiz
• To'lov ma'lumotlarini olasiz
• Mijozlar bilan bog'lanish imkoniyati
• Qarz statistikalari
• Eslatmalar tizimi

🎯 <b>Admin huquqlari faollashtirildi!</b>
          `.trim(), { parse_mode: 'HTML' });
        } else {
          // Oddiy foydalanuvchi uchun
          this.debtBot?.sendMessage(chatId, `
✅ <b>Telefon raqam muvaffaqiyatli saqlandi!</b>

📱 Raqam: <code>+${cleanPhone}</code>
💬 Chat ID: <code>${chatId}</code>

Endi sizga qarz qo'yilganda xabar olasiz! 🎉
          `.trim(), { parse_mode: 'HTML' });
        }

        this.phoneNumbersToChatId.set(cleanPhone, chatId);
        this.savePhoneNumbers();
      }
    });

    this.debtBot.on('polling_error', () => {
      // Ignore polling errors
    });
  }

  async sendCarUpdatedNotification(carData: any, parts: any[], serviceItems: any[]) {
    if (!this.carBot) {
      return { success: false, message: 'Bot not configured' };
    }

    try {
      // Telefon raqamini tozalash - barcha belgilarni olib tashlash
      let cleanPhone = carData.ownerPhone.replace(/[^0-9]/g, '');
      
      // Agar 998 bilan boshlanmasa, qo'shish
      if (!cleanPhone.startsWith('998')) {
        cleanPhone = '998' + cleanPhone;
      }

      console.log('🔍 Telegram Update Debug Info:');
      console.log('Original phone:', carData.ownerPhone);
      console.log('Clean phone:', cleanPhone);

      const userChatId = this.carPhoneNumbersToChatId.get(cleanPhone);
      const adminChatId = process.env.ADMIN_CHAT_ID;

      let sentToUser = false;
      let sentToAdmin = false;

      const message = this.formatCarUpdateMessage(carData, parts, serviceItems);

      // Mijozga xabar yuborish
      if (userChatId) {
        try {
          await this.carBot.sendMessage(userChatId, message, { parse_mode: 'HTML' });
          sentToUser = true;
          console.log('✅ Mijozga yangilanish xabari yuborildi');
        } catch (error) {
          console.error('❌ Mijozga yangilanish xabarini yuborishda xatolik:', error);
        }
      } else {
        console.log('⚠️ Mijoz botda ro\'yxatdan o\'tmagan:', cleanPhone);
      }

      // Adminga xabar yuborish (har doim)
      if (adminChatId) {
        try {
          const adminMessage = this.formatCarUpdateMessageForAdmin(carData, parts, serviceItems);
          await this.carBot.sendMessage(adminChatId, adminMessage, { parse_mode: 'HTML' });
          sentToAdmin = true;
          console.log('✅ Adminga yangilanish xabari yuborildi');
        } catch (error) {
          console.error('❌ Adminga yangilanish xabarini yuborishda xatolik:', error);
        }
      }

      // Natijani qaytarish
      if (sentToUser && sentToAdmin) {
        return { success: true, message: 'Yangilanish xabari mijoz va adminga yuborildi' };
      } else if (sentToAdmin && !sentToUser) {
        return { success: true, message: 'Yangilanish xabari adminga yuborildi. Mijoz botda ro\'yxatdan o\'tmagan' };
      } else if (sentToUser && !sentToAdmin) {
        return { success: true, message: 'Yangilanish xabari mijozga yuborildi. Admin konfiguratsiya qilinmagan' };
      } else {
        return { success: false, message: 'Yangilanish xabari yuborilmadi. Bot konfiguratsiyasini tekshiring' };
      }
    } catch (error: any) {
      console.error('❌ Telegram yangilanish xabarini yuborishda umumiy xatolik:', error);
      return { success: false, message: error.message };
    }
  }

  async sendCarAddedNotification(carData: any, parts: any[]) {
    if (!this.carBot) {
      console.log('❌ Car bot not configured');
      return { success: false, message: 'Bot not configured' };
    }

    try {
      // Telefon raqamini tozalash - barcha belgilarni olib tashlash
      let cleanPhone = carData.ownerPhone.replace(/[^0-9]/g, '');
      
      // Agar 998 bilan boshlanmasa, qo'shish
      if (!cleanPhone.startsWith('998')) {
        cleanPhone = '998' + cleanPhone;
      }

      console.log('🔍 Telegram Debug Info:');
      console.log('Original phone:', carData.ownerPhone);
      console.log('Clean phone:', cleanPhone);
      console.log('Registered phones:', Array.from(this.carPhoneNumbersToChatId.keys()));

      const userChatId = this.carPhoneNumbersToChatId.get(cleanPhone);
      const adminChatId = process.env.ADMIN_CHAT_ID;

      console.log('User chat ID:', userChatId);
      console.log('Admin chat ID:', adminChatId);
      console.log('Bot instance exists:', !!this.carBot);

      let sentToUser = false;
      let sentToAdmin = false;

      const message = this.formatCarMessage(carData, parts);

      // Mijozga xabar yuborish
      if (userChatId) {
        try {
          console.log('🚀 Mijozga xabar yuborilmoqda...');
          await this.carBot.sendMessage(userChatId, message, { parse_mode: 'HTML' });
          sentToUser = true;
          console.log('✅ Mijozga xabar yuborildi');
        } catch (error) {
          console.error('❌ Mijozga xabar yuborishda xatolik:', error);
        }
      } else {
        console.log('⚠️ Mijoz botda ro\'yxatdan o\'tmagan:', cleanPhone);
        console.log('⚠️ Mavjud raqamlar:', Array.from(this.carPhoneNumbersToChatId.keys()));
      }

      // Adminga xabar yuborish (har doim)
      if (adminChatId) {
        try {
          console.log('🚀 Adminga xabar yuborilmoqda...');
          const adminMessage = this.formatCarMessageForAdmin(carData, parts);
          await this.carBot.sendMessage(adminChatId, adminMessage, { parse_mode: 'HTML' });
          sentToAdmin = true;
          console.log('✅ Adminga xabar yuborildi');
        } catch (error) {
          console.error('❌ Adminga xabar yuborishda xatolik:', error);
        }
      } else {
        console.log('⚠️ Admin chat ID konfiguratsiya qilinmagan');
      }

      // Natijani qaytarish
      if (sentToUser && sentToAdmin) {
        return { success: true, message: 'Xabar mijoz va adminga yuborildi' };
      } else if (sentToAdmin && !sentToUser) {
        return { success: true, message: 'Xabar adminga yuborildi. Mijoz botda ro\'yxatdan o\'tmagan' };
      } else if (sentToUser && !sentToAdmin) {
        return { success: true, message: 'Xabar mijozga yuborildi. Admin konfiguratsiya qilinmagan' };
      } else {
        return { success: false, message: 'Xabar yuborilmadi. Bot konfiguratsiyasini tekshiring' };
      }
    } catch (error: any) {
      console.error('❌ Telegram xabar yuborishda umumiy xatolik:', error);
      return { success: false, message: error.message };
    }
  }

  private formatCarUpdateMessage(carData: any, parts: any[], serviceItems: any[]): string {
    const partsText = parts.length > 0
      ? parts.map((part, index) => 
          `${index + 1}. <b>${part.name}</b> - ${part.quantity} dona - ${part.price.toLocaleString('uz-UZ')} so'm`
        ).join('\n')
      : '<i>Qismlar yo\'q</i>';

    const servicesText = serviceItems.length > 0
      ? serviceItems.map((service, index) => {
          const categoryLabel = service.category === 'labor' ? 'Ish haqi' : 
                               service.category === 'part' ? 'Qism' : 'Material';
          return `${index + 1}. <b>${service.name}</b> (${categoryLabel}) - ${service.quantity} dona - ${service.price.toLocaleString('uz-UZ')} so'm`;
        }).join('\n')
      : '<i>Xizmatlar yo\'q</i>';

    const totalPartsPrice = parts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    const totalServicesPrice = serviceItems.reduce((sum, service) => sum + (service.price * service.quantity), 0);
    const totalPrice = totalPartsPrice + totalServicesPrice;

    return `
🔄 <b>MASHINA MA'LUMOTLARI YANGILANDI</b>

━━━━━━━━━━━━━━━━━━━━
📋 <b>Mashina Ma'lumotlari:</b>

🚘 <b>Model:</b> ${carData.make} ${carData.carModel}
📅 <b>Yil:</b> ${carData.year}
🔢 <b>Davlat raqami:</b> <code>${carData.licensePlate}</code>

━━━━━━━━━━━━━━━━━━━━
👤 <b>Egasi:</b>

👨‍💼 <b>Ism:</b> ${carData.ownerName}
📞 <b>Telefon:</b> <code>${carData.ownerPhone}</code>

━━━━━━━━━━━━━━━━━━━━
🔧 <b>Ehtiyot Qismlar:</b>

${partsText}

━━━━━━━━━━━━━━━━━━━━
⚙️ <b>Xizmatlar:</b>

${servicesText}

━━━━━━━━━━━━━━━━━━━━
💰 <b>Narxlar:</b>
• <b>Qismlar:</b> ${totalPartsPrice.toLocaleString('uz-UZ')} so'm
• <b>Xizmatlar:</b> ${totalServicesPrice.toLocaleString('uz-UZ')} so'm
• <b>Jami:</b> <b>${totalPrice.toLocaleString('uz-UZ')} so'm</b>

📅 <b>Yangilangan vaqt:</b> ${new Date().toLocaleString('uz-UZ', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
    `.trim();
  }

  private formatCarUpdateMessageForAdmin(carData: any, parts: any[], serviceItems: any[]): string {
    const partsText = parts.length > 0
      ? parts.map((part, index) => 
          `${index + 1}. <b>${part.name}</b> - ${part.quantity} dona - ${part.price.toLocaleString('uz-UZ')} so'm`
        ).join('\n')
      : '<i>Qismlar yo\'q</i>';

    const servicesText = serviceItems.length > 0
      ? serviceItems.map((service, index) => {
          const categoryLabel = service.category === 'labor' ? 'Ish haqi' : 
                               service.category === 'part' ? 'Qism' : 'Material';
          return `${index + 1}. <b>${service.name}</b> (${categoryLabel}) - ${service.quantity} dona - ${service.price.toLocaleString('uz-UZ')} so'm`;
        }).join('\n')
      : '<i>Xizmatlar yo\'q</i>';

    const totalPartsPrice = parts.reduce((sum, part) => sum + (part.price * part.quantity), 0);
    const totalServicesPrice = serviceItems.reduce((sum, service) => sum + (service.price * service.quantity), 0);
    const totalPrice = totalPartsPrice + totalServicesPrice;

    return `
🔔 <b>ADMIN: MASHINA MA'LUMOTLARI YANGILANDI</b>

━━━━━━━━━━━━━━━━━━━━
📋 <b>Mashina Ma'lumotlari:</b>

🚘 <b>Model:</b> ${carData.make} ${carData.carModel}
📅 <b>Yil:</b> ${carData.year}
🔢 <b>Davlat raqami:</b> <code>${carData.licensePlate}</code>

━━━━━━━━━━━━━━━━━━━━
👤 <b>Mijoz Ma'lumotlari:</b>

👨‍💼 <b>Ism:</b> ${carData.ownerName}
📞 <b>Telefon:</b> <code>${carData.ownerPhone}</code>

━━━━━━━━━━━━━━━━━━━━
🔧 <b>Ehtiyot Qismlar:</b>

${partsText}

━━━━━━━━━━━━━━━━━━━━
⚙️ <b>Xizmatlar:</b>

${servicesText}

━━━━━━━━━━━━━━━━━━━━
💰 <b>Narxlar:</b>
• <b>Qismlar:</b> ${totalPartsPrice.toLocaleString('uz-UZ')} so'm
• <b>Xizmatlar:</b> ${totalServicesPrice.toLocaleString('uz-UZ')} so'm
• <b>Jami:</b> <b>${totalPrice.toLocaleString('uz-UZ')} so'm</b>

━━━━━━━━━━━━━━━━━━━━
📊 <b>Admin Ma'lumotlari:</b>
• Mashina ma'lumotlari yangilandi
• Mijozga xabar yuborildi
• Ta'mir jarayonini kuzatib boring

📅 <b>Yangilangan vaqt:</b> ${new Date().toLocaleString('uz-UZ', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
    `.trim();
  }

  private formatCarMessage(carData: any, parts: any[]): string {
    // Qismlarni manba bo'yicha ajratish
    const availableParts = parts.filter(part => part.source !== 'tobring');
    const toBringParts = parts.filter(part => part.source === 'tobring');
    
    // Bizda bor qismlar
    const availablePartsText = availableParts.length > 0
      ? availableParts.map((part, index) => 
          `${index + 1}. <b>${part.name}</b> - ${part.quantity} dona - ${part.price.toLocaleString('uz-UZ')} so'm`
        ).join('\n')
      : '<i>Yo\'q</i>';

    // Keltirish kerak bo'lgan qismlar
    const toBringPartsText = toBringParts.length > 0
      ? toBringParts.map((part, index) => 
          `${index + 1}. <b>${part.name}</b> - ${part.quantity} dona`
        ).join('\n')
      : '<i>Yo\'q</i>';

    const totalPartsPrice = availableParts.reduce((sum, part) => sum + (part.price * part.quantity), 0);

    return `
🚗 <b>YANGI MASHINA QO'SHILDI</b>

━━━━━━━━━━━━━━━━━━━━
📋 <b>Mashina Ma'lumotlari:</b>

🚘 <b>Model:</b> ${carData.make} ${carData.carModel}
📅 <b>Yil:</b> ${carData.year}
🔢 <b>Davlat raqami:</b> <code>${carData.licensePlate}</code>

━━━━━━━━━━━━━━━━━━━━
👤 <b>Egasi:</b>

👨‍💼 <b>Ism:</b> ${carData.ownerName}
📞 <b>Telefon:</b> <code>${carData.ownerPhone}</code>

━━━━━━━━━━━━━━━━━━━━
✅ <b>Bizda Bor Qismlar:</b>

${availablePartsText}

━━━━━━━━━━━━━━━━━━━━
🚚 <b>Keltirish Kerak:</b>

${toBringPartsText}

━━━━━━━━━━━━━━━━━━━━
💰 <b>Qismlar Umumiy Narxi:</b> <b>${totalPartsPrice.toLocaleString('uz-UZ')} so'm</b>

📅 <b>Qo'shilgan vaqt:</b> ${new Date().toLocaleString('uz-UZ', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}

🎯 <b>Sizning mashinangiz ta'mir jarayoniga qabul qilindi!</b>
    `.trim();
  }

  private formatCarMessageForAdmin(carData: any, parts: any[]): string {
    // Qismlarni manba bo'yicha ajratish
    const availableParts = parts.filter(part => part.source !== 'tobring');
    const toBringParts = parts.filter(part => part.source === 'tobring');
    
    // Bizda bor qismlar
    const availablePartsText = availableParts.length > 0
      ? availableParts.map((part, index) => 
          `${index + 1}. <b>${part.name}</b> - ${part.quantity} dona - ${part.price.toLocaleString('uz-UZ')} so'm`
        ).join('\n')
      : '<i>Yo\'q</i>';

    // Keltirish kerak bo'lgan qismlar
    const toBringPartsText = toBringParts.length > 0
      ? toBringParts.map((part, index) => 
          `${index + 1}. <b>${part.name}</b> - ${part.quantity} dona`
        ).join('\n')
      : '<i>Yo\'q</i>';

    const totalPartsPrice = availableParts.reduce((sum, part) => sum + (part.price * part.quantity), 0);

    return `
🔔 <b>ADMIN: YANGI MASHINA QO'SHILDI</b>

━━━━━━━━━━━━━━━━━━━━
📋 <b>Mashina Ma'lumotlari:</b>

🚘 <b>Model:</b> ${carData.make} ${carData.carModel}
📅 <b>Yil:</b> ${carData.year}
🔢 <b>Davlat raqami:</b> <code>${carData.licensePlate}</code>

━━━━━━━━━━━━━━━━━━━━
👤 <b>Mijoz Ma'lumotlari:</b>

👨‍💼 <b>Ism:</b> ${carData.ownerName}
📞 <b>Telefon:</b> <code>${carData.ownerPhone}</code>

━━━━━━━━━━━━━━━━━━━━
✅ <b>Bizda Bor Qismlar:</b>

${availablePartsText}

━━━━━━━━━━━━━━━━━━━━
🚚 <b>Keltirish Kerak:</b>

${toBringPartsText}

━━━━━━━━━━━━━━━━━━━━
💰 <b>Qismlar Umumiy Narxi:</b> <b>${totalPartsPrice.toLocaleString('uz-UZ')} so'm</b>

━━━━━━━━━━━━━━━━━━━━
📊 <b>Admin Ma'lumotlari:</b>
• Yangi mashina tizimga qo'shildi
• Mijozga xabar yuborildi
• Ta'mir jarayonini kuzatib boring

📅 <b>Qo'shilgan vaqt:</b> ${new Date().toLocaleString('uz-UZ', { 
  year: 'numeric', 
  month: 'long', 
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit'
})}
    `.trim();
  }

  async sendTestMessage() {
    if (!this.carBot) {
      throw new Error('Car Telegram bot not configured');
    }

    try {
      // Debug ma'lumotlarini qaytarish
      const registeredPhones = Array.from(this.carPhoneNumbersToChatId.keys());
      const adminChatId = process.env.ADMIN_CHAT_ID;
      
      console.log('🔍 Telegram Bot Debug Info:');
      console.log('Bot configured:', !!this.carBot);
      console.log('Admin Chat ID:', adminChatId);
      console.log('Registered phones:', registeredPhones);
      console.log('Total registered users:', registeredPhones.length);
      
      return { 
        success: true, 
        message: 'Debug info logged to console',
        data: {
          botConfigured: !!this.carBot,
          adminChatId: adminChatId || 'Not configured',
          registeredPhones,
          totalUsers: registeredPhones.length
        }
      };
    } catch (error: any) {
      throw new Error(`Failed to send test message: ${error.message}`);
    }
  }

  async sendDebtNotification(debtData: any) {
    if (!this.debtBot) {
      return { success: false, message: 'Bot not configured' };
    }

    try {
      let cleanPhone = debtData.phone.replace(/[^0-9]/g, '');
      
      if (!cleanPhone.startsWith('998')) {
        cleanPhone = '998' + cleanPhone;
      }

      const userChatId = this.phoneNumbersToChatId.get(cleanPhone);
      const adminChatId = process.env.ADMIN_CHAT_ID;

      let sentToUser = false;
      let sentToAdmin = false;

      if (userChatId) {
        const userMessage = this.formatDebtMessage(debtData, false);
        await this.debtBot.sendMessage(userChatId, userMessage, { parse_mode: 'HTML' });
        sentToUser = true;
      }

      if (adminChatId) {
        const adminMessage = this.formatDebtMessageForAdmin(debtData);
        await this.debtBot.sendMessage(adminChatId, adminMessage, { parse_mode: 'HTML' });
        sentToAdmin = true;
      }

      if (sentToUser && sentToAdmin) {
        return { success: true, message: 'Xabar foydalanuvchi va adminga yuborildi' };
      } else if (sentToAdmin) {
        return { success: true, message: 'Xabar adminga yuborildi (foydalanuvchi botda ro\'yxatdan o\'tmagan)' };
      } else if (sentToUser) {
        return { success: true, message: 'Xabar foydalanuvchiga yuborildi' };
      } else {
        return { success: false, message: 'Xabar yuborilmadi' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  private formatDebtMessage(debtData: any, isAdmin: boolean = false): string {
    // Admin uchun qarz turini teskari qilish
    let type = debtData.type;
    if (isAdmin) {
      type = type === 'receivable' ? 'payable' : 'receivable';
    }

    const typeText = type === 'receivable' ? '📥 SIZ QARZ' : '📤 SIZDAN QARZ';
    const typeEmoji = type === 'receivable' ? '💰' : '💸';
    
    return `
${typeEmoji} <b>${typeText}</b>

━━━━━━━━━━━━━━━━━━━━
👤 <b>Shaxs Ma'lumotlari:</b>

👨‍💼 <b>Ism:</b> ${debtData.name}
📞 <b>Telefon:</b> <code>${debtData.phone}</code>

━━━━━━━━━━━━━━━━━━━━
💵 <b>Qarz Ma'lumotlari:</b>

💰 <b>Summa:</b> <b>${debtData.amount.toLocaleString('uz-UZ')} so'm</b>
📅 <b>Muddat:</b> ${new Date(debtData.dueDate).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })}
📝 <b>Izoh:</b> ${debtData.description || '<i>Izoh yo\'q</i>'}

━━━━━━━━━━━━━━━━━━━━
📊 <b>Status:</b> ${this.getStatusText(debtData.status)}

📅 <b>Qo'shilgan vaqt:</b> ${new Date().toLocaleString('uz-UZ', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}

${type === 'receivable' 
  ? '⚠️ <b>Eslatma:</b> Ushbu qarzni o\'z vaqtida to\'lang!' 
  : 'ℹ️ <b>Ma\'lumot:</b> Ushbu qarz sizdan olingan.'}
    `.trim();
  }

  private formatDebtMessageForAdmin(debtData: any): string {
    const typeText = debtData.type === 'receivable' ? '📥 QARZ BERILDI' : '📤 QARZ OLINDI';
    const typeEmoji = debtData.type === 'receivable' ? '💰' : '💸';
    
    return `
🔔 <b>ADMIN: YANGI QARZ QO'SHILDI</b>

${typeEmoji} <b>${typeText}</b>

━━━━━━━━━━━━━━━━━━━━
👤 <b>Mijoz Ma'lumotlari:</b>

👨‍💼 <b>Ism:</b> ${debtData.name}
📞 <b>Telefon:</b> <code>${debtData.phone}</code>

━━━━━━━━━━━━━━━━━━━━
💵 <b>Qarz Ma'lumotlari:</b>

💰 <b>Summa:</b> <b>${debtData.amount.toLocaleString('uz-UZ')} so'm</b>
📅 <b>Muddat:</b> ${new Date(debtData.dueDate).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long', 
      day: 'numeric'
    })}
📝 <b>Izoh:</b> ${debtData.description || '<i>Izoh yo\'q</i>'}

━━━━━━━━━━━━━━━━━━━━
📊 <b>Status:</b> ${this.getStatusText(debtData.status)}

━━━━━━━━━━━━━━━━━━━━
📊 <b>Admin Ma'lumotlari:</b>
• Yangi qarz tizimga qo'shildi
• Mijozga xabar yuborildi
• Qarz holatini kuzatib boring

📅 <b>Qo'shilgan vaqt:</b> ${new Date().toLocaleString('uz-UZ', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}

${debtData.type === 'receivable' 
  ? '💡 <b>Eslatma:</b> Mijozga to\'lov eslatmalari avtomatik yuboriladi.' 
  : 'ℹ️ <b>Ma\'lumot:</b> Bu qarz sizdan olingan qarz hisoblanadi.'}
    `.trim();
  }

  private getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': '⏳ Kutilmoqda',
      'partial': '📊 Qisman to\'langan',
      'paid': '✅ To\'langan'
    };
    return statusMap[status] || status;
  }

  // Mijoz telefon raqamini tekshirish
  checkCustomerPhone(phoneNumber: string): { found: boolean, cleanPhone: string, chatId?: string } {
    // Telefon raqamini tozalash
    let cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    
    // Agar 998 bilan boshlanmasa, qo'shish
    if (!cleanPhone.startsWith('998')) {
      cleanPhone = '998' + cleanPhone;
    }

    const chatId = this.carPhoneNumbersToChatId.get(cleanPhone);
    
    console.log('📞 Phone Check Debug:');
    console.log('Original phone:', phoneNumber);
    console.log('Clean phone:', cleanPhone);
    console.log('Found in database:', !!chatId);
    console.log('Chat ID:', chatId || 'Not found');
    console.log('All registered phones:', Array.from(this.carPhoneNumbersToChatId.keys()));
    
    // Qo'shimcha debug: har bir ro'yxatdan o'tgan raqam bilan solishtirish
    const allPhones = Array.from(this.carPhoneNumbersToChatId.keys());
    console.log('🔍 Detailed comparison:');
    allPhones.forEach(registeredPhone => {
      console.log(`  "${cleanPhone}" === "${registeredPhone}" → ${cleanPhone === registeredPhone ? 'MATCH ✅' : 'NO MATCH ❌'}`);
    });

    return {
      found: !!chatId,
      cleanPhone,
      chatId: chatId || undefined
    };
  }

  getRegisteredCarPhones(): string[] {
    return Array.from(this.carPhoneNumbersToChatId.keys());
  }

  getRegisteredDebtPhones(): string[] {
    return Array.from(this.phoneNumbersToChatId.keys());
  }

  private setupDebtReminders() {
    cron.schedule('0 8 * * *', async () => {
      await this.checkAndSendDebtReminders();
    });
  }

  async checkAndSendDebtReminders() {
    try {
      const Debt = require('../models/Debt').default;
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const threeDaysLater = new Date(today);
      threeDaysLater.setDate(threeDaysLater.getDate() + 3);

      const upcomingDebts = await Debt.find({
        status: { $in: ['pending', 'partial'] },
        dueDate: { $lte: threeDaysLater }
      }).lean();

      for (const debt of upcomingDebts) {
        await this.sendDebtReminder(debt);
      }
    } catch {
      // Ignore errors
    }
  }

  async sendDebtReminder(debt: any) {
    if (!this.debtBot) return;

    try {
      let cleanPhone = debt.creditorPhone.replace(/[^0-9]/g, '');
      if (!cleanPhone.startsWith('998')) {
        cleanPhone = '998' + cleanPhone;
      }

      const userChatId = this.phoneNumbersToChatId.get(cleanPhone);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dueDate = new Date(debt.dueDate);
      dueDate.setHours(0, 0, 0, 0);

      const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      if (userChatId && debt.type === 'receivable') {
        const userMessage = this.formatDebtReminderMessage(debt, daysUntilDue, false);
        await this.debtBot.sendMessage(userChatId, userMessage, { parse_mode: 'HTML' });
      }
    } catch {
      // Ignore errors
    }
  }

  async sendPaymentNotification(paymentData: any) {
    if (!this.debtBot) {
      return { success: false, message: 'Bot not configured' };
    }

    try {
      let cleanPhone = paymentData.creditorPhone.replace(/[^0-9]/g, '');
      
      if (!cleanPhone.startsWith('998')) {
        cleanPhone = '998' + cleanPhone;
      }

      const userChatId = this.phoneNumbersToChatId.get(cleanPhone);
      const adminChatId = process.env.ADMIN_CHAT_ID;

      let sentToUser = false;
      let sentToAdmin = false;

      if (userChatId) {
        const userMessage = this.formatPaymentMessage(paymentData, false);
        await this.debtBot.sendMessage(userChatId, userMessage, { parse_mode: 'HTML' });
        sentToUser = true;
      }

      if (adminChatId) {
        const adminMessage = this.formatPaymentMessageForAdmin(paymentData);
        await this.debtBot.sendMessage(adminChatId, adminMessage, { parse_mode: 'HTML' });
        sentToAdmin = true;
      }

      if (sentToUser && sentToAdmin) {
        return { success: true, message: 'To\'lov xabari foydalanuvchi va adminga yuborildi' };
      } else if (sentToAdmin) {
        return { success: true, message: 'To\'lov xabari adminga yuborildi (foydalanuvchi botda ro\'yxatdan o\'tmagan)' };
      } else if (sentToUser) {
        return { success: true, message: 'To\'lov xabari foydalanuvchiga yuborildi' };
      } else {
        return { success: false, message: 'To\'lov xabari yuborilmadi' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async sendCarReadyNotification(carData: any, serviceData: any) {
    if (!this.carBot) {
      return { success: false, message: 'Bot not configured' };
    }

    try {
      let cleanPhone = carData.ownerPhone.replace(/[^0-9]/g, '');
      
      if (!cleanPhone.startsWith('998')) {
        cleanPhone = '998' + cleanPhone;
      }

      const userChatId = this.carPhoneNumbersToChatId.get(cleanPhone);
      let sentToUser = false;
      const message = this.formatCarReadyMessage(carData, serviceData);

      if (userChatId) {
        await this.carBot.sendMessage(userChatId, message, { parse_mode: 'HTML' });
        sentToUser = true;
      }

      if (sentToUser) {
        return { success: true, message: 'Tayyor xabari foydalanuvchiga yuborildi' };
      } else {
        return { success: false, message: 'Tayyor xabari yuborilmadi (foydalanuvchi botda ro\'yxatdan o\'tmagan)' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  async sendCarDeliveredNotification(carData: any, serviceData: any) {
    if (!this.carBot) {
      return { success: false, message: 'Bot not configured' };
    }

    try {
      let cleanPhone = carData.ownerPhone.replace(/[^0-9]/g, '');
      
      if (!cleanPhone.startsWith('998')) {
        cleanPhone = '998' + cleanPhone;
      }

      const userChatId = this.carPhoneNumbersToChatId.get(cleanPhone);
      let sentToUser = false;
      const message = this.formatCarDeliveredMessage(carData, serviceData);

      if (userChatId) {
        await this.carBot.sendMessage(userChatId, message, { parse_mode: 'HTML' });
        sentToUser = true;
      }

      if (sentToUser) {
        return { success: true, message: 'Topshirildi xabari foydalanuvchiga yuborildi' };
      } else {
        return { success: false, message: 'Topshirildi xabari yuborilmadi (foydalanuvchi botda ro\'yxatdan o\'tmagan)' };
      }
    } catch (error: any) {
      return { success: false, message: error.message };
    }
  }

  private formatCarReadyMessage(carData: any, serviceData: any): string {
    const totalPrice = serviceData.totalPrice || 0;

    return `
✅ <b>MASHINANGIZ TAYYOR!</b>

━━━━━━━━━━━━━━━━━━━━
🎉 <b>Xushxabar!</b> Mashinangiz ta'mirlandi va olib ketishingiz mumkin!

━━━━━━━━━━━━━━━━━━━━
📋 <b>Mashina Ma'lumotlari:</b>

🚘 <b>Model:</b> ${carData.make} ${carData.carModel}
📅 <b>Yil:</b> ${carData.year}
🔢 <b>Davlat raqami:</b> <code>${carData.licensePlate}</code>

━━━━━━━━━━━━━━━━━━━━
👤 <b>Egasi:</b>

👨‍💼 <b>Ism:</b> ${carData.ownerName}
📞 <b>Telefon:</b> <code>${carData.ownerPhone}</code>

━━━━━━━━━━━━━━━━━━━━
💰 <b>Jami To'lov:</b> <b>${totalPrice.toLocaleString('uz-UZ')} so'm</b>

━━━━━━━━━━━━━━━━━━━━
📍 <b>Olib ketish:</b>
Mashinangizni istalgan vaqtda olib ketishingiz mumkin!

📞 <b>Aloqa:</b> Qo'shimcha savollar bo'lsa, biz bilan bog'laning.

🙏 <b>Rahmat!</b> Bizni tanlaganingiz uchun tashakkur!
    `.trim();
  }

  private formatCarDeliveredMessage(carData: any, serviceData: any): string {
    const totalPrice = serviceData.totalPrice || 0;

    return `
🎊 <b>XIZMAT QILGANIMIZDAN XURSANDMIZ!</b>

━━━━━━━━━━━━━━━━━━━━
✅ <b>Mashina muvaffaqiyatli topshirildi!</b>

━━━━━━━━━━━━━━━━━━━━
📋 <b>Mashina Ma'lumotlari:</b>

🚘 <b>Model:</b> ${carData.make} ${carData.carModel}
📅 <b>Yil:</b> ${carData.year}
🔢 <b>Davlat raqami:</b> <code>${carData.licensePlate}</code>

━━━━━━━━━━━━━━━━━━━━
👤 <b>Egasi:</b>

👨‍💼 <b>Ism:</b> ${carData.ownerName}
📞 <b>Telefon:</b> <code>${carData.ownerPhone}</code>

━━━━━━━━━━━━━━━━━━━━
💰 <b>Jami To'lov:</b> <b>${totalPrice.toLocaleString('uz-UZ')} so'm</b>

━━━━━━━━━━━━━━━━━━━━
📅 <b>Topshirilgan vaqt:</b> ${new Date().toLocaleString('uz-UZ', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}

━━━━━━━━━━━━━━━━━━━━
🌟 <b>Sizga xizmat qilganimizdan xursandmiz!</b>

🙏 Bizni tanlaganingiz va ishonch bildirganingiz uchun katta rahmat!

💬 Fikr-mulohazalaringiz bizga muhim. Xizmatimiz yoqdimi?

🔄 Keyingi safar ham sizga xizmat qilishdan mamnun bo'lamiz!

📞 Har qanday savol yoki muammo bo'lsa, biz bilan bog'laning.

✨ <b>Xavfsiz haydang va omad tilaymiz!</b> 🚗💨
    `.trim();
  }

  private formatDebtReminderMessage(debt: any, daysUntilDue: number, isAdmin: boolean): string {
    let urgencyEmoji = '⏰';
    let urgencyText = '';
    
    if (daysUntilDue < 0) {
      urgencyEmoji = '🚨';
      urgencyText = `<b>MUDDATI O'TGAN!</b> ${Math.abs(daysUntilDue)} kun oldin to'lanishi kerak edi`;
    } else if (daysUntilDue === 0) {
      urgencyEmoji = '⚠️';
      urgencyText = '<b>BUGUN TO\'LASH KERAK!</b>';
    } else if (daysUntilDue <= 3) {
      urgencyEmoji = '⏰';
      urgencyText = `<b>${daysUntilDue} kun qoldi!</b>`;
    } else {
      urgencyEmoji = '📅';
      urgencyText = `<b>${daysUntilDue} kun qoldi</b>`;
    }

    // Admin uchun qarz turini teskari qilish
    let type = debt.type;
    if (isAdmin) {
      type = type === 'receivable' ? 'payable' : 'receivable';
    }

    const typeText = type === 'receivable' ? 'SIZ QARZ' : 'SIZDAN QARZ';
    const remainingAmount = debt.amount - debt.paidAmount;

    return `
${urgencyEmoji} <b>QARZINGIZNI TO'LASHINGIZ UCHUN ESLATMA</b>

━━━━━━━━━━━━━━━━━━━━
💼 <b>Qarz turi:</b> ${typeText}

👤 <b>Shaxs Ma'lumotlari:</b>
👨‍💼 <b>Ism:</b> ${debt.creditorName}
📞 <b>Telefon:</b> <code>${debt.creditorPhone}</code>

━━━━━━━━━━━━━━━━━━━━
💵 <b>Qarz Ma'lumotlari:</b>

💰 <b>Umumiy qarz:</b> <b>${debt.amount.toLocaleString('uz-UZ')} so'm</b>
✅ <b>To'langan:</b> ${debt.paidAmount.toLocaleString('uz-UZ')} so'm
💸 <b>Qolgan qarz:</b> <b>${remainingAmount.toLocaleString('uz-UZ')} so'm</b>

━━━━━━━━━━━━━━━━━━━━
📅 <b>To'lov muddati:</b> ${new Date(debt.dueDate).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })}

⏰ <b>Muddat:</b> ${urgencyText}

━━━━━━━━━━━━━━━━━━━━
📝 <b>Izoh:</b> ${debt.description || '<i>Izoh yo\'q</i>'}

${daysUntilDue < 0 
  ? '🚨 <b>DIQQAT:</b> Qarz muddati o\'tgan! Zudlik bilan to\'lang!' 
  : daysUntilDue === 0
  ? '⚠️ <b>ESLATMA:</b> Bugun to\'lash muddati! Iltimos, qarzingizni to\'lang.'
  : daysUntilDue <= 3
  ? '⏰ <b>ESLATMA:</b> To\'lov muddati yaqinlashmoqda! Qarzingizni o\'z vaqtida to\'lang.'
  : '📅 <b>ESLATMA:</b> Qarzingizni to\'lashni unutmang!'}
    `.trim();
  }

  private formatPaymentMessage(paymentData: any, isAdmin: boolean = false): string {
    // Admin uchun qarz turini teskari qilish
    let type = paymentData.type;
    if (isAdmin) {
      type = type === 'receivable' ? 'payable' : 'receivable';
    }

    const typeText = type === 'receivable' ? 'SIZNING QARZINGIZ' : 'SIZDAN OLINGAN QARZ';
    const typeEmoji = type === 'receivable' ? '💰' : '💸';
    
    return `
${typeEmoji} <b>TO'LOV QABUL QILINDI</b>

━━━━━━━━━━━━━━━━━━━━
💼 <b>Qarz turi:</b> ${typeText}

👤 <b>Shaxs Ma'lumotlari:</b>
👨‍💼 <b>Ism:</b> ${paymentData.creditorName}
📞 <b>Telefon:</b> <code>${paymentData.creditorPhone}</code>

━━━━━━━━━━━━━━━━━━━━
💵 <b>To'lov Ma'lumotlari:</b>

💳 <b>To'langan summa:</b> <b>${paymentData.amount.toLocaleString('uz-UZ')} so'm</b>
💰 <b>Umumiy qarz:</b> ${paymentData.totalAmount.toLocaleString('uz-UZ')} so'm
✅ <b>Jami to'langan:</b> ${paymentData.paidAmount.toLocaleString('uz-UZ')} so'm
💸 <b>Qolgan qarz:</b> <b>${paymentData.remainingAmount.toLocaleString('uz-UZ')} so'm</b>

━━━━━━━━━━━━━━━━━━━━
📝 <b>To'lov izohi:</b> ${paymentData.notes || '<i>Izoh yo\'q</i>'}

━━━━━━━━━━━━━━━━━━━━
📅 <b>To'lov vaqti:</b> ${new Date().toLocaleString('uz-UZ', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}

${paymentData.remainingAmount > 0 
  ? `⚠️ <b>Eslatma:</b> Hali ${paymentData.remainingAmount.toLocaleString('uz-UZ')} so'm qarz qoldi.` 
  : '🎉 <b>Tabriklaymiz!</b> Qarz to\'liq to\'landi!'}
    `.trim();
  }

  private formatPaymentMessageForAdmin(paymentData: any): string {
    const typeText = paymentData.type === 'receivable' ? '📥 QARZGA TO\'LOV' : '📤 QARZDAN TO\'LOV';
    const typeEmoji = paymentData.type === 'receivable' ? '💰' : '💸';
    
    return `
🔔 <b>ADMIN: YANGI TO'LOV QABUL QILINDI</b>

${typeEmoji} <b>${typeText}</b>

━━━━━━━━━━━━━━━━━━━━
👤 <b>Mijoz Ma'lumotlari:</b>

👨‍💼 <b>Ism:</b> ${paymentData.creditorName}
📞 <b>Telefon:</b> <code>${paymentData.creditorPhone}</code>

━━━━━━━━━━━━━━━━━━━━
💵 <b>To'lov Ma'lumotlari:</b>

💳 <b>To'langan summa:</b> <b>${paymentData.amount.toLocaleString('uz-UZ')} so'm</b>
💰 <b>Umumiy qarz:</b> ${paymentData.totalAmount.toLocaleString('uz-UZ')} so'm
✅ <b>Jami to'langan:</b> ${paymentData.paidAmount.toLocaleString('uz-UZ')} so'm
💸 <b>Qolgan qarz:</b> <b>${paymentData.remainingAmount.toLocaleString('uz-UZ')} so'm</b>

━━━━━━━━━━━━━━━━━━━━
📝 <b>To'lov izohi:</b> ${paymentData.notes || '<i>Izoh yo\'q</i>'}

━━━━━━━━━━━━━━━━━━━━
📊 <b>Admin Ma'lumotlari:</b>
• Yangi to'lov tizimga qo'shildi
• Mijozga xabar yuborildi
• Qarz holatini kuzatib boring

━━━━━━━━━━━━━━━━━━━━
📅 <b>To'lov vaqti:</b> ${new Date().toLocaleString('uz-UZ', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })}

${paymentData.remainingAmount > 0 
  ? `⚠️ <b>Status:</b> Hali ${paymentData.remainingAmount.toLocaleString('uz-UZ')} so'm qarz qoldi.` 
  : '🎉 <b>Status:</b> Qarz to\'liq to\'landi!'}
    `.trim();
  }
}

export default new TelegramService();
