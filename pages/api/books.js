import dbConnect from '../../lib/mongodb';
import Book from '../../models/Book';
import { withAuth } from '../../lib/auth';

async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();

    const {
      page = 1,
      limit = 12,
      search = '',
      category = '',
      sort = 'newest'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = { 
      status: 'published',
      isDeleted: { $ne: true }
    };

    // Add search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    // Add category filter
    if (category) {
      query.category = category;
    }

    // Build sort object
    let sortObj = {};
    switch (sort) {
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'oldest':
        sortObj = { createdAt: 1 };
        break;
      case 'title-asc':
        sortObj = { title: 1 };
        break;
      case 'title-desc':
        sortObj = { title: -1 };
        break;
      case 'author-asc':
        sortObj = { author: 1 };
        break;
      case 'author-desc':
        sortObj = { author: -1 };
        break;
      default:
        sortObj = { createdAt: -1 };
    }

    // Execute queries
    const [books, total] = await Promise.all([
      Book.find(query)
        .populate('category', 'name color')
        .sort(sortObj)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Book.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.status(200).json({
      success: true,
      books,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalBooks: total,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      },
      total,
      totalPages
    });
  } catch (error) {
    console.error('Error fetching books:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch books'
    });
  }
}

export default withAuth(handler);