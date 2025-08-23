import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { loadStripe } from '@stripe/stripe-js';
import { useAuth } from '../contexts/AuthContext';

function PricingSection() {
  const { user } = useAuth();
  const [pricingPlans, setPricingPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [billingPeriod, setBillingPeriod] = useState('');
  const [paymentConfigs, setPaymentConfigs] = useState({ stripe: null, paypal: null });

  useEffect(() => {
    fetchPricingPlans();
    fetchPaymentConfigs();
  }, []);

  useEffect(() => {
    if (pricingPlans.length > 0 && !billingPeriod) {
      const availablePeriods = [...new Set(pricingPlans.map(plan => plan.billingPeriod))];
      setBillingPeriod(availablePeriods[0]);
    }
  }, [pricingPlans, billingPeriod]);

  const fetchPaymentConfigs = async () => {
    try {
      const response = await fetch('/api/admin/payment-config', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        const configs = {};
        data.configs.forEach(config => {
          if (config.isActive) {
            configs[config.provider] = config;
          }
        });
        setPaymentConfigs(configs);
      }
    } catch (error) {
      console.error('Error fetching payment configs:', error);
    }
  };

  const fetchPricingPlans = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/pricing');
      
      if (response.ok) {
        const data = await response.json();
        setPricingPlans(data.pricingPlans || []);
      } else {
        console.error('Failed to fetch pricing plans');
        toast.error('Failed to load pricing plans');
      }
    } catch (error) {
      console.error('Error fetching pricing plans:', error);
      toast.error('Failed to load pricing plans');
    } finally {
      setLoading(false);
    }
  };

  const filteredPlans = pricingPlans;

  const availablePeriods = [...new Set(pricingPlans.map(plan => plan.billingPeriod))];

  const handleGetStarted = (plan) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }
    // This will be handled by the payment buttons
    console.log('Selected plan:', plan);
  };

  const handleStripePayment = async (plan) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }

    try {
      const response = await fetch('/api/payments/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          priceId: plan._id,
          billingPeriod: billingPeriod
        })
      });

      const data = await response.json();
      if (data.success) {
        window.location.href = data.url;
      } else {
        toast.error(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      console.error('Stripe payment error:', error);
      toast.error('Failed to process payment');
    }
  };

  const handlePayPalPayment = async (plan) => {
    if (!user) {
      toast.error('Please log in to subscribe');
      return;
    }

    try {
      const response = await fetch('/api/payments/paypal/create-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          priceId: plan._id,
          billingPeriod: billingPeriod
        })
      });

      const data = await response.json();
      if (data.success) {
        window.location.href = data.approvalUrl;
      } else {
        toast.error(data.error || 'Failed to create PayPal subscription');
      }
    } catch (error) {
      console.error('PayPal payment error:', error);
      toast.error('Failed to process payment');
    }
  };

  if (loading) {
    return (
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Loading pricing plans...</p>
          </div>
        </div>
      </div>
    );
  }

  if (pricingPlans.length === 0) {
    return (
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Pricing Plans
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              No pricing plans available at the moment.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">
            Choose Your Plan
          </h2>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Select the perfect plan for your reading journey
          </p>
        </div>



        {/* Pricing Cards */}
        <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
          {filteredPlans.map((plan) => (
            <div
              key={plan._id}
              className={`relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg border-2 transition-all duration-200 hover:shadow-xl w-full max-w-sm ${
                plan.isPopular
                  ? 'border-primary-500 ring-2 ring-primary-200 dark:ring-primary-800'
                  : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600'
              }`}
            >
              {/* Popular Badge */}
              {plan.isPopular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-8">
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  {plan.description && (
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      {plan.description}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="text-center mb-8">
                  <div className="flex items-baseline justify-center">
                    <span className="text-4xl font-bold text-gray-900 dark:text-white">
                      {plan.formattedPrice}
                    </span>
                    {plan.billingPeriod !== 'lifetime' && (
                      <span className="text-gray-600 dark:text-gray-400 ml-1">
                        /{plan.billingPeriod === 'yearly' ? 'year' : 'month'}
                      </span>
                    )}
                  </div>
                  {plan.billingPeriod === 'yearly' && (
                    <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                      Save 20% with annual billing
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="mb-8">
                  <ul className="space-y-3">
                    {plan.features && plan.features.length > 0 ? (
                      plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <div className="flex-shrink-0 mt-0.5">
                            {feature.included ? (
                              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div className="ml-3">
                            <span className={`text-sm ${
                              feature.included 
                                ? 'text-gray-700 dark:text-gray-300' 
                                : 'text-gray-500 dark:text-gray-500 line-through'
                            }`}>
                              {feature.name}
                            </span>
                            {feature.limit && (
                              <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">
                                ({feature.limit})
                              </span>
                            )}
                          </div>
                        </li>
                      ))
                    ) : (
                      <li className="flex items-center text-gray-500 dark:text-gray-400 text-sm">
                        <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Contact us for feature details
                      </li>
                    )}
                  </ul>
                </div>

                {/* Payment Buttons */}
                <div className="space-y-3">
                  {/* Stripe Payment Button */}
                  {paymentConfigs.stripe && (
                    <button
                      onClick={() => handleStripePayment(plan)}
                      className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center space-x-2 ${
                        plan.isPopular
                          ? 'bg-primary-600 hover:bg-primary-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                      }`}
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.591-7.305z"/>
                      </svg>
                      <span>Pay with Stripe</span>
                    </button>
                  )}
                  
                  {/* PayPal Payment Button */}
                  {paymentConfigs.paypal && (
                    <button
                      onClick={() => handlePayPalPayment(plan)}
                      className="w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors flex items-center justify-center space-x-2 bg-yellow-500 text-white hover:bg-yellow-600 dark:bg-yellow-600 dark:hover:bg-yellow-700"
                    >
                      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.26-.93 4.778-4.005 6.405-7.974 6.405h-2.19c-.524 0-.968.382-1.05.9L8.24 20.047h2.65c.524 0 .968-.382 1.05-.9l.429-2.717c.082-.518.526-.9 1.05-.9h.659c3.745 0 6.675-1.52 7.53-5.918.285-1.47.126-2.696-.432-3.595z"/>
                      </svg>
                      <span>Pay with PayPal</span>
                    </button>
                  )}
                  
                  {/* Fallback button if no payment methods configured */}
                  {!paymentConfigs.stripe && !paymentConfigs.paypal && (
                    <button
                      onClick={() => handleGetStarted(plan)}
                      className={`w-full py-3 px-4 rounded-lg font-medium text-sm transition-colors ${
                        plan.isPopular
                          ? 'bg-primary-600 hover:bg-primary-700 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                      }`}
                    >
                      {plan.buttonText || 'Get Started'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Additional Info */}
        <div className="text-center mt-12">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            All plans include 30-day money-back guarantee. No setup fees.
          </p>
          <div className="mt-4 flex justify-center space-x-6 text-sm text-gray-500 dark:text-gray-400">
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Secure Payment
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              24/7 Support
            </div>
            <div className="flex items-center">
              <svg className="w-4 h-4 mr-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              Cancel Anytime
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default PricingSection;