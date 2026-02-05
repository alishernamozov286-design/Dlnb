import mongoose, { Document, Schema } from 'mongoose';

export interface ITelegramUser extends Document {
  chatId: string;
  phoneNumber: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TelegramUserSchema: Schema = new Schema({
  chatId: {
    type: String,
    required: true,
    unique: true
  },
  phoneNumber: {
    type: String,
    required: true,
    unique: true
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
  username: {
    type: String
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model<ITelegramUser>('TelegramUser', TelegramUserSchema);