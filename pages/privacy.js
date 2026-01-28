import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import { CompactThemeToggle } from '../components/ThemeToggle'
import { LogIn } from 'lucide-react'

export default function Privacy() {
  const { user, isAuthenticated } = useAuth()

  return (
    <div className='min-h-screen bg-secondary-50 dark:bg-secondary-950'>
      {/* Navigation */}
      <nav className='sticky top-0 z-50 bg-transparent backdrop-blur-md shadow-sm border-b border-secondary-200 dark:border-secondary-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <Link
                href={isAuthenticated ? '/' : '/'}
                className='flex-shrink-0'
              >
                <h1 className='text-2xl font-bold text-primary-600 dark:text-primary-400'>
                  BX Library
                </h1>
              </Link>
            </div>
            <div className='flex items-center space-x-1 sm:space-x-4'>
              {isAuthenticated ? (
                <>
                  <CompactThemeToggle />
                  <Link
                    href='/'
                    className='text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                  >
                    Library
                  </Link>
                  <Link
                    href='/account'
                    className='text-secondary-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                  >
                    Account
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href='/'
                    className='text-secondary-700 hover:text-primary-600 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                  >
                    Home
                  </Link>
                  <Link
                    href='/login'
                    className='bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center'
                    title='Sign In'
                  >
                    <LogIn size={18} />
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
        {!isAuthenticated && (
          <div className='flex justify-end mb-6'>
            <CompactThemeToggle />
          </div>
        )}
        <div className='bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-8'>
          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold text-secondary-900 dark:text-white mb-4'>
              Privacy Policy
            </h1>
            <p className='text-secondary-600 dark:text-secondary-400'>
              Last updated: January 17, 2025
            </p>
          </div>

          <div className='prose max-w-none'>
            <h2 className='text-xl font-semibold text-secondary-900 dark:text-white mt-8 mb-4'>
              1. Introduction
            </h2>
            <p className='text-secondary-700 dark:text-secondary-300 mb-4'>
              BX Library (we, our, or us) is committed to protecting your
              privacy. This Privacy Policy explains how we collect, use,
              disclose, and safeguard your information when you use our digital
              library service.
            </p>

            <h2 className='text-xl font-semibold text-secondary-900 dark:text-white mt-8 mb-4'>
              2. Information We Collect
            </h2>

            <h3 className='text-lg font-medium text-secondary-900 dark:text-white mt-6 mb-3'>
              2.1 Personal Information
            </h3>
            <div className='text-secondary-700 dark:text-secondary-300 mb-4'>
              <p className='mb-2'>
                We collect the following personal information:
              </p>
              <ul className='list-disc pl-6'>
                <li>Name (provided during account setup)</li>
                <li>
                  Email address (used for account creation and communication)
                </li>
                <li>
                  Phone number (provided by administrator during account
                  creation)
                </li>
                <li>Password (encrypted and stored securely)</li>
              </ul>
            </div>

            <h3 className='text-lg font-medium text-secondary-900 dark:text-white mt-6 mb-3'>
              2.2 Usage Information
            </h3>
            <div className='text-secondary-700 dark:text-secondary-300 mb-4'>
              <p className='mb-2'>
                We automatically collect certain information about your use of
                our service:
              </p>
              <ul className='list-disc pl-6'>
                <li>Login and logout times</li>
                <li>Books accessed and reading duration</li>
                <li>Search queries and browsing patterns</li>
                <li>Device information and browser type</li>
                <li>IP address and general location information</li>
              </ul>
            </div>

            <h3 className='text-lg font-medium text-secondary-900 dark:text-white mt-6 mb-3'>
              2.3 Technical Information
            </h3>
            <div className='text-secondary-700 dark:text-secondary-300 mb-4'>
              <p className='mb-2'>
                We collect technical information to improve our service:
              </p>
              <ul className='list-disc pl-6'>
                <li>Session tokens and authentication data</li>
                <li>Error logs and performance metrics</li>
                <li>Feature usage statistics</li>
              </ul>
            </div>

            <h2 className='text-xl font-semibold text-secondary-900 dark:text-white mt-8 mb-4'>
              3. How We Use Your Information
            </h2>
            <div className='text-secondary-700 dark:text-secondary-300 mb-4'>
              <p className='mb-2'>
                We use your information for the following purposes:
              </p>
              <ul className='list-disc pl-6'>
                <li>Providing access to our digital library service</li>
                <li>Authenticating your identity and managing your account</li>
                <li>
                  Sending account-related communications (invitations, password
                  resets)
                </li>
                <li>Improving our service and user experience</li>
                <li>
                  Generating usage analytics and reports for administrators
                </li>
                <li>Ensuring security and preventing unauthorized access</li>
                <li>Complying with legal obligations</li>
              </ul>
            </div>

            <h2 className='text-xl font-semibold text-secondary-900 dark:text-white mt-8 mb-4'>
              4. Information Sharing and Disclosure
            </h2>

            <h3 className='text-lg font-medium text-secondary-900 dark:text-white mt-6 mb-3'>
              4.1 Internal Sharing
            </h3>
            <p className='text-secondary-700 dark:text-secondary-300 mb-4'>
              Your information may be accessed by authorized administrators for
              account management, user support, and service administration
              purposes.
            </p>

            <h3 className='text-lg font-medium text-secondary-900 dark:text-white mt-6 mb-3'>
              4.2 Third-Party Services
            </h3>
            <div className='text-secondary-700 dark:text-secondary-300 mb-4'>
              <p className='mb-2'>
                We may share information with third-party services that help us
                operate our platform:
              </p>
              <ul className='list-disc pl-6'>
                <li>Google Drive (for content storage and delivery)</li>
                <li>Email service providers (for sending notifications)</li>
                <li>Database hosting services (MongoDB Atlas)</li>
                <li>Analytics and monitoring services</li>
              </ul>
            </div>

            <h3 className='text-lg font-medium text-secondary-900 dark:text-white mt-6 mb-3'>
              4.3 Legal Requirements
            </h3>
            <p className='text-secondary-700 dark:text-secondary-300 mb-4'>
              We may disclose your information if required by law, court order,
              or government regulation, or to protect our rights, property, or
              safety.
            </p>

            <h2 className='text-xl font-semibold text-secondary-900 dark:text-white mt-8 mb-4'>
              5. Data Security
            </h2>
            <div className='text-secondary-700 dark:text-secondary-300 mb-4'>
              <p className='mb-2'>
                We implement appropriate security measures to protect your
                information:
              </p>
              <ul className='list-disc pl-6'>
                <li>Encryption of sensitive data in transit and at rest</li>
                <li>Secure authentication and session management</li>
                <li>Regular security audits and updates</li>
                <li>Access controls and administrator authentication</li>
                <li>Secure hosting infrastructure</li>
              </ul>
            </div>

            <h2 className='text-xl font-semibold text-secondary-900 dark:text-white mt-8 mb-4'>
              6. Data Retention
            </h2>
            <div className='text-secondary-700 dark:text-secondary-300 mb-4'>
              <p className='mb-2'>
                We retain your information for the following periods:
              </p>
              <ul className='list-disc pl-6'>
                <li>
                  Account information: Until account deletion or service
                  termination
                </li>
                <li>
                  Usage logs: Up to 2 years for analytics and security purposes
                </li>
                <li>Email communications: As required for legal compliance</li>
                <li>Audit trails: As required by applicable regulations</li>
              </ul>
            </div>

            <h2 className='text-xl font-semibold text-secondary-900 dark:text-white mt-8 mb-4'>
              7. Your Rights and Choices
            </h2>
            <div className='text-secondary-700 dark:text-secondary-300 mb-4'>
              <p className='mb-2'>
                Depending on your location, you may have the following rights:
              </p>
              <ul className='list-disc pl-6'>
                <li>
                  Access: Request information about the personal data we hold
                  about you
                </li>
                <li>
                  Correction: Request correction of inaccurate or incomplete
                  information
                </li>
                <li>
                  Deletion: Request deletion of your personal data (subject to
                  legal requirements)
                </li>
                <li>
                  Portability: Request a copy of your data in a structured
                  format
                </li>
                <li>
                  Objection: Object to certain processing of your personal data
                </li>
              </ul>
              <p className='mt-2'>
                To exercise these rights, please contact us using the
                information provided below.
              </p>
            </div>

            <h2 className='text-xl font-semibold text-secondary-900 dark:text-white mt-8 mb-4'>
              8. Cookies and Tracking
            </h2>
            <div className='text-secondary-700 dark:text-secondary-300 mb-4'>
              <p className='mb-2'>
                We use cookies and similar technologies to:
              </p>
              <ul className='list-disc pl-6'>
                <li>Maintain your login session</li>
                <li>Remember your preferences and settings</li>
                <li>Analyze usage patterns and improve our service</li>
                <li>Ensure security and prevent fraud</li>
              </ul>
              <p className='mt-2'>
                You can control cookie settings through your browser, but
                disabling cookies may affect service functionality.
              </p>
            </div>

            <h2 className='text-xl font-semibold text-secondary-900 dark:text-white mt-8 mb-4'>
              9. Children&apos;s Privacy
            </h2>
            <p className='text-secondary-700 dark:text-secondary-300 mb-4'>
              Our service is not intended for children under 13 years of age. We
              do not knowingly collect personal information from children under
              13. If we become aware that we have collected such information, we
              will take steps to delete it promptly.
            </p>

            <h2 className='text-xl font-semibold text-secondary-900 dark:text-white mt-8 mb-4'>
              10. International Data Transfers
            </h2>
            <p className='text-secondary-700 dark:text-secondary-300 mb-4'>
              Your information may be transferred to and processed in countries
              other than your own. We ensure that such transfers comply with
              applicable data protection laws and implement appropriate
              safeguards.
            </p>

            <h2 className='text-xl font-semibold text-secondary-900 dark:text-white mt-8 mb-4'>
              11. Changes to This Privacy Policy
            </h2>
            <p className='text-secondary-700 dark:text-secondary-300 mb-4'>
              We may update this Privacy Policy from time to time. We will
              notify you of any material changes by email or through our
              service. Your continued use of the service after such changes
              constitutes acceptance of the updated policy.
            </p>

            <h2 className='text-xl font-semibold text-secondary-900 dark:text-white mt-8 mb-4'>
              12. Contact Information
            </h2>
            <p className='text-secondary-700 dark:text-secondary-300 mb-4'>
              If you have any questions about this Privacy Policy or our data
              practices, please contact us:
            </p>
            <div className='bg-secondary-50 dark:bg-secondary-700 p-4 rounded-md'>
              <p className='text-secondary-700 dark:text-secondary-300'>
                Email: privacy@bxlibrary.com
              </p>
              <p className='text-secondary-700 dark:text-secondary-300'>
                Address: 123 Library Street, Digital City, DC 12345
              </p>
              <p className='text-secondary-700 dark:text-secondary-300'>
                Phone: +1 (555) 123-4567
              </p>
            </div>

            <div className='mt-8 pt-8 border-t border-secondary-200 dark:border-secondary-600'>
              <p className='text-sm text-secondary-500 dark:text-secondary-400 text-center'>
                This Privacy Policy is effective as of the date stated above and
                will remain in effect except with respect to any changes in its
                provisions in the future.
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className='mt-8 text-center'>
          <div className='space-x-4'>
            <Link
              href='/terms'
              className='text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 underline'
            >
              Terms of Service
            </Link>
            <Link
              href='/contact'
              className='text-primary-600 hover:text-primary-800 underline'
            >
              Contact Us
            </Link>
            <Link
              href={isAuthenticated ? '/' : '/'}
              className='text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 underline'
            >
              {isAuthenticated ? 'Back to Library' : 'Back to Home'}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
