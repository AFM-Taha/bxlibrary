import { useState } from 'react'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import toast from 'react-hot-toast'
import { CompactThemeToggle } from '../components/ThemeToggle'
import { LogIn } from 'lucide-react'

export default function Contact() {
  const { user, isAuthenticated } = useAuth()
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    subject: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Simulate form submission - in a real app, this would send to an API
      await new Promise((resolve) => setTimeout(resolve, 1000))

      setSubmitted(true)
      toast.success("Message sent successfully! We'll get back to you soon.")

      // Reset form
      setFormData({
        name: user?.name || '',
        email: user?.email || '',
        subject: '',
        message: '',
      })
    } catch (error) {
      toast.error('Failed to send message. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    })
  }

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
                    className='text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                  >
                    Account
                  </Link>
                </>
              ) : (
                <>
                  <CompactThemeToggle />
                  <Link
                    href='/'
                    className='text-secondary-700 dark:text-secondary-300 hover:text-primary-600 dark:hover:text-primary-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
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
        <div className='text-center mb-12'>
          <h1 className='text-4xl font-bold text-secondary-900 dark:text-white mb-4'>
            Contact Us
          </h1>
          <p className='text-xl text-secondary-600 dark:text-secondary-400 max-w-2xl mx-auto'>
            Have a question or need help? We&apos;d love to hear from you. Send
            us a message and we&apos;ll respond as soon as possible.
          </p>
        </div>

        <div className='grid grid-cols-1 lg:grid-cols-3 gap-8'>
          {/* Contact Information */}
          <div className='lg:col-span-1'>
            <div className='bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6'>
              <h2 className='text-lg font-semibold text-secondary-900 dark:text-white mb-6'>
                Get in Touch
              </h2>

              <div className='space-y-4'>
                <div className='flex items-start'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='h-6 w-6 text-primary-600'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm font-medium text-secondary-900 dark:text-white'>
                      Email
                    </p>
                    <p className='text-sm text-secondary-600 dark:text-secondary-400'>
                      support@bxlibrary.com
                    </p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='h-6 w-6 text-primary-600'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm font-medium text-secondary-900 dark:text-white'>
                      Phone
                    </p>
                    <p className='text-sm text-secondary-600 dark:text-secondary-400'>
                      +1 (555) 123-4567
                    </p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='h-6 w-6 text-primary-600'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm font-medium text-secondary-900 dark:text-white'>
                      Response Time
                    </p>
                    <p className='text-sm text-secondary-600 dark:text-secondary-400'>
                      Within 24 hours
                    </p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <div className='flex-shrink-0'>
                    <svg
                      className='h-6 w-6 text-primary-600'
                      fill='none'
                      viewBox='0 0 24 24'
                      stroke='currentColor'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                      />
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                      />
                    </svg>
                  </div>
                  <div className='ml-3'>
                    <p className='text-sm font-medium text-secondary-900 dark:text-white'>
                      Office
                    </p>
                    <p className='text-sm text-secondary-600 dark:text-secondary-400'>
                      123 Library Street
                      <br />
                      Digital City, DC 12345
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className='lg:col-span-2'>
            <div className='bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700 p-6'>
              <h2 className='text-lg font-semibold text-secondary-900 dark:text-white mb-6'>
                Send us a Message
              </h2>

              {submitted ? (
                <div className='text-center py-8'>
                  <svg
                    className='mx-auto h-12 w-12 text-success-500 mb-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'
                    />
                  </svg>
                  <h3 className='text-lg font-medium text-secondary-900 dark:text-white mb-2'>
                    Message Sent!
                  </h3>
                  <p className='text-secondary-600 dark:text-secondary-400 mb-4'>
                    Thank you for contacting us. We&apos;ll get back to you
                    soon.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className='text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 underline'
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className='space-y-6'>
                  <div className='grid grid-cols-1 sm:grid-cols-2 gap-6'>
                    <div>
                      <label
                        htmlFor='name'
                        className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'
                      >
                        Full Name *
                      </label>
                      <input
                        type='text'
                        id='name'
                        name='name'
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                        placeholder='Your full name'
                      />
                    </div>

                    <div>
                      <label
                        htmlFor='email'
                        className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'
                      >
                        Email Address *
                      </label>
                      <input
                        type='email'
                        id='email'
                        name='email'
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                        placeholder='your.email@example.com'
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor='subject'
                      className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'
                    >
                      Subject *
                    </label>
                    <input
                      type='text'
                      id='subject'
                      name='subject'
                      value={formData.subject}
                      onChange={handleChange}
                      required
                      className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                      placeholder='What is this about?'
                    />
                  </div>

                  <div>
                    <label
                      htmlFor='message'
                      className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'
                    >
                      Message *
                    </label>
                    <textarea
                      id='message'
                      name='message'
                      value={formData.message}
                      onChange={handleChange}
                      required
                      rows={6}
                      className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md bg-white dark:bg-secondary-700 text-secondary-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent'
                      placeholder='Please describe your question or concern in detail...'
                    />
                  </div>

                  <div className='flex justify-end'>
                    <button
                      type='submit'
                      disabled={loading}
                      className='px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center'
                    >
                      {loading ? (
                        <>
                          <svg
                            className='animate-spin -ml-1 mr-3 h-5 w-5 text-white'
                            fill='none'
                            viewBox='0 0 24 24'
                          >
                            <circle
                              className='opacity-25'
                              cx='12'
                              cy='12'
                              r='10'
                              stroke='currentColor'
                              strokeWidth='4'
                            ></circle>
                            <path
                              className='opacity-75'
                              fill='currentColor'
                              d='M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z'
                            ></path>
                          </svg>
                          Sending...
                        </>
                      ) : (
                        'Send Message'
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className='mt-16'>
          <div className='text-center mb-8'>
            <h2 className='text-2xl font-bold text-secondary-900 dark:text-white mb-4'>
              Frequently Asked Questions
            </h2>
            <p className='text-secondary-600 dark:text-secondary-400'>
              Quick answers to common questions
            </p>
          </div>

          <div className='bg-white dark:bg-secondary-800 rounded-lg shadow-sm border border-secondary-200 dark:border-secondary-700'>
            <div className='divide-y divide-secondary-200 dark:divide-secondary-700'>
              <div className='p-6'>
                <h3 className='text-lg font-medium text-secondary-900 dark:text-white mb-2'>
                  How do I access the library?
                </h3>
                <p className='text-secondary-600 dark:text-secondary-400'>
                  You need an active account to access our digital library.
                  Contact your administrator to get an invitation to create your
                  account.
                </p>
              </div>

              <div className='p-6'>
                <h3 className='text-lg font-medium text-secondary-900 dark:text-white mb-2'>
                  Can I download books for offline reading?
                </h3>
                <p className='text-secondary-600 dark:text-secondary-400'>
                  Our books are designed for online reading only. You can read
                  them directly in your browser with our built-in PDF reader.
                </p>
              </div>

              <div className='p-6'>
                <h3 className='text-lg font-medium text-secondary-900 dark:text-white mb-2'>
                  I forgot my password. How can I reset it?
                </h3>
                <p className='text-secondary-600 dark:text-secondary-400'>
                  Use the &quot;Forgot Password&quot; link on the login page to
                  receive a password reset email. If you continue having issues,
                  contact us for assistance.
                </p>
              </div>

              <div className='p-6'>
                <h3 className='text-lg font-medium text-secondary-900 dark:text-white mb-2'>
                  How do I search for specific books?
                </h3>
                <p className='text-secondary-600 dark:text-secondary-400'>
                  Use the search bar in the library to find books by title or
                  author. You can also filter by category and sort results to
                  find what you&quot;re looking for.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
