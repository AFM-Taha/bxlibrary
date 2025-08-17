import { withAdminAuth } from '../../../../lib/auth';
import dbConnect from '../../../../lib/mongodb';
import Category from '../../../../models/Category';
import Book from '../../../../models/Book';

async function handler(req, res) {
  await dbConnect();

  switch (req.method) {
    case 'GET':
      return await getCategories(req, res);
    case 'POST':
      return await createCategory(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getCategories(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      includeDeleted = false,
      sortBy = 'name',
      sortOrder = 'asc'
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Include/exclude deleted categories
    if (!includeDeleted || includeDeleted === 'false') {
      query.isDeleted = { $ne: true };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get categories with book counts
    const categories = await Category.aggregate([
      { $match: query },
      {
        $lookup: {
          from: 'books',
          localField: '_id',
          foreignField: 'category',
          as: 'books'
        }
      },
      {
        $addFields: {
          bookCount: {
            $size: {
              $filter: {
                input: '$books',
                cond: { $ne: ['$$this.isDeleted', true] }
              }
            }
          }
        }
      },
      {
        $project: {
          books: 0
        }
      },
      { $sort: sortObj },
      { $skip: skip },
      { $limit: limitNum }
    ]);

    // Get total count
    const totalCount = await Category.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    res.status(200).json({
      categories,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createCategory(req, res) {
  try {
    const { name, description, color } = req.body;
    const adminUserId = req.user._id;

    // Validation
    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    if (name.trim().length > 100) {
      return res.status(400).json({ error: 'Category name must be less than 100 characters' });
    }

    if (description && description.length > 500) {
      return res.status(400).json({ error: 'Description must be less than 500 characters' });
    }

    // Check for duplicate name (case-insensitive, excluding deleted)
    const existingCategory = await Category.findOne({
      name: { $regex: `^${name.trim()}$`, $options: 'i' },
      isDeleted: { $ne: true }
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category name already exists' });
    }

    // Validate color if provided
    if (color && !/^#[0-9A-F]{6}$/i.test(color)) {
      return res.status(400).json({ error: 'Invalid color format. Use hex format (#RRGGBB)' });
    }

    // Create category
    const category = new Category({
      name: name.trim(),
      description: description?.trim() || '',
      color: color || '#3B82F6', // Default blue color
      createdBy: adminUserId
    });

    await category.save();

    // Return category data
    const categoryData = {
      id: category._id,
      name: category.name,
      description: category.description,
      color: category.color,
      bookCount: 0,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };

    res.status(201).json({
      message: 'Category created successfully',
      category: categoryData
    });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAdminAuth(handler);