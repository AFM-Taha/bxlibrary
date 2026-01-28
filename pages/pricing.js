import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import PricingSection from '../components/PricingSection'

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

      <div className='min-h-screen bg-white dark:bg-secondary-900'>
        {/* Navigation Breadcrumb */}
        <div className='bg-secondary-50 dark:bg-secondary-800 border-b border-secondary-200 dark:border-secondary-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex items-center space-x-2 py-4 text-sm'>
              <Link
                href='/'
                className='text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300'
              >
                Home
              </Link>
              <svg
                className='w-4 h-4 text-secondary-400'
                fill='currentColor'
                viewBox='0 0 20 20'
              >
                <path
                  fillRule='evenodd'
                  d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                  clipRule='evenodd'
                />
              </svg>
              <span className='text-secondary-500 dark:text-secondary-400'>Pricing</span>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <PricingSection />
      </div>
    </>
  )
}

export default PricingPage
