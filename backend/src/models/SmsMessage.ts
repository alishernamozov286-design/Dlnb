import mongoose, { Document, Schema } from 'mongoose';

export interface ISmsMessage extends Document {
  phoneNumber: string;
  message: string;
  status: 'pending' | 'queued' | 'sent' | 'delivered' | 'failed';
  gatewayId: mongoose.Types.ObjectId;
  bookingId?: mongoose.Types.ObjectId;
  sentAt?: Date;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SmsMessageSchema = new Schema<ISmsMessage>({
  phoneNumber: {
    type: String,
    required: true,
    trim: true
  },
  message: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'queued', 'sent', 'delivered', 'failed'],
    default: 'pending'
  },
  gatewayId: {
    type: Schema.Types.ObjectId,
    ref: 'SmsGateway',
    required: true
  },
  bookingId: {
    type: Schema.Types.ObjectId,
    ref: 'Booking'
  },
  sentAt: {
    type: Date
  },
  error: {
    type: String
  }
}, {
  timestamps: true
});

// Index'lar
SmsMessageSchema.index({ status: 1, gatewayId: 1 });
SmsMessageSchema.index({ bookingId: 1 });

export default mongoose.model<ISmsMessage>('SmsMessage', SmsMessageSchema);
