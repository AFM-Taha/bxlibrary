import dbConnect from '../../../lib/mongodb'
import PaymentSession from '../../../models/PaymentSession'
import PaymentConfig from '../../../models/PaymentConfig'
import User from '../../../models/User'
import Pricing from '../../../models/Pricing'
import RupantorPayService from '../../../lib/payment/rupantor'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  await dbConnect()

  try {
    // Note: Rupantor redirect provides transaction_id or order_id
    const { sessionId, subscriptionId, transactionId, orderId } = req.body

    if (!sessionId && !subscriptionId && !orderId && !transactionId) {
      return res
        .status(400)
        .json({ error: 'Transaction ID or Order ID required' })
    }

    let paymentData = null
    let userExists = false

    // Handle Rupantor payment verification
    // Prioritize transactionId if available, else try orderId
    const rupantorId = transactionId || orderId

    if (rupantorId) {
      const config = await PaymentConfig.findOne({
        provider: 'rupantor',
        isActive: true,
      })
      if (!config) {
        return res.status(400).json({ error: 'RupantorPay is not active' })
      }

      const rupantorService = new RupantorPayService({
        apiKey: config.rupantorApiKey,
        merchantId: config.rupantorMerchantId,
        secretKey: config.rupantorSecretKey,
        environment: config.environment,
      })

      // If we only have orderId (sessionId), we might not be able to verify with API if it requires transaction_id
      // But let's assume if we have transactionId we verify properly.
      // If we only have orderId, we might need to check if we can query by order_id or if the frontend passed transaction_id

      let verificationResult = null

      if (transactionId) {
        verificationResult = await rupantorService.verifyPayment(transactionId)
      } else {
        // Fallback or error if transactionId is mandatory for verification
        // But let's try to see if we can use orderId or if the service can handle it.
        // Current service implementation expects transactionId.
        // If we don't have it, we can't verify against the gateway.
        // However, for robustness, if we only have orderId (from session), maybe we check our DB?
        // But this is 'verify' endpoint, implies verifying with provider.

        // If we are here, it means the frontend sent orderId but not transactionId?
        // This might happen if the redirect didn't have transaction_id.
        // We will return error if strict verification is needed.
        return res
          .status(400)
          .json({ error: 'Transaction ID missing for verification' })
      }

      if (verificationResult && verificationResult.success) {
        // Parse metadata if available to get plan/user info
        // The API returns 'meta_data' as a string or object?
        // Service just returns response.data

        let metaData = verificationResult.meta_data || {}
        if (typeof metaData === 'string') {
          try {
            metaData = JSON.parse(metaData)
          } catch (e) {}
        }

        // If meta_data is empty (e.g. not returned by verify endpoint), try to find by orderId in our PaymentSession
        let planId = metaData.planId
        let planName = metaData.planName
        let billingPeriod = metaData.billingPeriod
        let userId = metaData.userId
        const customerEmail =
          verificationResult.customer_email || metaData.customerEmail
        const amount = verificationResult.amount

        // If we can't find plan info from metadata, look up the session
        // Note: We used orderId as sessionId in create-session.js
        // The order_id should be in verificationResult or metaData
        const relatedOrderId =
          verificationResult.order_id || metaData.order_id || orderId

        if (relatedOrderId) {
          const session = await PaymentSession.findOne({
            sessionId: relatedOrderId,
          })
          if (session) {
            if (!planId) planId = session.planId
            if (!planName) planName = session.planDetails?.name
            if (!billingPeriod)
              billingPeriod = session.planDetails?.billingPeriod
            if (!userId) userId = session.userId
          }
        }

        // Check user existence
        if (userId) {
          const user = await User.findById(userId)
          if (user) userExists = true
        } else if (customerEmail) {
          const user = await User.findOne({ email: customerEmail })
          if (user) {
            userId = user._id
            userExists = true
          }
        }

        // Fetch plan name if still missing
        if (planId && !planName) {
          try {
            const plan = await Pricing.findById(planId)
            if (plan) planName = plan.name
          } catch (e) {}
        }

        paymentData = {
          success: true,
          provider: 'rupantor',
          sessionId: relatedOrderId, // The internal session ID (orderId)
          transactionId: transactionId,
          amount: parseFloat(amount || 0),
          currency: (verificationResult.currency || 'USD').toUpperCase(),
          customerEmail: customerEmail,
          planId: planId,
          planName: planName,
          billingPeriod: billingPeriod,
          status: 'completed',
          userId: userId,
        }
      } else {
        return res.status(400).json({
          error: 'Payment verification failed',
          details: verificationResult?.message || 'Invalid transaction',
        })
      }
    }

    if (!paymentData) {
      return res.status(404).json({ error: 'Payment data not found' })
    }

    return res.status(200).json({
      ...paymentData,
      userExists: userExists,
    })
  } catch (error) {
    console.error('Payment verification error:', error)
    return res.status(500).json({
      error: 'Failed to verify payment',
      details:
        process.env.NODE_ENV === 'development' ? error.message : undefined,
    })
  }
}
