import mongoose, { Document, Schema } from 'mongoose';

export interface IKnowledgeBase extends Document {
  master: mongoose.Types.ObjectId;
  carModel: string;
  problem: string;
  solution: string;
  category?: string;
  tags?: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const knowledgeBaseSchema = new Schema<IKnowledgeBase>(
  {
    master: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    carModel: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    problem: {
      type: String,
      required: true,
      trim: true
    },
    solution: {
      type: String,
      required: true,
      trim: true
    },
    category: {
      type: String,
      trim: true,
      enum: ['motor', 'transmissiya', 'tormoz', 'suspenziya', 'elektr', 'boshqa'],
      default: 'boshqa'
    },
    tags: [{
      type: String,
      trim: true
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Text search index
knowledgeBaseSchema.index({ 
  carModel: 'text', 
  problem: 'text', 
  solution: 'text',
  tags: 'text'
});

const KnowledgeBase = mongoose.model<IKnowledgeBase>('KnowledgeBase', knowledgeBaseSchema);

export default KnowledgeBase;
