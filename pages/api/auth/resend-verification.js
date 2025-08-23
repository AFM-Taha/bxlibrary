import dbConnect from '../../../lib/mongodb'
import User from '../../../models/User'
import { sendInvitationEmail } from '../../../lib/email'
import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await dbConnect()

    const { email } = req.body

    if (!email) {
      return res.status(400).json({ error: 'Email is required' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Find user with this email
    const user = await User.findOne({ email: email.toLowerCase() })

    if (!user) {
      // Don't reveal if user exists or not for security
      return res.status(200).json({ 
        success: true,
        message: 'If an account with this email exists, a verification email has been sent.' 
      })
    }

    // Check if email is already verified
    if (user.emailVerified) {
      return res.status(400).json({ 
        error: 'Email is already verified' 
      })
    }

    // Check if user account is active
    if (user.status === 'active') {
      return res.status(400).json({ 
        error: 'Account is already active' 
      })
    }

    // Generate new verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update user with new token
    user.emailVerificationToken = emailVerificationToken
    user.emailVerificationExpiry = emailVerificationExpiry
    user.audit.lastVerificationEmailSent = new Date()

    await user.save()

    // Send verification email
    try {
      await sendInvitationEmail(
        email,
        emailVerificationToken,
        'BX Library System'
      )

      res.status(200).json({
        success: true,
        message: 'Verification email sent successfully'
      })

    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      
      // Revert the token update if email fails
      user.emailVerificationToken = undefined
      user.emailVerificationExpiry = undefined
      await user.save()
      
      res.status(500).json({ 
        error: 'Failed to send verification email. Please try again later.' 
      })
    }

  } catch (error) {
    console.error('Error resending verification email:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}