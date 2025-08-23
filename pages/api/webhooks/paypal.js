import crypto from 'crypto';
import dbConnect from '../../../lib/mongodb';
import Subscription from '../../../models/Subscription';
import User from '../../../models/User';
import PaymentConfig from '../../../models/PaymentConfig';
import PaymentSession from '../../../models/PaymentSession';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get PayPal configuration
    const paypalConfig = await PaymentConfig.findOne({
      provider: 'paypal',
      isActive: true
    });

    if (!paypalConfig) {
      return res.status(400).json({ error: 'PayPal not configured' });
    }

    // Verify webhook signature (if webhook ID is configured)
    if (paypalConfig.webhookId) {
      const isValid = await verifyPayPalWebhook(req, paypalConfig);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid webhook signature' });
      }
    }

    const event = req.body;
    const eventType = event.event_type;

    console.log('PayPal webhook event:', eventType);

    // Handle different event types
    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        await handleSubscriptionActivated(event);
        break;
      
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        await handleSubscriptionCancelled(event);
        break;
      
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
        await handleSubscriptionSuspended(event);
        break;
      
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
        await handlePaymentFailed(event);
        break;
      
      case 'PAYMENT.SALE.COMPLETED':
        await handlePaymentCompleted(event);
        break;
      
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        await handleSubscriptionExpired(event);
        break;
      
      default:
        console.log(`Unhandled PayPal event type: ${eventType}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function verifyPayPalWebhook(req, paypalConfig) {
  try {
    // Get PayPal access token
    const tokenResponse = await fetch(`${paypalConfig.environment === 'sandbox' ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com'}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Accept-Language': 'en_US',
        'Authorization': `Basic ${Buffer.from(`${paypalConfig.clientId}:${paypalConfig.clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Verify webhook signature
    const verifyResponse = await fetch(`${paypalConfig.environment === 'sandbox' ? 'https://api.sandbox.paypal.com' : 'https://api.paypal.com'}/v1/notifications/verify-webhook-signature`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        auth_algo: req.headers['paypal-auth-algo'],
        cert_id: req.headers['paypal-cert-id'],
        transmission_id: req.headers['paypal-transmission-id'],
        transmission_sig: req.headers['paypal-transmission-sig'],
        transmission_time: req.headers['paypal-transmission-time'],
        webhook_id: paypalConfig.webhookId,
        webhook_event: req.body
      })
    });

    const verifyData = await verifyResponse.json();
    return verifyData.verification_status === 'SUCCESS';
  } catch (error) {
    console.error('PayPal webhook verification error:', error);
    return false;
  }
}

async function handleSubscriptionActivated(event) {
  try {
    const subscriptionId = event.resource.id;
    const customId = event.resource.custom_id; // Should contain userId and priceId or sessionId
    
    if (!customId) {
      console.error('No custom_id found in PayPal subscription');
      return;
    }

    // Check if this is a payment session for new user signup (customId format: session_<sessionId>)
    if (customId.startsWith('session_')) {
      const sessionId = customId.replace('session_', '');
      let paymentSession = await PaymentSession.findOne({
        sessionId: sessionId,
        provider: 'paypal'
      });

      if (paymentSession) {
        // Update payment session status
        paymentSession.status = 'completed';
        paymentSession.subscriptionId = subscriptionId;
        paymentSession.customerEmail = event.resource.subscriber?.email_address;
        
        // Generate signup token if not already generated
        if (!paymentSession.signupToken) {
          paymentSession.generateSignupToken();
        }
        
        await paymentSession.save();
        console.log('PayPal payment session updated for new user signup:', sessionId);
        return;
      }
    }

    // Existing user flow (customId format: userId|priceId)
    const [userId, priceId] = customId.split('|');
    
    if (!userId || !priceId) {
      console.error('Invalid custom_id format in PayPal subscription');
      return;
    }

    // Find existing subscription or create new one for existing users
    let subscription = await Subscription.findOne({
      paypalSubscriptionId: subscriptionId
    });

    if (!subscription) {
      const billingCycle = event.resource.billing_info.cycle_executions[0];
      const amount = parseFloat(event.resource.billing_info.last_payment.amount.value);
      
      subscription = new Subscription({
        user: userId,
        pricingPlan: priceId,
        provider: 'paypal',
        paypalSubscriptionId: subscriptionId,
        paypalPayerId: event.resource.subscriber?.payer_id,
        billingPeriod: billingCycle.tenure_type === 'MONTHLY' ? 'monthly' : 'yearly',
        status: 'active',
        amount: amount,
        currency: event.resource.billing_info.last_payment.amount.currency_code,
        startDate: new Date(event.resource.start_time),
        metadata: {
          paypalEventId: event.id
        }
      });
    } else {
      subscription.status = 'active';
      subscription.startDate = new Date(event.resource.start_time);
    }

    await subscription.save();
    console.log('PayPal subscription activated:', subscriptionId);
  } catch (error) {
    console.error('Error handling PayPal subscription activated:', error);
  }
}

async function handleSubscriptionCancelled(event) {
  try {
    const subscriptionId = event.resource.id;
    
    const subscription = await Subscription.findOne({
      paypalSubscriptionId: subscriptionId
    });

    if (subscription) {
      subscription.status = 'canceled';
      subscription.canceledAt = new Date();
      await subscription.save();
    }

    console.log('PayPal subscription cancelled:', subscriptionId);
  } catch (error) {
    console.error('Error handling PayPal subscription cancelled:', error);
  }
}

async function handleSubscriptionSuspended(event) {
  try {
    const subscriptionId = event.resource.id;
    
    const subscription = await Subscription.findOne({
      paypalSubscriptionId: subscriptionId
    });

    if (subscription) {
      subscription.status = 'inactive';
      await subscription.save();
    }

    console.log('PayPal subscription suspended:', subscriptionId);
  } catch (error) {
    console.error('Error handling PayPal subscription suspended:', error);
  }
}

async function handlePaymentFailed(event) {
  try {
    const subscriptionId = event.resource.id;
    
    const subscription = await Subscription.findOne({
      paypalSubscriptionId: subscriptionId
    });

    if (subscription) {
      subscription.failedPaymentAttempts = (subscription.failedPaymentAttempts || 0) + 1;
      subscription.status = 'past_due';
      await subscription.save();
    }

    console.log('PayPal payment failed for subscription:', subscriptionId);
  } catch (error) {
    console.error('Error handling PayPal payment failed:', error);
  }
}

async function handlePaymentCompleted(event) {
  try {
    const billingAgreementId = event.resource.billing_agreement_id;
    const customId = event.resource.custom;
    
    // Check if this is a payment session for new user signup
    if (customId && customId.startsWith('session_')) {
      const sessionId = customId.replace('session_', '');
      let paymentSession = await PaymentSession.findOne({
        sessionId: sessionId,
        provider: 'paypal'
      });

      if (paymentSession) {
        // Update payment session status
        paymentSession.status = 'completed';
        paymentSession.paymentIntentId = event.resource.id;
        
        // Generate signup token if not already generated
        if (!paymentSession.signupToken) {
          paymentSession.generateSignupToken();
        }
        
        await paymentSession.save();
        console.log('PayPal payment completed for new user signup:', sessionId);
        return;
      }
    }
    
    if (!billingAgreementId) {
      console.log('No billing agreement ID found in payment completed event');
      return;
    }

    const subscription = await Subscription.findOne({
      paypalSubscriptionId: billingAgreementId
    });

    if (subscription) {
      subscription.lastPaymentDate = new Date(event.resource.create_time);
      subscription.lastPaymentAmount = parseFloat(event.resource.amount.total);
      subscription.failedPaymentAttempts = 0;
      subscription.status = 'active';
      await subscription.save();
    }

    console.log('PayPal payment completed for subscription:', billingAgreementId);
  } catch (error) {
    console.error('Error handling PayPal payment completed:', error);
  }
}

async function handleSubscriptionExpired(event) {
  try {
    const subscriptionId = event.resource.id;
    
    const subscription = await Subscription.findOne({
      paypalSubscriptionId: subscriptionId
    });

    if (subscription) {
      subscription.status = 'canceled';
      subscription.endDate = new Date();
      await subscription.save();
    }

    console.log('PayPal subscription expired:', subscriptionId);
  } catch (error) {
    console.error('Error handling PayPal subscription expired:', error);
  }
}