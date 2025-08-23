import { buffer } from 'micro';
import Stripe from 'stripe';
import dbConnect from '../../../lib/mongodb';
import Subscription from '../../../models/Subscription';
import User from '../../../models/User';
import PaymentConfig from '../../../models/PaymentConfig';

// Disable body parsing for webhooks
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get Stripe configuration
    const stripeConfig = await PaymentConfig.findOne({
      provider: 'stripe',
      isActive: true
    });

    if (!stripeConfig) {
      return res.status(400).json({ error: 'Stripe not configured' });
    }

    const stripe = new Stripe(stripeConfig.secretKey);
    const endpointSecret = stripeConfig.webhookSecret;

    if (!endpointSecret) {
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
      event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: 'Webhook signature verification failed' });
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleCheckoutCompleted(session) {
  try {
    const { customer, subscription: stripeSubscriptionId, metadata } = session;
    const { userId, priceId, billingPeriod } = metadata;

    if (!userId || !priceId) {
      console.error('Missing metadata in checkout session');
      return;
    }

    // Find or create subscription record
    let subscription = await Subscription.findOne({
      user: userId,
      stripeSubscriptionId
    });

    if (!subscription) {
      subscription = new Subscription({
        user: userId,
        pricingPlan: priceId,
        provider: 'stripe',
        stripeSubscriptionId,
        stripeCustomerId: customer,
        billingPeriod,
        status: 'active',
        amount: session.amount_total / 100, // Convert from cents
        currency: session.currency.toUpperCase(),
        startDate: new Date(),
        metadata: {
          sessionId: session.id
        }
      });
      await subscription.save();
    }

    console.log('Checkout completed for subscription:', stripeSubscriptionId);
  } catch (error) {
    console.error('Error handling checkout completed:', error);
  }
}

async function handleSubscriptionCreated(stripeSubscription) {
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    });

    if (subscription) {
      subscription.status = stripeSubscription.status;
      subscription.startDate = new Date(stripeSubscription.current_period_start * 1000);
      subscription.endDate = new Date(stripeSubscription.current_period_end * 1000);
      subscription.nextBillingDate = new Date(stripeSubscription.current_period_end * 1000);
      await subscription.save();
    }

    console.log('Subscription created:', stripeSubscription.id);
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(stripeSubscription) {
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    });

    if (subscription) {
      subscription.status = stripeSubscription.status;
      subscription.endDate = new Date(stripeSubscription.current_period_end * 1000);
      subscription.nextBillingDate = new Date(stripeSubscription.current_period_end * 1000);
      
      if (stripeSubscription.canceled_at) {
        subscription.canceledAt = new Date(stripeSubscription.canceled_at * 1000);
      }
      
      await subscription.save();
    }

    console.log('Subscription updated:', stripeSubscription.id);
  } catch (error) {
    console.error('Error handling subscription updated:', error);
  }
}

async function handleSubscriptionDeleted(stripeSubscription) {
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: stripeSubscription.id
    });

    if (subscription) {
      subscription.status = 'canceled';
      subscription.canceledAt = new Date();
      await subscription.save();
    }

    console.log('Subscription deleted:', stripeSubscription.id);
  } catch (error) {
    console.error('Error handling subscription deleted:', error);
  }
}

async function handlePaymentSucceeded(invoice) {
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });

    if (subscription) {
      subscription.lastPaymentDate = new Date(invoice.created * 1000);
      subscription.lastPaymentAmount = invoice.amount_paid / 100;
      subscription.failedPaymentAttempts = 0;
      subscription.status = 'active';
      await subscription.save();
    }

    console.log('Payment succeeded for subscription:', invoice.subscription);
  } catch (error) {
    console.error('Error handling payment succeeded:', error);
  }
}

async function handlePaymentFailed(invoice) {
  try {
    const subscription = await Subscription.findOne({
      stripeSubscriptionId: invoice.subscription
    });

    if (subscription) {
      subscription.failedPaymentAttempts = (subscription.failedPaymentAttempts || 0) + 1;
      subscription.status = 'past_due';
      await subscription.save();
    }

    console.log('Payment failed for subscription:', invoice.subscription);
  } catch (error) {
    console.error('Error handling payment failed:', error);
  }
}