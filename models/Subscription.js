const mongoose = require('mongoose')

const subscriptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    pricingPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Pricing',
      required: true,
    },
    // Payment provider details
    provider: {
      type: String,
      enum: ['rupantor'],
      required: true,
    },
    // Provider-specific subscription IDs
    providerSubscriptionId: {
      type: String,
      required: false,
    },
    providerCustomerId: {
      type: String,
      required: false,
    },
    // Subscription details
    status: {
      type: String,
      enum: ['active', 'inactive', 'canceled', 'past_due', 'unpaid', 'pending'],
      default: 'pending',
    },
    billingPeriod: {
      type: String,
      enum: ['monthly', 'yearly'],
      required: true,
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
    // Subscription dates
    startDate: {
      type: Date,
    },
    endDate: {
      type: Date,
    },
    nextBillingDate: {
      type: Date,
    },
    canceledAt: {
      type: Date,
    },
    // Trial information
    trialStart: {
      type: Date,
    },
    trialEnd: {
      type: Date,
    },
    // Payment history
    lastPaymentDate: {
      type: Date,
    },
    lastPaymentAmount: {
      type: Number,
    },
    failedPaymentAttempts: {
      type: Number,
      default: 0,
    },
    // Metadata
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Administrative fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
subscriptionSchema.index({ user: 1 })
subscriptionSchema.index({ status: 1 })
subscriptionSchema.index({ provider: 1 })
subscriptionSchema.index({ stripeSubscriptionId: 1 })
subscriptionSchema.index({ paypalSubscriptionId: 1 })
subscriptionSchema.index({ nextBillingDate: 1 })
subscriptionSchema.index({ endDate: 1 })

// Virtual for checking if subscription is active
subscriptionSchema.virtual('isActive').get(function () {
  return (
    this.status === 'active' && (!this.endDate || this.endDate > new Date())
  )
})

// Virtual for checking if subscription is in trial
subscriptionSchema.virtual('isInTrial').get(function () {
  const now = new Date()
  return (
    this.trialStart &&
    this.trialEnd &&
    now >= this.trialStart &&
    now <= this.trialEnd
  )
})

// Virtual for days until next billing
subscriptionSchema.virtual('daysUntilNextBilling').get(function () {
  if (!this.nextBillingDate) return null
  const now = new Date()
  const diffTime = this.nextBillingDate - now
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
})

// Virtual for formatted amount
subscriptionSchema.virtual('formattedAmount').get(function () {
  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    CAD: 'C$',
    AUD: 'A$',
  }
  const symbol = currencySymbols[this.currency] || this.currency
  return `${symbol}${this.amount.toFixed(2)}`
})

// Ensure virtual fields are serialized
subscriptionSchema.set('toJSON', { virtuals: true })
subscriptionSchema.set('toObject', { virtuals: true })

// Static method to find active subscriptions for a user
subscriptionSchema.statics.findActiveForUser = function (userId) {
  return this.findOne({
    user: userId,
    status: 'active',
    $or: [{ endDate: { $exists: false } }, { endDate: { $gt: new Date() } }],
  }).populate('pricingPlan')
}

// Static method to find subscriptions by provider ID
subscriptionSchema.statics.findByProviderSubscriptionId = function (
  provider,
  subscriptionId,
) {
  const query = { provider }
  if (provider === 'stripe') {
    query.stripeSubscriptionId = subscriptionId
  } else if (provider === 'paypal') {
    query.paypalSubscriptionId = subscriptionId
  }
  return this.findOne(query).populate('user pricingPlan')
}

// Instance method to cancel subscription
subscriptionSchema.methods.cancel = function () {
  this.status = 'canceled'
  this.canceledAt = new Date()
  return this.save()
}

// Instance method to activate subscription
subscriptionSchema.methods.activate = function (startDate, endDate) {
  this.status = 'active'
  this.startDate = startDate || new Date()
  if (endDate) this.endDate = endDate
  return this.save()
}

// Pre-save middleware
subscriptionSchema.pre('save', function (next) {
  // Set next billing date if not set
  if (this.isNew && !this.nextBillingDate && this.startDate) {
    const nextBilling = new Date(this.startDate)
    if (this.billingPeriod === 'monthly') {
      nextBilling.setMonth(nextBilling.getMonth() + 1)
    } else if (this.billingPeriod === 'yearly') {
      nextBilling.setFullYear(nextBilling.getFullYear() + 1)
    }
    this.nextBillingDate = nextBilling
  }
  next()
})

module.exports =
  mongoose.models.Subscription ||
  mongoose.model('Subscription', subscriptionSchema)
