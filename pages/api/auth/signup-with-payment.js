import dbConnect from '../../../lib/mongodb'
import User from '../../../models/User'
import PaymentSession from '../../../models/PaymentSession'
import { sendInvitationEmail } from '../../../lib/email'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    await dbConnect()

    const { name, email, phone, password, signupToken } = req.body

    // Validate required fields
    if (!name || !email || !password || !signupToken) {
      return res.status(400).json({ error: 'All required fields must be provided' })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' })
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters long' })
    }

    // Find and validate payment session
    const paymentSession = await PaymentSession.findOne({ signupToken })

    if (!paymentSession) {
      return res.status(404).json({ error: 'Invalid signup token' })
    }

    if (!paymentSession.isSignupTokenValid()) {
      let errorMessage = 'Signup token has expired'
      
      if (paymentSession.signupCompleted) {
        errorMessage = 'Account has already been created with this payment'
      } else if (paymentSession.status !== 'completed') {
        errorMessage = 'Payment is not completed'
      }
      
      return res.status(400).json({ error: errorMessage })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' })
    }

    // Hash password
    const saltRounds = 12
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex')
    const emailVerificationExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Determine user role and status
    const userRole = 'user' // Default role for paid users
    const userStatus = 'pending' // Will be activated after email verification

    // Create user
    const newUser = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '',
      password: hashedPassword,
      role: userRole,
      status: userStatus,
      emailVerified: false,
      emailVerificationToken,
      emailVerificationExpiry,
      subscription: {
        planId: paymentSession.planId,
        planName: paymentSession.planDetails?.name || 'Premium Plan',
        status: 'active',
        startDate: new Date(),
        paymentProvider: paymentSession.provider,
        paymentSessionId: paymentSession._id,
        subscriptionId: paymentSession.subscriptionId,
      },
      audit: {
        createdBy: 'system',
        createdAt: new Date(),
        createdReason: 'Payment signup',
        createdMethod: 'payment-flow',
      },
    })

    // Save user
    await newUser.save()

    // Update payment session
    paymentSession.userId = newUser._id
    paymentSession.signupCompleted = true
    paymentSession.metadata = {
      ...paymentSession.metadata,
      userCreated: true,
      userCreatedAt: new Date(),
      signupCompletedAt: new Date()
    }
    await paymentSession.save()

    // Send verification email
    try {
      await sendInvitationEmail(
        email,
        emailVerificationToken,
        'BX Library System'
      )
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Don't fail the signup if email fails, but log it
    }

    res.status(201).json({
      success: true,
      message: 'Account created successfully. Please check your email to verify your account.',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        status: newUser.status,
        subscription: {
          planName: newUser.subscription.planName,
          status: newUser.subscription.status,
          startDate: newUser.subscription.startDate
        }
      },
      emailSent: true
    })

  } catch (error) {
    console.error('Error creating user account:', error)
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return res.status(400).json({ 
        error: `User with this ${field} already exists` 
      })
    }
    
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}