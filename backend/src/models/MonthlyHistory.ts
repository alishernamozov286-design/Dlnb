import mongoose, { Document, Schema } from 'mongoose';

export interface IMonthlyHistory extends Document {
  month: number; // 1-12
  year: number;
  totalIncome: number;
  totalExpense: number;
  balance: number;
  incomeCash: number;
  incomeCard: number;
  expenseCash: number;
  expenseCard: number;
  balanceCash: number;
  balanceCard: number;
  incomeCount: number;
  expenseCount: number;
  transactionCount: number;
  userEarnings: {
    userId: mongoose.Types.ObjectId;
    name: string;
    role: string;
    earnings: number;
  }[];
  resetDate: Date;
  resetBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const monthlyHistorySchema = new Schema<IMonthlyHistory>({
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  totalIncome: {
    type: Number,
    default: 0
  },
  totalExpense: {
    type: Number,
    default: 0
  },
  balance: {
    type: Number,
    default: 0
  },
  incomeCash: {
    type: Number,
    default: 0
  },
  incomeCard: {
    type: Number,
    default: 0
  },
  expenseCash: {
    type: Number,
    default: 0
  },
  expenseCard: {
    type: Number,
    default: 0
  },
  balanceCash: {
    type: Number,
    default: 0
  },
  balanceCard: {
    type: Number,
    default: 0
  },
  incomeCount: {
    type: Number,
    default: 0
  },
  expenseCount: {
    type: Number,
    default: 0
  },
  transactionCount: {
    type: Number,
    default: 0
  },
  userEarnings: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    name: {
      type: String,
      required: true
    },
    role: {
      type: String,
      required: true
    },
    earnings: {
      type: Number,
      default: 0
    }
  }],
  resetDate: {
    type: Date,
    default: Date.now
  },
  resetBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
monthlyHistorySchema.index({ year: -1, month: -1 });
monthlyHistorySchema.index({ resetDate: -1 });

export default mongoose.model<IMonthlyHistory>('MonthlyHistory', monthlyHistorySchema);
