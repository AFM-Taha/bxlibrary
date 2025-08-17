import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { generateResetToken } from '../../../lib/jwt';
import { isValidEmail } from '../../../lib/auth';
import { sendPasswordResetEmail } from '../../../lib/email';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const { email } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    // But only send email if user exists and has completed registration
    if (user && user.password && user.status === 'active') {
      // Generate reset token
      const resetToken = generateResetToken(user.email, user._id.toString());
      
      // Save reset token to user
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      // Add audit entry
      user.addAuditEntry('password_reset_requested', user._id, `Reset requested from ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
      
      await user.save();

      // Send reset email (don't wait for it)
      sendPasswordResetEmail(user.email, resetToken).catch(error => {
        console.error('Failed to send password reset email:', error);
      });
    }

    // Always return success message
    res.status(200).json({
      message: 'If an account with that email exists, a password reset link has been sent.'
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}