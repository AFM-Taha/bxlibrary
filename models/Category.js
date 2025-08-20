import mongoose from 'mongoose';

const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bookCount: {
    type: Number,
    default: 0
  },
  // Soft delete fields
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    required: false
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Index for faster searches
CategorySchema.index({ name: 1 });
CategorySchema.index({ isActive: 1 });
CategorySchema.index({ isDeleted: 1 });

// Virtual for getting active books in this category
CategorySchema.virtual('books', {
  ref: 'Book',
  localField: '_id',
  foreignField: 'categories',
  match: { isPublished: true }
});

// Update book count when books are added/removed
CategorySchema.methods.updateBookCount = async function() {
  const Book = mongoose.model('Book');
  this.bookCount = await Book.countDocuments({ 
    categories: this._id, 
    isPublished: true 
  });
  await this.save();
};

export default mongoose.models.Category || mongoose.model('Category', CategorySchema);