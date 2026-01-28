import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useRouter } from 'next/router'
import { toast } from 'react-hot-toast'
import Link from 'next/link'

function AdminPricing() {
  const { user } = useAuth()
  const router = useRouter()
  const [pricingPlans, setPricingPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingPlan, setEditingPlan] = useState(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalPlans, setTotalPlans] = useState(0)
  const [plansPerPage] = useState(20)
  const [searchTerm, setSearchTerm] = useState('')
  const [searchTimeout, setSearchTimeout] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    currency: 'USD',
    billingPeriod: 'monthly',
    features: [],
    isPopular: false,
    isActive: true,
    sortOrder: 0,
    buttonText: 'Get Started',
    buttonLink: '',
  })
  const [newFeature, setNewFeature] = useState({
    name: '',
    included: true,
    limit: '',
  })

  useEffect(() => {
    fetchPricingPlans()
  }, [])

  useEffect(() => {
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    const timeout = setTimeout(() => {
      fetchPricingPlans(1, searchTerm)
    }, 500)
    setSearchTimeout(timeout)

    return () => clearTimeout(timeout)
  }, [searchTerm])

  const fetchPricingPlans = async (page = currentPage, search = searchTerm) => {
    try {
      setLoading(true)
      const response = await fetch(
        `/api/admin/pricing?page=${page}&limit=${plansPerPage}&search=${encodeURIComponent(search)}`,
        { credentials: 'include' },
      )

      if (response.ok) {
        const data = await response.json()
        setPricingPlans(data.pricingPlans)
        setCurrentPage(data.pagination.currentPage)
        setTotalPages(data.pagination.totalPages)
        setTotalPlans(data.pagination.totalCount)
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Failed to fetch pricing plans')
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error)
      toast.error('Failed to fetch pricing plans')
    } finally {
      setLoading(false)
    }
  }

  const handleCreatePlan = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/pricing', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Pricing plan created successfully')
        setShowCreateModal(false)
        resetForm()
        fetchPricingPlans(currentPage, searchTerm)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to create pricing plan')
      }
    } catch (error) {
      console.error('Error creating pricing plan:', error)
      toast.error('Failed to create pricing plan')
    }
  }

  const handleUpdatePlan = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`/api/admin/pricing/${editingPlan._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Pricing plan updated successfully')
        setEditingPlan(null)
        resetForm()
        fetchPricingPlans(currentPage, searchTerm)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to update pricing plan')
      }
    } catch (error) {
      console.error('Error updating pricing plan:', error)
      toast.error('Failed to update pricing plan')
    }
  }

  const handleDeletePlan = async (planId) => {
    if (!confirm('Are you sure you want to delete this pricing plan?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/pricing/${planId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast.success('Pricing plan deleted successfully')
        fetchPricingPlans(currentPage, searchTerm)
      } else {
        const data = await response.json()
        toast.error(data.error || 'Failed to delete pricing plan')
      }
    } catch (error) {
      console.error('Error deleting pricing plan:', error)
      toast.error('Failed to delete pricing plan')
    }
  }

  const openEditModal = (plan) => {
    setEditingPlan(plan)
    setFormData({
      name: plan.name,
      description: plan.description || '',
      price: plan.price,
      currency: plan.currency,
      billingPeriod: plan.billingPeriod,
      features: plan.features || [],
      isPopular: plan.isPopular,
      isActive: plan.isActive,
      sortOrder: plan.sortOrder,
      buttonText: plan.buttonText,
      buttonLink: plan.buttonLink || '',
    })
    setShowCreateModal(true)
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      price: 0,
      currency: 'USD',
      billingPeriod: 'monthly',
      features: [],
      isPopular: false,
      isActive: true,
      sortOrder: 0,
      buttonText: 'Get Started',
      buttonLink: '',
    })
    setNewFeature({ name: '', included: true, limit: '' })
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingPlan(null)
    resetForm()
  }

  const addFeature = () => {
    if (!newFeature.name.trim()) {
      toast.error('Feature name is required')
      return
    }

    const feature = {
      name: newFeature.name.trim(),
      included: newFeature.included,
      limit: newFeature.limit.trim() || undefined,
    }

    setFormData({
      ...formData,
      features: [...formData.features, feature],
    })

    setNewFeature({ name: '', included: true, limit: '' })
  }

  const removeFeature = (index) => {
    const updatedFeatures = formData.features.filter((_, i) => i !== index)
    setFormData({ ...formData, features: updatedFeatures })
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900'>
        <div className='flex flex-col items-center space-y-4'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
          <p className='text-sm text-secondary-600 dark:text-secondary-400'>
            Loading pricing plans...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-secondary-50 dark:bg-secondary-950'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Header */}
        <div className='mb-8'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-3xl font-bold text-secondary-900 dark:text-white'>
                Pricing Management
              </h1>
              <p className='mt-2 text-sm text-secondary-600 dark:text-secondary-400'>
                Manage pricing plans and subscription options
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className='bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium'
            >
              Add New Plan
            </button>
          </div>
        </div>

        {/* Search and Stats */}
        <div className='mb-6'>
          <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
            <div className='flex-1 max-w-md'>
              <input
                type='text'
                placeholder='Search pricing plans...'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white'
              />
            </div>
            <div className='text-sm text-secondary-600 dark:text-secondary-400'>
              Total: {totalPlans} plans
            </div>
          </div>
        </div>

        {/* Pricing Plans Table */}
        <div className='bg-white dark:bg-secondary-800 shadow overflow-hidden sm:rounded-md'>
          <div className='overflow-x-auto'>
            <table className='min-w-full divide-y divide-secondary-200 dark:divide-secondary-700'>
              <thead className='bg-secondary-50 dark:bg-secondary-700'>
                <tr>
                  <th className='px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider'>
                    Plan
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider'>
                    Price
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider'>
                    Billing
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider'>
                    Features
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider'>
                    Status
                  </th>
                  <th className='px-6 py-3 text-left text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider'>
                    Order
                  </th>
                  <th className='px-6 py-3 text-right text-xs font-medium text-secondary-500 dark:text-secondary-300 uppercase tracking-wider'>
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className='bg-white dark:bg-secondary-800 divide-y divide-secondary-200 dark:divide-secondary-700'>
                {pricingPlans.map((plan) => (
                  <tr
                    key={plan._id}
                    className='hover:bg-secondary-50 dark:hover:bg-secondary-700'
                  >
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <div>
                        <div className='text-sm font-medium text-secondary-900 dark:text-white'>
                          {plan.name}
                          {plan.isPopular && (
                            <span className='ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-warning-100 text-warning-800 dark:bg-warning-800 dark:text-warning-100'>
                              Popular
                            </span>
                          )}
                        </div>
                        {plan.description && (
                          <div className='text-sm text-secondary-500 dark:text-secondary-400 truncate max-w-xs'>
                            {plan.description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-300'>
                      {plan.formattedPrice}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-300 capitalize'>
                      {plan.billingPeriod}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-300'>
                      {plan.features?.length || 0} features
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap'>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          plan.isActive
                            ? 'bg-success-100 text-success-800 dark:bg-success-800 dark:text-success-100'
                            : 'bg-error-100 text-error-800 dark:bg-error-900 dark:text-error-300'
                        }`}
                      >
                        {plan.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-sm text-secondary-900 dark:text-secondary-300'>
                      {plan.sortOrder}
                    </td>
                    <td className='px-6 py-4 whitespace-nowrap text-right text-sm font-medium'>
                      <div className='flex justify-end space-x-2'>
                        <button
                          onClick={() => openEditModal(plan)}
                          className='text-primary-600 hover:text-primary-900 dark:hover:text-primary-400 p-1'
                          title='Edit'
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z'
                            />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDeletePlan(plan._id)}
                          className='text-error-600 hover:text-error-900 dark:text-error-400 dark:hover:text-error-300 p-1'
                          title='Delete'
                        >
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16'
                            />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className='bg-white dark:bg-secondary-800 px-4 py-3 flex items-center justify-between border-t border-secondary-200 dark:border-secondary-700 sm:px-6'>
              <div className='flex-1 flex justify-between sm:hidden'>
                <button
                  onClick={() => fetchPricingPlans(currentPage - 1)}
                  disabled={currentPage === 1}
                  className='relative inline-flex items-center px-4 py-2 border border-secondary-300 dark:border-secondary-600 text-sm font-medium rounded-md text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchPricingPlans(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className='ml-3 relative inline-flex items-center px-4 py-2 border border-secondary-300 dark:border-secondary-600 text-sm font-medium rounded-md text-secondary-700 dark:text-secondary-300 bg-white dark:bg-secondary-700 hover:bg-secondary-50 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Next
                </button>
              </div>
              <div className='hidden sm:flex-1 sm:flex sm:items-center sm:justify-between'>
                <div>
                  <p className='text-sm text-secondary-700 dark:text-secondary-300'>
                    Showing{' '}
                    <span className='font-medium'>
                      {(currentPage - 1) * plansPerPage + 1}
                    </span>{' '}
                    to{' '}
                    <span className='font-medium'>
                      {Math.min(currentPage * plansPerPage, totalPlans)}
                    </span>{' '}
                    of <span className='font-medium'>{totalPlans}</span> results
                  </p>
                </div>
                <div>
                  <nav
                    className='relative z-0 inline-flex rounded-md shadow-sm -space-x-px'
                    aria-label='Pagination'
                  >
                    <button
                      onClick={() => fetchPricingPlans(currentPage - 1)}
                      disabled={currentPage === 1}
                      className='relative inline-flex items-center px-2 py-2 rounded-l-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-sm font-medium text-secondary-500 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Previous
                    </button>
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      const page = i + Math.max(1, currentPage - 2)
                      if (page > totalPages) return null
                      return (
                        <button
                          key={page}
                          onClick={() => fetchPricingPlans(page)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            page === currentPage
                              ? 'z-10 bg-primary-50 border-primary-500 text-primary-600 dark:bg-primary-900/20 dark:border-primary-500 dark:text-primary-400'
                              : 'bg-white dark:bg-secondary-700 border-secondary-300 dark:border-secondary-600 text-secondary-500 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-600'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => fetchPricingPlans(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className='relative inline-flex items-center px-2 py-2 rounded-r-md border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-sm font-medium text-secondary-500 dark:text-secondary-300 hover:bg-secondary-50 dark:hover:bg-secondary-600 disabled:opacity-50 disabled:cursor-not-allowed'
                    >
                      Next
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Create/Edit Modal */}
        {showCreateModal && (
          <div className='fixed inset-0 bg-secondary-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
            <div className='relative top-20 mx-auto p-5 border border-secondary-200 dark:border-secondary-700 w-11/12 max-w-4xl shadow-lg rounded-md bg-white dark:bg-secondary-800'>
              <div className='mt-3'>
                <h3 className='text-lg font-medium text-secondary-900 dark:text-white mb-4'>
                  {editingPlan
                    ? 'Edit Pricing Plan'
                    : 'Create New Pricing Plan'}
                </h3>
                <form
                  onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan}
                >
                  <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                    {/* Plan Name */}
                    <div className='mb-4'>
                      <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'>
                        Plan Name *
                      </label>
                      <input
                        type='text'
                        required
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white'
                        placeholder='e.g., Basic Plan'
                      />
                    </div>

                    {/* Price */}
                    <div className='mb-4'>
                      <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'>
                        Price *
                      </label>
                      <input
                        type='number'
                        required
                        min='0'
                        step='0.01'
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: parseFloat(e.target.value) || 0,
                          })
                        }
                        className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white'
                        placeholder='0.00'
                      />
                    </div>

                    {/* Currency */}
                    <div className='mb-4'>
                      <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'>
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) =>
                          setFormData({ ...formData, currency: e.target.value })
                        }
                        className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white'
                      >
                        <option value='USD'>USD ($)</option>
                        <option value='EUR'>EUR (€)</option>
                        <option value='GBP'>GBP (£)</option>
                        <option value='INR'>INR (₹)</option>
                      </select>
                    </div>

                    {/* Billing Period */}
                    <div className='mb-4'>
                      <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'>
                        Billing Period
                      </label>
                      <select
                        value={formData.billingPeriod}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            billingPeriod: e.target.value,
                          })
                        }
                        className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white'
                      >
                        <option value='monthly'>Monthly</option>
                        <option value='yearly'>Yearly</option>
                        <option value='lifetime'>Lifetime</option>
                      </select>
                    </div>

                    {/* Sort Order */}
                    <div className='mb-4'>
                      <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'>
                        Sort Order
                      </label>
                      <input
                        type='number'
                        value={formData.sortOrder}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            sortOrder: parseInt(e.target.value) || 0,
                          })
                        }
                        className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white'
                        placeholder='0'
                      />
                    </div>

                    {/* Button Text */}
                    <div className='mb-4'>
                      <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'>
                        Button Text
                      </label>
                      <input
                        type='text'
                        value={formData.buttonText}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            buttonText: e.target.value,
                          })
                        }
                        className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white'
                        placeholder='Get Started'
                      />
                    </div>
                  </div>

                  {/* Description */}
                  <div className='mb-4'>
                    <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'>
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={3}
                      className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white'
                      placeholder='Brief description of the plan...'
                    />
                  </div>

                  {/* Button Link */}
                  <div className='mb-4'>
                    <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'>
                      Button Link (Optional)
                    </label>
                    <input
                      type='url'
                      value={formData.buttonLink}
                      onChange={(e) =>
                        setFormData({ ...formData, buttonLink: e.target.value })
                      }
                      className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white'
                      placeholder='https://example.com/signup'
                    />
                  </div>

                  {/* Features */}
                  <div className='mb-4'>
                    <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'>
                      Features
                    </label>

                    {/* Add Feature */}
                    <div className='flex gap-2 mb-3'>
                      <input
                        type='text'
                        value={newFeature.name}
                        onChange={(e) =>
                          setNewFeature({ ...newFeature, name: e.target.value })
                        }
                        className='flex-1 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white'
                        placeholder='Feature name'
                      />
                      <input
                        type='text'
                        value={newFeature.limit}
                        onChange={(e) =>
                          setNewFeature({
                            ...newFeature,
                            limit: e.target.value,
                          })
                        }
                        className='w-24 px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 dark:bg-secondary-700 dark:text-white'
                        placeholder='Limit'
                      />
                      <label className='flex items-center'>
                        <input
                          type='checkbox'
                          checked={newFeature.included}
                          onChange={(e) =>
                            setNewFeature({
                              ...newFeature,
                              included: e.target.checked,
                            })
                          }
                          className='rounded border-secondary-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50'
                        />
                        <span className='ml-2 text-sm text-secondary-700 dark:text-secondary-300'>
                          Included
                        </span>
                      </label>
                      <button
                        type='button'
                        onClick={addFeature}
                        className='px-3 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700'
                      >
                        Add
                      </button>
                    </div>

                    {/* Features List */}
                    <div className='space-y-2 max-h-40 overflow-y-auto'>
                      {formData.features.map((feature, index) => (
                        <div
                          key={index}
                          className='flex items-center justify-between p-2 bg-secondary-50 dark:bg-secondary-700 rounded'
                        >
                          <div className='flex-1'>
                            <span className='text-sm font-medium text-secondary-900 dark:text-white'>
                              {feature.name}
                            </span>
                            {feature.limit && (
                              <span className='ml-2 text-xs text-secondary-500 dark:text-secondary-400'>
                                ({feature.limit})
                              </span>
                            )}
                            <span
                              className={`ml-2 text-xs ${
                                feature.included
                                  ? 'text-success-600'
                                  : 'text-error-600'
                              }`}
                            >
                              {feature.included ? '✓' : '✗'}
                            </span>
                          </div>
                          <button
                            type='button'
                            onClick={() => removeFeature(index)}
                            className='text-error-600 hover:text-error-800'
                          >
                            <svg
                              className='w-4 h-4'
                              fill='none'
                              stroke='currentColor'
                              viewBox='0 0 24 24'
                            >
                              <path
                                strokeLinecap='round'
                                strokeLinejoin='round'
                                strokeWidth={2}
                                d='M6 18L18 6M6 6l12 12'
                              />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Checkboxes */}
                  <div className='mb-6 space-y-3'>
                    <label className='flex items-center'>
                      <input
                        type='checkbox'
                        checked={formData.isPopular}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isPopular: e.target.checked,
                          })
                        }
                        className='rounded border-secondary-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50'
                      />
                      <span className='ml-2 text-sm text-secondary-700 dark:text-secondary-300'>
                        Mark as popular plan
                      </span>
                    </label>
                    <label className='flex items-center'>
                      <input
                        type='checkbox'
                        checked={formData.isActive}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            isActive: e.target.checked,
                          })
                        }
                        className='rounded border-secondary-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50'
                      />
                      <span className='ml-2 text-sm text-secondary-700 dark:text-secondary-300'>
                        Active plan
                      </span>
                    </label>
                  </div>

                  <div className='flex justify-end space-x-3'>
                    <button
                      type='button'
                      onClick={closeModal}
                      className='px-4 py-2 text-sm font-medium text-secondary-700 dark:text-secondary-300 bg-secondary-100 dark:bg-secondary-600 hover:bg-secondary-200 dark:hover:bg-secondary-500 rounded-md'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      className='px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md'
                    >
                      {editingPlan ? 'Update Plan' : 'Create Plan'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPricing
