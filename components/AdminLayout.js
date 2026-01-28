import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { CompactThemeToggle } from './ThemeToggle'
import ProtectedRoute from './ProtectedRoute'

export default function AdminLayout({
  children,
  title,
  subtitle,
  backLink = '/admin',
}) {
  const { user } = useAuth()

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className='min-h-screen bg-secondary-50 dark:bg-secondary-950'>
        {/* Header */}
        <div className='bg-white dark:bg-secondary-900 shadow border-b border-secondary-200 dark:border-secondary-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between items-center py-6'>
              <div>
                <Link
                  href={backLink}
                  className='text-primary-600 hover:text-primary-700 text-sm font-medium'
                >
                  ← Back to Dashboard
                </Link>
                <h1 className='text-3xl font-bold text-secondary-900 dark:text-white mt-2'>
                  {title}
                </h1>
                {subtitle && (
                  <p className='mt-1 text-sm text-secondary-600 dark:text-secondary-400'>
                    {subtitle}
                  </p>
                )}
              </div>
              <div className='flex items-center space-x-4'>
                <CompactThemeToggle />
                <Link
                  href='/'
                  className='text-secondary-600 hover:text-secondary-900 dark:text-secondary-300 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors'
                >
                  View Library
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
          {children}
        </div>
      </div>
    </ProtectedRoute>
  )
}
