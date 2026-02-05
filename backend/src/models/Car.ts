import mongoose, { Document, Schema } from 'mongoose';

export interface IPart {
  _id?: mongoose.Types.ObjectId;
  name: string;
  price: number;
  quantity: number;
  status: 'needed' | 'ordered' | 'available' | 'installed';
  source?: 'available' | 'tobring'; // Bizda bor yoki keltirish
}

export interface IServiceItem {
  _id?: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  category: 'part' | 'material' | 'labor';
}

export interface IPayment {
  _id?: mongoose.Types.ObjectId;
  amount: number;
  method: 'cash' | 'card' | 'click';
  paidAt: Date;
  paidBy?: mongoose.Types.ObjectId;
  notes?: string;
}

export interface ICar extends Document {
  clientId?: string; // UUID for offline sync
  make: string;
  carModel: string;
  year: number;
  licensePlate: string;
  ownerName: string;
  ownerPhone: string;
  parts: IPart[];
  serviceItems: IServiceItem[];
  totalEstimate: number;
  paidAmount: number;
  paymentStatus: 'pending' | 'partial' | 'paid';
  payments: IPayment[];
  status: 'pending' | 'in-progress' | 'completed' | 'delivered';
  isDeleted: boolean;
  deletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const partSchema = new Schema<IPart>({
  name: {
    type: String,
    required: true
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
  status: {
    type: String,
    enum: ['needed', 'ordered', 'available', 'installed'],
    default: 'needed'
  },
  source: {
    type: String,
    enum: ['available', 'tobring'],
    default: 'available'
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
    required: true,
    default: 'labor'
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
  },
  notes: {
    type: String,
    trim: true
  }
});

const carSchema = new Schema<ICar>({
  clientId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  make: {
    type: String,
    required: true,
    trim: true
  },
  carModel: {
    type: String,
    required: true,
    trim: true
  },
  year: {
    type: Number,
    required: true,
    min: 1900,
    max: new Date().getFullYear() + 1
  },
  licensePlate: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },
  ownerName: {
    type: String,
    required: true,
    trim: true
  },
  ownerPhone: {
    type: String,
    required: true,
    trim: true
  },
  parts: [partSchema],
  serviceItems: [serviceItemSchema],
  totalEstimate: {
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
    enum: ['pending', 'in-progress', 'completed', 'delivered'],
    default: 'pending'
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  }
}, {
  timestamps: true
});

carSchema.pre('save', function(next) {
  const partsTotal = this.parts.reduce((total, part) => total + (part.price * part.quantity), 0);
  const servicesTotal = this.serviceItems.reduce((total, service) => total + (service.price * service.quantity), 0);
  this.totalEstimate = partsTotal + servicesTotal;
  next();
});

carSchema.pre('findOneAndUpdate', function(next) {
  const update = this.getUpdate() as any;
  if (update.parts || update.serviceItems) {
    const partsTotal = (update.parts || []).reduce((total: number, part: any) => total + (part.price * part.quantity), 0);
    const servicesTotal = (update.serviceItems || []).reduce((total: number, service: any) => total + (service.price * service.quantity), 0);
    update.totalEstimate = partsTotal + servicesTotal;
  }
  next();
});

export default mongoose.model<ICar>('Car', carSchema);