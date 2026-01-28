import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import Head from 'next/head'
import { toast } from 'react-hot-toast'
import {
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  User,
  Mail,
  Lock,
} from 'lucide-react'

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [token, setToken] = useState('')
  const [isValidToken, setIsValidToken] = useState(null)
  const [paymentDetails, setPaymentDetails] = useState(null)
  const [passwordErrors, setPasswordErrors] = useState([])
  const router = useRouter()

  useEffect(() => {
    // Get token from URL query and validate it
    if (router.isReady) {
      const { token: urlToken } = router.query
      if (urlToken) {
        setToken(urlToken)
        validateToken(urlToken)
      } else {
        setIsValidToken(false)
      }
    }
  }, [router.isReady, router.query])

  const validateToken = async (tokenToValidate) => {
    try {
      const response = await fetch('/api/payment/validate-signup-token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: tokenToValidate }),
      })

      const data = await response.json()

      if (response.ok && data.valid) {
        setIsValidToken(true)
        setPaymentDetails(data.paymentDetails)
        // Pre-fill email if available
        if (data.paymentDetails?.customerEmail) {
          setFormData((prev) => ({
            ...prev,
            email: data.paymentDetails.customerEmail,
          }))
        }
      } else {
        setIsValidToken(false)
        toast.error(data.error || 'Invalid or expired signup token')
      }
    } catch (error) {
      console.error('Token validation error:', error)
      setIsValidToken(false)
      toast.error('Failed to validate signup token')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })

    // Validate password in real-time
    if (name === 'password') {
      validatePassword(value)
    }
  }

  const validatePassword = (password) => {
    const errors = []
    if (password.length < 8) {
      errors.push('At least 8 characters long')
    }
    if (!/(?=.*[a-z])/.test(password)) {
      errors.push('At least one lowercase letter')
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      errors.push('At least one uppercase letter')
    }
    if (!/(?=.*\d)/.test(password)) {
      errors.push('At least one number')
    }
    if (!/(?=.*[@$!%*?&])/.test(password)) {
      errors.push('At least one special character (@$!%*?&)')
    }
    setPasswordErrors(errors)
    return errors.length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Validate form
    if (!formData.name.trim()) {
      toast.error('Name is required')
      setIsLoading(false)
      return
    }

    if (!formData.email.trim()) {
      toast.error('Email is required')
      setIsLoading(false)
      return
    }

    if (!validatePassword(formData.password)) {
      toast.error('Please fix password requirements')
      setIsLoading(false)
      return
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/signup-with-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          signupToken: token,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(
          'Account created successfully! Please check your email to verify your account.',
        )
        // Redirect to verification page or login
        router.push('/verify-email?email=' + encodeURIComponent(formData.email))
      } else {
        toast.error(data.error || 'Failed to create account')
      }
    } catch (error) {
      console.error('Signup error:', error)
      toast.error('An error occurred during signup')
    } finally {
      setIsLoading(false)
    }
  }

  // Loading state while validating token
  if (isValidToken === null) {
    return (
      <div className='min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4'></div>
          <p className='text-secondary-600 dark:text-secondary-400'>
            Validating signup token...
          </p>
        </div>
      </div>
    )
  }

  // Invalid token state
  if (isValidToken === false) {
    return (
      <div className='min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center'>
        <div className='max-w-md w-full mx-auto'>
          <div className='bg-white dark:bg-secondary-800 rounded-lg shadow-lg p-8 text-center'>
            <AlertCircle className='w-16 h-16 text-error-500 mx-auto mb-4' />
            <h1 className='text-2xl font-bold text-secondary-900 dark:text-white mb-4'>
              Invalid Signup Link
            </h1>
            <p className='text-secondary-600 dark:text-secondary-400 mb-6'>
              This signup link is invalid or has expired. Please complete a
              payment first to get access to account creation.
            </p>
            <div className='space-y-3'>
              <Link
                href='/pricing'
                className='w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 transition-colors inline-block text-center'
              >
                View Pricing Plans
              </Link>
              <Link
                href='/'
                className='w-full border border-secondary-300 dark:border-secondary-600 text-secondary-700 dark:text-secondary-300 px-6 py-3 rounded-lg font-medium hover:bg-secondary-50 dark:hover:bg-secondary-800 transition-colors inline-block text-center'
              >
                Return to Home
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>Create Your Account - BX Library</title>
        <meta
          name='description'
          content='Complete your account setup after payment'
        />
      </Head>

      <div className='min-h-screen bg-secondary-50 dark:bg-secondary-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
        <div className='max-w-md w-full space-y-8'>
          {/* Header */}
          <div className='text-center'>
            <CheckCircle className='w-16 h-16 text-green-500 mx-auto mb-4' />
            <h2 className='text-3xl font-bold text-secondary-900 dark:text-white'>
              Create Your Account
            </h2>
            <p className='mt-2 text-secondary-600 dark:text-secondary-400'>
              Complete your account setup to access your purchased plan
            </p>
          </div>

          {/* Payment Details */}
          {paymentDetails && (
            <div className='bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4'>
              <h3 className='font-medium text-green-800 dark:text-green-200 mb-2'>
                Payment Confirmed
              </h3>
              <div className='text-sm text-green-700 dark:text-green-300 space-y-1'>
                {paymentDetails.planDetails && (
                  <p>
                    <strong>Plan:</strong> {paymentDetails.planDetails.name}
                  </p>
                )}
                <p>
                  <strong>Amount:</strong> ${paymentDetails.amount}{' '}
                  {paymentDetails.currency}
                </p>
                <p>
                  <strong>Provider:</strong> {paymentDetails.provider}
                </p>
              </div>
            </div>
          )}

          {/* Signup Form */}
          <form className='mt-8 space-y-6' onSubmit={handleSubmit}>
            <div className='space-y-4'>
              {/* Name */}
              <div>
                <label
                  htmlFor='name'
                  className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1'
                >
                  Full Name *
                </label>
                <div className='relative'>
                  <User className='absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5' />
                  <input
                    id='name'
                    name='name'
                    type='text'
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className='pl-10 w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white'
                    placeholder='Enter your full name'
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor='email'
                  className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1'
                >
                  Email Address *
                </label>
                <div className='relative'>
                  <Mail className='absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5' />
                  <input
                    id='email'
                    name='email'
                    type='email'
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className='pl-10 w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white'
                    placeholder='Enter your email address'
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor='phone'
                  className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1'
                >
                  Phone Number (Optional)
                </label>
                <input
                  id='phone'
                  name='phone'
                  type='tel'
                  value={formData.phone}
                  onChange={handleChange}
                  className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white'
                  placeholder='Enter your phone number'
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor='password'
                  className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1'
                >
                  Password *
                </label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5' />
                  <input
                    id='password'
                    name='password'
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className='pl-10 pr-10 w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white'
                    placeholder='Create a strong password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowPassword(!showPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600'
                  >
                    {showPassword ? (
                      <EyeOff className='w-5 h-5' />
                    ) : (
                      <Eye className='w-5 h-5' />
                    )}
                  </button>
                </div>

                {/* Password Requirements */}
                {formData.password && (
                  <div className='mt-2 space-y-1'>
                    {passwordErrors.map((error, index) => (
                      <p
                        key={index}
                        className='text-sm text-red-600 dark:text-red-400 flex items-center gap-1'
                      >
                        <AlertCircle className='w-3 h-3' />
                        {error}
                      </p>
                    ))}
                    {passwordErrors.length === 0 && (
                      <p className='text-sm text-green-600 dark:text-green-400 flex items-center gap-1'>
                        <CheckCircle className='w-3 h-3' />
                        Password meets all requirements
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Confirm Password */}
              <div>
                <label
                  htmlFor='confirmPassword'
                  className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-1'
                >
                  Confirm Password *
                </label>
                <div className='relative'>
                  <Lock className='absolute left-3 top-1/2 transform -translate-y-1/2 text-secondary-400 w-5 h-5' />
                  <input
                    id='confirmPassword'
                    name='confirmPassword'
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className='pl-10 pr-10 w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:bg-secondary-700 dark:text-white'
                    placeholder='Confirm your password'
                  />
                  <button
                    type='button'
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-secondary-400 hover:text-secondary-600'
                  >
                    {showConfirmPassword ? (
                      <EyeOff className='w-5 h-5' />
                    ) : (
                      <Eye className='w-5 h-5' />
                    )}
                  </button>
                </div>

                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <p className='mt-1 text-sm text-error-600 dark:text-error-400 flex items-center gap-1'>
                    <AlertCircle className='w-3 h-3' />
                    Passwords do not match
                  </p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type='submit'
              disabled={isLoading || passwordErrors.length > 0}
              className='w-full bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2'
            >
              {isLoading ? (
                <>
                  <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white'></div>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>

            {/* Footer */}
            <div className='text-center'>
              <p className='text-sm text-secondary-600 dark:text-secondary-400'>
                Already have an account?{' '}
                <Link
                  href='/login'
                  className='text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-medium'
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
