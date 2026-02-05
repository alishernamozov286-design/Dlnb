import mongoose, { Document, Schema } from 'mongoose';

export interface ITransaction extends Document {
  type: 'income' | 'expense';
  category: string;
  categoryId?: mongoose.Types.ObjectId; // Xarajat kategoriyasi ID'si
  amount: number;
  description: string;
  paymentMethod: 'cash' | 'card' | 'click';
  relatedTo?: {
    type: 'debt' | 'car' | 'expense_category' | 'other';
    id?: mongoose.Types.ObjectId;
  };
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const transactionSchema = new Schema<ITransaction>({
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  categoryId: {
    type: Schema.Types.ObjectId,
    ref: 'ExpenseCategory',
    required: false
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'click'],
    default: 'cash'
  },
  relatedTo: {
    type: {
      type: String,
      enum: ['debt', 'car', 'expense_category', 'other']
    },
    id: {
      type: Schema.Types.ObjectId,
      refPath: 'relatedTo.type'
    }
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ createdBy: 1, createdAt: -1 });

export default mongoose.model<ITransaction>('Transaction', transactionSchema);
