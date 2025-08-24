import dbConnect from '../../../lib/mongodb';
import PaymentSession from '../../../models/PaymentSession';
import PaymentConfig from '../../../models/PaymentConfig';
import User from '../../../models/User';
import Subscription from '../../../models/Subscription';
const stripe = require('stripe');

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    const { sessionId, subscriptionId } = req.body;

    if (!sessionId && !subscriptionId) {
      return res.status(400).json({ error: 'Session ID or Subscription ID required' });
    }

    let paymentData = null;
    let userExists = false;

    // Handle Stripe payment verification
    if (sessionId) {
      const stripeConfig = await PaymentConfig.findOne({ 
        provider: 'stripe', 
        isActive: true 
      });

      if (!stripeConfig) {
        return res.status(400).json({ error: 'Stripe payment is not configured' });
      }

      const stripeInstance = stripe(stripeConfig.stripeSecretKey);
      const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

      if (!session) {
        return res.status(404).json({ error: 'Payment session not found' });
      }

      // Check if this is a guest session
      const isGuestSession = session.metadata?.guestSession === 'true';
      
      if (isGuestSession) {
        // Find payment session by sessionId from metadata
        const guestSessionId = session.metadata?.sessionId;
        const paymentSession = await PaymentSession.findOne({ sessionId: guestSessionId });
        
        if (paymentSession) {
          paymentData = {
            success: true,
            provider: 'stripe',
            sessionId: sessionId,
            guestSessionId: guestSessionId,
            amount: session.amount_total / 100,
            currency: session.currency.toUpperCase(),
            customerEmail: session.customer_details?.email,
            planId: session.metadata?.priceId,
            planName: session.metadata?.planName,
            billingPeriod: session.metadata?.billingPeriod,
            status: session.payment_status
          };
        }
      } else {
        // Existing user flow
        const userId = session.metadata?.userId;
        if (userId) {
          const user = await User.findById(userId);
          userExists = !!user;
        }
        
        paymentData = {
          success: true,
          provider: 'stripe',
          sessionId: sessionId,
          amount: session.amount_total / 100,
          currency: session.currency.toUpperCase(),
          customerEmail: session.customer_details?.email,
          planId: session.metadata?.priceId,
          planName: session.metadata?.planName,
          billingPeriod: session.metadata?.billingPeriod,
          status: session.payment_status,
          userId: userId
        };
      }
    }

    // Handle PayPal payment verification
    if (subscriptionId) {
      const paypalConfig = await PaymentConfig.findOne({ 
        provider: 'paypal', 
        isActive: true 
      });

      if (!paypalConfig) {
        return res.status(400).json({ error: 'PayPal payment is not configured' });
      }

      // Get PayPal access token
      const accessToken = await getPayPalAccessToken(paypalConfig);
      if (!accessToken) {
        return res.status(500).json({ error: 'Failed to authenticate with PayPal' });
      }

      // Get subscription details from PayPal
      const response = await fetch(`${getPayPalBaseURL(paypalConfig.environment)}/v1/billing/subscriptions/${subscriptionId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/json'
        }
      });

      if (!response.ok) {
        return res.status(404).json({ error: 'PayPal subscription not found' });
      }

      const subscription = await response.json();
      const customId = subscription.custom_id;

      // Check if this is a guest session
      const isGuestSession = customId?.startsWith('session_');
      
      if (isGuestSession) {
        const guestSessionId = customId.replace('session_', '');
        const paymentSession = await PaymentSession.findOne({ sessionId: guestSessionId });
        
        if (paymentSession) {
          paymentData = {
            success: true,
            provider: 'paypal',
            subscriptionId: subscriptionId,
            guestSessionId: guestSessionId,
            amount: parseFloat(subscription.billing_info?.last_payment?.amount?.value || 0),
            currency: subscription.billing_info?.last_payment?.amount?.currency_code || 'USD',
            customerEmail: subscription.subscriber?.email_address,
            status: subscription.status
          };
        }
      } else {
        // Existing user flow
        const [userId] = customId?.split('_') || [];
        if (userId) {
          const user = await User.findById(userId);
          userExists = !!user;
        }
        
        paymentData = {
          success: true,
          provider: 'paypal',
          subscriptionId: subscriptionId,
          amount: parseFloat(subscription.billing_info?.last_payment?.amount?.value || 0),
          currency: subscription.billing_info?.last_payment?.amount?.currency_code || 'USD',
          customerEmail: subscription.subscriber?.email_address,
          status: subscription.status,
          userId: userId
        };
      }
    }

    if (!paymentData) {
      return res.status(404).json({ error: 'Payment data not found' });
    }

    return res.status(200).json({
      ...paymentData,
      userExists: userExists
    });

  } catch (error) {
    console.error('Payment verification error:', error);
    return res.status(500).json({ 
      error: 'Failed to verify payment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

// Helper function to get PayPal access token
async function getPayPalAccessToken(config) {
  try {
    const auth = Buffer.from(`${config.paypalClientId}:${config.paypalClientSecret}`).toString('base64');
    
    const response = await fetch(`${getPayPalBaseURL(config.environment)}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!response.ok) {
      console.error('PayPal auth error:', await response.text());
      return null;
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('PayPal access token error:', error);
    return null;
  }
}

// Helper function to get PayPal base URL
function getPayPalBaseURL(environment) {
  return environment === 'live' 
    ? 'https://api.paypal.com' 
    : 'https://api.sandbox.paypal.com';
}