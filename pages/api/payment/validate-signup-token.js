import dbConnect from '../../../lib/mongodb'
import PaymentSession from '../../../models/PaymentSession'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await dbConnect()

    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Token is required' })
    }

    // Find payment session with this signup token
    const paymentSession = await PaymentSession.findOne({ signupToken: token })

    if (!paymentSession) {
      return res.status(404).json({ 
        error: 'Invalid signup token',
        valid: false 
      })
    }

    // Check if token is valid
    if (!paymentSession.isSignupTokenValid()) {
      let errorMessage = 'Signup token has expired'
      
      if (paymentSession.signupCompleted) {
        errorMessage = 'Account has already been created with this payment'
      } else if (paymentSession.status !== 'completed') {
        errorMessage = 'Payment is not completed'
      }
      
      return res.status(400).json({ 
        error: errorMessage,
        valid: false 
      })
    }

    // Return payment details for display
    const paymentDetails = {
      sessionId: paymentSession.sessionId,
      subscriptionId: paymentSession.subscriptionId,
      provider: paymentSession.provider,
      amount: paymentSession.amount,
      currency: paymentSession.currency,
      customerEmail: paymentSession.customerEmail,
      planDetails: paymentSession.planDetails,
      createdAt: paymentSession.createdAt
    }

    res.status(200).json({
      valid: true,
      paymentDetails: paymentDetails,
      message: 'Token is valid'
    })

  } catch (error) {
    console.error('Error validating signup token:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      valid: false,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}