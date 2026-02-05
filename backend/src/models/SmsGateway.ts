import mongoose, { Document, Schema } from 'mongoose';

export interface ISmsGateway extends Document {
  name: string;
  token: string;
  simNumber?: string;
  isActive: boolean;
  lastHeartbeat?: Date;
  messagesSent: number;
  createdAt: Date;
  updatedAt: Date;
}

const SmsGatewaySchema = new Schema<ISmsGateway>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  simNumber: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastHeartbeat: {
    type: Date
  },
  messagesSent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Token generatsiya qilish
SmsGatewaySchema.pre('save', function(next) {
  if (this.isNew && !this.token) {
    this.token = generateToken();
  }
  next();
});

function generateToken(): string {
  return require('crypto').randomBytes(32).toString('hex');
}

export default mongoose.model<ISmsGateway>('SmsGateway', SmsGatewaySchema);
