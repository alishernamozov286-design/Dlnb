import SmsMessage from '../models/SmsMessage';
import SmsGateway from '../models/SmsGateway';

class SmsService {
  // SMS yuborish
  async sendSms(phoneNumber: string, message: string, bookingId?: string) {
    try {
      // Faol gateway'ni topish
      const gateway = await SmsGateway.findOne({
        isActive: true,
        lastHeartbeat: { $gte: new Date(Date.now() - 60000) } // Oxirgi 1 daqiqada faol
      });

      if (!gateway) {
        console.error('SMS Gateway mavjud emas yoki offline');
        return null;
      }

      // SMS'ni bazaga saqlash
      const smsMessage = await SmsMessage.create({
        phoneNumber,
        message,
        status: 'pending',
        gatewayId: gateway._id,
        bookingId
      });

      console.log(`SMS navbatga qo'shildi: ${phoneNumber}`);
      return smsMessage;
    } catch (error) {
      console.error('SMS yuborishda xatolik:', error);
      return null;
    }
  }

  // Bron yaratilganda SMS
  async sendBookingCreatedSms(phoneNumber: string, customerName: string, bookingDate: string, bookingId: string) {
    const message = `Hurmatli ${customerName}! Sizning broningiz qabul qilindi. Sana: ${bookingDate}. Avtojon Service`;
    return this.sendSms(phoneNumber, message, bookingId);
  }

  // Bron tasdiqlanganida SMS
  async sendBookingConfirmedSms(phoneNumber: string, customerName: string, bookingDate: string, bookingId: string) {
    const message = `Hurmatli ${customerName}! Sizning broningiz tasdiqlandi. Sana: ${bookingDate}. Avtojon Service`;
    return this.sendSms(phoneNumber, message, bookingId);
  }

  // Bron bajarilganida SMS
  async sendBookingCompletedSms(phoneNumber: string, customerName: string, bookingId: string) {
    const message = `Hurmatli ${customerName}! Mashina tayyor, olib ketishingiz mumkin. Avtojon Service`;
    return this.sendSms(phoneNumber, message, bookingId);
  }

  // Bron bekor qilinganida SMS
  async sendBookingCancelledSms(phoneNumber: string, customerName: string, bookingId: string) {
    const message = `Hurmatli ${customerName}! Sizning broningiz bekor qilindi. Ma'lumot uchun: +998901234567. Avtojon Service`;
    return this.sendSms(phoneNumber, message, bookingId);
  }

  // Eslatma SMS (bron sanasidan 1 kun oldin)
  async sendBookingReminderSms(phoneNumber: string, customerName: string, bookingDate: string, bookingId: string) {
    const message = `Hurmatli ${customerName}! Eslatma: Sizning broningiz ertaga ${bookingDate}. Avtojon Service`;
    return this.sendSms(phoneNumber, message, bookingId);
  }

  // Tug'ilgan kun tabrigi SMS
  async sendBirthdaySms(phoneNumber: string, customerName: string, bookingId?: string) {
    const message = `Tabriklaymiz, ${customerName}! Tug'ilgan kuningiz bilan! 🎂🎉 Avtojon Service`;
    return this.sendSms(phoneNumber, message, bookingId);
  }
}

export default new SmsService();
