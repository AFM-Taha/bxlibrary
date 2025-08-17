import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { verifyResetToken } from '../../../lib/jwt';
import { validatePassword } from '../../../lib/auth';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { token, password, confirmPassword } = req.body;

    // Validate input
    if (!token || !password || !confirmPassword) {
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

    // Verify reset token
    let decoded;
    try {
      decoded = verifyResetToken(token);
    } catch (error) {
      return res.status(400).json({ 
        error: 'Invalid or expired reset link' 
      });
    }

    // Find user by ID and email
    const user = await User.findOne({ 
      _id: decoded.userId,
      email: decoded.email 
    });

    if (!user) {
      return res.status(404).json({ 
        error: 'User not found or reset link invalid' 
      });
    }

    // Check if reset token matches
    if (user.resetPasswordToken !== token) {
      return res.status(400).json({ 
        error: 'Invalid reset token' 
      });
    }

    // Check if reset token is expired
    if (user.resetPasswordExpiry && user.resetPasswordExpiry < new Date()) {
      return res.status(400).json({ 
        error: 'Reset link has expired. Please request a new password reset.' 
      });
    }

    // Update user password
    user.password = password; // Will be hashed by pre-save middleware
    user.resetPasswordToken = undefined;
    user.resetPasswordExpiry = undefined;
    
    // Add audit entry
    user.addAuditEntry('password_reset_completed', user._id, `Password reset from ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
    
    await user.save();

    res.status(200).json({
      message: 'Password reset successfully. You can now log in with your new password.'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}