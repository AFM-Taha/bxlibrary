import dbConnect from '../../../lib/mongodb';
import PaymentConfig from '../../../models/PaymentConfig';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // Get only active payment configurations without sensitive data
    const configs = await PaymentConfig.find({ isActive: true })
      .select('provider isActive rupantorMerchantId')
      .lean();

    // Format configs for frontend consumption
    const formattedConfigs = {};
    configs.forEach(config => {
      if (config.isActive) {
        formattedConfigs[config.provider] = {
          provider: config.provider,
          isActive: config.isActive,
          ...(config.provider === 'rupantor' && { merchantId: config.rupantorMerchantId })
        };
      }
    });

    res.status(200).json({
      success: true,
      configs: formattedConfigs
    });
  } catch (error) {
    console.error('Get public payment configs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}