import nodemailer from 'nodemailer';
import dbConnect from './mongodb';
import Settings from '../models/Settings';

// Create transporter with environment variables
const createTransporter = () => {
  const config = {
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_PORT === '465', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  };

  return nodemailer.createTransport(config);
};

/**
 * Send email using configured transporter
 * @param {Object} options - Email options
 * @returns {Promise} Send result
 */
export async function sendEmail({ to, subject, html, text }) {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('Email sending failed:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Send invitation email to new user
 * @param {string} email - User email
 * @param {string} inviteToken - Invitation token
 * @param {string} invitedBy - Admin who sent the invite
 * @returns {Promise} Send result
 */
export async function sendInvitationEmail(email, inviteToken, invitedBy = 'BX Library Admin') {
  try {
    await dbConnect();
    const settings = await Settings.getInstance();
    
    const inviteUrl = `${process.env.APP_URL}/accept-invite?token=${inviteToken}`;
    
    const variables = {
      email,
      inviteUrl,
      invitedBy,
      siteName: settings.branding.siteName,
      supportEmail: process.env.EMAIL_FROM
    };
    
    const { subject, body } = settings.getEmailTemplate('invite', variables);
    
    return await sendEmail({
      to: email,
      subject,
      html: body
    });
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw error;
  }
}

/**
 * Send password reset email
 * @param {string} email - User email
 * @param {string} resetToken - Reset token
 * @returns {Promise} Send result
 */
export async function sendPasswordResetEmail(email, resetToken) {
  try {
    await dbConnect();
    const settings = await Settings.getInstance();
    
    const resetUrl = `${process.env.APP_URL}/reset-password?token=${resetToken}`;
    
    const variables = {
      email,
      resetUrl,
      siteName: settings.branding.siteName,
      supportEmail: process.env.EMAIL_FROM
    };
    
    const { subject, body } = settings.getEmailTemplate('resetPassword', variables);
    
    return await sendEmail({
      to: email,
      subject,
      html: body
    });
  } catch (error) {
    console.error('Failed to send password reset email:', error);
    throw error;
  }
}

/**
 * Send welcome email after user completes registration
 * @param {string} email - User email
 * @param {string} name - User name
 * @returns {Promise} Send result
 */
export async function sendWelcomeEmail(email, name) {
  try {
    await dbConnect();
    const settings = await Settings.getInstance();
    
    const libraryUrl = `${process.env.APP_URL}/library`;
    const siteName = settings.branding.siteName;
    
    const subject = `Welcome to ${siteName}!`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Welcome to ${siteName}!</h2>
        
        <p>Hi ${name},</p>
        
        <p>Your account has been successfully activated. You now have access to our digital library with thousands of books and resources.</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${libraryUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">Browse Library</a>
        </div>
        
        <h3>Getting Started:</h3>
        <ul>
          <li>Browse our extensive collection of books</li>
          <li>Use the search function to find specific titles</li>
          <li>Filter books by category</li>
          <li>Your reading progress is automatically saved</li>
        </ul>
        
        <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
        
        <p>Happy reading!</p>
        <p>The ${siteName} Team</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="font-size: 12px; color: #666; text-align: center;">
          This email was sent to ${email}. If you didn't expect this email, please contact support.
        </p>
      </div>
    `;
    
    return await sendEmail({
      to: email,
      subject,
      html
    });
  } catch (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }
}

/**
 * Send account deactivation notification
 * @param {string} email - User email
 * @param {string} name - User name
 * @param {string} reason - Deactivation reason
 * @returns {Promise} Send result
 */
export async function sendAccountDeactivationEmail(email, name, reason = 'Administrative action') {
  try {
    await dbConnect();
    const settings = await Settings.getInstance();
    
    const siteName = settings.branding.siteName;
    const supportEmail = process.env.EMAIL_FROM;
    
    const subject = `${siteName} - Account Deactivated`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545; text-align: center;">Account Deactivated</h2>
        
        <p>Hi ${name},</p>
        
        <p>Your ${siteName} account has been deactivated.</p>
        
        <p><strong>Reason:</strong> ${reason}</p>
        
        <p>You will no longer have access to the digital library. If you believe this was done in error or would like to discuss reactivation, please contact our support team.</p>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 0;"><strong>Support Contact:</strong> ${supportEmail}</p>
        </div>
        
        <p>Thank you for being part of our community.</p>
        <p>The ${siteName} Team</p>
      </div>
    `;
    
    return await sendEmail({
      to: email,
      subject,
      html
    });
  } catch (error) {
    console.error('Failed to send deactivation email:', error);
    throw error;
  }
}

/**
 * Test email configuration
 * @param {string} testEmail - Email to send test to
 * @returns {Promise} Test result
 */
export async function testEmailConfiguration(testEmail) {
  try {
    const subject = 'BX Library - Email Configuration Test';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745; text-align: center;">Email Configuration Test</h2>
        <p>This is a test email to verify that your email configuration is working correctly.</p>
        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p>If you received this email, your email service is configured properly!</p>
      </div>
    `;
    
    return await sendEmail({
      to: testEmail,
      subject,
      html
    });
  } catch (error) {
    console.error('Email configuration test failed:', error);
    throw error;
  }
}

/**
 * Validate email configuration
 * @returns {boolean} Is configuration valid
 */
export function validateEmailConfig() {
  const requiredVars = ['EMAIL_HOST', 'EMAIL_USER', 'EMAIL_PASS', 'EMAIL_FROM'];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      console.error(`Missing required environment variable: ${varName}`);
      return false;
    }
  }
  
  return true;
}