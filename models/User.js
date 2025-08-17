import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  name: {
    type: String,
    required: false,
    trim: true
  },
  password: {
    type: String,
    required: false // Will be set when user accepts invite
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive'],
    default: 'pending'
  },
  inviteToken: {
    type: String,
    required: false
  },
  inviteTokenExpiry: {
    type: Date,
    required: false
  },
  resetPasswordToken: {
    type: String,
    required: false
  },
  resetPasswordExpiry: {
    type: Date,
    required: false
  },
  expiryDate: {
    type: Date,
    required: false // Optional expiry date for user access
  },
  lastLogin: {
    type: Date,
    required: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  auditTrail: [{
    action: String,
    performedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: String
  }]
}, {
  timestamps: true
});

// Hash password before saving
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12);
  }
  next();
});

// Compare password method
UserSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Check if user access is valid
UserSchema.methods.isAccessValid = function() {
  if (this.status !== 'active') return false;
  if (this.expiryDate && this.expiryDate < new Date()) return false;
  return true;
};

// Add audit trail entry
UserSchema.methods.addAuditEntry = function(action, performedBy, details = '') {
  this.auditTrail.push({
    action,
    performedBy,
    details,
    timestamp: new Date()
  });
};

export default mongoose.models.User || mongoose.model('User', UserSchema);