import dbConnect from '../../../../lib/mongodb';
import { verifyToken } from '../../../../lib/jwt';
import Pricing from '../../../../models/Pricing';
import User from '../../../../models/User';
import mongoose from 'mongoose';

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

  const { id } = req.query;

  // Validate ObjectId
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid pricing plan ID' });
  }

  switch (req.method) {
    case 'GET':
      return await getPricingPlan(req, res, id);
    case 'PUT':
      return await updatePricingPlan(req, res, id);
    case 'DELETE':
      return await deletePricingPlan(req, res, id);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}

async function getPricingPlan(req, res, planId) {
  try {
    const pricingPlan = await Pricing.findById(planId)
      .populate('createdBy', 'name email')
      .populate('updatedBy', 'name email');

    if (!pricingPlan) {
      return res.status(404).json({ error: 'Pricing plan not found' });
    }

    res.status(200).json({
      success: true,
      pricingPlan
    });
  } catch (error) {
    console.error('Get pricing plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updatePricingPlan(req, res, planId) {
  try {
    const {
      name,
      description,
      price,
      currency,
      billingPeriod,
      features,
      isPopular,
      isActive,
      sortOrder,
      buttonText,
      buttonLink
    } = req.body;

    // Find pricing plan
    const pricingPlan = await Pricing.findById(planId);
    if (!pricingPlan) {
      return res.status(404).json({ error: 'Pricing plan not found' });
    }

    let hasChanges = false;

    // Update name
    if (name && name.trim() !== pricingPlan.name) {
      if (name.trim().length === 0) {
        return res.status(400).json({ error: 'Plan name is required' });
      }

      // Check if new name already exists
      const existingPlan = await Pricing.findOne({ 
        name: { $regex: new RegExp(`^${name.trim()}$`, 'i') },
        _id: { $ne: planId }
      });

      if (existingPlan) {
        return res.status(400).json({ error: 'A pricing plan with this name already exists' });
      }

      pricingPlan.name = name.trim();
      hasChanges = true;
    }

    // Update description
    if (description !== undefined && description !== pricingPlan.description) {
      pricingPlan.description = description?.trim() || '';
      hasChanges = true;
    }

    // Update price
    if (price !== undefined && price !== pricingPlan.price) {
      if (price < 0) {
        return res.status(400).json({ error: 'Price cannot be negative' });
      }
      pricingPlan.price = price;
      hasChanges = true;
    }

    // Update currency
    if (currency && currency !== pricingPlan.currency) {
      if (!['USD', 'EUR', 'GBP', 'INR'].includes(currency)) {
        return res.status(400).json({ error: 'Invalid currency' });
      }
      pricingPlan.currency = currency;
      hasChanges = true;
    }

    // Update billing period
    if (billingPeriod && billingPeriod !== pricingPlan.billingPeriod) {
      if (!['monthly', 'yearly', 'lifetime'].includes(billingPeriod)) {
        return res.status(400).json({ error: 'Invalid billing period' });
      }
      pricingPlan.billingPeriod = billingPeriod;
      hasChanges = true;
    }

    // Update features
    if (features !== undefined) {
      pricingPlan.features = features;
      hasChanges = true;
    }

    // Update boolean fields
    if (isPopular !== undefined && isPopular !== pricingPlan.isPopular) {
      pricingPlan.isPopular = isPopular;
      hasChanges = true;
    }

    if (isActive !== undefined && isActive !== pricingPlan.isActive) {
      pricingPlan.isActive = isActive;
      hasChanges = true;
    }

    // Update sort order
    if (sortOrder !== undefined && sortOrder !== pricingPlan.sortOrder) {
      pricingPlan.sortOrder = sortOrder;
      hasChanges = true;
    }

    // Update button text
    if (buttonText !== undefined && buttonText !== pricingPlan.buttonText) {
      pricingPlan.buttonText = buttonText?.trim() || 'Get Started';
      hasChanges = true;
    }

    // Update button link
    if (buttonLink !== undefined && buttonLink !== pricingPlan.buttonLink) {
      pricingPlan.buttonLink = buttonLink?.trim() || '';
      hasChanges = true;
    }

    if (!hasChanges) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    pricingPlan.updatedBy = req.user._id;
    await pricingPlan.save();

    // Populate for response
    await pricingPlan.populate('createdBy', 'name email');
    await pricingPlan.populate('updatedBy', 'name email');

    res.status(200).json({
      success: true,
      message: 'Pricing plan updated successfully',
      pricingPlan
    });
  } catch (error) {
    console.error('Update pricing plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deletePricingPlan(req, res, planId) {
  try {
    const pricingPlan = await Pricing.findById(planId);
    if (!pricingPlan) {
      return res.status(404).json({ error: 'Pricing plan not found' });
    }

    await Pricing.findByIdAndDelete(planId);

    res.status(200).json({
      success: true,
      message: 'Pricing plan deleted successfully'
    });
  } catch (error) {
    console.error('Delete pricing plan error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}