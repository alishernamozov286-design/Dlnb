import mongoose, { Document, Schema } from 'mongoose';

export interface ISparePart extends Document {
  name: string;
  costPrice: number; // O'zini narxi (sotib olingan narx)
  sellingPrice: number; // Sotish narxi
  price: number; // Deprecated - eski tizim uchun
  quantity: number;
  supplier: string;
  usageCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  profit?: number; // Virtual field - foyda (sellingPrice - costPrice)
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
  quantity: {
    type: Number,
    required: true,
    min: 0
  },
  supplier: {
    type: String,
    required: true,
    trim: true
  },
  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
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

// Compound index for efficient queries
sparePartSchema.index({ isActive: 1, usageCount: -1 });

export default mongoose.model<ISparePart>('SparePart', sparePartSchema);