import { useState } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import { toast } from 'react-hot-toast'
import { CompactThemeToggle } from '../components/ThemeToggle'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setIsSubmitted(true)
        toast.success('Password reset instructions sent!')
      } else {
        toast.error(data.error || 'Failed to send reset email')
      }
    } catch (error) {
      toast.error('Network error. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <>
        <Head>
          <title>Check Your Email - BX Library</title>
          <meta name='description' content='Password reset instructions sent' />
        </Head>

        <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8'>
          <div className='max-w-md w-full space-y-8'>
            <div className='flex justify-end'>
              <CompactThemeToggle />
            </div>
            <div className='text-center'>
              <div className='mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 dark:bg-green-900'>
                <svg
                  className='h-6 w-6 text-green-600 dark:text-green-400'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M5 13l4 4L19 7'
                  />
                </svg>
              </div>
              <h2 className='mt-6 text-3xl font-extrabold text-gray-900 dark:text-white'>
                Check your email
              </h2>
              <p className='mt-2 text-sm text-gray-600 dark:text-gray-400'>
                If an account with that email exists, we&apos;ve sent password
                reset instructions to:
              </p>
              <p className='mt-1 text-sm font-medium text-gray-900 dark:text-white'>{email}</p>
              <p className='mt-4 text-sm text-gray-600 dark:text-gray-400'>
                Didn&apos;t receive the email? Check your spam folder or try
                again.
              </p>
            </div>

            <div className='space-y-4'>
              <button
                onClick={() => {
                  setIsSubmitted(false)
                  setEmail('')
                }}
                className='w-full flex justify-center py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              >
                Try different email
              </button>

              <Link
                href='/login'
                className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500'
              >
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Forgot Password - BX Library</title>
        <meta name='description' content='Reset your BX Library password' />
      </Head>

      <div className='min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-md w-full space-y-8'>
          <div className='flex justify-end'>
            <CompactThemeToggle />
          </div>
          <div>
            <h2 className='mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white'>
              Forgot your password?
            </h2>
            <p className='mt-2 text-center text-sm text-gray-600 dark:text-gray-400'>
              Enter your email address and we&apos;ll send you a link to reset
              your password.
            </p>
          </div>

          <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 dark:text-gray-300'
              >
                Email address
              </label>
              <div className='mt-1'>
                <input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  required
                  className='appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md placeholder-gray-400 dark:placeholder-gray-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm'
                  placeholder='Enter your email address'
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            <div>
              <button
                type='submit'
                disabled={isLoading || !email.trim()}
                className='group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed'
              >
                {isLoading ? (
                  <div className='flex items-center'>
                    <div className='animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2'></div>
                    Sending...
                  </div>
                ) : (
                  'Send reset instructions'
                )}
              </button>
            </div>

            <div className='text-center'>
              <Link
                href='/login'
                className='font-medium text-primary-600 dark:text-primary-400 hover:text-primary-500 dark:hover:text-primary-300'
              >
                Back to login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
