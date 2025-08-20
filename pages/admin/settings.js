import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { CompactThemeToggle } from '../../components/ThemeToggle';
import { toast } from 'react-hot-toast';

function AdminSettings() {
  const { user } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState({
    siteName: '',
    siteDescription: '',
    allowRegistration: true,
    requireEmailVerification: false,
    maxFileSize: 50,
    allowedFileTypes: ['pdf'],
    emailSettings: {
      smtpHost: '',
      smtpPort: 587,
      smtpUser: '',
      smtpPassword: '',
      fromEmail: '',
      fromName: ''
    },
    googleDriveSettings: {
      clientId: '',
      clientSecret: '',
      redirectUri: '',
      refreshToken: ''
    },
    maintenanceMode: false,
    maintenanceMessage: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/admin/settings', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings || settings);
      } else {
        toast.error('Failed to fetch settings');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        toast.success('Settings saved successfully');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    if (section) {
      setSettings(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const testEmailConnection = async () => {
    try {
      const response = await fetch('/api/admin/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(settings.emailSettings)
      });

      if (response.ok) {
        toast.success('Email connection test successful');
      } else {
        const data = await response.json();
        toast.error(data.message || 'Email connection test failed');
      }
    } catch (error) {
      console.error('Error testing email:', error);
      toast.error('Email connection test failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading settings...</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: 'General', icon: '⚙️' },
    { id: 'email', name: 'Email', icon: '📧' },
    { id: 'storage', name: 'Storage', icon: '💾' },
    { id: 'security', name: 'Security', icon: '🔒' },
    { id: 'maintenance', name: 'Maintenance', icon: '🔧' }
  ];

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <Link href="/admin" className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium">
                  ← Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">System Settings</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Configure system-wide settings and preferences
                </p>
              </div>
              <CompactThemeToggle />
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-64">
              <nav className="space-y-1">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                      activeTab === tab.id
                        ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                  >
                    <span className="mr-3">{tab.icon}</span>
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            {/* Content */}
            <div className="flex-1">
              <form onSubmit={handleSaveSettings}>
                <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                  <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {tabs.find(tab => tab.id === activeTab)?.name} Settings
                    </h3>
                  </div>
                  
                  <div className="px-6 py-6">
                    {/* General Settings */}
                    {activeTab === 'general' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Site Name
                          </label>
                          <input
                            type="text"
                            value={settings.siteName}
                            onChange={(e) => handleInputChange(null, 'siteName', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            placeholder="BX Library"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Site Description
                          </label>
                          <textarea
                            value={settings.siteDescription}
                            onChange={(e) => handleInputChange(null, 'siteDescription', e.target.value)}
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            placeholder="A digital library management system"
                          />
                        </div>
                        
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings.allowRegistration}
                              onChange={(e) => handleInputChange(null, 'allowRegistration', e.target.checked)}
                              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Allow user registration</span>
                          </label>
                        </div>
                        
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings.requireEmailVerification}
                              onChange={(e) => handleInputChange(null, 'requireEmailVerification', e.target.checked)}
                              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Require email verification</span>
                          </label>
                        </div>
                      </div>
                    )}

                    {/* Email Settings */}
                    {activeTab === 'email' && (
                      <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              SMTP Host
                            </label>
                            <input
                              type="text"
                              value={settings.emailSettings.smtpHost}
                              onChange={(e) => handleInputChange('emailSettings', 'smtpHost', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              placeholder="smtp.gmail.com"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              SMTP Port
                            </label>
                            <input
                              type="number"
                              value={settings.emailSettings.smtpPort}
                              onChange={(e) => handleInputChange('emailSettings', 'smtpPort', parseInt(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              placeholder="587"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              SMTP Username
                            </label>
                            <input
                              type="text"
                              value={settings.emailSettings.smtpUser}
                              onChange={(e) => handleInputChange('emailSettings', 'smtpUser', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              placeholder="your-email@gmail.com"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                              SMTP Password
                            </label>
                            <input
                              type="password"
                              value={settings.emailSettings.smtpPassword}
                              onChange={(e) => handleInputChange('emailSettings', 'smtpPassword', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              placeholder="••••••••"
                            />
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              From Email
                            </label>
                            <input
                              type="email"
                              value={settings.emailSettings.fromEmail}
                              onChange={(e) => handleInputChange('emailSettings', 'fromEmail', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              placeholder="noreply@yourdomain.com"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              From Name
                            </label>
                            <input
                              type="text"
                              value={settings.emailSettings.fromName}
                              onChange={(e) => handleInputChange('emailSettings', 'fromName', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                              placeholder="BX Library"
                            />
                          </div>
                        </div>
                        
                        <div>
                          <button
                            type="button"
                            onClick={testEmailConnection}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                          >
                            Test Email Connection
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Storage Settings */}
                    {activeTab === 'storage' && (
                      <div className="space-y-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum File Size (MB)
                          </label>
                          <input
                            type="number"
                            value={settings.maxFileSize}
                            onChange={(e) => handleInputChange(null, 'maxFileSize', parseInt(e.target.value))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            placeholder="50"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Google Drive Client ID
                          </label>
                          <input
                            type="text"
                            value={settings.googleDriveSettings.clientId}
                            onChange={(e) => handleInputChange('googleDriveSettings', 'clientId', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            placeholder="Your Google Drive Client ID"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Google Drive Client Secret
                          </label>
                          <input
                            type="password"
                            value={settings.googleDriveSettings.clientSecret}
                            onChange={(e) => handleInputChange('googleDriveSettings', 'clientSecret', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            placeholder="••••••••"
                          />
                        </div>
                      </div>
                    )}

                    {/* Security Settings */}
                    {activeTab === 'security' && (
                      <div className="space-y-6">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">
                                Security Settings
                              </h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p>Security settings are managed through environment variables and cannot be changed from the admin panel for security reasons.</p>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">JWT Secret</h4>
                              <p className="text-sm text-gray-500">Used for signing authentication tokens</p>
                            </div>
                            <span className="text-sm text-green-600">✓ Configured</span>
                          </div>
                          
                          <div className="flex justify-between items-center py-3 border-b border-gray-200">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">Database Connection</h4>
                              <p className="text-sm text-gray-500">MongoDB connection string</p>
                            </div>
                            <span className="text-sm text-green-600">✓ Connected</span>
                          </div>
                          
                          <div className="flex justify-between items-center py-3">
                            <div>
                              <h4 className="text-sm font-medium text-gray-900">HTTPS</h4>
                              <p className="text-sm text-gray-500">Secure connection protocol</p>
                            </div>
                            <span className="text-sm text-yellow-600">⚠ Development Mode</span>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Maintenance Settings */}
                    {activeTab === 'maintenance' && (
                      <div className="space-y-6">
                        <div>
                          <label className="flex items-center">
                            <input
                              type="checkbox"
                              checked={settings.maintenanceMode}
                              onChange={(e) => handleInputChange(null, 'maintenanceMode', e.target.checked)}
                              className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                            />
                            <span className="ml-2 text-sm text-gray-700">Enable maintenance mode</span>
                          </label>
                          <p className="mt-1 text-sm text-gray-500">
                            When enabled, only administrators can access the site
                          </p>
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maintenance Message
                          </label>
                          <textarea
                            value={settings.maintenanceMessage}
                            onChange={(e) => handleInputChange(null, 'maintenanceMessage', e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                            placeholder="We are currently performing scheduled maintenance. Please check back later."
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white px-6 py-2 rounded-md text-sm font-medium"
                    >
                      {saving ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default AdminSettings;