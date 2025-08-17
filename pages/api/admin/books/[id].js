import { withAdminAuth } from '../../../../lib/auth';
import dbConnect from '../../../../lib/mongodb';
import Book from '../../../../models/Book';
import Category from '../../../../models/Category';
import mongoose from 'mongoose';

async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  // Validate book ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid book ID' });
  }

  switch (req.method) {
    case 'GET':
      return await getBook(req, res, id);
    case 'PUT':
      return await updateBook(req, res, id);
    case 'DELETE':
      return await deleteBook(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getBook(req, res, bookId) {
  try {
    const book = await Book.findById(bookId)
      .populate('category', 'name color')
      .populate('createdBy', 'name email')
      .lean();

    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

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
      createdBy: book.createdBy ? {
        id: book.createdBy._id,
        name: book.createdBy.name,
        email: book.createdBy.email
      } : null,
      createdAt: book.createdAt,
      updatedAt: book.updatedAt,
      isDeleted: book.isDeleted
    };

    res.status(200).json({ book: bookData });
  } catch (error) {
    console.error('Get book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateBook(req, res, bookId) {
  try {
    const {
      title,
      author,
      description,
      driveUrl,
      categoryId,
      images,
      status,
      action
    } = req.body;
    const adminUserId = req.user._id;

    // Find book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book.isDeleted) {
      return res.status(400).json({ error: 'Cannot update deleted book' });
    }

    // Handle specific actions
    if (action) {
      switch (action) {
        case 'refresh_thumbnail':
          return await refreshThumbnail(req, res, book, adminUserId);
        case 'publish':
          book.status = 'published';
          break;
        case 'unpublish':
          book.status = 'draft';
          break;
        case 'archive':
          book.status = 'archived';
          break;
        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    } else {
      // Regular update
      let hasChanges = false;

      // Update title
      if (title && title.trim() !== book.title) {
        if (title.trim().length === 0) {
          return res.status(400).json({ error: 'Book title is required' });
        }

        if (title.trim().length > 200) {
          return res.status(400).json({ error: 'Title must be less than 200 characters' });
        }

        book.title = title.trim();
        hasChanges = true;
      }

      // Update author
      if (author && author.trim() !== book.author) {
        if (author.trim().length === 0) {
          return res.status(400).json({ error: 'Author is required' });
        }

        if (author.trim().length > 100) {
          return res.status(400).json({ error: 'Author must be less than 100 characters' });
        }

        book.author = author.trim();
        hasChanges = true;
      }

      // Update description
      if (description !== undefined && description !== book.description) {
        if (description && description.length > 1000) {
          return res.status(400).json({ error: 'Description must be less than 1000 characters' });
        }

        book.description = description?.trim() || '';
        hasChanges = true;
      }

      // Update images
      if (images !== undefined) {
        // Validate images array
        if (!Array.isArray(images)) {
          return res.status(400).json({ error: 'Images must be an array' });
        }

        if (images.length > 5) {
          return res.status(400).json({ error: 'Maximum 5 images allowed' });
        }

        // Validate each image object
        for (const image of images) {
          if (!image.url || typeof image.url !== 'string') {
            return res.status(400).json({ error: 'Each image must have a valid URL' });
          }
        }

        // Check if images have changed
        const currentImages = JSON.stringify(book.images || []);
        const newImages = JSON.stringify(images);
        
        if (currentImages !== newImages) {
          book.images = images;
          hasChanges = true;
        }
      }

      // Update drive URL
      if (driveUrl && driveUrl.trim() !== book.driveUrl) {
        const driveFileId = extractDriveFileId(driveUrl.trim());
        if (!driveFileId) {
          return res.status(400).json({ error: 'Invalid Google Drive URL format' });
        }

        // Check for duplicate drive URL (excluding current book)
        const existingBook = await Book.findOne({
          driveFileId,
          _id: { $ne: bookId },
          isDeleted: { $ne: true }
        });

        if (existingBook) {
          return res.status(400).json({ error: 'A book with this Google Drive file already exists' });
        }

        const canonicalUrl = `https://drive.google.com/file/d/${driveFileId}/view`;
        book.driveUrl = canonicalUrl;
        book.driveFileId = driveFileId;
        
        // Reset file metadata when URL changes
        book.fileSize = undefined;
        book.pageCount = undefined;
        book.thumbnailUrl = undefined;
        
        hasChanges = true;

        // Fetch new thumbnail (non-blocking)
        fetchThumbnail(bookId, driveFileId).catch(err => {
          console.error('Failed to fetch thumbnail:', err);
        });
      }

      // Update category
      if (categoryId !== undefined) {
        if (categoryId === null || categoryId === '') {
          book.category = undefined;
          hasChanges = true;
        } else {
          if (!mongoose.Types.ObjectId.isValid(categoryId)) {
            return res.status(400).json({ error: 'Invalid category ID' });
          }

          const category = await Category.findById(categoryId);
          if (!category || category.isDeleted) {
            return res.status(400).json({ error: 'Category not found' });
          }

          if (book.category?.toString() !== categoryId) {
            book.category = categoryId;
            hasChanges = true;
          }
        }
      }

      // Update status
      if (status && status !== book.status) {
        if (!['published', 'draft', 'archived'].includes(status)) {
          return res.status(400).json({ error: 'Invalid status' });
        }

        book.status = status;
        hasChanges = true;
      }

      if (!hasChanges) {
        return res.status(400).json({ error: 'No changes provided' });
      }
    }

    book.updatedBy = adminUserId;
    await book.save();

    // Populate for response
    await book.populate('category', 'name color');
    await book.populate('createdBy', 'name email');

    // Return updated book data
    const bookData = {
      id: book._id,
      title: book.title,
      author: book.author,
      description: book.description,
      driveUrl: book.driveUrl,
      driveFileId: book.driveFileId,
      thumbnailUrl: book.thumbnailUrl,
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

    res.status(200).json({
      message: 'Book updated successfully',
      book: bookData
    });
  } catch (error) {
    console.error('Update book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteBook(req, res, bookId) {
  try {
    const { force = false } = req.query;
    const adminUserId = req.user._id;

    // Find book
    const book = await Book.findById(bookId);
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }

    if (book.isDeleted && !force) {
      return res.status(400).json({ error: 'Book is already deleted' });
    }

    if (force === 'true') {
      // Hard delete - remove book completely
      await Book.findByIdAndDelete(bookId);
      res.status(200).json({ message: 'Book permanently deleted' });
    } else {
      // Soft delete
      book.isDeleted = true;
      book.deletedAt = new Date();
      book.deletedBy = adminUserId;
      await book.save();

      res.status(200).json({ message: 'Book deleted successfully' });
    }
  } catch (error) {
    console.error('Delete book error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function refreshThumbnail(req, res, book, adminUserId) {
  try {
    // Clear existing thumbnail
    book.thumbnailUrl = undefined;
    book.updatedBy = adminUserId;
    await book.save();

    // Fetch new thumbnail (non-blocking)
    fetchThumbnail(book._id, book.driveFileId).catch(err => {
      console.error('Failed to fetch thumbnail:', err);
    });

    res.status(200).json({ message: 'Thumbnail refresh initiated' });
  } catch (error) {
    console.error('Refresh thumbnail error:', error);
    res.status(500).json({ error: 'Failed to refresh thumbnail' });
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