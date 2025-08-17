import { withAuth } from '../../lib/auth';
import Settings from '../../models/Settings';

const handler = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get application settings
    let settings = await Settings.findOne();
    
    if (!settings) {
      // Create default settings if none exist
      settings = new Settings({
        siteName: 'BX Library',
        siteDescription: 'Your Digital Library',
        logoUrl: '',
        primaryColor: '#2563eb',
        secondaryColor: '#1e40af',
        sessionLength: 24,
        readerMode: 'drive_embed',
        allowDownload: false,
        showWatermark: true,
        emailTemplates: {
          invite: {
            subject: 'Welcome to BX Library',
            body: 'You have been invited to join BX Library. Click the link below to set up your account:\n\n{{inviteLink}}\n\nThis link will expire in 7 days.'
          },
          passwordReset: {
            subject: 'Reset Your Password',
            body: 'Click the link below to reset your password:\n\n{{resetLink}}\n\nThis link will expire in 1 hour. If you did not request this reset, please ignore this email.'
          }
        }
      });
      await settings.save();
    }

    // Return public settings (exclude sensitive information)
    const publicSettings = {
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      readerMode: settings.readerMode,
      showWatermark: settings.showWatermark
    };

    return res.status(200).json({
      settings: publicSettings
    });

  } catch (error) {
    console.error('Settings fetch error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export default withAuth(handler);