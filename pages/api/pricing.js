import dbConnect from '../../lib/mongodb';
import Pricing from '../../models/Pricing';

export default async function handler(req, res) {
  await dbConnect();

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // Get only active pricing plans, sorted by sortOrder
    const pricingPlans = await Pricing.find({ isActive: true })
      .select('-createdBy -updatedBy -__v')
      .sort({ sortOrder: 1, createdAt: 1 })
      .lean();

    // Add formatted price to each plan
    const formattedPlans = pricingPlans.map(plan => {
      const currencySymbols = {
        USD: '$',
        EUR: '€',
        GBP: '£',
        INR: '₹'
      };
      
      const symbol = currencySymbols[plan.currency] || '$';
      
      return {
        ...plan,
        formattedPrice: `${symbol}${plan.price}`
      };
    });

    res.status(200).json({
      success: true,
      pricingPlans: formattedPlans
    });
  } catch (error) {
    console.error('Get public pricing plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}