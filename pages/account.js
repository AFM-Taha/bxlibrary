import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import { CompactThemeToggle } from '../components/ThemeToggle'
import toast from 'react-hot-toast'
import { LogOut } from 'lucide-react'

function AccountPage() {
  const { user, logout, updateProfile } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('profile')
  const [loading, setLoading] = useState(false)

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    phone: '',
  })

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
      })
    }
  }, [user])

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileForm.name,
          phone: profileForm.phone,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        await updateProfile(data.user)
        toast.success('Profile updated successfully')
      } else {
        toast.error(data.message || 'Failed to update profile')
      }
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters long')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/update-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Password updated successfully')
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: '',
        })
      } else {
        toast.error(data.message || 'Failed to update password')
      }
    } catch (error) {
      console.error('Password update error:', error)
      toast.error('Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  const getPasswordStrength = (password) => {
    if (password.length === 0) return { strength: 0, label: '', color: '' }
    if (password.length < 4)
      return { strength: 1, label: 'Too Short', color: 'bg-error-500' }
    if (password.length < 6)
      return { strength: 2, label: 'Weak', color: 'bg-warning-500' }
    if (password.length < 8)
      return { strength: 3, label: 'Good', color: 'bg-primary-500' }
    return { strength: 4, label: 'Strong', color: 'bg-success-500' }
  }

  const passwordStrength = getPasswordStrength(passwordForm.newPassword)

  return (
    <div className='min-h-screen bg-secondary-50 dark:bg-secondary-950'>
      {/* Navigation */}
      <nav className='sticky top-0 z-50 bg-transparent backdrop-blur-md shadow-sm border-b border-secondary-200 dark:border-secondary-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <Link href='/' className='flex-shrink-0'>
                <h1 className='text-2xl font-bold text-primary-600 dark:text-primary-400'>
                  BX Library
                </h1>
              </Link>
            </div>
            <div className='flex items-center space-x-1 sm:space-x-4'>
              <CompactThemeToggle />
              <Link
                href='/'
                className='text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
              >
                Library
              </Link>
              <button
                onClick={handleLogout}
                className='text-secondary-700 dark:text-secondary-300 hover:text-error-600 dark:hover:text-error-400 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center'
                title='Sign Out'
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-secondary-900 dark:text-white mb-2'>
            Account Settings
          </h1>
          <p className='text-secondary-600 dark:text-secondary-400'>
            Manage your account information and preferences
          </p>
        </div>

        <div className='card overflow-hidden'>
          {/* Tabs */}
          <div className='border-b border-secondary-200 dark:border-secondary-700'>
            <nav className='-mb-px flex'>
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 hover:border-secondary-300 dark:hover:border-secondary-600'
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('password')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'password'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 hover:border-secondary-300 dark:hover:border-secondary-600'
                }`}
              >
                Change Password
              </button>
              <button
                onClick={() => setActiveTab('info')}
                className={`py-4 px-6 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === 'info'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-secondary-500 dark:text-secondary-400 hover:text-secondary-700 dark:hover:text-secondary-300 hover:border-secondary-300 dark:hover:border-secondary-600'
                }`}
              >
                Account Info
              </button>
            </nav>
          </div>

          <div className='p-6'>
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <form onSubmit={handleProfileSubmit} className='space-y-6'>
                <div>
                  <label
                    htmlFor='name'
                    className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'
                  >
                    Full Name
                  </label>
                  <input
                    type='text'
                    id='name'
                    value={profileForm.name}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, name: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white'
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor='email'
                    className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'
                  >
                    Email Address
                  </label>
                  <input
                    type='email'
                    id='email'
                    value={profileForm.email}
                    className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-secondary-50 dark:bg-secondary-800 text-secondary-500 dark:text-secondary-400'
                    disabled
                  />
                  <p className='mt-1 text-sm text-secondary-500 dark:text-secondary-400'>
                    Email address cannot be changed
                  </p>
                </div>

                <div>
                  <label
                    htmlFor='phone'
                    className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'
                  >
                    Phone Number
                  </label>
                  <input
                    type='tel'
                    id='phone'
                    value={profileForm.phone}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, phone: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white'
                  />
                </div>

                <div className='flex justify-end'>
                  <button
                    type='submit'
                    disabled={loading}
                    className='px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    {loading ? 'Updating...' : 'Update Profile'}
                  </button>
                </div>
              </form>
            )}

            {/* Password Tab */}
            {activeTab === 'password' && (
              <form onSubmit={handlePasswordSubmit} className='space-y-6'>
                <div>
                  <label
                    htmlFor='currentPassword'
                    className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'
                  >
                    Current Password
                  </label>
                  <input
                    type='password'
                    id='currentPassword'
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        currentPassword: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white'
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor='newPassword'
                    className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'
                  >
                    New Password
                  </label>
                  <input
                    type='password'
                    id='newPassword'
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white'
                    required
                  />
                  {passwordForm.newPassword && (
                    <div className='mt-2'>
                      <div className='flex items-center space-x-2'>
                        <div className='flex-1 bg-secondary-200 dark:bg-secondary-600 rounded-full h-2'>
                          <div
                            className={`h-2 rounded-full transition-all duration-300 ${passwordStrength.color}`}
                            style={{
                              width: `${
                                (passwordStrength.strength / 4) * 100
                              }%`,
                            }}
                          ></div>
                        </div>
                        <span className='text-sm text-secondary-600 dark:text-secondary-400'>
                          {passwordStrength.label}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor='confirmPassword'
                    className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'
                  >
                    Confirm New Password
                  </label>
                  <input
                    type='password'
                    id='confirmPassword'
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({
                        ...passwordForm,
                        confirmPassword: e.target.value,
                      })
                    }
                    className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white'
                    required
                  />
                  {passwordForm.confirmPassword &&
                    passwordForm.newPassword !==
                      passwordForm.confirmPassword && (
                      <p className='mt-1 text-sm text-error-600 dark:text-error-400'>
                        Passwords do not match
                      </p>
                    )}
                </div>

                <div className='flex justify-end'>
                  <button
                    type='submit'
                    disabled={
                      loading ||
                      passwordForm.newPassword !== passwordForm.confirmPassword
                    }
                    className='px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
                  >
                    {loading ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}

            {/* Account Info Tab */}
            {activeTab === 'info' && (
              <div className='space-y-6'>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div>
                    <h3 className='text-lg font-medium text-secondary-900 dark:text-white mb-4'>
                      Account Status
                    </h3>
                    <dl className='space-y-3'>
                      <div>
                        <dt className='text-sm font-medium text-secondary-500 dark:text-secondary-400'>
                          Status
                        </dt>
                        <dd className='text-sm text-secondary-900 dark:text-white'>
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user?.status === 'active'
                                ? 'bg-success-100 dark:bg-success-900 text-success-800 dark:text-success-200'
                                : 'bg-error-100 dark:bg-error-900 text-error-800 dark:text-error-200'
                            }`}
                          >
                            {user?.status?.charAt(0).toUpperCase() +
                              user?.status?.slice(1)}
                          </span>
                        </dd>
                      </div>
                      <div>
                        <dt className='text-sm font-medium text-secondary-500 dark:text-secondary-400'>
                          Role
                        </dt>
                        <dd className='text-sm text-secondary-900 dark:text-white capitalize'>
                          {user?.role}
                        </dd>
                      </div>
                      <div>
                        <dt className='text-sm font-medium text-secondary-500 dark:text-secondary-400'>
                          Member Since
                        </dt>
                        <dd className='text-sm text-secondary-900 dark:text-white'>
                          {user?.createdAt
                            ? new Date(user.createdAt).toLocaleDateString()
                            : 'N/A'}
                        </dd>
                      </div>
                      {user?.expiryDate && (
                        <div>
                          <dt className='text-sm font-medium text-secondary-500 dark:text-secondary-400'>
                            Account Expires
                          </dt>
                          <dd className='text-sm text-secondary-900 dark:text-white'>
                            {new Date(user.expiryDate).toLocaleDateString()}
                          </dd>
                        </div>
                      )}
                    </dl>
                  </div>

                  <div>
                    <h3 className='text-lg font-medium text-secondary-900 dark:text-white mb-4'>
                      Contact Information
                    </h3>
                    <dl className='space-y-3'>
                      <div>
                        <dt className='text-sm font-medium text-secondary-500 dark:text-secondary-400'>
                          Email
                        </dt>
                        <dd className='text-sm text-secondary-900 dark:text-white'>
                          {user?.email}
                        </dd>
                      </div>
                      <div>
                        <dt className='text-sm font-medium text-secondary-500 dark:text-secondary-400'>
                          Phone
                        </dt>
                        <dd className='text-sm text-secondary-900 dark:text-white'>
                          {user?.phone || 'Not provided'}
                        </dd>
                      </div>
                      <div>
                        <dt className='text-sm font-medium text-secondary-500 dark:text-secondary-400'>
                          Last Login
                        </dt>
                        <dd className='text-sm text-secondary-900 dark:text-white'>
                          {user?.lastLogin
                            ? new Date(user.lastLogin).toLocaleString()
                            : 'N/A'}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                <div className='border-t border-secondary-200 dark:border-secondary-700 pt-6'>
                  <h3 className='text-lg font-medium text-secondary-900 dark:text-white mb-4'>
                    Account Actions
                  </h3>
                  <div className='flex space-x-4'>
                    <Link
                      href='/'
                      className='px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors'
                    >
                      Go to Library
                    </Link>
                    <button
                      onClick={handleLogout}
                      className='px-4 py-2 bg-secondary-600 text-white rounded-md hover:bg-secondary-700 transition-colors flex items-center justify-center'
                      title='Sign Out'
                    >
                      <LogOut size={18} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Account() {
  return (
    <ProtectedRoute>
      <AccountPage />
    </ProtectedRoute>
  )
}
