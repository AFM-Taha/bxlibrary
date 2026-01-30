import mongoose from 'mongoose'

const PricingSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: false,
      trim: true,
      maxlength: 500,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: 'USD',
      enum: ['USD', 'EUR', 'GBP', 'INR', 'BDT'],
    },
    billingPeriod: {
      type: String,
      required: true,
      enum: ['monthly', 'yearly', 'lifetime'],
      default: 'monthly',
    },
    features: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        included: {
          type: Boolean,
          default: true,
        },
        limit: {
          type: String,
          required: false,
        },
      },
    ],
    isPopular: {
      type: Boolean,
      default: false,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    sortOrder: {
      type: Number,
      default: 0,
    },
    buttonText: {
      type: String,
      default: 'Get Started',
    },
    buttonLink: {
      type: String,
      required: false,
    },
    // Admin fields
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
PricingSchema.index({ isActive: 1 })
PricingSchema.index({ sortOrder: 1 })
PricingSchema.index({ createdAt: -1 })

// Virtual for formatted price
PricingSchema.virtual('formattedPrice').get(function () {
  const currencySymbols = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    INR: '₹',
    BDT: '৳',
  }

  const symbol = currencySymbols[this.currency] || '$'
  return `${symbol}${this.price}`
})

// Ensure virtuals are included in JSON
PricingSchema.set('toJSON', { virtuals: true })
PricingSchema.set('toObject', { virtuals: true })

// Force model recompilation to pick up schema changes (especially enum updates)
// This is necessary because Next.js hot reloading doesn't automatically update Mongoose schemas
if (mongoose.models.Pricing) {
  delete mongoose.models.Pricing
}

export default mongoose.model('Pricing', PricingSchema)
