import { withAdminAuth } from '../../../../lib/auth';
import dbConnect from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { generateInviteToken } from '../../../../lib/jwt';
import { sendInvitationEmail } from '../../../../lib/email';
import { isValidEmail } from '../../../../lib/auth';

async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'GET':
      return await getUsers(req, res);
    case 'POST':
      return await createUser(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getUsers(req, res) {
  try {
    const { page = 1, limit = 10, search = '', status = '', role = '' } = req.query;
    
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build filter query
    const filter = {};
    
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (role) {
      filter.role = role;
    }

    // Get users with pagination
    const users = await User.find(filter)
      .select('-password -resetPasswordToken -inviteToken')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate('createdBy', 'name email')
      .lean();

    // Get total count for pagination
    const total = await User.countDocuments(filter);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.status(200).json({
      users,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalUsers: total,
        hasNextPage,
        hasPrevPage,
        limit: limitNum
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createUser(req, res) {
  console.log('=== ENTERING createUser function ===');
  console.log('Request body:', req.body);
  console.log('Admin user:', req.user._id);
  try {
    const { email, phone, role = 'user', expiryDate } = req.body;
    const adminUserId = req.user._id;
    
    console.log('Extracted data:', { email, phone, role, expiryDate });

    // Validate input
    console.log('=== Starting validation ===');
    
    console.log('Checking email and phone presence...');
    if (!email || !phone) {
      console.log('VALIDATION FAILED: Missing email or phone');
      return res.status(400).json({ error: 'Email and phone are required' });
    }
    console.log('Email and phone present ✓');

    console.log('Validating email format...');
    if (!isValidEmail(email)) {
      console.log('VALIDATION FAILED: Invalid email format');
      return res.status(400).json({ error: 'Invalid email format' });
    }
    console.log('Email format valid ✓');

    console.log('Validating role...');
    if (!['user', 'admin'].includes(role)) {
      console.log('VALIDATION FAILED: Invalid role');
      return res.status(400).json({ error: 'Invalid role' });
    }
    console.log('Role valid ✓');

    // Validate phone number (basic validation)
    console.log('Validating phone number...');
    const phoneRegex = /^[\+]?[0-9][\d]{0,15}$/;
    const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
    console.log('Clean phone:', cleanPhone);
    if (!phoneRegex.test(cleanPhone)) {
      console.log('VALIDATION FAILED: Invalid phone number format');
      return res.status(400).json({ error: 'Invalid phone number format' });
    }
    console.log('Phone number valid ✓');

    // Validate expiry date if provided
    console.log('Validating expiry date...');
    if (expiryDate) {
      const expiry = new Date(expiryDate);
      console.log('Expiry date:', expiry, 'Current date:', new Date());
      if (expiry <= new Date()) {
        console.log('VALIDATION FAILED: Expiry date must be in the future');
        return res.status(400).json({ error: 'Expiry date must be in the future' });
      }
    }
    console.log('Expiry date valid ✓');

    // Check if user already exists
    console.log('Checking for existing user...');
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { phone: phone }
      ]
    });
    
    console.log('Existing user found:', existingUser ? 'Yes' : 'No');
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        console.log('VALIDATION FAILED: User with this email already exists');
        return res.status(400).json({ error: 'User with this email already exists' });
      }
      if (existingUser.phone === phone) {
        console.log('VALIDATION FAILED: User with this phone number already exists');
        return res.status(400).json({ error: 'User with this phone number already exists' });
      }
    }
    console.log('No duplicate user found ✓');

    // Generate invite token
    console.log('Generating invite token...');
    const inviteToken = generateInviteToken(email.toLowerCase(), null); // userId will be set after save
    const inviteTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    console.log('Invite token generated ✓');

    // Create user
    console.log('Creating user object...');
    const userData = {
      email: email.toLowerCase(),
      phone,
      role,
      status: 'pending', // User needs to complete registration
      expiryDate: expiryDate ? new Date(expiryDate) : undefined,
      inviteToken,
      inviteTokenExpiry,
      createdBy: adminUserId
    };
    console.log('User data to save:', userData);
    
    const user = new User(userData);
    console.log('User object created ✓');

    // Add audit entry
    console.log('Adding audit entry...');
    user.addAuditEntry('user_created', adminUserId, `User created by admin`);
    console.log('Audit entry added ✓');

    console.log('Saving user to database...');
    await user.save();
    console.log('User saved successfully with ID:', user._id);

    // Update invite token with user ID
    const updatedInviteToken = generateInviteToken(email.toLowerCase(), user._id.toString());
    user.inviteToken = updatedInviteToken;
    await user.save();

    // Send invitation email (don't wait for it)
    sendInvitationEmail(email.toLowerCase(), updatedInviteToken).catch(error => {
      console.error('Failed to send invite email:', error);
    });

    // Return user data (without sensitive fields)
    const responseData = {
      id: user._id,
      email: user.email,
      phone: user.phone,
      role: user.role,
      status: user.status,
      expiryDate: user.expiryDate,
      createdAt: user.createdAt,
      createdBy: user.createdBy
    };

    res.status(201).json({
      message: 'User created and invitation sent successfully',
      user: responseData
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAdminAuth(handler);