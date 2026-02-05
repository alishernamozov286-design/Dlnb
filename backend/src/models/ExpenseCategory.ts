import mongoose, { Document, Schema } from 'mongoose';

export interface IExpenseCategory extends Document {
  name: string;
  nameUz: string;
  description: string;
  icon: string;
  color: string;
  isDefault: boolean;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const expenseCategorySchema = new Schema<IExpenseCategory>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  nameUz: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  icon: {
    type: String,
    required: true,
    enum: [
      'ShoppingCart', 'Home', 'Zap', 'Users', 'Truck', 'Megaphone', 
      'Monitor', 'FileText', 'DollarSign', 'CreditCard', 'Wallet',
      'Building', 'Car', 'Fuel', 'Wrench', 'Package', 'Phone',
      'Wifi', 'Lightbulb', 'Calculator', 'Briefcase'
    ],
    default: 'DollarSign'
  },
  color: {
    type: String,
    required: true,
    enum: ['blue', 'green', 'yellow', 'purple', 'red', 'indigo', 'pink', 'gray'],
    default: 'blue'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
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
expenseCategorySchema.index({ isActive: 1, isDefault: 1 });
expenseCategorySchema.index({ createdBy: 1 });

export default mongoose.model<IExpenseCategory>('ExpenseCategory', expenseCategorySchema);