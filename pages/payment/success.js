import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { CheckCircle, ArrowRight, Home, User, BookOpen, UserPlus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

export default function PaymentSuccess() {
  const router = useRouter()
  const { user } = useAuth()
  const [paymentData, setPaymentData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [signupToken, setSignupToken] = useState(null)
  const [subscription, setSubscription] = useState(null)
  const { session_id, subscription_id, provider } = router.query

  useEffect(() => {
    const verifyPayment = async () => {
      const { session_id, subscription_id, transaction_id, order_id } = router.query
      
      // Determine the identifier to use
      const paymentId = session_id || subscription_id || transaction_id || order_id
      
      if (!paymentId) {
        setError('No payment session found')
        setIsLoading(false)
        return
      }

      try {
        const response = await fetch('/api/payment/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: session_id || order_id, // Map order_id to sessionId for consistency
            subscriptionId: subscription_id,
            transactionId: transaction_id, // Pass explicit transaction_id if available
            orderId: order_id
          }),
        })

        const data = await response.json()

        if (response.ok) {
          setPaymentData(data)
          // Store payment session and generate signup token
          if (data.success && !data.userExists) {
            const sessionResponse = await fetch('/api/payment/create-session', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                sessionId: session_id || order_id,
                subscriptionId: subscription_id,
                paymentData: data,
              }),
            })
            
            const sessionData = await sessionResponse.json()
            if (sessionResponse.ok && sessionData.signupToken) {
              setSignupToken(sessionData.signupToken)
            }
          }
        } else {
          setError(data.error || 'Payment verification failed')
        }
      } catch (error) {
        console.error('Payment verification error:', error)
        setError('Failed to verify payment')
      } finally {
        setIsLoading(false)
      }
    }

    if (router.isReady) {
      verifyPayment()
    }
  }, [router.isReady, router.query])

  if (isLoading) {
    return (
      <div className='min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4'></div>
          <p className='text-secondary-600 dark:text-secondary-400'>
            Verifying your payment...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center px-4'>
      <div className='max-w-md w-full'>
        <div className='bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-8 text-center'>
          {/* Success Icon */}
          <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-100 dark:bg-success-900 mb-6'>
            <svg
              className='h-8 w-8 text-success-600 dark:text-success-400'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M5 13l4 4L19 7'
              />
            </svg>
          </div>

          {/* Success Message */}
          <h1 className='text-2xl font-bold text-secondary-900 dark:text-white mb-4'>
            Payment Successful!
          </h1>

          <p className='text-secondary-600 dark:text-secondary-400 mb-6'>
            Thank you for your subscription. Your account has been upgraded and
            you now have access to all premium features.
          </p>

          {/* Payment Details */}
          <div className='bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4 mb-6'>
            <div className='text-sm text-secondary-600 dark:text-secondary-400 space-y-2'>
              {provider && (
                <div className='flex justify-between'>
                  <span>Payment Method:</span>
                  <span className='font-medium capitalize'>{provider}</span>
                </div>
              )}
              {session_id && (
                <div className='flex justify-between'>
                  <span>Session ID:</span>
                  <span className='font-mono text-xs'>
                    {session_id.substring(0, 20)}...
                  </span>
                </div>
              )}
              {subscription_id && (
                <div className='flex justify-between'>
                  <span>Subscription ID:</span>
                  <span className='font-mono text-xs'>
                    {subscription_id.substring(0, 20)}...
                  </span>
                </div>
              )}
              <div className='flex justify-between'>
                <span>Date:</span>
                <span className='font-medium'>
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className='space-y-3'>
            {signupToken ? (
              <>
                <Link
                  href={`/signup?token=${signupToken}`}
                  className='w-full bg-success-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-success-700 transition-colors flex items-center justify-center gap-2'
                >
                  <UserPlus className='w-5 h-5' />
                  Create Your Account
                </Link>
                
                <div className='bg-primary-50 dark:bg-primary-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-4'>
                  <p className='text-sm text-primary-800 dark:text-primary-200'>
                    <strong>Next Step:</strong> Create your account to access your purchased plan and start using the library.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Link href='/'>
                  <button className='w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2'>
                    <BookOpen className='w-5 h-5' />
                    Access Library
                  </button>
                </Link>

                <Link href='/account'>
                  <button className='w-full bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:hover:bg-secondary-600 text-secondary-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2'>
                    <User className='w-5 h-5' />
                    View Account
                  </button>
                </Link>
              </>
            )}

            <Link href='/'>
              <button className='w-full text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium py-2 transition-colors flex items-center justify-center gap-2'>
                <Home className='w-5 h-5' />
                Return to Home
              </button>
            </Link>
          </div>

          {/* Support Info */}
          <div className='mt-8 pt-6 border-t border-secondary-200 dark:border-secondary-700'>
            <p className='text-xs text-secondary-500 dark:text-secondary-400'>
              Need help? Contact our support team at{' '}
              <a
                href='mailto:support@example.com'
                className='text-primary-600 hover:text-primary-700 dark:text-primary-400'
              >
                support@example.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
