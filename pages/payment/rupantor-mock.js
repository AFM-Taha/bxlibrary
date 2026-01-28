import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { Loader2, ShieldCheck, AlertCircle } from 'lucide-react'

// This page simulates the external RupantorPay gateway
export default function RupantorMockGateway() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [paymentData, setPaymentData] = useState(null)

  useEffect(() => {
    if (router.isReady) {
      try {
        const { token } = router.query
        if (!token) {
          setError('Invalid payment session')
          setLoading(false)
          return
        }

        const decodedData = JSON.parse(atob(token))
        setPaymentData(decodedData)
        setLoading(false)
      } catch (err) {
        setError('Failed to load payment details')
        setLoading(false)
      }
    }
  }, [router.isReady, router.query])

  const handlePayment = async (success) => {
    setProcessing(true)

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    if (success) {
      // Redirect to success URL with parameters that would normally come from the gateway
      // We need to sign this in a real scenario, but here we just pass back to our callback
      const callbackUrl = new URL(
        paymentData.success_url,
        window.location.origin,
      )
      callbackUrl.searchParams.append('order_id', paymentData.order_id)
      callbackUrl.searchParams.append('status', 'success')
      callbackUrl.searchParams.append(
        'transaction_id',
        'rp_' + Math.random().toString(36).substr(2, 9),
      )
      callbackUrl.searchParams.append('amount', paymentData.amount)
      callbackUrl.searchParams.append('currency', paymentData.currency)
      if (paymentData.planId)
        callbackUrl.searchParams.append('planId', paymentData.planId)
      if (paymentData.billingPeriod)
        callbackUrl.searchParams.append(
          'billingPeriod',
          paymentData.billingPeriod,
        )
      if (paymentData.customer_email)
        callbackUrl.searchParams.append(
          'customerEmail',
          paymentData.customer_email,
        )

      router.push(callbackUrl.toString())
    } else {
      const cancelUrl = new URL(paymentData.cancel_url, window.location.origin)
      router.push(cancelUrl.toString())
    }
  }

  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <Loader2 className='w-8 h-8 animate-spin text-blue-600' />
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center'>
          <AlertCircle className='w-12 h-12 text-red-500 mx-auto mb-4' />
          <h1 className='text-xl font-bold text-gray-900 mb-2'>Error</h1>
          <p className='text-gray-600'>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4'>
      <Head>
        <title>RupantorPay Secure Checkout (Simulation)</title>
      </Head>

      <div className='bg-white w-full max-w-md rounded-xl shadow-lg overflow-hidden border border-gray-200'>
        {/* Header */}
        <div className='bg-[#006A4E] p-6 text-white text-center'>
          <div className='flex items-center justify-center gap-2 mb-2'>
            <ShieldCheck className='w-8 h-8' />
            <span className='text-2xl font-bold'>RupantorPay</span>
          </div>
          <p className='text-white/80 text-sm'>Secure Payment Gateway</p>
        </div>

        {/* Order Details */}
        <div className='p-6 space-y-6'>
          <div className='text-center'>
            <p className='text-gray-500 text-sm uppercase tracking-wide'>
              Amount to Pay
            </p>
            <div className='text-3xl font-bold text-gray-900 mt-1'>
              {paymentData.currency} {paymentData.amount}
            </div>
            <p className='text-gray-600 text-sm mt-2'>
              {paymentData.description}
            </p>
          </div>

          <div className='border-t border-gray-100 pt-4 space-y-3'>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-500'>Merchant</span>
              <span className='font-medium text-gray-900'>BX Library</span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-500'>Order ID</span>
              <span className='font-medium text-gray-900'>
                {paymentData.order_id}
              </span>
            </div>
            <div className='flex justify-between text-sm'>
              <span className='text-gray-500'>Customer</span>
              <span className='font-medium text-gray-900'>
                {paymentData.customer_email}
              </span>
            </div>
          </div>

          {/* Payment Actions */}
          <div className='space-y-3 pt-4'>
            <button
              onClick={() => handlePayment(true)}
              disabled={processing}
              className='w-full bg-[#006A4E] hover:bg-[#005a42] text-white py-3 rounded-lg font-semibold shadow-md transition-all flex items-center justify-center gap-2'
            >
              {processing ? (
                <>
                  <Loader2 className='w-5 h-5 animate-spin' />
                  Processing...
                </>
              ) : (
                'Pay Now'
              )}
            </button>

            <button
              onClick={() => handlePayment(false)}
              disabled={processing}
              className='w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors'
            >
              Cancel Payment
            </button>
          </div>
        </div>

        <div className='bg-gray-50 p-4 text-center text-xs text-gray-500 border-t border-gray-100'>
          <p>This is a simulated payment page for development purposes.</p>
          <p className='mt-1'>Secured by RupantorPay</p>
        </div>
      </div>
    </div>
  )
}
