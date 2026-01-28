import { useRouter } from 'next/router'
import Link from 'next/link'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function PaymentCancel() {
  const router = useRouter()
  const { provider } = router.query

  useEffect(() => {
    toast.error('Payment was cancelled. You can try again anytime.')
  }, [])

  return (
    <div className='min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center px-4'>
      <div className='max-w-md w-full'>
        <div className='bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-8 text-center'>
          {/* Cancel Icon */}
          <div className='mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-error-100 dark:bg-error-900 mb-6'>
            <svg
              className='h-8 w-8 text-error-600 dark:text-error-400'
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
          </div>

          {/* Cancel Message */}
          <h1 className='text-2xl font-bold text-secondary-900 dark:text-white mb-4'>
            Payment Cancelled
          </h1>

          <p className='text-secondary-600 dark:text-secondary-400 mb-6'>
            Your payment was cancelled and no charges were made. You can try
            again anytime or choose a different payment method.
          </p>

          {/* Payment Details */}
          {provider && (
            <div className='bg-secondary-50 dark:bg-secondary-700 rounded-lg p-4 mb-6'>
              <div className='text-sm text-secondary-600 dark:text-secondary-400'>
                <div className='flex justify-between'>
                  <span>Payment Method:</span>
                  <span className='font-medium capitalize'>{provider}</span>
                </div>
                <div className='flex justify-between mt-2'>
                  <span>Status:</span>
                  <span className='font-medium text-error-600 dark:text-error-400'>
                    Cancelled
                  </span>
                </div>
                <div className='flex justify-between mt-2'>
                  <span>Date:</span>
                  <span className='font-medium'>
                    {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className='space-y-3'>
            <Link href='/pricing'>
              <button className='w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-3 px-4 rounded-lg transition-colors'>
                Try Again
              </button>
            </Link>

            <Link href='/pricing'>
              <button className='w-full bg-secondary-100 hover:bg-secondary-200 dark:bg-secondary-700 dark:hover:bg-secondary-600 text-secondary-900 dark:text-white font-medium py-3 px-4 rounded-lg transition-colors'>
                View Pricing Plans
              </button>
            </Link>

            <Link href='/'>
              <button className='w-full text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium py-2 transition-colors'>
                Return to Home
              </button>
            </Link>
          </div>

          {/* Help Section */}
          <div className='mt-8 pt-6 border-t border-secondary-200 dark:border-secondary-700'>
            <h3 className='text-sm font-medium text-secondary-900 dark:text-white mb-2'>
              Need Help?
            </h3>
            <p className='text-xs text-secondary-500 dark:text-secondary-400 mb-3'>
              If you&apos;re experiencing issues with payment, here are some
              things you can try:
            </p>
            <ul className='text-xs text-secondary-500 dark:text-secondary-400 text-left space-y-1'>
              <li>• Check your payment method details</li>
              <li>• Try a different payment method</li>
              <li>• Clear your browser cache and cookies</li>
              <li>• Contact your bank if the issue persists</li>
            </ul>
            <p className='text-xs text-secondary-500 dark:text-secondary-400 mt-4'>
              Still having trouble? Contact our support team at{' '}
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
