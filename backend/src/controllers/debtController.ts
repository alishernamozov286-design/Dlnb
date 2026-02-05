import { Response } from 'express';
import Debt from '../models/Debt';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import telegramService from '../services/telegramService';
export const createDebt = async (req: AuthRequest, res: Response) => {
  try {
    const { type, amount, description, creditorName, creditorPhone, car, dueDate } = req.body;
    const debt = new Debt({
      type,
      amount,
      description,
      creditorName,
      creditorPhone,
      car,
      dueDate,
      createdBy: req.user!._id
    });
    await debt.save();
    await debt.populate('car', 'make carModel licensePlate');
    
    // Qarz yaratilganda kassa daromadini yangilash
    const user = req.user!;
    
    if (type === 'payable') {
      // Bizning qarzimiz yaratilganda - daromaddan kamayadi (chiqim)
      user.earnings = Math.max(0, user.earnings - amount);
      await user.save();
    }
    // receivable type uchun hech narsa qilmaymiz, chunki bu faqat qarz yozuvi
    
    // Telegram xabar yuborish
    try {
      const debtData = {
        type,
        amount,
        description,
        name: creditorName,
        phone: creditorPhone,
        dueDate,
        status: debt.status
      };
      const result = await telegramService.sendDebtNotification(debtData);
      if (!result.success) {
        }
    } catch (telegramError) {
      // Don't fail the request if telegram fails
    }
    res.status(201).json({
      message: 'Debt record created successfully',
      debt,
      updatedEarnings: user.earnings
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const getDebts = async (req: AuthRequest, res: Response) => {
  try {
    const { type, status } = req.query;
    const filter: any = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    const debts = await Debt.find(filter)
      .populate('car', 'make carModel licensePlate ownerName')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });
    res.json({ debts });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const getDebtById = async (req: AuthRequest, res: Response) => {
  try {
    const debt = await Debt.findById(req.params.id)
      .populate('car')
      .populate('createdBy', 'name');
    if (!debt) {
      return res.status(404).json({ message: 'Debt record not found' });
    }
    res.json({ debt });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const addPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { amount, notes, paymentMethod } = req.body;
    const debt = await Debt.findById(req.params.id);
    
    if (!debt) {
      return res.status(404).json({ message: 'Debt record not found' });
    }
    
    // To'lov qo'shish
    debt.paymentHistory.push({
      amount,
      date: new Date(),
      paymentMethod: paymentMethod || 'cash',
      notes
    });
    
    await debt.save();
    await debt.populate('car', 'make carModel licensePlate');
    
    // ❌ OLIB TASHLANDI: Daromad yangilash
    // Daromad faqat Transaction orqali yangilanadi (transactionController.ts)
    // Bu yerda faqat qarz ma'lumotlarini yangilaymiz
    
    // To'lov qo'shilganda Telegram xabar yuborish
    try {
      const paymentData = {
        creditorName: debt.creditorName,
        creditorPhone: debt.creditorPhone,
        amount: amount,
        totalAmount: debt.amount,
        paidAmount: debt.paidAmount,
        remainingAmount: debt.amount - debt.paidAmount,
        notes: notes,
        type: debt.type,
        paymentMethod: paymentMethod || 'cash'
      };
      
      const result = await telegramService.sendPaymentNotification(paymentData);
      if (!result.success) {
        console.log('Telegram notification failed:', result.message);
      }
    } catch (telegramError) {
      // Don't fail the request if telegram fails
      console.error('Telegram error:', telegramError);
    }
    
    res.json({
      message: 'Payment added successfully',
      debt
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const updateDebt = async (req: AuthRequest, res: Response) => {
  try {
    const updates = req.body;
    const debt = await Debt.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('car', 'make model licensePlate');
    if (!debt) {
      return res.status(404).json({ message: 'Debt record not found' });
    }
    res.json({
      message: 'Debt record updated successfully',
      debt
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const deleteDebt = async (req: AuthRequest, res: Response) => {
  try {
    const debt = await Debt.findByIdAndDelete(req.params.id);
    if (!debt) {
      return res.status(404).json({ message: 'Debt record not found' });
    }
    res.json({
      message: 'Debt record deleted successfully',
      debt
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const getDebtSummary = async (req: AuthRequest, res: Response) => {
  try {
    const summary = await Debt.aggregate([
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          totalPaid: { $sum: '$paidAmount' },
          count: { $sum: 1 }
        }
      }
    ]);
    const receivables = summary.find(s => s._id === 'receivable') || { totalAmount: 0, totalPaid: 0, count: 0 };
    const payables = summary.find(s => s._id === 'payable') || { totalAmount: 0, totalPaid: 0, count: 0 };
    res.json({
      receivables: {
        total: receivables.totalAmount,
        paid: receivables.totalPaid,
        remaining: receivables.totalAmount - receivables.totalPaid,
        count: receivables.count
      },
      payables: {
        total: payables.totalAmount,
        paid: payables.totalPaid,
        remaining: payables.totalAmount - payables.totalPaid,
        count: payables.count
      },
      netPosition: (receivables.totalAmount - receivables.totalPaid) - (payables.totalAmount - payables.totalPaid)
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
export const sendDebtReminders = async (req: AuthRequest, res: Response) => {
  try {
    await telegramService.checkAndSendDebtReminders();
    res.json({ 
      success: true,
      message: 'Qarz eslatmalari yuborildi' 
    });
  } catch (error: any) {
    res.status(500).json({ 
      success: false,
      message: 'Eslatmalarni yuborishda xatolik',
      error: error.message 
    });
  }
};

export const getUpcomingDebts = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // 1 kun oldin notification ko'rsatish uchun ertaga sanasini olamiz
    const oneDayBefore = new Date(today);
    oneDayBefore.setDate(oneDayBefore.getDate() + 2); // Bugun + 1 kun = ertaga
    
    // Muddati 1 kun qolgan, bugun yoki o'tgan qarzlar
    const upcomingDebts = await Debt.find({
      status: { $in: ['pending', 'partial'] },
      dueDate: { $exists: true, $ne: null, $lte: oneDayBefore }
    })
      .populate('car', 'make carModel licensePlate ownerName')
      .populate('createdBy', 'name')
      .sort({ dueDate: 1 });
    
    // Qarzlarni kategoriyalash
    const categorized = upcomingDebts.map(debt => {
      const dueDate = new Date(debt.dueDate!);
      dueDate.setHours(0, 0, 0, 0);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      let status: 'overdue' | 'today' | 'tomorrow' = 'tomorrow';
      if (diffDays < 0) status = 'overdue';
      else if (diffDays === 0) status = 'today';
      else if (diffDays === 1) status = 'tomorrow';
      
      return {
        ...debt.toObject(),
        daysRemaining: diffDays,
        urgencyStatus: status
      };
    });
    
    res.json({ 
      debts: categorized,
      count: categorized.length,
      overdue: categorized.filter(d => d.urgencyStatus === 'overdue').length,
      today: categorized.filter(d => d.urgencyStatus === 'today').length,
      tomorrow: categorized.filter(d => d.urgencyStatus === 'tomorrow').length
    });
  } catch (error: any) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Muddati yetgan yoki 3 kun qolgan qarzlar sonini qaytarish (sidebar notification uchun)
export const getOverdueDebtsCount = async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Bugunning boshlanishi
    
    // 3 kun keyingi sana
    const threeDaysLater = new Date(today);
    threeDaysLater.setDate(threeDaysLater.getDate() + 3);
    threeDaysLater.setHours(23, 59, 59, 999);
    
    console.log('🔍 Checking debts with due date within 3 days...');
    console.log('📅 Today:', today.toISOString());
    console.log('📅 Three days later:', threeDaysLater.toISOString());
    
    // Muddati 3 kun ichida yoki o'tgan qarzlar
    const debts = await Debt.find({
      status: { $in: ['pending', 'partial'] },
      dueDate: { $exists: true, $ne: null, $lte: threeDaysLater }
    });
    
    console.log(`📊 Found ${debts.length} debts (due within 3 days or overdue)`);
    debts.forEach(debt => {
      const dueDate = new Date(debt.dueDate!);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      console.log(`  - ${debt.creditorName}: ${debt.dueDate?.toISOString()} (${diffDays} kun qoldi, status: ${debt.status})`);
    });
    
    res.json({ count: debts.length });
  } catch (error: any) {
    console.error('❌ Error fetching debts count:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};