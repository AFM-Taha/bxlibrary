/**
 * API endpoint to create the first admin user
 * This should only be used once to bootstrap the system
 * 
 * Usage: POST /api/setup/create-admin
 * Body: { email, phone, name, password }
 */

import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Check if any admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      return res.status(400).json({ 
        message: 'Admin user already exists',
        admin: {
          email: existingAdmin.email,
          status: existingAdmin.status,
          createdAt: existingAdmin.createdAt
        }
      });
    }

    // Get admin data from request body or use defaults
    const {
      email = 'admin@bxlibrary.com',
      phone = '+1234567890',
      name = 'BX Library Admin',
      password = 'admin123'
    } = req.body;

    // Validate required fields
    if (!email || !phone || !password) {
      return res.status(400).json({ 
        message: 'Email, phone, and password are required' 
      });
    }

    // Check if user with this email already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this email already exists' 
      });
    }

    // Create admin user
    const adminUser = new User({
      email: email.toLowerCase(),
      phone,
      name,
      password,
      role: 'admin',
      status: 'active'
    });

    // Add audit trail entry
    adminUser.addAuditEntry('user_created', null, 'Initial admin user created via setup API');
    
    await adminUser.save();

    res.status(201).json({
      message: 'Admin user created successfully',
      admin: {
        id: adminUser._id,
        email: adminUser.email,
        name: adminUser.name,
        role: adminUser.role,
        status: adminUser.status,
        createdAt: adminUser.createdAt
      },
      loginUrl: `${req.headers.origin || 'http://localhost:3000'}/login`,
      credentials: {
        email: adminUser.email,
        password: '(hidden for security)'
      },
      warning: 'Please change the password after first login!'
    });

  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({ 
      message: 'Internal server error',
      error: error.message 
    });
  }
}