const mongoose = require('mongoose')

const paymentConfigSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      enum: ['stripe', 'paypal', 'rupantor'],
      unique: true,
    },
    isActive: {
      type: Boolean,
      default: false,
    },
    // RupantorPay Configuration
    rupantorApiKey: {
      type: String,
      required: function () {
        return this.provider === 'rupantor'
      },
    },
    rupantorMerchantId: {
      type: String,
    },
    rupantorSecretKey: {
      type: String,
    },
    // Stripe Configuration
    stripePublishableKey: {
      type: String,
      required: function () {
        return this.provider === 'stripe'
      },
    },
    stripeSecretKey: {
      type: String,
      required: function () {
        return this.provider === 'stripe'
      },
    },
    stripeWebhookSecret: {
      type: String,
    },
    // PayPal Configuration
    paypalClientId: {
      type: String,
    },
    paypalClientSecret: {
      type: String,
    },
    paypalWebhookId: {
      type: String,
    },
    // Environment settings
    environment: {
      type: String,
      enum: ['sandbox', 'production'],
      default: 'sandbox',
    },
    // Currency settings
    defaultCurrency: {
      type: String,
      default: 'USD',
    },
    supportedCurrencies: [
      {
        type: String,
        default: ['USD', 'EUR', 'GBP'],
      },
    ],
    // Additional settings
    settings: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    // Administrative fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
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
paymentConfigSchema.index({ provider: 1 })
paymentConfigSchema.index({ isActive: 1 })

// Ensure virtual fields are serialized
paymentConfigSchema.set('toJSON', { virtuals: true })
paymentConfigSchema.set('toObject', { virtuals: true })

// Pre-save middleware to encrypt sensitive data (basic implementation)
paymentConfigSchema.pre('save', function (next) {
  // In production, you should encrypt sensitive fields like API keys
  // For now, we'll just proceed
  next()
})

// Static method to get active payment providers
paymentConfigSchema.statics.getActiveProviders = function () {
  return this.find({ isActive: true }).select(
    '-stripeSecretKey -paypalClientSecret',
  )
}

// Static method to get provider config
paymentConfigSchema.statics.getProviderConfig = function (provider) {
  return this.findOne({ provider, isActive: true })
}

module.exports =
  mongoose.models.PaymentConfig ||
  mongoose.model('PaymentConfig', paymentConfigSchema)
