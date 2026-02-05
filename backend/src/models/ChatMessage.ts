import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  user?: mongoose.Types.ObjectId;
  sessionId: string; // For anonymous users
  role: 'user' | 'assistant';
  content: string;
  userRole: 'client' | 'apprentice' | 'master';
  createdAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  sessionId: {
    type: String,
    required: true,
    index: true
  },
  role: {
    type: String,
    enum: ['user', 'assistant'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  userRole: {
    type: String,
    enum: ['client', 'apprentice', 'master'],
    required: true
  }
}, {
  timestamps: true
});

// Index for faster queries
chatMessageSchema.index({ sessionId: 1, createdAt: -1 });

export default mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
