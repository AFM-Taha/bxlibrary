import mongoose from 'mongoose';

const BookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: false,
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  // Google Drive integration
  driveUrl: {
    type: String,
    required: true,
    trim: true
  },
  driveFileId: {
    type: String,
    required: true,
    trim: true
  },
  thumbnailUrl: {
    type: String,
    required: false
  },
  // Publishing status
  status: {
    type: String,
    enum: ['published', 'draft', 'archived'],
    default: 'draft'
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date,
    required: false
  },
  // Metadata
  fileSize: {
    type: Number,
    required: false
  },
  pageCount: {
    type: Number,
    required: false
  },
  // Reading statistics
  readCount: {
    type: Number,
    default: 0
  },
  lastReadAt: {
    type: Date,
    required: false
  },
  // Admin fields
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Indexes for better performance
BookSchema.index({ title: 'text' }); // Text search
BookSchema.index({ category: 1 });
BookSchema.index({ isPublished: 1 });
BookSchema.index({ createdAt: -1 });
BookSchema.index({ readCount: -1 });

// Virtual for category name
BookSchema.virtual('categoryName', {
  ref: 'Category',
  localField: 'category',
  foreignField: '_id',
  justOne: true
});

// Extract Google Drive file ID from URL
BookSchema.statics.extractFileId = function(input) {
  if (!input) throw new Error('Input is required');
  
  // If it's already a file ID (no slashes), return as is
  if (!input.includes('/') && /^[a-zA-Z0-9-_]+$/.test(input) && input.length > 10) {
    return input;
  }
  
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/open\?id=([a-zA-Z0-9-_]+)/,
    /\/uc\?id=([a-zA-Z0-9-_]+)/
  ];
  
  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1];
    }
  }
  
  throw new Error('Invalid Google Drive URL format');
};

// Generate canonical Google Drive URL
BookSchema.methods.getCanonicalUrl = function() {
  return `https://drive.google.com/file/d/${this.driveFileId}/view`;
};

// Generate embed URL for iframe
BookSchema.methods.getEmbedUrl = function() {
  return `https://drive.google.com/file/d/${this.driveFileId}/preview`;
};

// Increment read count
BookSchema.methods.incrementReadCount = async function() {
  this.readCount += 1;
  this.lastReadAt = new Date();
  await this.save();
};

// Pre-save middleware to extract file ID
BookSchema.pre('save', function(next) {
  if (this.isModified('driveUrl')) {
    try {
      this.driveFileId = this.constructor.extractFileId(this.driveUrl);
    } catch (error) {
      return next(error);
    }
  }
  
  if (this.isModified('isPublished') && this.isPublished && !this.publishedAt) {
    this.publishedAt = new Date();
  }
  
  next();
});

// Update category book count after save
BookSchema.post('save', async function() {
  if (this.category) {
    const Category = mongoose.model('Category');
    const category = await Category.findById(this.category);
    if (category) {
      await category.updateBookCount();
    }
  }
});

// Update category book count after remove
BookSchema.post('remove', async function() {
  if (this.category) {
    const Category = mongoose.model('Category');
    const category = await Category.findById(this.category);
    if (category) {
      await category.updateBookCount();
    }
  }
});

export default mongoose.models.Book || mongoose.model('Book', BookSchema);