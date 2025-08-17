import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import Book from '../../../models/Book';
import Category from '../../../models/Category';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Get public statistics
    const [totalBooks, totalCategories, totalUsers] = await Promise.all([
      Book.countDocuments({ status: 'published' }),
      Category.countDocuments({ deletedAt: null }),
      User.countDocuments({ status: 'active' })
    ]);

    const stats = {
      totalBooks,
      totalCategories,
      totalUsers
    };

    res.status(200).json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Error fetching public stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics'
    });
  }
}