import dbConnect from '../../../../lib/mongodb'
import PaymentConfig from '../../../../models/PaymentConfig'
import { verifyToken } from '../../../../lib/jwt'
import User from '../../../../models/User'
import mongoose from 'mongoose'

export default async function handler(req, res) {
  await dbConnect()

  // Verify authentication
  const token = req.cookies.token
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  try {
    const decoded = verifyToken(token)
    const user = await User.findById(decoded.userId)

    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' })
    }

    const { id } = req.query

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid configuration ID' })
    }

    switch (req.method) {
      case 'GET':
        return await getPaymentConfig(req, res, id)
      case 'PUT':
        return await updatePaymentConfig(req, res, id, user)
      case 'DELETE':
        return await deletePaymentConfig(req, res, id)
      default:
        return res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Payment config API error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

async function getPaymentConfig(req, res, id) {
  try {
    const config = await PaymentConfig.findById(id)
      .select('-stripeSecretKey -paypalClientSecret')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')

    if (!config) {
      return res.status(404).json({ error: 'Payment configuration not found' })
    }

    return res.status(200).json({
      success: true,
      config,
    })
  } catch (error) {
    console.error('Error fetching payment config:', error)
    return res
      .status(500)
      .json({ error: 'Failed to fetch payment configuration' })
  }
}

async function updatePaymentConfig(req, res, id, user) {
  try {
    const config = await PaymentConfig.findById(id)
    if (!config) {
      return res.status(404).json({ error: 'Payment configuration not found' })
    }

    const {
      isActive,
      stripePublishableKey,
      stripeSecretKey,
      stripeWebhookSecret,
      paypalClientId,
      paypalClientSecret,
      paypalWebhookId,
      environment,
      defaultCurrency,
      supportedCurrencies,
      settings,
    } = req.body

    // Provider-specific validation
    if (config.provider === 'stripe') {
      if (stripePublishableKey !== undefined && !stripePublishableKey) {
        return res
          .status(400)
          .json({ error: 'Stripe publishable key cannot be empty' })
      }
      if (stripeSecretKey !== undefined && !stripeSecretKey) {
        return res
          .status(400)
          .json({ error: 'Stripe secret key cannot be empty' })
      }
    }

    if (config.provider === 'paypal') {
      // PayPal credentials can be updated later
    }

    // If setting this config as active, deactivate others of the same provider
    if (isActive && !config.isActive) {
      await PaymentConfig.updateMany(
        { provider: config.provider, _id: { $ne: id } },
        { isActive: false },
      )
    }

    // Update fields
    const updateData = {
      updatedBy: user._id,
    }

    if (isActive !== undefined) updateData.isActive = isActive
    if (environment !== undefined) updateData.environment = environment
    if (defaultCurrency !== undefined)
      updateData.defaultCurrency = defaultCurrency
    if (supportedCurrencies !== undefined)
      updateData.supportedCurrencies = supportedCurrencies
    if (settings !== undefined) updateData.settings = settings

    // Provider-specific updates
    if (config.provider === 'rupantor') {
      if (rupantorApiKey !== undefined)
        updateData.rupantorApiKey = rupantorApiKey
      if (rupantorMerchantId !== undefined)
        updateData.rupantorMerchantId = rupantorMerchantId
      if (rupantorSecretKey !== undefined)
        updateData.rupantorSecretKey = rupantorSecretKey
    }

    const updatedConfig = await PaymentConfig.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true },
    )
      .select('-rupantorSecretKey')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')

    return res.status(200).json({
      success: true,
      message: 'Payment configuration updated successfully',
      config: updatedConfig,
    })
  } catch (error) {
    console.error('Error updating payment config:', error)
    return res
      .status(500)
      .json({ error: 'Failed to update payment configuration' })
  }
}

async function deletePaymentConfig(req, res, id) {
  try {
    const config = await PaymentConfig.findById(id)
    if (!config) {
      return res.status(404).json({ error: 'Payment configuration not found' })
    }

    await PaymentConfig.findByIdAndDelete(id)

    return res.status(200).json({
      success: true,
      message: 'Payment configuration deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting payment config:', error)
    return res
      .status(500)
      .json({ error: 'Failed to delete payment configuration' })
  }
}
