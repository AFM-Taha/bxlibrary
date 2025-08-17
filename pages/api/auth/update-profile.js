import { withAuth } from '../../../lib/auth';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import { validatePassword } from '../../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'PUT') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const userId = req.user._id;
    const { name, currentPassword, newPassword, confirmPassword } = req.body;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user account is still valid
    if (!user.isAccessValid()) {
      return res.status(403).json({ 
        error: 'Account access expired or deactivated'
      });
    }

    let hasChanges = false;

    // Update name if provided
    if (name && name.trim() !== user.name) {
      if (name.trim().length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters long' });
      }
      user.name = name.trim();
      hasChanges = true;
    }

    // Handle password change
    if (newPassword) {
      // Validate input
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password is required to change password' });
      }

      if (!confirmPassword) {
        return res.status(400).json({ error: 'Password confirmation is required' });
      }

      if (newPassword !== confirmPassword) {
        return res.status(400).json({ error: 'New passwords do not match' });
      }

      // Verify current password
      const isCurrentPasswordValid = await user.comparePassword(currentPassword);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Current password is incorrect' });
      }

      // Validate new password strength
      const passwordValidation = validatePassword(newPassword);
      if (!passwordValidation.isValid) {
        return res.status(400).json({ 
          error: 'New password does not meet requirements',
          details: passwordValidation.errors
        });
      }

      // Check if new password is different from current
      const isSamePassword = await user.comparePassword(newPassword);
      if (isSamePassword) {
        return res.status(400).json({ error: 'New password must be different from current password' });
      }

      user.password = newPassword; // Will be hashed by pre-save middleware
      hasChanges = true;

      // Add audit entry for password change
      user.addAuditEntry('password_changed', user._id, `Password changed from ${req.headers['x-forwarded-for'] || req.connection.remoteAddress}`);
    }

    if (!hasChanges) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    // Add audit entry for profile update
    if (name && name.trim() !== user.name) {
      user.addAuditEntry('profile_updated', user._id, 'Profile information updated');
    }

    await user.save();

    // Return updated user data (without password)
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      lastLogin: user.lastLogin
    };

    res.status(200).json({
      message: 'Profile updated successfully',
      user: userData
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);