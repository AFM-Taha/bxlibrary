import mongoose from 'mongoose'

const PaymentSessionSchema = new mongoose.Schema(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    subscriptionId: {
      type: String,
      required: false,
    },
    provider: {
      type: String,
      enum: ['rupantor'],
      required: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pricing',
      required: true,
    },
    planDetails: {
      name: String,
      price: Number,
      currency: String,
      billingPeriod: String,
      features: [String],
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'expired'],
      default: 'pending',
    },
    customerEmail: {
      type: String,
      required: false,
    },
    paymentIntentId: {
      type: String,
      required: false,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false, // Will be set after user signup
    },
    signupToken: {
      type: String,
      required: false, // Generated after payment completion
    },
    signupTokenExpiry: {
      type: Date,
      required: false,
    },
    signupCompleted: {
      type: Boolean,
      default: false,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  },
)

// Index for efficient queries
PaymentSessionSchema.index({ sessionId: 1 })
PaymentSessionSchema.index({ signupToken: 1 })
PaymentSessionSchema.index({ status: 1 })
PaymentSessionSchema.index({ createdAt: 1 })

// Method to generate signup token
PaymentSessionSchema.methods.generateSignupToken = function () {
  const crypto = require('crypto')
  const token = crypto.randomBytes(32).toString('hex')
  this.signupToken = token
  this.signupTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours
  return token
}

// Method to check if signup token is valid
PaymentSessionSchema.methods.isSignupTokenValid = function () {
  return (
    this.signupToken &&
    this.signupTokenExpiry &&
    this.signupTokenExpiry > new Date() &&
    this.status === 'completed' &&
    !this.signupCompleted
  )
}

export default mongoose.models.PaymentSession ||
  mongoose.model('PaymentSession', PaymentSessionSchema)
