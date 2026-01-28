import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import ProtectedRoute from '../../components/ProtectedRoute'
import { CompactThemeToggle } from '../../components/ThemeToggle'
import { toast } from 'react-hot-toast'

function AdminReports() {
  const { user } = useAuth()
  const router = useRouter()
  const [reports, setReports] = useState({
    userStats: {
      totalUsers: 0,
      activeUsers: 0,
      newUsersThisMonth: 0,
      userGrowth: [],
    },
    bookStats: {
      totalBooks: 0,
      publicBooks: 0,
      privateBooks: 0,
      booksAddedThisMonth: 0,
      popularBooks: [],
    },
    activityStats: {
      totalViews: 0,
      viewsThisMonth: 0,
      mostActiveUsers: [],
      recentActivity: [],
    },
    systemStats: {
      storageUsed: 0,
      totalCategories: 0,
      averageRating: 0,
      systemHealth: 'good',
    },
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('30') // days
  const [exportFormat, setExportFormat] = useState('csv')

  useEffect(() => {
    fetchReports()
  }, [dateRange])

  const fetchReports = async () => {
    try {
      const response = await fetch(`/api/admin/reports?range=${dateRange}`, {
        credentials: 'include',
      })
      if (response.ok) {
        const data = await response.json()
        setReports(data.reports || reports)
      } else {
        toast.error('Failed to fetch reports')
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      toast.error('Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }

  const exportReport = async (reportType) => {
    try {
      const response = await fetch(`/api/admin/export-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          reportType,
          format: exportFormat,
          dateRange,
        }),
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = `${reportType}-report-${new Date().toISOString().split('T')[0]}.${exportFormat}`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        toast.success('Report exported successfully')
      } else {
        toast.error('Failed to export report')
      }
    } catch (error) {
      console.error('Error exporting report:', error)
      toast.error('Failed to export report')
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-secondary-50 dark:bg-secondary-900'>
        <div className='flex flex-col items-center space-y-4'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600'></div>
          <p className='text-sm text-secondary-600 dark:text-secondary-400'>
            Loading reports...
          </p>
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className='min-h-screen bg-secondary-50 dark:bg-secondary-900'>
        {/* Header */}
        <div className='bg-white dark:bg-secondary-800 shadow border-b border-secondary-200 dark:border-secondary-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between items-center py-6'>
              <div>
                <Link
                  href='/admin'
                  className='text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-sm font-medium'
                >
                  ← Back to Dashboard
                </Link>
                <h1 className='text-3xl font-bold text-secondary-900 dark:text-white mt-2'>
                  Reports & Analytics
                </h1>
                <p className='mt-1 text-sm text-secondary-600 dark:text-secondary-400'>
                  View system statistics and generate reports
                </p>
              </div>
              <div className='flex items-center space-x-4'>
                <CompactThemeToggle />
                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className='px-3 py-2 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500'
                >
                  <option value='7'>Last 7 days</option>
                  <option value='30'>Last 30 days</option>
                  <option value='90'>Last 90 days</option>
                  <option value='365'>Last year</option>
                </select>
                <select
                  value={exportFormat}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className='px-3 py-2 border border-secondary-300 dark:border-secondary-600 bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500'
                >
                  <option value='csv'>CSV</option>
                  <option value='pdf'>PDF</option>
                  <option value='xlsx'>Excel</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {/* Overview Cards */}
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
            <div className='bg-white dark:bg-secondary-800 rounded-lg shadow p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-primary-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z'
                      />
                    </svg>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-secondary-500 dark:text-secondary-400 truncate'>
                      Total Users
                    </dt>
                    <dd className='text-lg font-medium text-secondary-900 dark:text-white'>
                      {reports.userStats.totalUsers}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className='bg-white dark:bg-secondary-800 rounded-lg shadow p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-success-100 rounded-full flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-success-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
                      />
                    </svg>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-secondary-500 dark:text-secondary-400 truncate'>
                      Total Books
                    </dt>
                    <dd className='text-lg font-medium text-secondary-900 dark:text-white'>
                      {reports.bookStats.totalBooks}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className='bg-white dark:bg-secondary-800 rounded-lg shadow p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-warning-100 rounded-full flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-warning-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                      />
                    </svg>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-secondary-500 dark:text-secondary-400 truncate'>
                      Total Views
                    </dt>
                    <dd className='text-lg font-medium text-secondary-900 dark:text-white'>
                      {reports.activityStats.totalViews}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>

            <div className='bg-white dark:bg-secondary-800 rounded-lg shadow p-6'>
              <div className='flex items-center'>
                <div className='flex-shrink-0'>
                  <div className='w-8 h-8 bg-secondary-100 rounded-full flex items-center justify-center'>
                    <svg
                      className='w-5 h-5 text-secondary-600'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10'
                      />
                    </svg>
                  </div>
                </div>
                <div className='ml-5 w-0 flex-1'>
                  <dl>
                    <dt className='text-sm font-medium text-secondary-500 dark:text-secondary-400 truncate'>
                      Categories
                    </dt>
                    <dd className='text-lg font-medium text-secondary-900 dark:text-white'>
                      {reports.systemStats.totalCategories}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Reports Grid */}
          <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
            {/* User Statistics */}
            <div className='bg-white dark:bg-secondary-800 rounded-lg shadow'>
              <div className='px-6 py-4 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center'>
                <h3 className='text-lg font-medium text-secondary-900 dark:text-white'>
                  User Statistics
                </h3>
                <button
                  onClick={() => exportReport('users')}
                  className='text-primary-600 hover:text-primary-700 text-sm font-medium'
                >
                  Export
                </button>
              </div>
              <div className='p-6'>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-secondary-600 dark:text-secondary-400'>
                      Active Users
                    </span>
                    <span className='text-sm font-medium text-secondary-900 dark:text-white'>
                      {reports.userStats.activeUsers}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-secondary-600 dark:text-secondary-400'>
                      New Users This Month
                    </span>
                    <span className='text-sm font-medium text-secondary-900 dark:text-white'>
                      {reports.userStats.newUsersThisMonth}
                    </span>
                  </div>
                  <div className='pt-4'>
                    <h4 className='text-sm font-medium text-secondary-900 dark:text-white mb-2'>
                      Most Active Users
                    </h4>
                    <div className='space-y-2'>
                      {reports.activityStats.mostActiveUsers
                        .slice(0, 5)
                        .map((user, index) => (
                          <div
                            key={index}
                            className='flex justify-between items-center text-sm'
                          >
                            <span className='text-secondary-600 dark:text-secondary-400'>
                              {user.name || user.email}
                            </span>
                            <span className='text-secondary-900 dark:text-white'>
                              {user.activityCount} activities
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Book Statistics */}
            <div className='bg-white dark:bg-secondary-800 rounded-lg shadow'>
              <div className='px-6 py-4 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center'>
                <h3 className='text-lg font-medium text-secondary-900 dark:text-white'>
                  Book Statistics
                </h3>
                <button
                  onClick={() => exportReport('books')}
                  className='text-primary-600 hover:text-primary-700 text-sm font-medium'
                >
                  Export
                </button>
              </div>
              <div className='p-6'>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-secondary-600 dark:text-secondary-400'>
                      Public Books
                    </span>
                    <span className='text-sm font-medium text-secondary-900 dark:text-white'>
                      {reports.bookStats.publicBooks}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-secondary-600 dark:text-secondary-400'>
                      Private Books
                    </span>
                    <span className='text-sm font-medium text-secondary-900 dark:text-white'>
                      {reports.bookStats.privateBooks}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-secondary-600 dark:text-secondary-400'>
                      Books Added This Month
                    </span>
                    <span className='text-sm font-medium text-secondary-900 dark:text-white'>
                      {reports.bookStats.booksAddedThisMonth}
                    </span>
                  </div>
                  <div className='pt-4'>
                    <h4 className='text-sm font-medium text-secondary-900 dark:text-white mb-2'>
                      Popular Books
                    </h4>
                    <div className='space-y-2'>
                      {reports.bookStats.popularBooks
                        .slice(0, 5)
                        .map((book, index) => (
                          <div
                            key={index}
                            className='flex justify-between items-center text-sm'
                          >
                            <span className='text-secondary-600 dark:text-secondary-400 truncate'>
                              {book.title}
                            </span>
                            <span className='text-secondary-900 dark:text-white'>
                              {book.views} views
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Activity Statistics */}
            <div className='bg-white dark:bg-secondary-800 rounded-lg shadow'>
              <div className='px-6 py-4 border-b border-secondary-200 dark:border-secondary-700 flex justify-between items-center'>
                <h3 className='text-lg font-medium text-secondary-900 dark:text-white'>
                  Activity Statistics
                </h3>
                <button
                  onClick={() => exportReport('activity')}
                  className='text-primary-600 hover:text-primary-700 text-sm font-medium'
                >
                  Export
                </button>
              </div>
              <div className='p-6'>
                <div className='space-y-4'>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-secondary-600 dark:text-secondary-400'>
                      Total Views
                    </span>
                    <span className='text-sm font-medium text-secondary-900 dark:text-white'>
                      {reports.activityStats.totalViews}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='text-sm text-secondary-600 dark:text-secondary-400'>
                      Views This Month
                    </span>
                    <span className='text-sm font-medium text-secondary-900 dark:text-white'>
                      {reports.activityStats.viewsThisMonth}
                    </span>
                  </div>
                  <div className='pt-4'>
                    <h4 className='text-sm font-medium text-secondary-900 dark:text-white mb-2'>
                      Recent Activity
                    </h4>
                    <div className='space-y-4'>
                      {reports.activityStats.recentActivity
                        .slice(0, 5)
                        .map((activity, index) => (
                          <div key={index} className='flex text-sm'>
                            <div className='flex-shrink-0'>
                              <div className='h-8 w-8 rounded-full bg-secondary-200 dark:bg-secondary-700 flex items-center justify-center'>
                                <span className='text-xs font-medium text-secondary-500 dark:text-secondary-400'>
                                  {activity.user
                                    ? activity.user.charAt(0).toUpperCase()
                                    : '?'}
                                </span>
                              </div>
                            </div>
                            <div className='ml-3'>
                              <p className='text-secondary-900 dark:text-white'>
                                <span className='font-medium'>
                                  {activity.user}
                                </span>{' '}
                                {activity.action}
                              </p>
                              <p className='text-secondary-500 dark:text-secondary-400 text-xs'>
                                {new Date(activity.date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Health */}
            <div className='bg-white dark:bg-secondary-800 rounded-lg shadow'>
              <div className='px-6 py-4 border-b border-secondary-200 dark:border-secondary-700'>
                <h3 className='text-lg font-medium text-secondary-900 dark:text-white'>
                  System Health
                </h3>
              </div>
              <div className='p-6'>
                <div className='space-y-4'>
                  <div>
                    <div className='flex justify-between items-center mb-1'>
                      <span className='text-sm text-secondary-600 dark:text-secondary-400'>
                        System Status
                      </span>
                      <span className='text-sm font-medium text-success-600'>
                        Operational
                      </span>
                    </div>
                    <div className='w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2'>
                      <div
                        className='bg-success-500 h-2 rounded-full'
                        style={{ width: '100%' }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className='flex justify-between items-center mb-1'>
                      <span className='text-sm text-secondary-600 dark:text-secondary-400'>
                        Storage Used
                      </span>
                      <span className='text-sm font-medium text-primary-600'>
                        {reports.systemStats.storageUsed}%
                      </span>
                    </div>
                    <div className='w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2'>
                      <div
                        className='bg-primary-500 h-2 rounded-full'
                        style={{ width: `${reports.systemStats.storageUsed}%` }}
                      ></div>
                    </div>
                  </div>
                  <div>
                    <div className='flex justify-between items-center mb-1'>
                      <span className='text-sm text-secondary-600 dark:text-secondary-400'>
                        Average Rating
                      </span>
                      <span className='text-sm font-medium text-warning-600'>
                        {reports.systemStats.averageRating}/5.0
                      </span>
                    </div>
                    <div className='w-full bg-secondary-200 dark:bg-secondary-700 rounded-full h-2'>
                      <div
                        className='bg-warning-500 h-2 rounded-full'
                        style={{
                          width: `${(reports.systemStats.averageRating / 5) * 100}%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default AdminReports
