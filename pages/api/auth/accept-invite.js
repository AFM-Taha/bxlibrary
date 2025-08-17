import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { verifyInviteToken, generateSessionToken } from '../../../lib/jwt';
import { validatePassword, isValidEmail } from '../../../lib/auth';
import { sendWelcomeEmail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { token, name, password, confirmPassword } = req.body;

    // Validate input
    if (!token || !name || !password || !confirmPassword) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        error: 'Passwords do not match' 
      });
    }

    // Validate password strength
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet requirements',
        details: passwordValidation.errors
      });
    }

    // Verify invite token
    let decoded;
    try {
      decoded = verifyInviteToken(token);
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid or expired invitation link' 
      });
    }

    // Find user by ID and email
    const user = await User.findOne({ 
      _id: decoded.userId,
      email: decoded.email 
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found or invitation invalid' 
      });
    }

    // Check if user already completed registration
    if (user.password) {
      return res.status(400).json({ 
        error: 'Account already activated' 
      });
    }

    // Check if invite token matches
    if (user.inviteToken !== token) {
      return res.status(400).json({ 
        error: 'Invalid invitation token' 
      });
    }

    // Check if invite token is expired
    if (user.inviteTokenExpiry && user.inviteTokenExpiry < new Date()) {
      return res.status(400).json({ 
        error: 'Invitation link has expired. Please request a new invitation.' 
      });
    }

    // Update user with name and password
    user.name = name.trim();
    user.password = password; // Will be hashed by pre-save middleware
    user.status = 'active';
    user.inviteToken = undefined;
    user.inviteTokenExpiry = undefined;
    user.lastLogin = new Date();
    
    // Add audit entry
    user.addAuditEntry('account_activated', user._id, 'User completed registration');
    
    await user.save();

    // Generate session token
    const sessionToken = generateSessionToken(user._id.toString(), user.email, user.role);

    // Set HTTP-only cookie
    res.setHeader('Set-Cookie', [
      `token=${sessionToken}; HttpOnly; Path=/; Max-Age=${24 * 60 * 60}; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
    ]);

    // Send welcome email (don't wait for it)
    sendWelcomeEmail(user.email, user.name).catch(error => {
      console.error('Failed to send welcome email:', error);
    });

    // Return user data
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin
    };

    res.status(200).json({
      message: 'Account activated successfully',
      user: userData,
      token: sessionToken
    });

  } catch (error) {
    console.error('Accept invite error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}