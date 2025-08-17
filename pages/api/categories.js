import dbConnect from '../../lib/mongodb';
import Category from '../../models/Category';
import { withAuth } from '../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Fetch all active categories
    const categories = await Category.find({ deletedAt: null })
      .sort({ name: 1 })
      .lean();

    res.status(200).json({
      success: true,
      categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
}

export default withAuth(handler);