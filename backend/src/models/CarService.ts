import mongoose, { Document, Schema } from 'mongoose';

export interface IServiceItem {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category: 'part' | 'material' | 'labor';
  status: 'pending' | 'in-progress' | 'completed' | 'approved' | 'rejected';
  completedAt?: Date;
  approvedAt?: Date;
  rejectionReason?: string;
}

export interface IUsedSparePart {
  _id?: mongoose.Types.ObjectId;
  sparePartId: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface IPayment {
  _id?: mongoose.Types.ObjectId;
  amount: number;
  method: 'cash' | 'card' | 'click';
  paidAt: Date;
  paidBy?: mongoose.Types.ObjectId;
}

export interface ICarService extends Document {
  car: mongoose.Types.ObjectId;
  items: IServiceItem[];
  usedSpareParts: IUsedSparePart[];
  totalPrice: number;
  paidAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  payments: IPayment[];
  status: 'pending' | 'in-progress' | 'ready-for-delivery' | 'rejected' | 'completed' | 'delivered';
  rejectionReason?: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const usedSparePartSchema = new Schema<IUsedSparePart>({
  sparePartId: {
    type: Schema.Types.ObjectId,
    ref: 'SparePart',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  unitPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalPrice: {
    type: Number,
    required: true,
    min: 0
  }
});

const serviceItemSchema = new Schema<IServiceItem>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  category: {
    type: String,
    enum: ['part', 'material', 'labor'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed', 'approved', 'rejected'],
    default: 'pending'
  },
  completedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  rejectionReason: {
    type: String,
    trim: true
  }
});

const paymentSchema = new Schema<IPayment>({
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  method: {
    type: String,
    enum: ['cash', 'card', 'click'],
    required: true
  },
  paidAt: {
    type: Date,
    default: Date.now
  },
  paidBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
});

const carServiceSchema = new Schema<ICarService>({
  car: {
    type: Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  items: [serviceItemSchema],
  usedSpareParts: [usedSparePartSchema],
  totalPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  paidAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'partial', 'paid'],
    default: 'pending'
  },
  payments: [paymentSchema],
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'ready-for-delivery', 'rejected', 'completed', 'delivered'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

// Calculate total price before saving
carServiceSchema.pre('save', function(next) {
  const itemsTotal = this.items.reduce((total, item) => {
    return total + (item.price * item.quantity);
  }, 0);
  
  const sparePartsTotal = this.usedSpareParts.reduce((total, part) => {
    return total + part.totalPrice;
  }, 0);
  
  this.totalPrice = itemsTotal + sparePartsTotal;
  next();
});

export default mongoose.model<ICarService>('CarService', carServiceSchema);