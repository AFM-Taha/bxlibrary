import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import PricingSection from '../components/PricingSection';

function PricingPage() {
  return (
    <>
      <Head>
        <title>Pricing Plans - BX Library</title>
        <meta
          name='description'
          content='Choose the perfect plan for your reading journey. Affordable pricing with flexible options.'
        />
        <meta
          name='keywords'
          content='pricing, subscription, books, library, reading plans'
        />
        <meta property='og:title' content='Pricing Plans - BX Library' />
        <meta
          property='og:description'
          content='Choose the perfect plan for your reading journey. Affordable pricing with flexible options.'
        />
        <meta property='og:type' content='website' />
      </Head>

      <div className='min-h-screen bg-white dark:bg-gray-900'>
        {/* Navigation Breadcrumb */}
        <div className='bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center space-x-2 py-4 text-sm'>
              <Link
                href='/'
                className='text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300'
              >
                Home
              </Link>
              <svg
                className='w-4 h-4 text-gray-400'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='text-gray-500 dark:text-gray-400'>Pricing</span>
            </div>
          </div>
        </div>

        {/* Hero Section */}
        <div className='bg-gradient-to-br from-primary-50 to-primary-100 dark:from-gray-800 dark:to-gray-900 py-16'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
            <h1 className='text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-6'>
              Simple, Transparent Pricing
            </h1>
            <p className='text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto'>
              Choose the plan that fits your reading habits. All plans include
              access to our vast library of books, personalized recommendations,
              and premium reading features.
            </p>
            <div className='flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 text-sm text-gray-600 dark:text-gray-400'>
              <div className='flex items-center'>
                <svg
                  className='w-5 h-5 mr-2 text-green-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
                30-day free trial
              </div>
              <div className='flex items-center'>
                <svg
                  className='w-5 h-5 mr-2 text-green-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
                Cancel anytime
              </div>
              <div className='flex items-center'>
                <svg
                  className='w-5 h-5 mr-2 text-green-500'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z'
                    clipRule='evenodd'
                  />
                </svg>
                No setup fees
              </div>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <PricingSection />

        {/* FAQ Section */}
        <div className='py-16 bg-white dark:bg-gray-900'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='text-center mb-12'>
              <h2 className='text-3xl font-bold text-gray-900 dark:text-white mb-4'>
                Frequently Asked Questions
              </h2>
              <p className='text-lg text-gray-600 dark:text-gray-400'>
                Got questions? We&apos;ve got answers.
              </p>
            </div>

            <div className='space-y-8'>
              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  Can I change my plan anytime?
                </h3>
                <p className='text-gray-600 dark:text-gray-400'>
                  Yes, you can upgrade or downgrade your plan at any time.
                  Changes will be reflected in your next billing cycle, and
                  we&apos;ll prorate any differences.
                </p>
              </div>

              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  What payment methods do you accept?
                </h3>
                <p className='text-gray-600 dark:text-gray-400'>
                  We accept all major credit cards (Visa, MasterCard, American
                  Express), PayPal, and bank transfers. All payments are
                  processed securely through our encrypted payment system.
                </p>
              </div>

              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  Is there a free trial?
                </h3>
                <p className='text-gray-600 dark:text-gray-400'>
                  Yes! We offer a 30-day free trial for all new users. You can
                  explore our entire library and features without any
                  commitment. No credit card required to start.
                </p>
              </div>

              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  Can I cancel my subscription?
                </h3>
                <p className='text-gray-600 dark:text-gray-400'>
                  Absolutely. You can cancel your subscription at any time from
                  your account settings. You&apos;ll continue to have access
                  until the end of your current billing period.
                </p>
              </div>

              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  Do you offer student discounts?
                </h3>
                <p className='text-gray-600 dark:text-gray-400'>
                  Yes, we offer special pricing for students and educational
                  institutions. Contact our support team with your student ID or
                  institutional email for more information.
                </p>
              </div>

              <div className='bg-gray-50 dark:bg-gray-800 rounded-lg p-6'>
                <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
                  What happens to my data if I cancel?
                </h3>
                <p className='text-gray-600 dark:text-gray-400'>
                  Your reading progress, bookmarks, and personal library will be
                  preserved for 90 days after cancellation. You can reactivate
                  your account anytime during this period to restore full
                  access.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className='bg-primary-600 dark:bg-primary-700 py-16'>
          <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center'>
            <h2 className='text-3xl font-bold text-white mb-4'>
              Ready to Start Your Reading Journey?
            </h2>
            <p className='text-xl text-primary-100 mb-8'>
              Join thousands of readers who have already discovered their next
              favorite book.
            </p>
            <div className='flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4'>
              <Link
                href='/register'
                className='bg-white text-primary-600 hover:bg-gray-100 px-8 py-3 rounded-lg font-semibold transition-colors'
              >
                Start Free Trial
              </Link>
              <Link
                href='/contact'
                className='border-2 border-white text-white hover:bg-white hover:text-primary-600 px-8 py-3 rounded-lg font-semibold transition-colors'
              >
                Contact Sales
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default PricingPage;