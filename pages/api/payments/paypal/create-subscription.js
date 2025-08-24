import dbConnect from '../../../../lib/mongodb';
import PaymentConfig from '../../../../models/PaymentConfig';
import Pricing from '../../../../models/Pricing';
import { verifyToken } from '../../../../lib/jwt';
import User from '../../../../models/User';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await dbConnect();

  try {
    // Verify authentication
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get PayPal configuration
    const paypalConfig = await PaymentConfig.findOne({ 
      provider: 'paypal', 
      isActive: true 
    });

    if (!paypalConfig) {
      return res.status(400).json({ error: 'PayPal payment is not configured' });
    }

    const { priceId, billingPeriod = 'monthly' } = req.body;

    if (!priceId) {
      return res.status(400).json({ error: 'Price ID is required' });
    }

    // Get pricing plan details
    const pricingPlan = await Pricing.findById(priceId);
    if (!pricingPlan || !pricingPlan.isActive) {
      return res.status(404).json({ error: 'Pricing plan not found or inactive' });
    }

    // Calculate price based on billing period
    let price;
    if (pricingPlan.billingPeriod === 'lifetime') {
      // For lifetime plans, use the plan's price directly
      price = pricingPlan.price;
    } else if (billingPeriod === 'yearly') {
      price = pricingPlan.price * 12 * 0.8; // 20% discount for yearly
    } else {
      price = pricingPlan.price;
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken(paypalConfig);
    if (!accessToken) {
      return res.status(500).json({ error: 'Failed to authenticate with PayPal' });
    }

    // Create PayPal subscription
    const subscriptionData = {
      plan_id: await getOrCreatePayPalPlan(paypalConfig, pricingPlan, billingPeriod, price, accessToken),
      subscriber: {
        email_address: user.email,
        name: {
          given_name: user.name.split(' ')[0] || user.name,
          surname: user.name.split(' ').slice(1).join(' ') || 'User'
        }
      },
      application_context: {
        brand_name: 'BX Library',
        locale: 'en-US',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'SUBSCRIBE_NOW',
        payment_method: {
          payer_selected: 'PAYPAL',
          payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED'
        },
        return_url: `${req.headers.origin}/payment/paypal/success`,
        cancel_url: `${req.headers.origin}/pricing?canceled=true`
      },
      custom_id: `${user._id}_${priceId}_${billingPeriod}`
    };

    const response = await fetch(`${getPayPalBaseURL(paypalConfig.environment)}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json',
        'PayPal-Request-Id': `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      },
      body: JSON.stringify(subscriptionData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayPal subscription creation error:', errorData);
      return res.status(500).json({ error: 'Failed to create PayPal subscription' });
    }

    const subscription = await response.json();
    const approvalLink = subscription.links.find(link => link.rel === 'approve');

    return res.status(200).json({
      success: true,
      subscriptionId: subscription.id,
      approvalUrl: approvalLink?.href
    });

  } catch (error) {
    console.error('PayPal subscription error:', error);
    return res.status(500).json({ 
      error: 'Failed to create PayPal subscription',
      details: error.message 
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

// Helper function to get or create PayPal billing plan
async function getOrCreatePayPalPlan(config, pricingPlan, billingPeriod, price, accessToken) {
  try {
    // For simplicity, we'll create a new plan each time
    // In production, you might want to cache and reuse plans
    const planData = {
      product_id: await getOrCreatePayPalProduct(config, pricingPlan, accessToken),
      name: `${pricingPlan.name} - ${billingPeriod}`,
      description: pricingPlan.description,
      status: 'ACTIVE',
      billing_cycles: [
        {
          frequency: {
            interval_unit: pricingPlan.billingPeriod === 'lifetime' ? 'YEAR' : (billingPeriod === 'yearly' ? 'YEAR' : 'MONTH'),
            interval_count: 1
          },
          tenure_type: 'REGULAR',
          sequence: 1,
          total_cycles: pricingPlan.billingPeriod === 'lifetime' ? 99 : 0, // 99 years for lifetime, infinite for others
          pricing_scheme: {
            fixed_price: {
              value: price.toFixed(2),
              currency_code: pricingPlan.currency
            }
          }
        }
      ],
      payment_preferences: {
        auto_bill_outstanding: true,
        setup_fee_failure_action: 'CONTINUE',
        payment_failure_threshold: 3
      }
    };

    const response = await fetch(`${getPayPalBaseURL(config.environment)}/v1/billing/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(planData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayPal plan creation error:', errorData);
      throw new Error('Failed to create PayPal plan');
    }

    const plan = await response.json();
    return plan.id;
  } catch (error) {
    console.error('PayPal plan creation error:', error);
    throw error;
  }
}

// Helper function to get or create PayPal product
async function getOrCreatePayPalProduct(config, pricingPlan, accessToken) {
  try {
    const productData = {
      name: pricingPlan.name,
      description: pricingPlan.description || `${pricingPlan.name} subscription plan`,
      type: 'SERVICE',
      category: 'SOFTWARE'
    };

    const response = await fetch(`${getPayPalBaseURL(config.environment)}/v1/catalogs/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('PayPal product creation error:', errorData);
      throw new Error('Failed to create PayPal product');
    }

    const product = await response.json();
    return product.id;
  } catch (error) {
    console.error('PayPal product creation error:', error);
    throw error;
  }
}

// Helper function to get PayPal base URL
function getPayPalBaseURL(environment) {
  return environment === 'production' 
    ? 'https://api.paypal.com' 
    : 'https://api.sandbox.paypal.com';
}