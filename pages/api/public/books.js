import dbConnect from '../../../lib/mongodb';
import Book from '../../../models/Book';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const {
      limit = 12,
      sort = 'newest'
    } = req.query;

    const limitNum = parseInt(limit);

    // Build query for public access - only published books
    const query = { 
      status: 'published',
      isDeleted: { $ne: true }
    };

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'title':
        sortObj = { title: 1 };
        break;
      case 'author':
        sortObj = { author: 1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    // Fetch books with category population
    const books = await Book.find(query)
      .populate('categories', 'name color')
      .sort(sortObj)
      .limit(limitNum)
      .lean();

    res.status(200).json({
      success: true,
      books
    });
  } catch (error) {
    console.error('Error fetching public books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books'
    });
  }
}