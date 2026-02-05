import mongoose, { Document, Schema } from 'mongoose';

export interface ISubscription extends Document {
  user: mongoose.Types.ObjectId;
  plan: 'free' | 'basic' | 'pro';
  status: 'active' | 'expired' | 'cancelled';
  startDate: Date;
  endDate: Date;
  messageLimit: number;
  messagesUsed: number;
  createdAt: Date;
  updatedAt: Date;
  isExpired(): boolean;
  canSendMessage(): boolean;
}

const subscriptionSchema = new Schema<ISubscription>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date,
    required: true
  },
  messageLimit: {
    type: Number,
    default: 10 // Free plan default
  },
  messagesUsed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Check if subscription is expired
subscriptionSchema.methods.isExpired = function(): boolean {
  return new Date() > this.endDate;
};

// Check if user can send message
subscriptionSchema.methods.canSendMessage = function(): boolean {
  if (this.isExpired()) return false;
  if (this.plan === 'pro') return true; // Unlimited
  return this.messagesUsed < this.messageLimit;
};

export default mongoose.model<ISubscription>('Subscription', subscriptionSchema);
