import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { toast } from 'react-hot-toast'
import { CheckCircle, AlertCircle, Mail, RefreshCw } from 'lucide-react'

export default function VerifyEmail() {
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState(null) // null, 'success', 'error'
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const router = useRouter()

  useEffect(() => {
    if (router.isReady) {
      const { email: queryEmail, token: queryToken } = router.query

      if (queryEmail) {
        setEmail(queryEmail)
      }

      if (queryToken) {
        setToken(queryToken)
        // Auto-verify if token is present
        verifyEmail(queryToken)
      }
    }
  }, [router.isReady, router.query])

  const verifyEmail = async (verificationToken) => {
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: verificationToken }),
      })

      const data = await response.json()

      if (response.ok) {
        setVerificationStatus('success')
        toast.success('Email verified successfully! You can now sign in.')

        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login?verified=true')
        }, 3000)
      } else {
        setVerificationStatus('error')
        toast.error(data.error || 'Email verification failed')
      }
    } catch (error) {
      console.error('Email verification error:', error)
      setVerificationStatus('error')
      toast.error('An error occurred during verification')
    } finally {
      setIsLoading(false)
    }
  }

  const resendVerificationEmail = async () => {
    if (!email) {
      toast.error('Email address is required')
      return
    }

    setIsResending(true)

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success('Verification email sent! Please check your inbox.')
      } else {
        toast.error(data.error || 'Failed to resend verification email')
      }
    } catch (error) {
      console.error('Resend verification error:', error)
      toast.error('An error occurred while resending email')
    } finally {
      setIsResending(false)
    }
  }

  return (
    <>
      <Head>
        <title>Verify Your Email - BX Library</title>
        <meta
          name='description'
          content='Verify your email address to complete account setup'
        />
      </Head>

      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-md w-full space-y-8'>
          <div className='text-center'>
            {/* Loading State */}
            {isLoading && (
              <>
                <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4'></div>
                <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>
                  Verifying Email...
                </h2>
                <p className='mt-2 text-gray-600 dark:text-gray-400'>
                  Please wait while we verify your email address
                </p>
              </>
            )}

            {/* Success State */}
            {verificationStatus === 'success' && (
              <>
                <CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' />
                <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>
                  Email Verified!
                </h2>
                <p className='mt-2 text-gray-600 dark:text-gray-400'>
                  Your email has been successfully verified. You will be
                  redirected to the login page shortly.
                </p>
                <div className='mt-6'>
                  <Link
                    href='/login'
                    className='bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-block'
                  >
                    Sign In Now
                  </Link>
                </div>
              </>
            )}

            {/* Error State */}
            {verificationStatus === 'error' && (
              <>
                <AlertCircle className='w-16 h-16 text-red-500 mx-auto mb-4' />
                <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>
                  Verification Failed
                </h2>
                <p className='mt-2 text-gray-600 dark:text-gray-400'>
                  The verification link is invalid or has expired. Please
                  request a new verification email.
                </p>
              </>
            )}

            {/* Default State - Waiting for verification */}
            {!isLoading && !verificationStatus && (
              <>
                <Mail className='w-16 h-16 text-blue-500 mx-auto mb-4' />
                <h2 className='text-3xl font-bold text-gray-900 dark:text-white'>
                  Check Your Email
                </h2>
                <p className='mt-2 text-gray-600 dark:text-gray-400'>
                  We&apos;ve sent a verification link to{' '}
                  {email ? <strong>{email}</strong> : 'your email address'}.
                  Click the link in the email to verify your account.
                </p>
              </>
            )}
          </div>

          {/* Resend Email Section */}
          {!isLoading && verificationStatus !== 'success' && (
            <div className='mt-8'>
              <div className='bg-gray-100 dark:bg-gray-800 rounded-lg p-6'>
                <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-4'>
                  Didn&apos;t receive the email?
                </h3>

                <div className='space-y-4'>
                  <div className='text-sm text-gray-600 dark:text-gray-400'>
                    <p>• Check your spam/junk folder</p>
                    <p>• Make sure the email address is correct</p>
                    <p>• Wait a few minutes for the email to arrive</p>
                  </div>

                  {email && (
                    <div>
                      <p className='text-sm text-gray-600 dark:text-gray-400 mb-2'>
                        Resend verification email to: <strong>{email}</strong>
                      </p>
                      <button
                        onClick={resendVerificationEmail}
                        disabled={isResending}
                        className='w-full bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
                      >
                        {isResending ? (
                          <>
                            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <RefreshCw className='w-4 h-4' />
                            Resend Verification Email
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  {!email && (
                    <div>
                      <input
                        type='email'
                        placeholder='Enter your email address'
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className='w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white mb-2'
                      />
                      <button
                        onClick={resendVerificationEmail}
                        disabled={isResending || !email}
                        className='w-full bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
                      >
                        {isResending ? (
                          <>
                            <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white'></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <RefreshCw className='w-4 h-4' />
                            Send Verification Email
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Links */}
          <div className='text-center space-y-2'>
            <Link
              href='/login'
              className='text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium block'
            >
              Back to Sign In
            </Link>
            <Link
              href='/'
              className='text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 block'
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    </>
  )
}
