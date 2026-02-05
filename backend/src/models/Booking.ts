import mongoose, { Document, Schema } from 'mongoose';

export interface IBooking extends Document {
  customerName: string;
  phoneNumber: string;
  licensePlate: string;
  bookingDate: Date;
  birthDate?: Date; // Tug'ilgan kun (ixtiyoriy)
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const bookingSchema = new Schema<IBooking>(
  {
    customerName: {
      type: String,
      required: true,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      trim: true,
    },
    licensePlate: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    bookingDate: {
      type: Date,
      required: true,
    },
    birthDate: {
      type: Date,
      required: false, // Ixtiyoriy
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'completed', 'cancelled'],
      default: 'pending',
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
bookingSchema.index({ bookingDate: 1, status: 1 });
bookingSchema.index({ phoneNumber: 1 });
bookingSchema.index({ licensePlate: 1 });

export default mongoose.model<IBooking>('Booking', bookingSchema);
