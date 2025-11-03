import mongoose from 'mongoose';

const SmartBookPageSchema = new mongoose.Schema(
  {
    pageNumber: { type: Number, required: true },
    text: { type: String, default: '' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date },
  },
  { _id: false }
);

const SmartBookContentSchema = new mongoose.Schema(
  {
    book: { type: mongoose.Schema.Types.ObjectId, ref: 'Book', required: true, unique: true },
    status: { type: String, enum: ['pending', 'parsed'], default: 'pending' },
    pages: { type: [SmartBookPageSchema], default: [] },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastEditedAt: { type: Date },
  },
  { timestamps: true }
);

SmartBookContentSchema.index({ book: 1 });

export default mongoose.models.SmartBookContent || mongoose.model('SmartBookContent', SmartBookContentSchema);