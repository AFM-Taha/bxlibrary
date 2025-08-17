import dbConnect from '../../../lib/mongodb';
import Category from '../../../models/Category';
import Book from '../../../models/Book';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    // Fetch all active categories
    const categories = await Category.find({ deletedAt: null })
      .sort({ name: 1 })
      .lean();

    // Add book count for each category
    const categoriesWithCount = await Promise.all(
      categories.map(async (category) => {
        const bookCount = await Book.countDocuments({
          category: category._id,
          status: 'published',
          isDeleted: { $ne: true }
        });
        return {
          ...category,
          bookCount
        };
      })
    );

    res.status(200).json({
      success: true,
      categories: categoriesWithCount
    });
  } catch (error) {
    console.error('Error fetching public categories:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch categories'
    });
  }
}