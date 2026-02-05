import cron from 'node-cron';
import User from '../models/User';
import Transaction from '../models/Transaction';
import MonthlyHistory from '../models/MonthlyHistory';

/**
 * Har oyning 1-sanasida soat 00:00 da barcha foydalanuvchilarning
 * joriy daromadini (earnings) 0 ga qaytaradi va tarixga saqlaydi
 */
export const startMonthlyResetJob = () => {
  // Har oyning 1-sanasida soat 00:00 da ishga tushadi
  cron.schedule('0 0 1 * *', async () => {
    try {
      console.log('🔄 Oylik avtomatik reset boshlandi:', new Date().toISOString());
      
      const users = await User.find({});
      const masterUser = users.find(u => u.role === 'master');
      
      await saveMonthlyHistoryAndReset(masterUser?._id);
      
    } catch (error) {
      console.error('❌ Oylik avtomatik reset xatosi:', error);
    }
  }, {
    timezone: 'Asia/Tashkent'
  });
  
  console.log('✅ Oylik reset cron job ishga tushdi (har oyning 1-sanasida soat 00:00)');
};

/**
 * Oylik tarixni saqlash va resetlash
 */
async function saveMonthlyHistoryAndReset(resetBy: any) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1; // 1-12
  const currentYear = now.getFullYear();
  
  // 1. Hozirgi oy statistikasini olish
  const monthStart = new Date(currentYear, now.getMonth(), 1);
  const monthEnd = new Date(currentYear, now.getMonth() + 1, 0, 23, 59, 59);
  
  const transactions = await Transaction.find({
    createdAt: {
      $gte: monthStart,
      $lte: monthEnd
    }
  });
  
  // Statistikani hisoblash
  let totalIncome = 0;
  let totalExpense = 0;
  let incomeCash = 0;
  let incomeCard = 0;
  let expenseCash = 0;
  let expenseCard = 0;
  let incomeCount = 0;
  let expenseCount = 0;
  
  transactions.forEach(t => {
    if (t.type === 'income') {
      totalIncome += t.amount;
      incomeCount++;
      if (t.paymentMethod === 'cash') incomeCash += t.amount;
      else if (t.paymentMethod === 'card') incomeCard += t.amount;
    } else {
      totalExpense += t.amount;
      expenseCount++;
      if (t.paymentMethod === 'cash') expenseCash += t.amount;
      else if (t.paymentMethod === 'card') expenseCard += t.amount;
    }
  });
  
  const balance = totalIncome - totalExpense;
  const balanceCash = incomeCash - expenseCash;
  const balanceCard = incomeCard - expenseCard;
  
  // 2. Barcha foydalanuvchilarning daromadlarini olish
  const users = await User.find({});
  const userEarnings = users.map(user => ({
    userId: user._id,
    name: user.name,
    role: user.role,
    earnings: user.earnings
  }));
  
  // 3. Tarixga saqlash
  const history = new MonthlyHistory({
    month: currentMonth,
    year: currentYear,
    totalIncome,
    totalExpense,
    balance,
    incomeCash,
    incomeCard,
    expenseCash,
    expenseCard,
    balanceCash,
    balanceCard,
    incomeCount,
    expenseCount,
    transactionCount: transactions.length,
    userEarnings,
    resetDate: now,
    resetBy: resetBy
  });
  
  await history.save();
  console.log(`📊 Tarix saqlandi: ${currentMonth}/${currentYear}`);
  
  // 4. ✨ YANGI: Joriy oy transaksiyalarini o'chirish
  const deleteResult = await Transaction.deleteMany({
    createdAt: {
      $gte: monthStart,
      $lte: monthEnd
    }
  });
  console.log(`🗑️ ${deleteResult.deletedCount} ta transaksiya o'chirildi`);
  
  // 5. Barcha foydalanuvchilarning daromadlarini 0 ga qaytarish
  let resetCount = 0;
  for (const user of users) {
    if (user.earnings > 0) {
      user.totalEarnings += user.earnings;
      const oldEarnings = user.earnings;
      user.earnings = 0;
      await user.save();
      
      console.log(`✅ ${user.name}: ${oldEarnings} so'm → 0 so'm (Jami: ${user.totalEarnings} so'm)`);
      resetCount++;
    }
  }
  
  console.log(`✅ Reset tugadi. ${resetCount} ta foydalanuvchi yangilandi.`);
  
  return {
    success: true,
    resetCount,
    deletedTransactions: deleteResult.deletedCount,
    history: {
      month: currentMonth,
      year: currentYear,
      totalIncome,
      totalExpense,
      balance,
      userCount: userEarnings.length
    }
  };
}

/**
 * Qo'lda reset qilish uchun funksiya
 */
export const manualMonthlyReset = async (resetBy: any) => {
  try {
    console.log('🔄 Qo\'lda oylik reset boshlandi:', new Date().toISOString());
    
    const result = await saveMonthlyHistoryAndReset(resetBy);
    
    return result;
  } catch (error) {
    console.error('❌ Qo\'lda reset xatosi:', error);
    throw error;
  }
};

/**
 * Oylik tarixni olish
 */
export const getMonthlyHistory = async (limit: number = 12) => {
  try {
    const history = await MonthlyHistory.find()
      .sort({ year: -1, month: -1 })
      .limit(limit)
      .populate('resetBy', 'name email');
    
    return history;
  } catch (error: any) {
    console.error('❌ Tarixni olishda xatolik:', error);
    throw error;
  }
};

/**
 * Ma'lum oy tarixini olish
 */
export const getMonthHistory = async (year: number, month: number) => {
  try {
    const history = await MonthlyHistory.findOne({ year, month })
      .populate('resetBy', 'name email')
      .populate('userEarnings.userId', 'name email role');
    
    return history;
  } catch (error: any) {
    console.error('❌ Oy tarixini olishda xatolik:', error);
    throw error;
  }
};
