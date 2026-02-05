import { Response } from 'express';
import Transaction from '../models/Transaction';
import User from '../models/User';
import { AuthRequest } from '../middleware/auth';
import { validationResult } from 'express-validator';

export const createTransaction = async (req: AuthRequest, res: Response) => {
  try {
    // Validation
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Validation errors', 
        errors: errors.array() 
      });
    }

    const { type, category, categoryId, amount, description, paymentMethod, relatedTo } = req.body;

    // Validate amount
    if (amount <= 0) {
      return res.status(400).json({ message: 'Amount must be greater than 0' });
    }

    // Create transaction with atomic operation
    const session = await Transaction.startSession();
    session.startTransaction();

    try {
      const transaction = new Transaction({
        type,
        category: category.trim(),
        categoryId: categoryId || undefined, // Xarajat kategoriyasi ID'si
        amount: Number(amount),
        description: description.trim(),
        paymentMethod,
        relatedTo,
        createdBy: req.user!._id
      });

      await transaction.save({ session });

      // Update user earnings atomically
      const user = req.user!;
      const earningsUpdate = type === 'income' ? amount : -amount;
      const newEarnings = Math.max(0, user.earnings + earningsUpdate);
      
      await User.findByIdAndUpdate(
        user._id,
        { earnings: newEarnings },
        { session, new: true }
      );

      await session.commitTransaction();
      
      await transaction.populate('createdBy', 'name');

      console.log(`✅ Transaction created: ${type} ${amount} by ${user.name}`);

      res.status(201).json({
        message: 'Transaction created successfully',
        transaction,
        updatedEarnings: newEarnings
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    console.error('❌ Transaction creation error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { 
      type, 
      category,
      categoryId,
      paymentMethod,
      startDate, 
      endDate, 
      page = 1, 
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Validate and sanitize inputs
    const pageNum = Math.max(1, Number(page));
    const limitNum = Math.min(100, Math.max(1, Number(limit))); // Max 100 items per page
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};

    // Type filter
    if (type && ['income', 'expense'].includes(type as string)) {
      filter.type = type;
    }

    // Category ID filter (yangi)
    if (categoryId && typeof categoryId === 'string') {
      filter.categoryId = categoryId.trim();
    }
    // Category name filter (eski usul, backward compatibility uchun)
    else if (category && typeof category === 'string') {
      filter.category = { $regex: category.trim(), $options: 'i' };
    }

    // Payment method filter
    if (paymentMethod && ['cash', 'card', 'click'].includes(paymentMethod as string)) {
      filter.paymentMethod = paymentMethod;
    }
    
    // Date range filter
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) {
        filter.createdAt.$gte = new Date(startDate as string);
      }
      if (endDate) {
        filter.createdAt.$lte = new Date(endDate as string);
      }
    }

    // Build sort object
    const sortObj: any = {};
    const validSortFields = ['createdAt', 'amount', 'category', 'type'];
    const sortField = validSortFields.includes(sortBy as string) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 1 : -1;
    sortObj[sortField as string] = sortDirection;

    // Execute queries in parallel
    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .populate('createdBy', 'name')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Transaction.countDocuments(filter)
    ]);

    res.json({
      transactions,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
        hasNext: pageNum < Math.ceil(total / limitNum),
        hasPrev: pageNum > 1
      }
    });
  } catch (error: any) {
    console.error('❌ Get transactions error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getTransactionSummary = async (req: AuthRequest, res: Response) => {
  try {
    const { period } = req.query;
    
    // Build date filter based on period
    let dateFilter = {};
    const now = new Date();
    
    if (period) {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (period) {
        case 'today':
          dateFilter = {
            createdAt: {
              $gte: today,
              $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
            }
          };
          break;
        case 'week':
          const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          dateFilter = {
            createdAt: {
              $gte: weekStart,
              $lt: now
            }
          };
          break;
        case 'month':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
          dateFilter = {
            createdAt: {
              $gte: monthStart,
              $lt: now
            }
          };
          break;
      }
    }

    // Get overall summary
    const overallSummary = await Transaction.aggregate([
      {
        $group: {
          _id: '$type',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get payment method breakdown
    const paymentMethodBreakdown = await Transaction.aggregate([
      {
        $group: {
          _id: {
            type: '$type',
            paymentMethod: '$paymentMethod'
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // Get period-specific summary if period is specified
    let periodSummary = [];
    if (Object.keys(dateFilter).length > 0) {
      periodSummary = await Transaction.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: '$type',
            totalAmount: { $sum: '$amount' },
            count: { $sum: 1 }
          }
        }
      ]);
    }

    // Process overall results
    const overallIncome = overallSummary.find(s => s._id === 'income') || { totalAmount: 0, count: 0 };
    const overallExpense = overallSummary.find(s => s._id === 'expense') || { totalAmount: 0, count: 0 };
    const overallBalance = overallIncome.totalAmount - overallExpense.totalAmount;

    // Calculate payment method totals for income
    const incomeCash = paymentMethodBreakdown
      .filter(p => p._id.type === 'income' && p._id.paymentMethod === 'cash')
      .reduce((sum, p) => sum + p.totalAmount, 0);
    
    const incomeCard = paymentMethodBreakdown
      .filter(p => p._id.type === 'income' && (p._id.paymentMethod === 'card' || p._id.paymentMethod === 'click'))
      .reduce((sum, p) => sum + p.totalAmount, 0);

    // Calculate payment method totals for expense
    const expenseCash = paymentMethodBreakdown
      .filter(p => p._id.type === 'expense' && p._id.paymentMethod === 'cash')
      .reduce((sum, p) => sum + p.totalAmount, 0);
    
    const expenseCard = paymentMethodBreakdown
      .filter(p => p._id.type === 'expense' && (p._id.paymentMethod === 'card' || p._id.paymentMethod === 'click'))
      .reduce((sum, p) => sum + p.totalAmount, 0);

    // Calculate balance by payment method
    const balanceCash = incomeCash - expenseCash;
    const balanceCard = incomeCard - expenseCard;

    // Process period results
    const periodIncome = periodSummary.find(s => s._id === 'income') || { totalAmount: 0, count: 0 };
    const periodExpense = periodSummary.find(s => s._id === 'expense') || { totalAmount: 0, count: 0 };
    const periodBalance = periodIncome.totalAmount - periodExpense.totalAmount;

    const summary = {
      totalIncome: overallIncome.totalAmount,
      totalExpense: overallExpense.totalAmount,
      balance: overallBalance,
      incomeCount: overallIncome.count,
      expenseCount: overallExpense.count,
      incomeCash,
      incomeCard,
      expenseCash,
      expenseCard,
      balanceCash,
      balanceCard,
      ...(period && {
        [`${period}Income`]: periodIncome.totalAmount,
        [`${period}Expense`]: periodExpense.totalAmount,
        [`${period}Balance`]: periodBalance,
        [`${period}IncomeCount`]: periodIncome.count,
        [`${period}ExpenseCount`]: periodExpense.count
      })
    };

    console.log(`📊 Transaction Summary (${period || 'all'}):`, summary);

    res.json({ summary });
  } catch (error: any) {
    console.error('❌ Summary error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getTransactionStats = async (req: AuthRequest, res: Response) => {
  try {
    const { period = 'month' } = req.query;
    
    // Build date filter
    const now = new Date();
    let dateFilter = {};
    
    switch (period) {
      case 'today':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        dateFilter = {
          createdAt: {
            $gte: today,
            $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
          }
        };
        break;
      case 'week':
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        dateFilter = {
          createdAt: {
            $gte: weekStart,
            $lt: now
          }
        };
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        dateFilter = {
          createdAt: {
            $gte: monthStart,
            $lt: now
          }
        };
        break;
      case 'year':
        const yearStart = new Date(now.getFullYear(), 0, 1);
        dateFilter = {
          createdAt: {
            $gte: yearStart,
            $lt: now
          }
        };
        break;
    }

    // Get stats by category
    const categoryStats = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$category',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    // Get stats by payment method
    const paymentMethodStats = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: '$paymentMethod',
          amount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { amount: -1 } }
    ]);

    // Get daily stats for the period
    const dailyStats = await Transaction.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            type: '$type'
          },
          amount: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // Process daily stats
    const dailyStatsProcessed = dailyStats.reduce((acc: any, curr: any) => {
      const date = curr._id.date;
      if (!acc[date]) {
        acc[date] = { date, income: 0, expense: 0, balance: 0 };
      }
      acc[date][curr._id.type] = curr.amount;
      acc[date].balance = acc[date].income - acc[date].expense;
      return acc;
    }, {});

    // Calculate totals for percentage calculations
    const totalAmount = categoryStats.reduce((sum, item) => sum + item.amount, 0);
    const totalPaymentAmount = paymentMethodStats.reduce((sum, item) => sum + item.amount, 0);

    const stats = {
      byCategory: categoryStats.map(item => ({
        category: item._id,
        amount: item.amount,
        count: item.count,
        percentage: totalAmount > 0 ? Math.round((item.amount / totalAmount) * 100) : 0
      })),
      byPaymentMethod: paymentMethodStats.map(item => ({
        method: item._id,
        amount: item.amount,
        count: item.count,
        percentage: totalPaymentAmount > 0 ? Math.round((item.amount / totalPaymentAmount) * 100) : 0
      })),
      byDate: Object.values(dailyStatsProcessed)
    };

    res.json({ stats });
  } catch (error: any) {
    console.error('❌ Stats error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const deleteTransaction = async (req: AuthRequest, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // Use atomic operation for deletion and earnings update
    const session = await Transaction.startSession();
    session.startTransaction();

    try {
      // Reverse the earnings update
      const user = req.user!;
      const earningsUpdate = transaction.type === 'income' ? -transaction.amount : transaction.amount;
      const newEarnings = Math.max(0, user.earnings + earningsUpdate);
      
      await User.findByIdAndUpdate(
        user._id,
        { earnings: newEarnings },
        { session, new: true }
      );

      await Transaction.findByIdAndDelete(req.params.id, { session });

      await session.commitTransaction();

      console.log(`✅ Transaction deleted: ${transaction.type} ${transaction.amount}`);

      res.json({
        message: 'Transaction deleted successfully',
        updatedEarnings: newEarnings
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    console.error('❌ Delete transaction error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Bulk delete transactions
export const bulkDeleteTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Invalid transaction IDs' });
    }

    // Get transactions to calculate earnings reversal
    const transactions = await Transaction.find({ _id: { $in: ids } });
    
    if (transactions.length === 0) {
      return res.status(404).json({ message: 'No transactions found' });
    }

    // Calculate total earnings change
    const earningsChange = transactions.reduce((total, transaction) => {
      return total + (transaction.type === 'income' ? -transaction.amount : transaction.amount);
    }, 0);

    // Use atomic operation
    const session = await Transaction.startSession();
    session.startTransaction();

    try {
      // Update user earnings
      const user = req.user!;
      const newEarnings = Math.max(0, user.earnings + earningsChange);
      
      await User.findByIdAndUpdate(
        user._id,
        { earnings: newEarnings },
        { session, new: true }
      );

      // Delete transactions
      const deleteResult = await Transaction.deleteMany(
        { _id: { $in: ids } },
        { session }
      );

      await session.commitTransaction();

      console.log(`✅ Bulk deleted ${deleteResult.deletedCount} transactions`);

      res.json({
        message: `${deleteResult.deletedCount} transactions deleted successfully`,
        deletedCount: deleteResult.deletedCount,
        updatedEarnings: newEarnings
      });
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  } catch (error: any) {
    console.error('❌ Bulk delete error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

export const getTransactionById = async (req: AuthRequest, res: Response) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('createdBy', 'name');

    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    res.json({ transaction });
  } catch (error: any) {
    console.error('❌ Get transaction error:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};