import dbConnect from '../../../lib/mongodb'
import PaymentSession from '../../../models/PaymentSession'
import Pricing from '../../../models/Pricing'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await dbConnect()

    const { sessionId, subscriptionId, paymentData } = req.body

    if (!sessionId && !subscriptionId) {
      return res.status(400).json({ error: 'Session ID or Subscription ID required' })
    }

    if (!paymentData || !paymentData.success) {
      return res.status(400).json({ error: 'Invalid payment data' })
    }

    // Check if payment session already exists
    const existingSession = await PaymentSession.findOne({
      $or: [
        { sessionId: sessionId },
        { subscriptionId: subscriptionId }
      ]
    })

    if (existingSession) {
      // If session exists and already has a signup token, return it
      if (existingSession.signupToken && existingSession.isSignupTokenValid()) {
        return res.status(200).json({
          success: true,
          signupToken: existingSession.signupToken,
          sessionExists: true
        })
      }
      
      // If session exists but no valid signup token, generate new one
      if (existingSession.status === 'completed' && !existingSession.signupCompleted) {
        const signupToken = existingSession.generateSignupToken()
        await existingSession.save()
        
        return res.status(200).json({
          success: true,
          signupToken: signupToken,
          sessionExists: true
        })
      }
      
      return res.status(400).json({ error: 'Payment session already processed' })
    }

    // Extract plan information from payment data
    let planDetails = null
    let planId = null

    if (paymentData.planId) {
      try {
        const plan = await Pricing.findById(paymentData.planId)
        if (plan) {
          planId = plan._id
          planDetails = {
            name: plan.name,
            price: plan.price,
            currency: plan.currency || 'USD',
            billingPeriod: plan.billingPeriod,
            features: plan.features || []
          }
        }
      } catch (error) {
        console.error('Error fetching plan details:', error)
      }
    }

    // Create new payment session
    const paymentSession = new PaymentSession({
      sessionId: sessionId,
      subscriptionId: subscriptionId,
      provider: paymentData.provider || 'stripe',
      planId: planId,
      planDetails: planDetails,
      amount: paymentData.amount || 0,
      currency: paymentData.currency || 'USD',
      status: 'completed',
      customerEmail: paymentData.customerEmail,
      paymentIntentId: paymentData.paymentIntentId,
      metadata: {
        originalPaymentData: paymentData,
        createdFrom: 'payment-success-page'
      }
    })

    // Generate signup token
    const signupToken = paymentSession.generateSignupToken()
    
    // Save the payment session
    await paymentSession.save()

    res.status(201).json({
      success: true,
      signupToken: signupToken,
      sessionId: paymentSession._id,
      message: 'Payment session created successfully'
    })

  } catch (error) {
    console.error('Error creating payment session:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}