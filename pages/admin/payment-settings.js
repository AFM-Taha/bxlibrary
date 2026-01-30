import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'
import AdminLayout from '../../components/AdminLayout'

export default function PaymentSettings() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [configs, setConfigs] = useState([])
  const [loadingConfigs, setLoadingConfigs] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingConfig, setEditingConfig] = useState(null)
  const [formData, setFormData] = useState({
    provider: 'rupantor',
    environment: 'sandbox',
    rupantorApiKey: '',
    isActive: false,
  })

  useEffect(() => {
    if (!loading && (!user || user.role !== 'admin')) {
      router.push('/login')
      return
    }
    if (user && user.role === 'admin') {
      fetchConfigs()
    }
  }, [user, loading, router])

  const fetchConfigs = async () => {
    try {
      const response = await fetch('/api/admin/payment-config', {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setConfigs(data.configs)
      } else {
        toast.error('Failed to fetch payment configurations')
      }
    } catch (error) {
      console.error('Error fetching configs:', error)
      toast.error('Failed to fetch payment configurations')
    } finally {
      setLoadingConfigs(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const url = editingConfig
        ? `/api/admin/payment-config/${editingConfig._id}`
        : '/api/admin/payment-config'

      const method = editingConfig ? 'PUT' : 'POST'

      // Map form data to API field names
      const apiData = {
        provider: formData.provider,
        environment: formData.environment,
        isActive: formData.isActive,
      }

      // Add provider-specific fields
      if (formData.provider === 'rupantor') {
        apiData.rupantorApiKey = formData.rupantorApiKey
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(apiData),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          editingConfig
            ? 'Configuration updated successfully'
            : 'Configuration created successfully',
        )
        setShowForm(false)
        setEditingConfig(null)
        resetForm()
        fetchConfigs()
      } else {
        toast.error(data.error || 'Failed to save configuration')
      }
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Failed to save configuration')
    }
  }

  const handleEdit = (config) => {
    setEditingConfig(config)

    // Map API field names to form field names
    const mappedFormData = {
      provider: config.provider,
      environment: config.environment,
      rupantorSecretKey: '', // Don't populate for security
      isActive: config.isActive,
    }

    // Map provider-specific fields
    if (config.provider === 'rupantor') {
      mappedFormData.rupantorApiKey = config.rupantorApiKey || ''
      mappedFormData.rupantorMerchantId = config.rupantorMerchantId || ''
    }

    setFormData(mappedFormData)
    setShowForm(true)
  }

  const handleDelete = async (configId) => {
    if (
      !confirm('Are you sure you want to delete this payment configuration?')
    ) {
      return
    }

    try {
      const response = await fetch(`/api/admin/payment-config/${configId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast.success('Configuration deleted successfully')
        fetchConfigs()
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete configuration')
      }
    } catch (error) {
      console.error('Error deleting config:', error)
      toast.error('Failed to delete configuration')
    }
  }

  const resetForm = () => {
    setFormData({
      provider: 'rupantor',
      environment: 'sandbox',
      rupantorApiKey: '',
      rupantorMerchantId: '',
      rupantorSecretKey: '',
      isActive: false,
    })
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingConfig(null)
    resetForm()
  }

  if (loading || loadingConfigs) {
    return (
      <AdminLayout
        title='Payment Settings'
        subtitle='Configure RupantorPay payment gateway'
      >
        <div className='flex justify-center items-center h-64'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600'></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout
      title='Payment Settings'
      subtitle='Configure RupantorPay payment gateway'
    >
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex justify-end'>
          <button
            onClick={() => setShowForm(true)}
            className='bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors'
          >
            Add Configuration
          </button>
        </div>

        {/* Configuration Form */}
        {showForm && (
          <div className='bg-white dark:bg-secondary-800 rounded-lg shadow-md p-6'>
            <h2 className='text-lg font-semibold text-secondary-900 dark:text-white mb-4'>
              {editingConfig ? 'Edit Configuration' : 'Add New Configuration'}
            </h2>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <div>
                  <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1'>
                    Provider
                  </label>
                  <select
                    value={formData.provider}
                    onChange={(e) =>
                      setFormData({ ...formData, provider: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white'
                    required
                  >
                    <option value='rupantor'>RupantorPay</option>
                  </select>
                </div>

                <div>
                  <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1'>
                    Environment
                  </label>
                  <select
                    value={formData.environment}
                    onChange={(e) =>
                      setFormData({ ...formData, environment: e.target.value })
                    }
                    className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white'
                    required
                  >
                    <option value='sandbox'>Sandbox</option>
                    <option value='production'>Production</option>
                  </select>
                </div>
              </div>

              {/* Stripe Fields */}
              {formData.provider === 'stripe' && (
                <>
                  <div>
                    <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1'>
                      Publishable Key
                    </label>
                    <input
                      type='text'
                      value={formData.publishableKey}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          publishableKey: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white'
                      placeholder='pk_test_...'
                      required
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1'>
                      Secret Key
                    </label>
                    <input
                      type='password'
                      value={formData.secretKey}
                      onChange={(e) =>
                        setFormData({ ...formData, secretKey: e.target.value })
                      }
                      className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white'
                      placeholder='sk_test_...'
                      required={!editingConfig}
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1'>
                      Webhook Secret
                    </label>
                    <input
                      type='password'
                      value={formData.webhookSecret}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          webhookSecret: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white'
                      placeholder='whsec_...'
                    />
                  </div>
                </>
              )}

              {/* PayPal Fields */}
              {formData.provider === 'paypal' && (
                <>
                  <div>
                    <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1'>
                      Client ID
                    </label>
                    <input
                      type='text'
                      value={formData.clientId}
                      onChange={(e) =>
                        setFormData({ ...formData, clientId: e.target.value })
                      }
                      className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1'>
                      Client Secret
                    </label>
                    <input
                      type='password'
                      value={formData.clientSecret}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          clientSecret: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white'
                    />
                  </div>

                  <div>
                    <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1'>
                      Webhook ID (Optional)
                    </label>
                    <input
                      type='text'
                      value={formData.webhookId}
                      onChange={(e) =>
                        setFormData({ ...formData, webhookId: e.target.value })
                      }
                      className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white'
                    />
                  </div>
                </>
              )}

              {/* RupantorPay Fields */}
              {formData.provider === 'rupantor' && (
                <>
                  <div>
                    <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1'>
                      API Key
                    </label>
                    <input
                      type='text'
                      value={formData.rupantorApiKey}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          rupantorApiKey: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white'
                      required
                    />
                  </div>
                </>
              )}

              <div className='flex items-center'>
                <input
                  type='checkbox'
                  id='isActive'
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className='h-4 w-4 text-primary-600 focus:ring-primary-500 border-secondary-300 rounded'
                />
                <label
                  htmlFor='isActive'
                  className='ml-2 block text-sm text-secondary-700 dark:text-secondary-300'
                >
                  Active
                </label>
              </div>

              <div className='flex space-x-3 pt-4'>
                <button
                  type='submit'
                  className='bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium transition-colors'
                >
                  {editingConfig ? 'Update' : 'Create'}
                </button>
                <button
                  type='button'
                  onClick={handleCancel}
                  className='bg-secondary-300 hover:bg-secondary-400 text-secondary-700 px-4 py-2 rounded-lg font-medium transition-colors'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Configurations List */}
        <div className='bg-white dark:bg-secondary-800 rounded-lg shadow-md overflow-hidden'>
          <div className='px-6 py-4 border-b border-secondary-200 dark:border-secondary-700'>
            <h2 className='text-lg font-semibold text-secondary-900 dark:text-white'>
              Payment Configurations
            </h2>
          </div>

          {configs.length === 0 ? (
            <div className='p-6 text-center text-secondary-500 dark:text-secondary-400'>
              No payment configurations found. Add one to get started.
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <table className='min-w-full divide-y divide-secondary-200 dark:divide-secondary-700'>
                <thead className='bg-secondary-50 dark:bg-secondary-700'>
                  <tr>
                    <th className='px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider'>
                      Provider
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider'>
                      Environment
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider'>
                      Status
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider'>
                      Created
                    </th>
                    <th className='px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className='bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700'>
                  {configs.map((config) => (
                    <tr key={config._id}>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <div className='flex items-center'>
                          <span className='text-sm font-medium text-secondary-900 dark:text-white capitalize'>
                            {config.provider}
                          </span>
                        </div>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            config.environment === 'production'
                              ? 'bg-success-100 text-success-800 dark:bg-success-800 dark:text-success-100'
                              : 'bg-warning-100 text-warning-800 dark:bg-warning-800 dark:text-warning-100'
                          }`}
                        >
                          {config.environment}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap'>
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            config.isActive
                              ? 'bg-success-100 text-success-800 dark:bg-success-800 dark:text-success-100'
                              : 'bg-error-100 text-error-800 dark:bg-error-800 dark:text-error-100'
                          }`}
                        >
                          {config.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm text-secondary-500 dark:text-secondary-400'>
                        {new Date(config.createdAt).toLocaleDateString()}
                      </td>
                      <td className='px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2'>
                        <button
                          onClick={() => handleEdit(config)}
                          className='text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300'
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(config._id)}
                          className='text-error-600 hover:text-error-900 dark:text-error-400 dark:hover:text-error-300'
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Webhook URLs Info */}
        <div className='bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4'>
          <h3 className='text-sm font-medium text-primary-800 dark:text-primary-200 mb-2'>
            Webhook URLs
          </h3>
          <div className='text-sm text-primary-700 dark:text-primary-300 space-y-1'>
            <p>
              <strong>Stripe:</strong> {window.location.origin}
              /api/webhooks/stripe
            </p>
            <p>
              <strong>PayPal:</strong> {window.location.origin}
              /api/webhooks/paypal
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
