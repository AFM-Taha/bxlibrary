import mongoose from 'mongoose';

const ReadingSessionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  // Reading progress
  currentPage: {
    type: Number,
    default: 1,
    min: 1
  },
  totalPages: {
    type: Number,
    required: false
  },
  progressPercentage: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  // Session details
  startedAt: {
    type: Date,
    default: Date.now
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  totalReadingTime: {
    type: Number, // in minutes
    default: 0
  },
  // Reader preferences for this session
  readerSettings: {
    zoom: {
      type: String,
      enum: ['fit_width', 'fit_page', 'actual_size', 'custom'],
      default: 'fit_width'
    },
    customZoom: {
      type: Number,
      min: 25,
      max: 500,
      default: 100
    },
    darkMode: {
      type: Boolean,
      default: false
    },
    pageLayout: {
      type: String,
      enum: ['single', 'double'],
      default: 'single'
    }
  },
  // Status
  isActive: {
    type: Boolean,
    default: true
  },
  completedAt: {
    type: Date,
    required: false
  }
}, {
  timestamps: true
});

// Compound index for user-book combination
ReadingSessionSchema.index({ user: 1, book: 1 }, { unique: true });
ReadingSessionSchema.index({ user: 1, lastAccessedAt: -1 });
ReadingSessionSchema.index({ book: 1 });

// Calculate progress percentage
ReadingSessionSchema.methods.updateProgress = function(currentPage, totalPages) {
  this.currentPage = currentPage;
  if (totalPages) {
    this.totalPages = totalPages;
  }
  
  if (this.totalPages && this.totalPages > 0) {
    this.progressPercentage = Math.round((this.currentPage / this.totalPages) * 100);
    
    // Mark as completed if reached the end
    if (this.progressPercentage >= 95 && !this.completedAt) {
      this.completedAt = new Date();
    }
  }
  
  this.lastAccessedAt = new Date();
};

// Update reading time
ReadingSessionSchema.methods.addReadingTime = function(minutes) {
  this.totalReadingTime += minutes;
  this.lastAccessedAt = new Date();
};

// Static method to find or create session
ReadingSessionSchema.statics.findOrCreateSession = async function(userId, bookId) {
  let session = await this.findOne({ user: userId, book: bookId });
  
  if (!session) {
    session = await this.create({
      user: userId,
      book: bookId
    });
  } else {
    // Update last accessed time
    session.lastAccessedAt = new Date();
    await session.save();
  }
  
  return session;
};

// Get recent reading sessions for a user
ReadingSessionSchema.statics.getRecentSessions = async function(userId, limit = 10) {
  return this.find({ user: userId, isActive: true })
    .populate('book', 'title thumbnailUrl category')
    .populate('book.category', 'name')
    .sort({ lastAccessedAt: -1 })
    .limit(limit);
};

// Get reading statistics for a user
ReadingSessionSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { user: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalBooks: { $sum: 1 },
        completedBooks: {
          $sum: {
            $cond: [{ $ne: ['$completedAt', null] }, 1, 0]
          }
        },
        totalReadingTime: { $sum: '$totalReadingTime' },
        averageProgress: { $avg: '$progressPercentage' }
      }
    }
  ]);
  
  return stats[0] || {
    totalBooks: 0,
    completedBooks: 0,
    totalReadingTime: 0,
    averageProgress: 0
  };
};

export default mongoose.models.ReadingSession || mongoose.model('ReadingSession', ReadingSessionSchema);