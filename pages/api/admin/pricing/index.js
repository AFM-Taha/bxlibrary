import dbConnect from '../../../../lib/mongodb';
import { verifyToken } from '../../../../lib/jwt';
import Pricing from '../../../../models/Pricing';
import User from '../../../../models/User';

export default async function handler(req, res) {
  await dbConnect();

  // Verify authentication
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  let decoded;
  try {
    decoded = verifyToken(token);
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  // Get user and verify admin role
  const user = await User.findById(decoded.userId);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  req.user = user;

  switch (req.method) {
    case 'GET':
      return await getPricingPlans(req, res);
    case 'POST':
      return await createPricingPlan(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

async function getPricingPlans(req, res) {
  try {
    const { page = 1, limit = 20, search = '', status = 'all' } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    if (status !== 'all') {
      query.isActive = status === 'active';
    }

    // Get total count
    const totalCount = await Pricing.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Get pricing plans
    const pricingPlans = await Pricing.find(query)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email')
      .sort({ sortOrder: 1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    res.status(200).json({
      success: true,
      pricingPlans,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get pricing plans error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createPricingPlan(req, res) {
  try {
    const {
      name,
      description,
      price,
      currency = 'USD',
      billingPeriod = 'monthly',
      features = [],
      isPopular = false,
      isActive = true,
      sortOrder = 0,
      buttonText = 'Get Started',
      buttonLink
    } = req.body;

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Plan name is required' });
    }

    if (price === undefined || price === null || price < 0) {
      return res.status(400).json({ error: 'Valid price is required' });
    }

    if (!['monthly', 'yearly', 'lifetime'].includes(billingPeriod)) {
      return res.status(400).json({ error: 'Invalid billing period' });
    }

    if (!['USD', 'EUR', 'GBP', 'INR'].includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }

    // Check if plan name already exists
    const existingPlan = await Pricing.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') }
    });

    if (existingPlan) {
      return res.status(400).json({ error: 'A pricing plan with this name already exists' });
    }

    // Create pricing plan
    const pricingPlan = new Pricing({
      name: name.trim(),
      description: description?.trim() || '',
      price,
      currency,
      billingPeriod,
      features,
      isPopular,
      isActive,
      sortOrder,
      buttonText: buttonText?.trim() || 'Get Started',
      buttonLink: buttonLink?.trim() || '',
      createdBy: req.user._id
    });

    await pricingPlan.save();

    // Populate for response
    await pricingPlan.populate('createdBy', 'name email');

    res.status(201).json({
      success: true,
      message: 'Pricing plan created successfully',
      pricingPlan
    });
  } catch (error) {
    console.error('Create pricing plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}