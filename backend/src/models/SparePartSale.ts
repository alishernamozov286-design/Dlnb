import mongoose, { Document, Schema } from 'mongoose';

export interface ISparePartSale extends Document {
  sparePartId: mongoose.Types.ObjectId;
  sparePartName: string;
  quantity: number;
  costPrice: number; // O'zini narxi
  sellingPrice: number; // Sotish narxi
  totalCost: number; // Jami tannarx
  totalRevenue: number; // Jami tushum
  profit: number; // Foyda
  soldBy: mongoose.Types.ObjectId;
  soldByName: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const sparePartSaleSchema = new Schema<ISparePartSale>({
  sparePartId: {
    type: Schema.Types.ObjectId,
    ref: 'SparePart',
    required: true
  },
  sparePartName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  costPrice: {
    type: Number,
    required: true,
    min: 0
  },
  sellingPrice: {
    type: Number,
    required: true,
    min: 0
  },
  totalCost: {
    type: Number,
    required: true,
    min: 0
  },
  totalRevenue: {
    type: Number,
    required: true,
    min: 0
  },
  profit: {
    type: Number,
    required: true
  },
  soldBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  soldByName: {
    type: String,
    required: true
  },
  customerName: {
    type: String,
    trim: true
  },
  customerPhone: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes for efficient queries
sparePartSaleSchema.index({ sparePartId: 1, createdAt: -1 });
sparePartSaleSchema.index({ soldBy: 1, createdAt: -1 });
sparePartSaleSchema.index({ createdAt: -1 });

export default mongoose.model<ISparePartSale>('SparePartSale', sparePartSaleSchema);
