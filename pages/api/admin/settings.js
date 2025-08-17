import { withAdminAuth } from '../../../lib/auth';
import dbConnect from '../../../lib/mongodb';
import Settings from '../../../models/Settings';

async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'GET':
      return await getSettings(req, res);
    case 'PUT':
      return await updateSettings(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getSettings(req, res) {
  try {
    let settings = await Settings.findOne();
    
    // Create default settings if none exist
    if (!settings) {
      settings = new Settings({
        siteName: 'BX Library',
        siteDescription: 'Your digital library for PDF books',
        logoUrl: '',
        primaryColor: '#3B82F6',
        secondaryColor: '#1E40AF',
        sessionLength: 24, // hours
        readerMode: 'embed', // 'embed' or 'stream'
        allowDownload: false,
        showWatermark: true,
        emailTemplates: {
          invite: {
            subject: 'Welcome to {{siteName}} - Complete Your Registration',
            body: `Hello,\n\nYou have been invited to join {{siteName}}.\n\nPlease click the link below to complete your registration:\n{{inviteLink}}\n\nThis link will expire in 7 days.\n\nBest regards,\nThe {{siteName}} Team`
          },
          passwordReset: {
            subject: 'Reset Your {{siteName}} Password',
            body: `Hello,\n\nYou have requested to reset your password for {{siteName}}.\n\nPlease click the link below to reset your password:\n{{resetLink}}\n\nThis link will expire in 1 hour.\n\nIf you did not request this, please ignore this email.\n\nBest regards,\nThe {{siteName}} Team`
          },
          welcome: {
            subject: 'Welcome to {{siteName}}!',
            body: `Hello {{userName}},\n\nWelcome to {{siteName}}! Your account has been successfully created.\n\nYou can now access our library of books and start reading.\n\nBest regards,\nThe {{siteName}} Team`
          }
        },
        createdBy: req.user._id
      });
      await settings.save();
    }

    // Remove sensitive fields
    const settingsData = {
      id: settings._id,
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      sessionLength: settings.sessionLength,
      readerMode: settings.readerMode,
      allowDownload: settings.allowDownload,
      showWatermark: settings.showWatermark,
      emailTemplates: settings.emailTemplates,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };

    res.status(200).json({ settings: settingsData });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateSettings(req, res) {
  try {
    const {
      siteName,
      siteDescription,
      logoUrl,
      primaryColor,
      secondaryColor,
      sessionLength,
      readerMode,
      allowDownload,
      showWatermark,
      emailTemplates
    } = req.body;
    const adminUserId = req.user._id;

    let settings = await Settings.findOne();
    if (!settings) {
      return res.status(404).json({ error: 'Settings not found' });
    }

    let hasChanges = false;

    // Update site name
    if (siteName !== undefined && siteName !== settings.siteName) {
      if (!siteName || siteName.trim().length === 0) {
        return res.status(400).json({ error: 'Site name is required' });
      }
      if (siteName.trim().length > 100) {
        return res.status(400).json({ error: 'Site name must be less than 100 characters' });
      }
      settings.siteName = siteName.trim();
      hasChanges = true;
    }

    // Update site description
    if (siteDescription !== undefined && siteDescription !== settings.siteDescription) {
      if (siteDescription && siteDescription.length > 500) {
        return res.status(400).json({ error: 'Site description must be less than 500 characters' });
      }
      settings.siteDescription = siteDescription?.trim() || '';
      hasChanges = true;
    }

    // Update logo URL
    if (logoUrl !== undefined && logoUrl !== settings.logoUrl) {
      if (logoUrl && !isValidUrl(logoUrl)) {
        return res.status(400).json({ error: 'Invalid logo URL format' });
      }
      settings.logoUrl = logoUrl?.trim() || '';
      hasChanges = true;
    }

    // Update primary color
    if (primaryColor !== undefined && primaryColor !== settings.primaryColor) {
      if (primaryColor && !/^#[0-9A-F]{6}$/i.test(primaryColor)) {
        return res.status(400).json({ error: 'Invalid primary color format. Use hex format (#RRGGBB)' });
      }
      settings.primaryColor = primaryColor || '#3B82F6';
      hasChanges = true;
    }

    // Update secondary color
    if (secondaryColor !== undefined && secondaryColor !== settings.secondaryColor) {
      if (secondaryColor && !/^#[0-9A-F]{6}$/i.test(secondaryColor)) {
        return res.status(400).json({ error: 'Invalid secondary color format. Use hex format (#RRGGBB)' });
      }
      settings.secondaryColor = secondaryColor || '#1E40AF';
      hasChanges = true;
    }

    // Update session length
    if (sessionLength !== undefined && sessionLength !== settings.sessionLength) {
      const sessionHours = parseInt(sessionLength);
      if (isNaN(sessionHours) || sessionHours < 1 || sessionHours > 168) { // 1 hour to 1 week
        return res.status(400).json({ error: 'Session length must be between 1 and 168 hours' });
      }
      settings.sessionLength = sessionHours;
      hasChanges = true;
    }

    // Update reader mode
    if (readerMode !== undefined && readerMode !== settings.readerMode) {
      if (!['embed', 'stream'].includes(readerMode)) {
        return res.status(400).json({ error: 'Reader mode must be either "embed" or "stream"' });
      }
      settings.readerMode = readerMode;
      hasChanges = true;
    }

    // Update allow download
    if (allowDownload !== undefined && allowDownload !== settings.allowDownload) {
      settings.allowDownload = Boolean(allowDownload);
      hasChanges = true;
    }

    // Update show watermark
    if (showWatermark !== undefined && showWatermark !== settings.showWatermark) {
      settings.showWatermark = Boolean(showWatermark);
      hasChanges = true;
    }

    // Update email templates
    if (emailTemplates && typeof emailTemplates === 'object') {
      const templateTypes = ['invite', 'passwordReset', 'welcome'];
      
      for (const templateType of templateTypes) {
        if (emailTemplates[templateType]) {
          const template = emailTemplates[templateType];
          
          if (template.subject !== undefined) {
            if (!template.subject || template.subject.trim().length === 0) {
              return res.status(400).json({ error: `${templateType} email subject is required` });
            }
            if (template.subject.length > 200) {
              return res.status(400).json({ error: `${templateType} email subject must be less than 200 characters` });
            }
            settings.emailTemplates[templateType].subject = template.subject.trim();
            hasChanges = true;
          }
          
          if (template.body !== undefined) {
            if (!template.body || template.body.trim().length === 0) {
              return res.status(400).json({ error: `${templateType} email body is required` });
            }
            if (template.body.length > 5000) {
              return res.status(400).json({ error: `${templateType} email body must be less than 5000 characters` });
            }
            settings.emailTemplates[templateType].body = template.body.trim();
            hasChanges = true;
          }
        }
      }
    }

    if (!hasChanges) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    settings.updatedBy = adminUserId;
    await settings.save();

    // Return updated settings data
    const settingsData = {
      id: settings._id,
      siteName: settings.siteName,
      siteDescription: settings.siteDescription,
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      sessionLength: settings.sessionLength,
      readerMode: settings.readerMode,
      allowDownload: settings.allowDownload,
      showWatermark: settings.showWatermark,
      emailTemplates: settings.emailTemplates,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt
    };

    res.status(200).json({
      message: 'Settings updated successfully',
      settings: settingsData
    });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

// Helper function to validate URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

export default withAdminAuth(handler);