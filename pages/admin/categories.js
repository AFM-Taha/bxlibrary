import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import ProtectedRoute from '../../components/ProtectedRoute'
import { CompactThemeToggle } from '../../components/ThemeToggle'
import { toast } from 'react-hot-toast'

function AdminCategories() {
  const { user } = useAuth()
  const router = useRouter()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [showDeleted, setShowDeleted] = useState(false)
  const [showBulkImportModal, setShowBulkImportModal] = useState(false)
  const [bulkImportFile, setBulkImportFile] = useState(null)
  const [bulkImportLoading, setBulkImportLoading] = useState(false)
  const [bulkImportResults, setBulkImportResults] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
  })

  useEffect(() => {
    fetchCategories()
  }, [showDeleted])

  const fetchCategories = async () => {
    try {
      const includeDeleted = showDeleted ? 'only' : 'false'
      const response = await fetch(`/api/admin/categories?t=${Date.now()}&includeDeleted=${includeDeleted}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      } else {
        toast.error('Failed to fetch categories')
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to fetch categories')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCategory = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch('/api/admin/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        toast.success('Category created successfully')
        setShowCreateModal(false)
        resetForm()
        fetchCategories()
      } else {
        const data = await response.json()
        toast.error(data.error || data.message || 'Failed to create category')
      }
    } catch (error) {
      console.error('Error creating category:', error)
      toast.error('Failed to create category')
    }
  }

  const handleUpdateCategory = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(
        `/api/admin/categories/${editingCategory._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(formData),
        }
      )

      if (response.ok) {
        toast.success('Category updated successfully')
        setEditingCategory(null)
        resetForm()
        fetchCategories()
      } else {
        const data = await response.json()
        toast.error(data.error || data.message || 'Failed to update category')
      }
    } catch (error) {
      console.error('Error updating category:', error)
      toast.error('Failed to update category')
    }
  }

  const handleDeleteCategory = async (categoryId) => {
    if (
      !confirm(
        'Are you sure you want to delete this category? This action can be undone by restoring it.'
      )
    )
      return

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        credentials: 'include',
      })

      if (response.ok) {
        toast.success('Category deleted successfully')
        // Force refresh the categories list
        setCategories([])
        setTimeout(() => fetchCategories(), 100)
      } else {
        const data = await response.json()
        toast.error(data.error || data.message || 'Failed to delete category')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }

  const handleRestoreCategory = async (categoryId) => {
    if (
      !confirm(
        'Are you sure you want to restore this category?'
      )
    )
      return

    try {
      const response = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'restore' }),
      })

      if (response.ok) {
        toast.success('Category restored successfully')
        // Force refresh the categories list
        setCategories([])
        setTimeout(() => fetchCategories(), 100)
      } else {
        const data = await response.json()
        toast.error(data.error || data.message || 'Failed to restore category')
      }
    } catch (error) {
      console.error('Error restoring category:', error)
      toast.error('Failed to restore category')
    }
  }

  const handleBulkImport = async () => {
    if (!bulkImportFile) {
      toast.error('Please select a JSON file')
      return
    }

    setBulkImportLoading(true)
    setBulkImportResults(null)

    try {
      const formData = new FormData()
      formData.append('file', bulkImportFile)

      const response = await fetch('/api/admin/categories/bulk-import', {
        method: 'POST',
        credentials: 'include',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setBulkImportResults(data.results)
        toast.success(`Bulk import completed: ${data.results.created} created, ${data.results.updated} updated`)
        // Refresh categories list
        fetchCategories()
      } else {
        toast.error(data.error || 'Failed to import categories')
      }
    } catch (error) {
      console.error('Error importing categories:', error)
      toast.error('Failed to import categories')
    } finally {
      setBulkImportLoading(false)
    }
  }



  const resetBulkImportModal = () => {
    setShowBulkImportModal(false)
    setBulkImportFile(null)
    setBulkImportResults(null)
    setBulkImportLoading(false)
  }

  const openEditModal = (category) => {
    setEditingCategory(category)
    setFormData({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6',
    })
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      color: '#3B82F6',
    })
  }

  const closeModal = () => {
    setShowCreateModal(false)
    setEditingCategory(null)
    resetForm()
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900'>
        <div className='flex flex-col items-center space-y-4'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
          <p className='text-sm text-gray-600 dark:text-gray-400'>
            Loading categories...
          </p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
        {/* Header */}
        <div className='bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between items-center py-6'>
              <div>
                <Link
                  href='/admin'
                  className='text-primary-600 hover:text-primary-700 text-sm font-medium'
                >
                  ← Back to Dashboard
                </Link>
                <h1 className='text-3xl font-bold text-gray-900 dark:text-white mt-2'>
                  {showDeleted ? 'Deleted Categories' : 'Category Management'}
                </h1>
                <p className='mt-1 text-sm text-gray-600 dark:text-gray-400'>
                  {showDeleted 
                    ? 'View and restore deleted categories' 
                    : 'Manage book categories and organize your library'
                  }
                </p>
              </div>
              <div className='flex items-center space-x-4'>
                <CompactThemeToggle />
                <button
                  onClick={() => setShowDeleted(!showDeleted)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    showDeleted
                      ? 'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-300 dark:hover:bg-red-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  {showDeleted ? 'Show Active' : 'Show Deleted'}
                </button>
                {!showDeleted && (
                  <>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className='bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium'
                    >
                      Add Category
                    </button>
                    <button
                      onClick={() => setShowBulkImportModal(true)}
                      className='bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium'
                    >
                      Bulk Import
                    </button>
                  </>
                )}

              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
            {categories.map((category) => (
              <div
                key={category._id}
                className={`rounded-lg shadow-md overflow-hidden ${
                  showDeleted 
                    ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800' 
                    : 'bg-white dark:bg-gray-800'
                }`}
              >
                <div
                  className='h-4'
                  style={{ backgroundColor: category.color || '#3B82F6' }}
                ></div>
                {showDeleted && (
                  <div className='bg-red-100 dark:bg-red-900/40 px-4 py-2 border-b border-red-200 dark:border-red-800'>
                    <span className='text-red-700 dark:text-red-300 text-xs font-medium'>
                      🗑️ DELETED - {category.deletedAt ? new Date(category.deletedAt).toLocaleDateString() : 'Unknown date'}
                    </span>
                  </div>
                )}
                <div className='p-6'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white'>
                      {category.name}
                    </h3>
                    <div className='flex space-x-2'>
                      {showDeleted ? (
                        <button
                          onClick={() => handleRestoreCategory(category._id)}
                          className='text-green-600 hover:text-green-700 text-sm font-medium'
                        >
                          Restore
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => openEditModal(category)}
                            className='text-primary-600 hover:text-primary-700 text-sm'
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(category._id)}
                            className='text-red-600 hover:text-red-700 text-sm'
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {category.description && (
                    <p className='text-gray-600 text-sm mb-4'>
                      {category.description}
                    </p>
                  )}

                  <div className='flex items-center justify-between text-sm text-gray-500'>
                    <span>{category.bookCount || 0} books</span>
                    <span>
                      Created{' '}
                      {new Date(category.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <div className='col-span-full'>
                <div className='text-center py-12'>
                  <svg
                    className='mx-auto h-12 w-12 text-gray-400'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                    />
                  </svg>
                  <h3 className='mt-2 text-sm font-medium text-gray-900'>
                    No categories
                  </h3>
                  <p className='mt-1 text-sm text-gray-500'>
                    Get started by creating a new category.
                  </p>
                  <div className='mt-6'>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className='inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700'
                    >
                      Add Category
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || editingCategory) && (
          <div className='fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50'>
            <div className='relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'>
              <div className='mt-3'>
                <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
                  {editingCategory ? 'Edit Category' : 'Add New Category'}
                </h3>
                <form
                  onSubmit={
                    editingCategory
                      ? handleUpdateCategory
                      : handleCreateCategory
                  }
                >
                  <div className='mb-4'>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Name *
                    </label>
                    <input
                      type='text'
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500'
                      required
                      placeholder='e.g., Fiction, Science, History'
                    />
                  </div>

                  <div className='mb-4'>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
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
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500'
                      placeholder='Brief description of this category'
                    />
                  </div>

                  <div className='mb-6'>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      Color
                    </label>
                    <div className='flex items-center space-x-3'>
                      <input
                        type='color'
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className='h-10 w-16 border border-gray-300 dark:border-gray-600 rounded cursor-pointer bg-white dark:bg-gray-700'
                      />
                      <input
                        type='text'
                        value={formData.color}
                        onChange={(e) =>
                          setFormData({ ...formData, color: e.target.value })
                        }
                        className='flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500'
                        placeholder='#3B82F6'
                      />
                    </div>
                  </div>

                  <div className='flex justify-end space-x-3'>
                    <button
                      type='button'
                      onClick={closeModal}
                      className='px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md'
                    >
                      Cancel
                    </button>
                    <button
                      type='submit'
                      className='px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md'
                    >
                      {editingCategory ? 'Update Category' : 'Add Category'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Import Modal */}
        {showBulkImportModal && (
          <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50'>
            <div className='bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto'>
              <div className='p-6'>
                <div className='flex justify-between items-center mb-4'>
                  <h2 className='text-xl font-semibold text-gray-900 dark:text-white'>
                    Bulk Import Categories
                  </h2>
                  <button
                    onClick={resetBulkImportModal}
                    className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                  >
                    ✕
                  </button>
                </div>

                <div className='mb-4'>
                  <p className='text-sm text-gray-600 dark:text-gray-400 mb-3'>
                    Upload a JSON file with category data. Categories will be matched by name (case-insensitive). 
                    Existing categories will be updated, new ones will be created.
                  </p>
                  
                  <div className='mb-3'>
                    <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'>
                      JSON File
                    </label>
                    <input
                      type='file'
                      accept='.json'
                      onChange={(e) => setBulkImportFile(e.target.files[0])}
                      className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500'
                    />
                  </div>

                  <div className='bg-gray-50 dark:bg-gray-700 p-3 rounded-md'>
                    <p className='text-xs text-gray-600 dark:text-gray-400 font-medium mb-2'>Expected JSON format:</p>
                    <pre className='text-xs text-gray-600 dark:text-gray-400 overflow-x-auto'>
{`[
  {
    "name": "Fiction",
    "description": "Fictional books",
    "color": "#FF5733"
  },
  {
    "name": "Science",
    "description": "Scientific literature",
    "color": "#33FF57"
  }
]`}
                    </pre>
                  </div>
                </div>

                {bulkImportResults && (
                  <div className='mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md'>
                    <h3 className='text-sm font-medium text-blue-800 dark:text-blue-300 mb-2'>Import Results:</h3>
                    <div className='text-sm text-blue-700 dark:text-blue-400'>
                      <p>Total processed: {bulkImportResults.total}</p>
                      <p>Created: {bulkImportResults.created}</p>
                      <p>Updated: {bulkImportResults.updated}</p>
                      {bulkImportResults.errors.length > 0 && (
                        <div className='mt-2'>
                          <p className='text-red-600 dark:text-red-400'>Errors: {bulkImportResults.errors.length}</p>
                          <div className='max-h-20 overflow-y-auto mt-1'>
                            {bulkImportResults.errors.map((error, index) => (
                              <p key={index} className='text-xs text-red-600 dark:text-red-400'>
                                Row {error.index + 1}: {error.error}
                              </p>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className='flex justify-end space-x-3'>
                  <button
                    onClick={resetBulkImportModal}
                    className='px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md text-sm font-medium'
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleBulkImport}
                    disabled={!bulkImportFile || bulkImportLoading}
                    className='px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-md text-sm font-medium'
                  >
                    {bulkImportLoading ? 'Importing...' : 'Import Categories'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

export default AdminCategories
