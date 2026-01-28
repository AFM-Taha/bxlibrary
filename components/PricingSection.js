import React, { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

function PricingSection() {
  const { user } = useAuth()
  const [pricingPlans, setPricingPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [billingPeriod, setBillingPeriod] = useState('')
  const [paymentConfigs, setPaymentConfigs] = useState({
    rupantor: null,
  })
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailInput, setEmailInput] = useState('')
  const [pendingPayment, setPendingPayment] = useState(null)

  useEffect(() => {
    fetchPricingPlans()
    fetchPaymentConfigs()
  }, [])

  useEffect(() => {
    if (pricingPlans.length > 0 && !billingPeriod) {
      const availablePeriods = [
        ...new Set(pricingPlans.map((plan) => plan.billingPeriod)),
      ]
      setBillingPeriod(availablePeriods[0])
    }
  }, [pricingPlans, billingPeriod])

  const fetchPaymentConfigs = async () => {
    try {
      const response = await fetch('/api/public/payment-config')
      if (response.ok) {
        const data = await response.json()
        setPaymentConfigs(data.configs || {})
      }
    } catch (error) {
      console.error('Error fetching payment configs:', error)
    }
  }

  const fetchPricingPlans = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/pricing')

      if (response.ok) {
        const data = await response.json()
        setPricingPlans(data.pricingPlans || [])
      } else {
        console.error('Failed to fetch pricing plans')
        toast.error('Failed to load pricing plans')
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error)
      toast.error('Failed to load pricing plans')
    } finally {
      setLoading(false)
    }
  }

  const filteredPlans = pricingPlans

  const handleGetStarted = (plan) => {
    // This will be handled by the payment buttons
    console.log('Selected plan:', plan)
  }

  const handleEmailSubmit = async () => {
    if (!emailInput) {
      toast.error('Email is required to proceed with payment')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput)) {
      toast.error('Please enter a valid email address')
      return
    }

    setShowEmailModal(false)

    if (pendingPayment) {
      await processRupantorPayment(pendingPayment.plan, emailInput)
    }

    // Reset states
    setEmailInput('')
    setPendingPayment(null)
  }

  const handleEmailModalClose = () => {
    setShowEmailModal(false)
    setEmailInput('')
    setPendingPayment(null)
  }

  const processRupantorPayment = async (plan, email = null) => {
    try {
      const endpoint = '/api/payments/rupantor/create-session'

      const requestBody = {
        priceId: plan._id,
        billingPeriod: billingPeriod,
      }

      if (email) {
        requestBody.customerEmail = email
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()
      if (data.success) {
        window.location.href = data.url
      } else {
        toast.error(data.error || 'Failed to create RupantorPay session')
      }
    } catch (error) {
      console.error('RupantorPay payment error:', error)
      toast.error('Failed to process payment')
    }
  }

  const handleRupantorPayment = async (plan) => {
    if (!user) {
      // Show email modal for guest users
      setPendingPayment({ type: 'rupantor', plan })
      setShowEmailModal(true)
    } else {
      // Process payment directly for logged-in users
      await processRupantorPayment(plan)
    }
  }

  if (loading) {
    return (
      <div className='py-16 bg-secondary-50 dark:bg-secondary-950'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto'></div>
            <p className='mt-4 text-sm text-secondary-600 dark:text-secondary-400'>
              Loading pricing plans...
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (pricingPlans.length === 0) {
    return (
      <div className='py-16 bg-secondary-50 dark:bg-secondary-950'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='text-center'>
            <h2 className='text-3xl font-bold text-secondary-900 dark:text-white mb-4'>
              Pricing Plans
            </h2>
            <p className='text-secondary-600 dark:text-secondary-400'>
              No pricing plans available at the moment.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='py-16 bg-secondary-50 dark:bg-secondary-950'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        {/* Header */}
        <div className='text-center mb-12'>
          <h2 className='text-3xl font-bold text-secondary-900 dark:text-white sm:text-4xl'>
            Choose Your Plan
          </h2>
          <p className='mt-4 text-lg text-secondary-600 dark:text-secondary-400'>
            Select the perfect plan for your reading journey
          </p>
        </div>

        {/* Pricing Cards */}
        <div className='flex flex-wrap justify-center gap-8 max-w-6xl mx-auto'>
          {filteredPlans.map((plan) => (
            <div
              key={plan._id}
              className={`relative bg-white dark:bg-secondary-800 rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl w-full max-w-sm ${
                plan.isPopular
                  ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                  : 'border-secondary-200 dark:border-secondary-700 hover:border-primary-300 dark:hover:border-primary-600'
              }`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className='absolute -top-4 left-1/2 transform -translate-x-1/2'>
                  <span className='bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium'>
                    Most Popular
                  </span>
                </div>
              )}

              <div className='p-8'>
                {/* Plan Header */}
                <div className='text-center mb-6'>
                  <h3 className='text-2xl font-bold text-secondary-900 dark:text-white mb-2'>
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className='text-secondary-600 dark:text-secondary-400 text-sm'>
                      {plan.description}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className='text-center mb-8'>
                  <div className='flex items-baseline justify-center'>
                    <span className='text-4xl font-bold text-secondary-900 dark:text-white'>
                      {plan.formattedPrice}
                    </span>
                    {plan.billingPeriod !== 'lifetime' && (
                      <span className='text-secondary-600 dark:text-secondary-400 ml-1'>
                        /{plan.billingPeriod === 'yearly' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  {plan.billingPeriod === 'yearly' && (
                    <p className='text-sm text-success-600 dark:text-success-400 mt-1'>
                      Save 20% with annual billing
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className='mb-8'>
                  <ul className='space-y-3'>
                    {plan.features && plan.features.length > 0 ? (
                      plan.features.map((feature, index) => (
                        <li key={index} className='flex items-start'>
                          <div className='flex-shrink-0 mt-0.5'>
                            {feature.included ? (
                              <svg
                                className='w-5 h-5 text-success-500'
                                fill='currentColor'
                                viewBox='0 0 20 20'
                              >
                                <path
                                  fillRule='evenodd'
                                  d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                                  clipRule='evenodd'
                                />
                              </svg>
                            ) : (
                              <svg
                                className='w-5 h-5 text-error-500'
                                fill='currentColor'
                                viewBox='0 0 20 20'
                              >
                                <path
                                  fillRule='evenodd'
                                  d='M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z'
                                  clipRule='evenodd'
                                />
                              </svg>
                            )}
                          </div>
                          <div className='ml-3'>
                            <span
                              className={`text-sm ${
                                feature.included
                                  ? 'text-secondary-700 dark:text-secondary-300'
                                  : 'text-secondary-500 dark:text-secondary-500 line-through'
                              }`}
                            >
                              {feature.name}
                            </span>
                            {feature.limit && (
                              <span className='text-xs text-secondary-500 dark:text-secondary-400 ml-1'>
                                ({feature.limit})
                              </span>
                            )}
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className='flex items-center text-secondary-500 dark:text-secondary-400 text-sm'>
                        <svg
                          className='w-5 h-5 mr-3'
                          fill='currentColor'
                          viewBox='0 0 20 20'
                        >
                          <path
                            fillRule='evenodd'
                            d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                            clipRule='evenodd'
                          />
                        </svg>
                        Contact us for feature details
                      </li>
                    )}
                  </ul>
                </div>

                {/* Payment Buttons */}
                <div className='space-y-3'>
                  {/* Custom button link takes priority */}
                  {plan.buttonLink ? (
                    <a
                      href={plan.buttonLink}
                      target='_blank'
                      rel='noopener noreferrer'
                      className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center ${
                        plan.isPopular
                          ? 'bg-primary-600 hover:bg-primary-700 text-white'
                          : 'bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 text-secondary-900 dark:text-white'
                      }`}
                    >
                      {plan.buttonText || 'Get Started'}
                    </a>
                  ) : (
                    <>
                      {/* RupantorPay Payment Button - Primary Option */}
                      <button
                        onClick={() => handleRupantorPayment(plan)}
                        className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center space-x-2 ${
                          plan.isPopular
                            ? 'bg-primary-600 hover:bg-primary-700 text-white'
                            : 'bg-secondary-100 dark:bg-secondary-700 hover:bg-secondary-200 dark:hover:bg-secondary-600 text-secondary-900 dark:text-white'
                        }`}
                      >
                        <svg
                          className='w-5 h-5'
                          viewBox='0 0 24 24'
                          fill='currentColor'
                        >
                          <path d='M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z' />
                        </svg>
                        <span>{plan.buttonText || 'Pay with RupantorPay'}</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className='text-center mt-12'>
          <p className='text-sm text-secondary-600 dark:text-secondary-400'>
            All plans include 30-day money-back guarantee. No setup fees.
          </p>
          <div className='mt-4 flex justify-center space-x-6 text-sm text-secondary-500 dark:text-secondary-400'>
            <div className='flex items-center'>
              <svg
                className='w-4 h-4 mr-2 text-success-500'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z'
                  clipRule='evenodd'
                />
              </svg>
              Secure Payment
            </div>
            <div className='flex items-center'>
              <svg
                className='w-4 h-4 mr-2 text-success-500'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z'
                  clipRule='evenodd'
                />
              </svg>
              24/7 Support
            </div>
            <div className='flex items-center'>
              <svg
                className='w-4 h-4 mr-2 text-success-500'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z'
                  clipRule='evenodd'
                />
              </svg>
              Cancel Anytime
            </div>
          </div>
        </div>
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className='fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'>
          <div className='bg-white dark:bg-secondary-800 rounded-lg p-6 w-full max-w-md mx-4'>
            <h3 className='text-lg font-semibold text-secondary-900 dark:text-white mb-4'>
              Enter Your Email
            </h3>
            <p className='text-secondary-600 dark:text-secondary-400 mb-4'>
              Please enter your email address to continue with payment:
            </p>
            <input
              type='email'
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder='your@email.com'
              className='w-full px-3 py-2 border border-secondary-300 dark:border-secondary-600 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-secondary-700 dark:text-white mb-4'
              autoFocus
            />
            <div className='flex justify-end space-x-3'>
              <button
                onClick={handleEmailModalClose}
                className='px-4 py-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200'
              >
                Cancel
              </button>
              <button
                onClick={handleEmailSubmit}
                className='px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500'
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PricingSection
