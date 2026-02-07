import mongoose, { Document, Schema } from 'mongoose';

export interface ISparePart extends Document {
  name: string;
  costPrice: number; // O'zini narxi (sotib olingan narx)
  sellingPrice: number; // Sotish narxi
  price: number; // Deprecated - eski tizim uchun
  currency: 'UZS' | 'USD'; // Valyuta turi
  quantity: number;
  supplier?: string; // Ixtiyoriy - eski ma'lumotlar uchun
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  profit?: number; // Virtual field - foyda (sellingPrice - costPrice)
  // Balon uchun maxsus maydonlar
  category?: 'tire' | 'other'; // Tovar kategoriyasi
  tireSize?: string; // Disk razmeri (R13, R14, R15, R16, R17, R20, R22.5, R24.5)
  tireFullSize?: string; // To'liq razmer (175/65 R15, 315/80R22.5, 11R22.5)
  tireBrand?: string; // Balon brendi (Michelin, Bridgestone, Goodyear, va h.k.)
  tireType?: 'yozgi' | 'qishki' | 'universal'; // Balon turi
  unit?: string; // O'lchov birligi (dona, kg, litr, va h.k.)
}

const sparePartSchema = new Schema<ISparePart>({
  name: {
    type: String,
    required: true,
    trim: true,
    index: true
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
  price: {
    type: Number,
    min: 0,
    default: function() {
      return this.sellingPrice || 0; // Backward compatibility
    }
  },
  currency: {
    type: String,
    enum: ['UZS', 'USD'],
    default: 'UZS'
  },
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    type: String,
    trim: true,
    default: '' // Ixtiyoriy qilamiz
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  // Balon uchun maxsus maydonlar
  category: {
    type: String,
    enum: ['tire', 'other'],
    default: 'other'
  },
  tireSize: {
    type: String,
    trim: true,
    index: true
  },
  tireFullSize: {
    type: String,
    trim: true,
    index: true
  },
  tireBrand: {
    type: String,
    trim: true,
    index: true
  },
  tireType: {
    type: String,
    enum: ['yozgi', 'qishki', 'universal'],
    default: 'universal'
  },
  unit: {
    type: String,
    default: 'dona',
    trim: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual field - foyda hisoblash
sparePartSchema.virtual('profit').get(function() {
  return this.sellingPrice - this.costPrice;
});

// Text search index
sparePartSchema.index({ 
  name: 'text', 
  supplier: 'text'
});

// Compound indexes for efficient queries
sparePartSchema.index({ isActive: 1, usageCount: -1 });
sparePartSchema.index({ isActive: 1, quantity: 1 }); // Low stock queries
sparePartSchema.index({ isActive: 1, name: 1 }); // Name sorting
sparePartSchema.index({ isActive: 1, createdAt: -1 }); // Recent items
sparePartSchema.index({ category: 1, tireSize: 1 }); // Balon kategoriya va disk razmeri
sparePartSchema.index({ category: 1, tireFullSize: 1 }); // Balon kategoriya va to'liq razmer
sparePartSchema.index({ category: 1, tireBrand: 1 }); // Balon kategoriya va brend

export default mongoose.model<ISparePart>('SparePart', sparePartSchema);