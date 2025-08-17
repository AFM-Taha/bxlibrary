import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { generateSessionToken } from '../../../lib/jwt';
import { isValidEmail } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user has set a password (completed registration)
    if (!user.password) {
      return res.status(401).json({ 
        error: 'Account not activated. Please check your email for the invitation link.' 
      });
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if user account is active
    if (!user.isAccessValid()) {
      let errorMessage = 'Account is inactive';
      
      if (user.status === 'inactive') {
        errorMessage = 'Your account has been deactivated. Please contact support.';
      } else if (user.expiryDate && user.expiryDate < new Date()) {
        errorMessage = 'Your account has expired. Please contact support for renewal.';
      }
      
      return res.status(403).json({ error: errorMessage });
    }

    // Generate session token
    const token = generateSessionToken(user._id.toString(), user.email, user.role);

    // Update last login
    user.lastLogin = new Date();
    user.addAuditEntry('login', user._id, `Login from ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
    await user.save();

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', [
      `token=${token}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    ]);

    // Return user data (without password)
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin
    };

    res.status(200).json({
      message: 'Login successful',
      user: userData,
      token // Also return token for client-side storage if needed
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}