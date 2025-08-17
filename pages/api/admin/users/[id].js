import { withAdminAuth } from '../../../../lib/auth';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { generateInviteToken, generateResetToken } from '../../../../lib/jwt';
import { sendInvitationEmail, sendPasswordResetEmail } from '../../../../lib/email';
import { isValidEmail } from '../../../../lib/auth';
import mongoose from 'mongoose';

async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  // Validate user ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  switch (req.method) {
    case 'GET':
      return await getUser(req, res, id);
    case 'PUT':
      return await updateUser(req, res, id);
    case 'POST':
      return await handlePostAction(req, res, id);
    case 'DELETE':
      return await deleteUser(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handlePostAction(req, res, userId) {
  try {
    const { action } = req.body;
    const adminUserId = req.user.id;

    // Find the user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    switch (action) {
      case 'resend_invite':
        return await resendInvite(req, res, user, adminUserId);
      case 'send_password_reset':
        return await sendPasswordReset(req, res, user, adminUserId);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('Handle post action error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getUser(req, res, userId) {
  try {
    const user = await User.findById(userId)
      .select('-password -resetPasswordToken -inviteToken')
      .populate('createdBy', 'name email')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateUser(req, res, userId) {
  try {
    const { email, phone, role, status, expiryDate, action } = req.body;
    const adminUserId = req.user._id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from modifying their own account in certain ways
    if (user._id.toString() === adminUserId) {
      if (status && status !== 'active') {
        return res.status(400).json({ error: 'Cannot deactivate your own account' });
      }
      if (role && role !== 'admin') {
        return res.status(400).json({ error: 'Cannot change your own role' });
      }
    }

    // Handle specific actions
    if (action) {
      switch (action) {
        case 'resend_invite':
          return await resendInvite(req, res, user, adminUserId);
        case 'send_password_reset':
          return await sendPasswordReset(req, res, user, adminUserId);
        case 'activate':
          user.status = 'active';
          user.addAuditEntry('user_activated', adminUserId, 'User activated by admin');
          break;
        case 'deactivate':
          user.status = 'inactive';
          user.addAuditEntry('user_deactivated', adminUserId, 'User deactivated by admin');
          break;
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    } else {
      // Regular update
      let hasChanges = false;

      // Update email
      if (email && email !== user.email) {
        if (!isValidEmail(email)) {
          return res.status(400).json({ error: 'Invalid email format' });
        }

        // Check if email is already taken
        const existingUser = await User.findOne({ 
          email: email.toLowerCase(),
          _id: { $ne: userId }
        });
        if (existingUser) {
          return res.status(400).json({ error: 'Email already taken' });
        }

        user.email = email.toLowerCase();
        hasChanges = true;
      }

      // Update phone
      if (phone && phone !== user.phone) {
        const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
        if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
          return res.status(400).json({ error: 'Invalid phone number format' });
        }

        // Check if phone is already taken
        const existingUser = await User.findOne({ 
          phone: phone,
          _id: { $ne: userId }
        });
        if (existingUser) {
          return res.status(400).json({ error: 'Phone number already taken' });
        }

        user.phone = phone;
        hasChanges = true;
      }

      // Update role
      if (role && role !== user.role) {
        if (!['user', 'admin'].includes(role)) {
          return res.status(400).json({ error: 'Invalid role' });
        }
        user.role = role;
        hasChanges = true;
      }

      // Update status
      if (status && status !== user.status) {
        if (!['active', 'inactive', 'pending'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }
        user.status = status;
        hasChanges = true;
      }

      // Update expiry date
      if (expiryDate !== undefined) {
        if (expiryDate) {
          const expiry = new Date(expiryDate);
          if (expiry <= new Date()) {
            return res.status(400).json({ error: 'Expiry date must be in the future' });
          }
          user.expiryDate = expiry;
        } else {
          user.expiryDate = undefined;
        }
        hasChanges = true;
      }

      if (!hasChanges) {
        return res.status(400).json({ error: 'No changes provided' });
      }

      // Add audit entry
      user.addAuditEntry('user_updated', adminUserId, 'User updated by admin');
    }

    await user.save();

    // Return updated user data
    const userData = {
      id: user._id,
      email: user.email,
      phone: user.phone,
      name: user.name,
      role: user.role,
      status: user.status,
      expiryDate: user.expiryDate,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    };

    res.status(200).json({
      message: 'User updated successfully',
      user: userData
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteUser(req, res, userId) {
  try {
    const adminUserId = req.user._id;

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Prevent admin from deleting their own account
    if (user._id.toString() === adminUserId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Add audit entry before deletion
    user.addAuditEntry('user_deleted', adminUserId, 'User deleted by admin');
    await user.save();

    // Delete user
    await User.findByIdAndDelete(userId);

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function resendInvite(req, res, user, adminUserId) {
  try {
    // Only resend invite if user hasn't completed registration
    if (user.password) {
      return res.status(400).json({ error: 'User has already completed registration' });
    }

    // Generate new invite token
    const inviteToken = generateInviteToken(user.email, user._id.toString());
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    user.inviteToken = inviteToken;
    user.inviteTokenExpiry = inviteTokenExpiry;
    user.addAuditEntry('invite_resent', adminUserId, 'Invitation resent by admin');
    
    await user.save();

    // Send invitation email
    await sendInvitationEmail(user.email, inviteToken);

    res.status(200).json({ message: 'Invitation resent successfully' });
  } catch (error) {
    console.error('Resend invite error:', error);
    res.status(500).json({ error: 'Failed to resend invitation' });
  }
}

async function sendPasswordReset(req, res, user, adminUserId) {
  try {
    // Only send reset if user has completed registration
    if (!user.password) {
      return res.status(400).json({ error: 'User has not completed registration yet' });
    }

    // Generate reset token
    const resetToken = generateResetToken(user.email, user._id.toString());
    
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    user.addAuditEntry('password_reset_sent', adminUserId, 'Password reset sent by admin');
    
    await user.save();

    // Send reset email
    await sendPasswordResetEmail(user.email, resetToken);

    res.status(200).json({ message: 'Password reset email sent successfully' });
  } catch (error) {
    console.error('Send password reset error:', error);
    res.status(500).json({ error: 'Failed to send password reset email' });
  }
}

export default withAdminAuth(handler);