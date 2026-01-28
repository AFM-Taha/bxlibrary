import dbConnect from '../../../../lib/mongodb';
import PaymentConfig from '../../../../models/PaymentConfig';
import { verifyToken } from '../../../../lib/jwt';
import User from '../../../../models/User';

export default async function handler(req, res) {
  await dbConnect();

  // Verify authentication
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    switch (req.method) {
      case 'GET':
        return await getPaymentConfigs(req, res);
      case 'POST':
        return await createPaymentConfig(req, res, user);
      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Payment config API error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getPaymentConfigs(req, res) {
  try {
    const configs = await PaymentConfig.find({})
      .select('-stripeSecretKey -paypalClientSecret')
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      configs
    });
  } catch (error) {
    console.error('Error fetching payment configs:', error);
    return res.status(500).json({ error: 'Failed to fetch payment configurations' });
  }
}

async function createPaymentConfig(req, res, user) {
  try {
    const {
      provider,
      isActive,
      stripePublishableKey,
      stripeSecretKey,
      stripeWebhookSecret,
      paypalClientId,
      paypalClientSecret,
      paypalWebhookId,
      environment,
      defaultCurrency,
      supportedCurrencies,
      settings
    } = req.body;

    // Validation
    if (!provider || !['rupantor'].includes(provider)) {
      return res.status(400).json({ error: 'Valid provider is required (rupantor)' });
    }

    // Check if provider config already exists
    const existingConfig = await PaymentConfig.findOne({ provider });
    if (existingConfig) {
      return res.status(400).json({ error: `Configuration for ${provider} already exists` });
    }

    // Provider-specific validation
    if (provider === 'rupantor') {
      if (!req.body.rupantorApiKey || !req.body.rupantorMerchantId || !req.body.rupantorSecretKey) {
        return res.status(400).json({ error: 'RupantorPay credentials are required' });
      }
    }

    // If setting this config as active, deactivate others of the same provider
    if (isActive) {
      await PaymentConfig.updateMany(
        { provider },
        { isActive: false }
      );
    }

    const configData = {
      provider,
      isActive: isActive || false,
      environment: environment || 'sandbox',
      defaultCurrency: defaultCurrency || 'USD',
      supportedCurrencies: supportedCurrencies || ['USD', 'EUR', 'GBP'],
      settings: settings || {},
      createdBy: user._id
    };

    // Add provider-specific fields
    if (provider === 'rupantor') {
      configData.rupantorApiKey = req.body.rupantorApiKey;
      configData.rupantorMerchantId = req.body.rupantorMerchantId;
      configData.rupantorSecretKey = req.body.rupantorSecretKey;
    }

    const config = new PaymentConfig(configData);
    await config.save();

    // Return config without sensitive data
    const responseConfig = await PaymentConfig.findById(config._id)
      .select('-rupantorSecretKey')
      .populate('createdBy', 'name email');

    return res.status(201).json({
      success: true,
      message: `${provider} configuration created successfully`,
      config: responseConfig
    });
  } catch (error) {
    console.error('Error creating payment config:', error);
    return res.status(500).json({ error: 'Failed to create payment configuration' });
  }
}