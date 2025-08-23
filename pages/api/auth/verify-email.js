import dbConnect from '../../../lib/mongodb'
import User from '../../../models/User'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await dbConnect()

    const { token } = req.body

    if (!token) {
      return res.status(400).json({ error: 'Verification token is required' })
    }

    // Find user with this verification token
    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpiry: { $gt: new Date() }
    })

    if (!user) {
      return res.status(400).json({ 
        error: 'Invalid or expired verification token' 
      })
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(400).json({ 
        error: 'Email is already verified' 
      })
    }

    // Update user - verify email and activate account
    user.emailVerified = true
    user.emailVerificationToken = undefined
    user.emailVerificationExpiry = undefined
    user.status = 'active' // Activate the account
    user.audit.verifiedAt = new Date()
    user.audit.verifiedBy = 'user'
    user.audit.verificationMethod = 'email-link'

    await user.save()

    res.status(200).json({
      success: true,
      message: 'Email verified successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        status: user.status,
        emailVerified: user.emailVerified
      }
    })

  } catch (error) {
    console.error('Error verifying email:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}