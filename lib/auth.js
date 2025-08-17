import { verifySessionToken } from './jwt';
import dbConnect from './mongodb';
import User from '../models/User';

/**
 * Authentication middleware for API routes
 * @param {Function} handler - The API route handler
 * @param {Object} options - Middleware options
 * @returns {Function} Wrapped handler
 */
export function withAuth(handler, options = {}) {
  return async (req, res) => {
    try {
      await dbConnect();
      
      // Get token from Authorization header or cookies
      const token = getTokenFromRequest(req);
      
      if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      
      // Verify token
      const decoded = verifySessionToken(token);
      
      // Get user from database
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return res.status(401).json({ error: 'User not found' });
      }
      
      // Check if user is active
      if (!user.isAccessValid()) {
        return res.status(403).json({ error: 'Account access expired or inactive' });
      }
      
      // Check role requirements
      if (options.requireRole && user.role !== options.requireRole) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      
      // Add user to request object
      req.user = user;
      
      // Update last login
      user.lastLogin = new Date();
      await user.save();
      
      return handler(req, res);
    } catch (error) {
      console.error('Auth middleware error:', error);
      return res.status(401).json({ error: 'Invalid authentication' });
    }
  };
}

/**
 * Admin-only authentication middleware
 * @param {Function} handler - The API route handler
 * @returns {Function} Wrapped handler
 */
export function withAdminAuth(handler) {
  return withAuth(handler, { requireRole: 'admin' });
}

/**
 * Get authentication token from request
 * @param {Object} req - Request object
 * @returns {string|null} Token or null
 */
function getTokenFromRequest(req) {
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  // Check cookies
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  return null;
}

/**
 * Get current user from request
 * @param {Object} req - Request object
 * @returns {Object|null} User object or null
 */
export async function getCurrentUser(req) {
  try {
    await dbConnect();
    
    const token = getTokenFromRequest(req);
    if (!token) return null;
    
    const decoded = verifySessionToken(token);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isAccessValid()) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

/**
 * Check if user has permission to access resource
 * @param {Object} user - User object
 * @param {string} resource - Resource type
 * @param {string} action - Action type
 * @param {Object} resourceData - Resource data for context
 * @returns {boolean} Has permission
 */
export function hasPermission(user, resource, action, resourceData = null) {
  // Admin has all permissions
  if (user.role === 'admin') {
    return true;
  }
  
  // Define permissions for regular users
  const userPermissions = {
    books: ['read'],
    library: ['read'],
    account: ['read', 'update'],
    reading_session: ['read', 'create', 'update']
  };
  
  // Check if user has permission for this resource and action
  const allowedActions = userPermissions[resource] || [];
  
  if (!allowedActions.includes(action)) {
    return false;
  }
  
  // Additional context-based checks
  if (resource === 'account' && resourceData) {
    // Users can only access their own account
    return resourceData.userId === user._id.toString();
  }
  
  if (resource === 'reading_session' && resourceData) {
    // Users can only access their own reading sessions
    return resourceData.userId === user._id.toString();
  }
  
  return true;
}

/**
 * Generate secure random string for tokens
 * @param {number} length - String length
 * @returns {string} Random string
 */
export function generateSecureToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Hash sensitive data
 * @param {string} data - Data to hash
 * @returns {string} Hashed data
 */
export function hashData(data) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Is valid email
 */
export function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {Object} Validation result
 */
export function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const errors = [];
  
  if (password.length < minLength) {
    errors.push(`Password must be at least ${minLength} characters long`);
  }
  
  if (!hasUpperCase) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!hasLowerCase) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!hasNumbers) {
    errors.push('Password must contain at least one number');
  }
  
  if (!hasSpecialChar) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}