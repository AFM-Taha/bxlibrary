import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  // Email configuration
  emailTemplates: {
    invite: {
      subject: {
        type: String,
        default: 'Welcome to BX Library - Complete Your Registration'
      },
      body: {
        type: String,
        default: `
          <h2>Welcome to BX Library!</h2>
          <p>You have been invited to join our digital library. Please click the link below to complete your registration:</p>
          <p><a href="{{inviteUrl}}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Complete Registration</a></p>
          <p>This invitation will expire in 7 days.</p>
          <p>If you have any questions, please contact our support team.</p>
        `
      }
    },
    resetPassword: {
      subject: {
        type: String,
        default: 'BX Library - Reset Your Password'
      },
      body: {
        type: String,
        default: `
          <h2>Password Reset Request</h2>
          <p>You have requested to reset your password. Please click the link below to set a new password:</p>
          <p><a href="{{resetUrl}}" style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `
      }
    }
  },
  
  // Session configuration
  sessionLength: {
    type: Number,
    default: 24 * 60 * 60 * 1000, // 24 hours in milliseconds
    min: 60 * 60 * 1000, // Minimum 1 hour
    max: 30 * 24 * 60 * 60 * 1000 // Maximum 30 days
  },
  
  // Reader configuration
  readerMode: {
    type: String,
    enum: ['drive_embed', 'pdf_stream'],
    default: 'drive_embed'
  },
  
  // Branding
  branding: {
    siteName: {
      type: String,
      default: 'BX Library'
    },
    logoUrl: {
      type: String,
      required: false
    },
    primaryColor: {
      type: String,
      default: '#007bff'
    },
    secondaryColor: {
      type: String,
      default: '#6c757d'
    },
    favicon: {
      type: String,
      required: false
    }
  },
  
  // Library settings
  library: {
    booksPerPage: {
      type: Number,
      default: 12,
      min: 6,
      max: 50
    },
    enableInfiniteScroll: {
      type: Boolean,
      default: false
    },
    defaultSortOrder: {
      type: String,
      enum: ['newest', 'oldest', 'title_asc', 'title_desc', 'most_read'],
      default: 'newest'
    }
  },
  
  // Reader settings
  reader: {
    enableWatermark: {
      type: Boolean,
      default: true
    },
    watermarkText: {
      type: String,
      default: '{{userEmail}} - {{timestamp}}'
    },
    enableDarkMode: {
      type: Boolean,
      default: true
    },
    defaultZoom: {
      type: String,
      enum: ['fit_width', 'fit_page', 'actual_size'],
      default: 'fit_width'
    },
    hideDownloadButton: {
      type: Boolean,
      default: true
    },
    hidePrintButton: {
      type: Boolean,
      default: true
    }
  },
  
  // Google Drive API settings
  googleDrive: {
    serviceAccountEmail: {
      type: String,
      required: false
    },
    privateKey: {
      type: String,
      required: false
    },
    enableThumbnails: {
      type: Boolean,
      default: true
    }
  },
  
  // System settings
  system: {
    maintenanceMode: {
      type: Boolean,
      default: false
    },
    maintenanceMessage: {
      type: String,
      default: 'The system is currently under maintenance. Please try again later.'
    },
    maxFileSize: {
      type: Number,
      default: 100 * 1024 * 1024 // 100MB in bytes
    }
  },
  
  // Last updated info
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false
  }
}, {
  timestamps: true
});

// Ensure only one settings document exists
SettingsSchema.statics.getInstance = async function() {
  let settings = await this.findOne();
  if (!settings) {
    settings = await this.create({});
  }
  return settings;
};

// Update settings
SettingsSchema.statics.updateSettings = async function(updates, updatedBy) {
  const settings = await this.getInstance();
  Object.assign(settings, updates);
  settings.updatedBy = updatedBy;
  await settings.save();
  return settings;
};

// Get email template with variable substitution
SettingsSchema.methods.getEmailTemplate = function(type, variables = {}) {
  const template = this.emailTemplates[type];
  if (!template) {
    throw new Error(`Email template '${type}' not found`);
  }
  
  let subject = template.subject;
  let body = template.body;
  
  // Replace variables in template
  Object.keys(variables).forEach(key => {
    const placeholder = `{{${key}}}`;
    subject = subject.replace(new RegExp(placeholder, 'g'), variables[key]);
    body = body.replace(new RegExp(placeholder, 'g'), variables[key]);
  });
  
  return { subject, body };
};

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);