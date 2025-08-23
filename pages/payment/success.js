import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { toast } from 'react-hot-toast'
import { useAuth } from '../../contexts/AuthContext'

export default function PaymentSuccess() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [subscription, setSubscription] = useState(null)
  const { session_id, subscription_id, provider } = router.query

  useEffect(() => {
    if (session_id || subscription_id) {
      verifyPayment()
    }
  }, [session_id, subscription_id, provider])

  const verifyPayment = async () => {
    try {
      // For now, we'll just show success. In a real app, you might want to verify the payment
      // by calling your backend to check the subscription status
      setLoading(false)
      toast.success('Payment successful! Your subscription is now active.')
    } catch (error) {
      console.error('Error verifying payment:', error)
      setLoading(false)
      toast.error(
        'There was an issue verifying your payment. Please contact support.'
      )
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600 dark:text-gray-400'>
            Verifying your payment...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4'>
      <div className='max-w-md w-full'>
        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center'>
          {/* Success Icon */}
          <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-6'>
            <svg
              className='h-8 w-8 text-green-600 dark:text-green-400'
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
          <h1 className='text-2xl font-bold text-gray-900 dark:text-white mb-4'>
            Payment Successful!
          </h1>

          <p className='text-gray-600 dark:text-gray-400 mb-6'>
            Thank you for your subscription. Your account has been upgraded and
            you now have access to all premium features.
          </p>

          {/* Payment Details */}
          <div className='bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6'>
            <div className='text-sm text-gray-600 dark:text-gray-400 space-y-2'>
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
            <Link href='/'>
              <button className='w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors'>
                Access Library
              </button>
            </Link>

            <Link href='/account'>
              <button className='w-full bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors'>
                View Account
              </button>
            </Link>

            <Link href='/'>
              <button className='w-full text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium py-2 transition-colors'>
                Return to Home
              </button>
            </Link>
          </div>

          {/* Support Info */}
          <div className='mt-8 pt-6 border-t border-gray-200 dark:border-gray-700'>
            <p className='text-xs text-gray-500 dark:text-gray-400'>
              Need help? Contact our support team at{' '}
              <a
                href='mailto:support@example.com'
                className='text-blue-600 hover:text-blue-700 dark:text-blue-400'
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
