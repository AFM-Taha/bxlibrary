import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}

/**
 * Generate a JWT token
 * @param {Object} payload - The payload to encode
 * @param {string} expiresIn - Token expiration time (default: 24h)
 * @returns {string} JWT token
 */
export function generateToken(payload, expiresIn = '24h') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

/**
 * Verify and decode a JWT token
 * @param {string} token - The JWT token to verify
 * @returns {Object} Decoded payload
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Generate an invite token
 * @param {string} email - User email
 * @param {string} userId - User ID
 * @returns {string} Invite token
 */
export function generateInviteToken(email, userId) {
  return generateToken(
    { 
      type: 'invite',
      email,
      userId 
    },
    '7d' // 7 days expiration
  );
}

/**
 * Generate a password reset token
 * @param {string} email - User email
 * @param {string} userId - User ID
 * @returns {string} Reset token
 */
export function generateResetToken(email, userId) {
  return generateToken(
    { 
      type: 'reset',
      email,
      userId 
    },
    '1h' // 1 hour expiration
  );
}

/**
 * Generate a session token
 * @param {string} userId - User ID
 * @param {string} email - User email
 * @param {string} role - User role
 * @returns {string} Session token
 */
export function generateSessionToken(userId, email, role) {
  return generateToken(
    {
      type: 'session',
      userId,
      email,
      role
    },
    process.env.SESSION_TIMEOUT || '24h'
  );
}

/**
 * Verify an invite token
 * @param {string} token - Invite token
 * @returns {Object} Decoded invite data
 */
export function verifyInviteToken(token) {
  const decoded = verifyToken(token);
  if (decoded.type !== 'invite') {
    throw new Error('Invalid invite token');
  }
  return decoded;
}

/**
 * Verify a reset token
 * @param {string} token - Reset token
 * @returns {Object} Decoded reset data
 */
export function verifyResetToken(token) {
  const decoded = verifyToken(token);
  if (decoded.type !== 'reset') {
    throw new Error('Invalid reset token');
  }
  return decoded;
}

/**
 * Verify a session token
 * @param {string} token - Session token
 * @returns {Object} Decoded session data
 */
export function verifySessionToken(token) {
  const decoded = verifyToken(token);
  if (decoded.type !== 'session') {
    throw new Error('Invalid session token');
  }
  return decoded;
}