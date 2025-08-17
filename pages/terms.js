import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { CompactThemeToggle } from '../components/ThemeToggle'

export default function Terms() {
  const { user, isAuthenticated } = useAuth()

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Navigation */}
      <nav className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <Link
                href={isAuthenticated ? '/library' : '/'}
                className='flex-shrink-0'
              >
                <h1 className='text-2xl font-bold text-blue-600 dark:text-blue-400'>BX Library</h1>
              </Link>
            </div>
            <div className='flex items-center space-x-4'>
              {isAuthenticated ? (
                <>
                  <span className='text-gray-700 dark:text-gray-300'>Welcome, {user?.name}</span>
                  <CompactThemeToggle />
                  <Link
                    href='/library'
                    className='text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                  >
                    Library
                  </Link>
                  <Link
                    href='/account'
                    className='text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                  >
                    Account
                  </Link>
                </>
              ) : (
                <>
                  <CompactThemeToggle />
                  <Link
                    href='/'
                    className='text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                  >
                    Home
                  </Link>
                  <Link
                    href='/login'
                    className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors'
                  >
                    Sign In
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-4'>
              Terms of Service
            </h1>
            <p className='text-gray-600 dark:text-gray-400'>Last updated: January 17, 2025</p>
          </div>

          <div className='prose max-w-none'>
            <h2 className='text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4'>
              1. Acceptance of Terms
            </h2>
            <p className='text-gray-700 dark:text-gray-300 mb-4'>
              By accessing and using BX Library (the Service), you accept and
              agree to be bound by the terms and provision of this agreement. If
              you do not agree to abide by the above, please do not use this
              service.
            </p>

            <h2 className='text-xl font-semibold text-gray-900 dark:text-white mt-8 mb-4'>
              2. Description of Service
            </h2>
            <p className='text-gray-700 dark:text-gray-300 mb-4'>
              BX Library is a digital library platform that provides authorized
              users with access to a collection of PDF documents and books. The
              service is provided on a subscription basis with manual user
              provisioning by administrators.
            </p>

            <h2 className='text-xl font-semibold text-gray-900 mt-8 mb-4'>
              3. User Accounts and Access
            </h2>
            <div className='text-gray-700 dark:text-gray-300 mb-4'>
              <p className='mb-2'>
                3.1. Account Creation: User accounts are created by
                administrators only. Users will receive an invitation email to
                set up their account.
              </p>
              <p className='mb-2'>
                3.2. Account Security: You are responsible for maintaining the
                confidentiality of your account credentials.
              </p>
              <p className='mb-2'>
                3.3. Account Status: Access to the library is contingent on
                having an active account status as determined by administrators.
              </p>
              <p className='mb-2'>
                3.4. Account Expiry: Accounts may have expiration dates set by
                administrators. Access will be revoked upon expiry.
              </p>
            </div>

            <h2 className='text-xl font-semibold text-gray-900 mt-8 mb-4'>
              4. Acceptable Use
            </h2>
            <div className='text-gray-700 dark:text-gray-300 mb-4'>
              <p className='mb-2'>
                You agree to use the service only for lawful purposes and in
                accordance with these Terms. You agree NOT to:
              </p>
              <ul className='list-disc pl-6 mt-2'>
                <li>
                  Attempt to download, copy, or redistribute content without
                  authorization
                </li>
                <li>Share your account credentials with others</li>
                <li>Use automated tools to access or scrape the service</li>
                <li>
                  Attempt to circumvent security measures or access restrictions
                </li>
                <li>
                  Use the service for any commercial purposes without permission
                </li>
                <li>Violate any applicable laws or regulations</li>
              </ul>
            </div>

            <h2 className='text-xl font-semibold text-gray-900 mt-8 mb-4'>
              5. Intellectual Property
            </h2>
            <p className='text-gray-700 mb-4'>
              All content available through the service, including but not
              limited to books, documents, images, and text, is protected by
              copyright and other intellectual property laws. Users are granted
              a limited, non-exclusive, non-transferable license to access and
              view content for personal, non-commercial use only.
            </p>

            <h2 className='text-xl font-semibold text-gray-900 mt-8 mb-4'>
              6. Privacy and Data Protection
            </h2>
            <p className='text-gray-700 mb-4'>
              Your privacy is important to us. Please review our Privacy Policy,
              which also governs your use of the service, to understand our
              practices regarding the collection and use of your personal
              information.
            </p>

            <h2 className='text-xl font-semibold text-gray-900 mt-8 mb-4'>
              7. Service Availability
            </h2>
            <div className='text-gray-700 mb-4'>
              <p className='mb-2'>
                7.1. We strive to maintain service availability but do not
                guarantee uninterrupted access.
              </p>
              <p className='mb-2'>
                7.2. We reserve the right to modify, suspend, or discontinue the
                service at any time.
              </p>
              <p className='mb-2'>
                7.3. Scheduled maintenance may temporarily interrupt service
                availability.
              </p>
            </div>

            <h2 className='text-xl font-semibold text-gray-900 mt-8 mb-4'>
              8. Account Termination
            </h2>
            <div className='text-gray-700 mb-4'>
              <p className='mb-2'>
                8.1. We reserve the right to terminate or suspend accounts that
                violate these terms.
              </p>
              <p className='mb-2'>
                8.2. Accounts may be deactivated by administrators at any time.
              </p>
              <p className='mb-2'>
                8.3. Upon termination, your right to access the service ceases
                immediately.
              </p>
            </div>

            <h2 className='text-xl font-semibold text-gray-900 mt-8 mb-4'>
              9. Disclaimers
            </h2>
            <div className='text-gray-700 mb-4'>
              <p className='mb-2'>
                9.1. The service is provided as is without warranties of any
                kind.
              </p>
              <p className='mb-2'>
                9.2. We do not warrant that the service will be error-free or
                uninterrupted.
              </p>
              <p className='mb-2'>
                9.3. We are not responsible for the accuracy or completeness of
                content provided through the service.
              </p>
            </div>

            <h2 className='text-xl font-semibold text-gray-900 mt-8 mb-4'>
              10. Limitation of Liability
            </h2>
            <p className='text-gray-700 mb-4'>
              In no event shall BX Library be liable for any indirect,
              incidental, special, consequential, or punitive damages, including
              without limitation, loss of profits, data, use, goodwill, or other
              intangible losses, resulting from your use of the service.
            </p>

            <h2 className='text-xl font-semibold text-gray-900 mt-8 mb-4'>
              11. Governing Law
            </h2>
            <p className='text-gray-700 mb-4'>
              These Terms shall be interpreted and governed by the laws of the
              jurisdiction in which BX Library operates, without regard to its
              conflict of law provisions.
            </p>

            <h2 className='text-xl font-semibold text-gray-900 mt-8 mb-4'>
              12. Changes to Terms
            </h2>
            <p className='text-gray-700 mb-4'>
              We reserve the right to modify these terms at any time. Users will
              be notified of significant changes via email or through the
              service. Continued use of the service after changes constitutes
              acceptance of the new terms.
            </p>

            <h2 className='text-xl font-semibold text-gray-900 mt-8 mb-4'>
              13. Contact Information
            </h2>
            <p className='text-gray-700 mb-4'>
              If you have any questions about these Terms of Service, please
              contact us at:
            </p>
            <div className='bg-gray-50 dark:bg-gray-700 p-4 rounded-md'>
              <p className='text-gray-700 dark:text-gray-300'>Email: legal@bxlibrary.com</p>
              <p className='text-gray-700 dark:text-gray-300'>
                Address: 123 Library Street, Digital City, DC 12345
              </p>
            </div>

            <div className='mt-8 pt-8 border-t border-gray-200 dark:border-gray-600'>
              <p className='text-sm text-gray-500 dark:text-gray-400 text-center'>
                By using BX Library, you acknowledge that you have read,
                understood, and agree to be bound by these Terms of Service.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className='mt-8 text-center'>
          <div className='space-x-4'>
            <Link
              href='/privacy'
              className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline'
            >
              Privacy Policy
            </Link>
            <Link
              href='/contact'
              className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline'
            >
              Contact Us
            </Link>
            <Link
              href={isAuthenticated ? '/library' : '/'}
              className='text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 underline'
            >
              {isAuthenticated ? 'Back to Library' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
