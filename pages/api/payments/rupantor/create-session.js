import dbConnect from '../../../../lib/mongodb'
import PaymentConfig from '../../../../models/PaymentConfig'
import Pricing from '../../../../models/Pricing'
import RupantorPayService from '../../../../lib/payment/rupantor'
import { verifyToken } from '../../../../lib/jwt'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await dbConnect()

    const { priceId, billingPeriod, customerEmail } = req.body

    // Basic validation
    if (!priceId || !billingPeriod) {
      return res.status(400).json({ error: 'Missing required fields' })
    }

    // Determine user email
    let email = customerEmail
    let userId = null

    // Try to get session from token if email is not provided or to link user
    const token = req.cookies.token
    if (token) {
      try {
        const decoded = verifyToken(token)
        userId = decoded.userId
        // If email was not explicitly provided (guest checkout), use the logged-in user's email
        if (!email) {
          email = decoded.email
        }
      } catch (err) {
        // Token invalid, treat as guest if email provided
        console.warn('Invalid token in payment session creation', err.message)
      }
    }

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Fetch active RupantorPay config
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

    // Get Plan details
    const plan = await Pricing.findById(priceId)
    if (!plan) {
      return res.status(404).json({ error: 'Plan not found' })
    }

    // Generate a unique order ID
    const orderId = `rp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Construct URLs
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const successUrl = `${baseUrl}/payment/success`
    const cancelUrl = `${baseUrl}/payment/cancel?provider=rupantor`

    const session = await rupantorService.createPaymentSession({
      amount: plan.price,
      currency: plan.currency || 'USD',
      orderId: orderId,
      customerEmail: email,
      description: `Subscription to ${plan.name} (${billingPeriod})`,
      successUrl,
      cancelUrl,
      metadata: {
        planId: plan._id.toString(),
        planName: plan.name,
        billingPeriod,
        userId: userId, // Add userId if available
      },
    })

    // Return consistent response
    res.status(200).json({
      success: true,
      url: session.paymentUrl,
      sessionId: session.sessionId,
    })
  } catch (error) {
    console.error('RupantorPay session error:', error)
    res.status(500).json({ error: 'Failed to create payment session' })
  }
}
