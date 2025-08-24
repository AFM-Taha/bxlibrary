import dbConnect from '../../../../lib/mongodb';
import PaymentConfig from '../../../../models/PaymentConfig';
import Pricing from '../../../../models/Pricing';
import PaymentSession from '../../../../models/PaymentSession';
const stripe = require('stripe');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // Get Stripe configuration
    const stripeConfig = await PaymentConfig.findOne({ 
      provider: 'stripe', 
      isActive: true 
    });

    if (!stripeConfig) {
      return res.status(400).json({ error: 'Stripe payment is not configured' });
    }

    const stripeInstance = stripe(stripeConfig.stripeSecretKey);

    const { priceId, billingPeriod = 'monthly', customerEmail } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Get pricing plan details
    const pricingPlan = await Pricing.findById(priceId);
    if (!pricingPlan || !pricingPlan.isActive) {
      return res.status(404).json({ error: 'Pricing plan not found or inactive' });
    }

    // Calculate price based on billing period
    const price = billingPeriod === 'yearly' 
      ? pricingPlan.price * 12 * 0.8 // 20% discount for yearly
      : pricingPlan.price;

    // Generate a unique session ID for tracking
    const sessionId = `guest_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create Stripe checkout session
    const session = await stripeInstance.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: pricingPlan.currency.toLowerCase(),
            product_data: {
              name: pricingPlan.name,
              description: pricingPlan.description,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
            recurring: {
              interval: billingPeriod === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${req.headers.origin}/payment/success?session_id={CHECKOUT_SESSION_ID}&provider=stripe`,
      cancel_url: `${req.headers.origin}/pricing?canceled=true`,
      customer_email: customerEmail,
      metadata: {
        guestSession: 'true',
        sessionId: sessionId,
        priceId: priceId,
        billingPeriod: billingPeriod,
        planName: pricingPlan.name
      },
      subscription_data: {
        metadata: {
          guestSession: 'true',
          sessionId: sessionId,
          priceId: priceId,
          billingPeriod: billingPeriod,
          planName: pricingPlan.name
        }
      }
    });

    // Create a payment session record for tracking
    const paymentSession = new PaymentSession({
      sessionId: sessionId,
      provider: 'stripe',
      planId: priceId,
      planDetails: {
        name: pricingPlan.name,
        price: price,
        currency: pricingPlan.currency,
        billingPeriod: billingPeriod,
        features: pricingPlan.features || []
      },
      amount: price,
      currency: pricingPlan.currency,
      status: 'pending',
      customerEmail: customerEmail,
      paymentIntentId: session.id,
      metadata: {
        stripeSessionId: session.id,
        createdFrom: 'guest-checkout'
      }
    });

    await paymentSession.save();

    return res.status(200).json({
      success: true,
      sessionId: session.id,
      url: session.url,
      guestSessionId: sessionId
    });

  } catch (error) {
    console.error('Stripe guest checkout error:', error);
    return res.status(500).json({ 
      error: 'Failed to create checkout session',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}