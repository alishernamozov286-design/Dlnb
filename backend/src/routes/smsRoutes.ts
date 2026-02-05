import { Router } from 'express';
import SmsMessage from '../models/SmsMessage';
import SmsGateway from '../models/SmsGateway';
import { authenticate, AuthRequest } from '../middleware/auth';
import smsService from '../services/smsService';

const router = Router();

// Gateway autentifikatsiyasi
const authenticateGateway = async (req: AuthRequest, res: any, next: any) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Token yo\'q' });
    }

    const gateway = await SmsGateway.findOne({ token, isActive: true });
    
    if (!gateway) {
      return res.status(401).json({ error: 'Noto\'g\'ri token' });
    }

    (req as any).gateway = gateway;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Autentifikatsiya xatosi' });
  }
};

// Gateway'lar ro'yxati (Admin)
router.get('/gateways', authenticate, async (req: AuthRequest, res) => {
  try {
    const gateways = await SmsGateway.find().sort({ createdAt: -1 });
    res.json({ gateways });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Yangi gateway yaratish (Admin)
router.post('/gateways', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, simNumber } = req.body;
    
    const gateway = await SmsGateway.create({
      name,
      simNumber
    });

    res.status(201).json({ gateway });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Gateway'ni o'chirish (Admin)
router.delete('/gateways/:id', authenticate, async (req: AuthRequest, res) => {
  try {
    await SmsGateway.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Gateway o\'chirildi' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SMS navbati (Android App)
router.get('/gateway/queue', authenticateGateway, async (req: AuthRequest, res) => {
  try {
    const gatewayId = (req as any).gateway._id;

    // Pending SMS'larni topish
    const messages = await SmsMessage.find({
      gatewayId,
      status: 'pending'
    })
    .limit(10)
    .sort({ createdAt: 1 });

    // Status'ni queued ga o'zgartirish
    const messageIds = messages.map(m => m._id);
    await SmsMessage.updateMany(
      { _id: { $in: messageIds } },
      { status: 'queued' }
    );

    res.json({ messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SMS status yangilash (Android App)
router.post('/gateway/status', authenticateGateway, async (req: AuthRequest, res) => {
  try {
    const { messageId, status, error, sentAt } = req.body;

    await SmsMessage.findByIdAndUpdate(messageId, {
      status,
      sentAt: sentAt ? new Date(sentAt) : undefined,
      error
    });

    // Gateway statistikasini yangilash
    if (status === 'sent') {
      await SmsGateway.findByIdAndUpdate((req as any).gateway._id, {
        $inc: { messagesSent: 1 }
      });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Heartbeat (Android App)
router.post('/gateway/heartbeat', authenticateGateway, async (req: AuthRequest, res) => {
  try {
    await SmsGateway.findByIdAndUpdate((req as any).gateway._id, {
      lastHeartbeat: new Date()
    });

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SMS log'lar (Admin)
router.get('/logs', authenticate, async (req: AuthRequest, res) => {
  try {
    const { status, bookingId } = req.query;
    
    const filter: any = {};
    if (status) filter.status = status;
    if (bookingId) filter.bookingId = bookingId;

    const messages = await SmsMessage.find(filter)
      .populate('gatewayId', 'name')
      .populate('bookingId', 'customerName licensePlate')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// SMS statistika (Admin)
router.get('/stats', authenticate, async (req: AuthRequest, res) => {
  try {
    const totalSent = await SmsMessage.countDocuments({ status: 'sent' });
    const totalFailed = await SmsMessage.countDocuments({ status: 'failed' });
    const totalPending = await SmsMessage.countDocuments({ status: 'pending' });
    
    const activeGateways = await SmsGateway.countDocuments({
      isActive: true,
      lastHeartbeat: { $gte: new Date(Date.now() - 60000) }
    });

    res.json({
      stats: {
        totalSent,
        totalFailed,
        totalPending,
        activeGateways
      }
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Tug'ilgan kun SMS yuborish (Admin)
router.post('/send-birthday', authenticate, async (req: AuthRequest, res) => {
  try {
    const { phoneNumber, customerName, bookingId } = req.body;

    console.log('=== TUG\'ILGAN KUN SMS ===');
    console.log('Telefon:', phoneNumber);
    console.log('Mijoz:', customerName);
    console.log('Booking ID:', bookingId);

    if (!phoneNumber || !customerName) {
      console.log('❌ Telefon yoki mijoz ismi yo\'q');
      return res.status(400).json({ error: 'Telefon raqam va mijoz ismi kerak' });
    }

    // Gateway mavjudligini tekshirish
    const gateway = await SmsGateway.findOne({
      isActive: true,
      lastHeartbeat: { $gte: new Date(Date.now() - 60000) }
    });

    if (!gateway) {
      console.log('❌ SMS Gateway mavjud emas yoki offline');
      return res.status(503).json({ 
        error: 'SMS Gateway mavjud emas yoki offline. Iltimos, Android ilovani ishga tushiring.' 
      });
    }

    console.log('✅ Gateway topildi:', gateway.name);

    const result = await smsService.sendBirthdaySms(phoneNumber, customerName, bookingId);

    if (result) {
      console.log('✅ SMS muvaffaqiyatli navbatga qo\'shildi');
      res.json({ 
        success: true, 
        message: 'SMS muvaffaqiyatli yuborildi',
        smsId: result._id 
      });
    } else {
      console.log('❌ SMS yuborishda xatolik');
      res.status(500).json({ error: 'SMS yuborishda xatolik yuz berdi' });
    }
  } catch (error: any) {
    console.error('❌ Xatolik:', error);
    res.status(500).json({ 
      error: error.message || 'SMS yuborishda xatolik yuz berdi' 
    });
  }
});

export default router;
