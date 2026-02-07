import mongoose, { Document, Schema } from 'mongoose';

// Har bir shogird uchun tayinlash ma'lumotlari
export interface ITaskAssignment {
  apprentice: mongoose.Types.ObjectId;
  percentage: number; // Shogird foizi (0-100)
  allocatedAmount: number; // Ajratilgan pul (umumiy pul / ishchilar soni)
  earning: number; // Shogird daromadi (allocatedAmount * percentage / 100)
  masterShare: number; // Ustoz ulushi (allocatedAmount - earning)
}

export interface ITask extends Document {
  title: string;
  description: string;
  assignedTo: mongoose.Types.ObjectId; // Bitta shogird (eski vazifalar uchun)
  assignments: ITaskAssignment[]; // Ko'p shogirdlar (yangi tizim)
  assignedBy: mongoose.Types.ObjectId;
  car: mongoose.Types.ObjectId;
  service?: mongoose.Types.ObjectId;
  serviceItemId?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'assigned' | 'in-progress' | 'completed' | 'approved' | 'rejected';
  dueDate: Date;
  completedAt?: Date;
  approvedAt?: Date;
  notes?: string;
  rejectionReason?: string;
  estimatedHours: number;
  actualHours?: number;
  payment?: number;
  apprenticePercentage?: number; // Eski tizim
  apprenticeEarning?: number; // Eski tizim
  masterEarning?: number; // Eski tizim
  createdAt: Date;
  updatedAt: Date;
}

// Shogird tayinlash schemasi
const taskAssignmentSchema = new Schema<ITaskAssignment>({
  apprentice: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  percentage: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  allocatedAmount: {
    type: Number,
    required: true,
    min: 0
  },
  earning: {
    type: Number,
    required: true,
    min: 0
  },
  masterShare: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const taskSchema = new Schema<ITask>({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false, // Yangi tizimda majburiy emas
    index: true // Tez qidirish uchun indeks
  },
  assignments: {
    type: [taskAssignmentSchema],
    default: []
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  car: {
    type: Schema.Types.ObjectId,
    ref: 'Car',
    required: true
  },
  service: {
    type: Schema.Types.ObjectId,
    ref: 'Service',
    required: false
  },
  serviceItemId: {
    type: String,
    required: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['assigned', 'in-progress', 'completed', 'approved', 'rejected'],
    default: 'assigned',
    index: true // Tez qidirish uchun indeks
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedAt: {
    type: Date
  },
  approvedAt: {
    type: Date
  },
  notes: {
    type: String,
    trim: true
  },
  rejectionReason: {
    type: String,
    trim: true
  },
  estimatedHours: {
    type: Number,
    required: true,
    min: 0.5
  },
  actualHours: {
    type: Number,
    min: 0
  },
  payment: {
    type: Number,
    min: 0,
    default: 0
  },
  apprenticePercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  apprenticeEarning: {
    type: Number,
    min: 0,
    default: 0
  },
  masterEarning: {
    type: Number,
    min: 0,
    default: 0
  }
}, {
  timestamps: true
});

// Compound indekslar - tez qidirish uchun
taskSchema.index({ assignedTo: 1, status: 1 });
taskSchema.index({ 'assignments.apprentice': 1, status: 1 });

export default mongoose.model<ITask>('Task', taskSchema);