/**
 * Script to create the first admin user
 * Run this script once to create an admin account that can then manage other users
 *
 * Usage: node scripts/create-admin.js
 */

const fs = require('fs')
const path = require('path')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

// Load environment variables from .env.local
function loadEnvFile() {
  try {
    const envPath = path.join(__dirname, '..', '.env.local')
    const envContent = fs.readFileSync(envPath, 'utf8')
    const lines = envContent.split('\n')

    lines.forEach((line) => {
      const trimmedLine = line.trim()
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=')
        if (key && valueParts.length > 0) {
          process.env[key] = valueParts.join('=')
        }
      }
    })
  } catch (error) {
    console.error('Error loading .env.local file:', error.message)
    process.exit(1)
  }
}

// Load environment variables
loadEnvFile()

// Import the User model
const UserSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    name: {
      type: String,
      required: false,
      trim: true,
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    status: {
      type: String,
      enum: ['pending', 'active', 'inactive'],
      default: 'pending',
    },
    inviteToken: {
      type: String,
      required: false,
    },
    inviteTokenExpiry: {
      type: Date,
      required: false,
    },
    resetPasswordToken: {
      type: String,
      required: false,
    },
    resetPasswordExpiry: {
      type: Date,
      required: false,
    },
    expiryDate: {
      type: Date,
      required: false,
    },
    lastLogin: {
      type: Date,
      required: false,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
    auditTrail: [
      {
        action: String,
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        details: String,
      },
    ],
  },
  {
    timestamps: true,
  }
)

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()

  if (this.password) {
    this.password = await bcrypt.hash(this.password, 12)
  }
  next()
})

// Compare password method
UserSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false
  return bcrypt.compare(candidatePassword, this.password)
}

// Check if user access is valid
UserSchema.methods.isAccessValid = function () {
  if (this.status !== 'active') return false
  if (this.expiryDate && this.expiryDate < new Date()) return false
  return true
}

// Add audit trail entry
UserSchema.methods.addAuditEntry = function (
  action,
  performedBy,
  details = ''
) {
  this.auditTrail.push({
    action,
    performedBy,
    details,
    timestamp: new Date(),
  })
}

const User = mongoose.models.User || mongoose.model('User', UserSchema)

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('Connected to MongoDB')

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ role: 'admin' })
    if (existingAdmin) {
      console.log('Admin user already exists:')
      console.log(`Email: ${existingAdmin.email}`)
      console.log(`Status: ${existingAdmin.status}`)
      return
    }

    // Admin user details - CHANGE THESE VALUES
    const adminData = {
      email: 'taha@bxlibrary.com',
      phone: '+1234567890',
      name: 'BX Library Admin',
      password: 'admin123', // CHANGE THIS PASSWORD
      role: 'admin',
      status: 'active',
    }

    // Create admin user
    const adminUser = new User(adminData)
    adminUser.addAuditEntry(
      'user_created',
      null,
      'Initial admin user created via script'
    )

    await adminUser.save()

    console.log('✅ Admin user created successfully!')
    console.log('Login credentials:')
    console.log(`Email: ${adminData.email}`)
    console.log(`Password: ${adminData.password}`)
    console.log('')
    console.log('⚠️  IMPORTANT: Please change the password after first login!')
    console.log('You can now login at: http://localhost:3000/login')
  } catch (error) {
    console.error('❌ Error creating admin user:', error)
  } finally {
    await mongoose.disconnect()
    console.log('Disconnected from MongoDB')
  }
}

// Run the script
createAdminUser()
