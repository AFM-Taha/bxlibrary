import { withAuth } from '../../../lib/auth';
import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get user from token (added by withAuth middleware)
    // req.user is already the full user object from withAuth middleware
    const user = req.user;

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user account is still valid
    if (!user.isAccessValid()) {
      return res.status(403).json({ 
        error: 'Account access expired or deactivated',
        shouldLogout: true
      });
    }

    // Return user data
    const userData = {
      id: user._id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      status: user.status,
      expiryDate: user.expiryDate,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    res.status(200).json({ user: userData });

  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAuth(handler);