import { withAdminAuth } from '../../../../lib/auth';
import dbConnect from '../../../../lib/mongodb';
import Book from '../../../../models/Book';
import Category from '../../../../models/Category';
import mongoose from 'mongoose';

async function handler(req, res) {
  console.log('=== ADMIN BOOKS API HANDLER ===');
  console.log('Method:', req.method);
  console.log('Body:', req.body);
  console.log('User:', req.user);
  
  await dbConnect();

  switch (req.method) {
    case 'GET':
      return await getBooks(req, res);
    case 'POST':
      return await createBook(req, res);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getBooks(req, res) {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      category = '',
      status = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
      includeDeleted = false
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    const query = {};
    
    // Search filter
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } }
      ];
    }

    // Category filter
    if (category && mongoose.Types.ObjectId.isValid(category)) {
      query.categories = category;
    }

    // Status filter
    if (status) {
      query.status = status;
    }

    // Include/exclude deleted books
    if (!includeDeleted || includeDeleted === 'false') {
      query.isDeleted = { $ne: true };
    }

    // Build sort object
    const sortObj = {};
    sortObj[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Get books with category information
    const books = await Book.find(query)
      .populate('categories', 'name color')
      .populate('createdBy', 'name email')
      .sort(sortObj)
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Get total count
    const totalCount = await Book.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Format books data
    const formattedBooks = books.map(book => ({
      id: book._id,
      title: book.title,
      author: book.author,
      description: book.description,
      driveUrl: book.driveUrl,
      driveFileId: book.driveFileId,
      thumbnailUrl: book.thumbnailUrl,
      images: book.images || [],
      categories: book.categories ? book.categories.map(cat => ({
        id: cat._id,
        name: cat.name,
        color: cat.color
      })) : [],
      status: book.status,
      fileSize: book.fileSize,
      pageCount: book.pageCount,
      readCount: book.readCount,
      createdBy: book.createdBy ? {
        id: book.createdBy._id,
        name: book.createdBy.name,
        email: book.createdBy.email
      } : null,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt
    }));

    res.status(200).json({
      books: formattedBooks,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        hasNextPage: pageNum < totalPages,
        hasPrevPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error('Get books error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function createBook(req, res) {
  console.log('=== ENTERING createBook function ===');
  try {
    console.log('Create book request body:', req.body);
    console.log('req.user:', req.user);
    console.log('req.user._id:', req.user._id);
    console.log('=== About to extract driveFileId ===');
    
    const {
      title,
      author,
      description,
      driveUrl,
      categoryId,
      categoryIds,
      images = [],
      status = 'published'
    } = req.body;
    const adminUserId = req.user._id;

    // Validation
    if (!title || title.trim().length === 0) {
      return res.status(400).json({ error: 'Book title is required' });
    }

    if (title.trim().length > 200) {
      return res.status(400).json({ error: 'Title must be less than 200 characters' });
    }

    if (!author || author.trim().length === 0) {
      return res.status(400).json({ error: 'Author is required' });
    }

    if (author.trim().length > 100) {
      return res.status(400).json({ error: 'Author must be less than 100 characters' });
    }

    if (!driveUrl || driveUrl.trim().length === 0) {
      return res.status(400).json({ error: 'Google Drive URL is required' });
    }

    if (description && description.length > 1000) {
      return res.status(400).json({ error: 'Description must be less than 1000 characters' });
    }

    if (!['published', 'draft', 'archived'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Validate images array
    if (images && !Array.isArray(images)) {
      return res.status(400).json({ error: 'Images must be an array' });
    }

    if (images && images.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 images allowed' });
    }

    // Validate each image object
    if (images && images.length > 0) {
      for (const image of images) {
        if (!image.url || typeof image.url !== 'string') {
          return res.status(400).json({ error: 'Each image must have a valid URL' });
        }
      }
    }

    // Handle both single category (backward compatibility) and multiple categories
    let categories = [];
    if (categoryIds && Array.isArray(categoryIds)) {
      categories = categoryIds;
    } else if (categoryId) {
      categories = [categoryId];
    }

    // Validate categories (at least one required)
    if (!categories || categories.length === 0) {
      return res.status(400).json({ error: 'At least one category is required' });
    }

    if (categories.length > 5) {
      return res.status(400).json({ error: 'Maximum 5 categories allowed' });
    }

    // Validate each category ID
    for (const catId of categories) {
      if (!mongoose.Types.ObjectId.isValid(catId)) {
        return res.status(400).json({ error: 'Invalid category ID format' });
      }
    }

    // Check if all categories exist
    const foundCategories = await Category.find({
      _id: { $in: categories },
      isDeleted: { $ne: true }
    });

    if (foundCategories.length !== categories.length) {
      return res.status(400).json({ error: 'One or more categories not found' });
    }

    // Extract Google Drive file ID from URL
    console.log('driveUrl received:', driveUrl);
    const driveFileId = extractDriveFileId(driveUrl.trim());
    console.log('extracted driveFileId:', driveFileId);
    console.log('=== driveFileId extraction completed successfully ===');
    if (!driveFileId) {
      console.log('Failed to extract file ID from:', driveUrl.trim());
      return res.status(400).json({ error: 'Invalid Google Drive URL format' });
    }

    // Check for duplicate drive URL
    console.log('=== Starting duplicate check ===');
    console.log('Checking for duplicate driveFileId:', driveFileId);
    const existingBook = await Book.findOne({
      driveFileId,
      isDeleted: { $ne: true }
    });
    console.log('=== Duplicate check completed ===');
    console.log('Existing book found:', existingBook ? 'Yes' : 'No');

    if (existingBook) {
      console.log('Duplicate book found, returning error');
      return res.status(400).json({ error: 'A book with this Google Drive file already exists' });
    }

    // Create canonical Drive URL
    const canonicalUrl = `https://drive.google.com/file/d/${driveFileId}/view`;

    // Create book
    console.log('Creating book with data:', {
      title: title.trim(),
      author: author.trim(),
      description: description?.trim() || '',
      driveUrl: canonicalUrl,
      driveFileId,
      categories: categories,
      status,
      isPublished: status === 'published',
      createdBy: adminUserId
    });
    const book = new Book({
      title: title.trim(),
      author: author.trim(),
      description: description?.trim() || '',
      driveUrl: canonicalUrl,
      driveFileId,
      images: images || [],
      categories: categories,
      status,
      isPublished: status === 'published',
      createdBy: adminUserId
    });

    console.log('Saving book to database...');
    await book.save();
    console.log('Book saved successfully with ID:', book._id);

    // Populate categories for response
    await book.populate('categories', 'name color');
    await book.populate('createdBy', 'name email');

    // Try to fetch thumbnail (non-blocking)
    fetchThumbnail(book._id, driveFileId).catch(err => {
      console.error('Failed to fetch thumbnail:', err);
    });

    // Return book data
    const bookData = {
      id: book._id,
      title: book.title,
      author: book.author,
      description: book.description,
      driveUrl: book.driveUrl,
      driveFileId: book.driveFileId,
      thumbnailUrl: book.thumbnailUrl,
      images: book.images || [],
      category: book.category ? {
        id: book.category._id,
        name: book.category.name,
        color: book.category.color
      } : null,
      status: book.status,
      fileSize: book.fileSize,
      pageCount: book.pageCount,
      readCount: book.readCount,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt
    };

    res.status(201).json({
      message: 'Book created successfully',
      book: bookData
    });
  } catch (error) {
    console.error('=== CREATE BOOK ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error code:', error.code);
    console.error('Error stack:', error.stack);
    console.error('Full error:', error);
    
    if (error.name === 'ValidationError') {
      console.error('Validation errors:', error.errors);
      const validationDetails = Object.keys(error.errors).map(key => ({
        field: key,
        message: error.errors[key].message
      }));
      console.error('Formatted validation details:', validationDetails);
      return res.status(400).json({ 
        error: 'Validation failed', 
        details: validationDetails
      });
    }
    
    if (error.name === 'MongoServerError' && error.code === 11000) {
      console.error('Duplicate key error:', error.keyPattern, error.keyValue);
      return res.status(400).json({ 
        error: 'Duplicate entry found',
        details: error.message
      });
    }
    
    console.error('=== END CREATE BOOK ERROR ===');
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Helper function to extract Google Drive file ID from various URL formats
function extractDriveFileId(input) {
  if (!input) return null;
  
  // If it's already a file ID (no slashes), return as is
  if (!input.includes('/') && /^[a-zA-Z0-9-_]+$/.test(input) && input.length > 10) {
    return input;
  }
  
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /\/open\?id=([a-zA-Z0-9-_]+)/,
    /\/uc\?id=([a-zA-Z0-9-_]+)/
  ];

  for (const pattern of patterns) {
    const match = input.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

// Helper function to fetch thumbnail (placeholder for now)
async function fetchThumbnail(bookId, driveFileId) {
  try {
    // This would use Google Drive API to fetch thumbnail
    // For now, we'll use a placeholder
    const thumbnailUrl = `https://drive.google.com/thumbnail?id=${driveFileId}&sz=w400-h600`;
    
    await Book.findByIdAndUpdate(bookId, {
      thumbnailUrl
    });
  } catch (error) {
    console.error('Fetch thumbnail error:', error);
  }
}

export default withAdminAuth(handler);