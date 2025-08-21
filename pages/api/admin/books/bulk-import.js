import dbConnect from '../../../../lib/mongodb';
import { verifyToken } from '../../../../lib/jwt';
import Book from '../../../../models/Book';
import Category from '../../../../models/Category';
import formidable from 'formidable';
import fs from 'fs';
import { extractFileId } from '../../../../utils/googleDrive';

// Disable body parser for file uploads
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Connect to database
    await dbConnect();

    // Verify authentication
    const token = req.headers.authorization?.replace('Bearer ', '') || req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Parse the uploaded file
    const form = formidable({
      maxFileSize: 10 * 1024 * 1024, // 10MB limit for books JSON
      filter: ({ mimetype }) => {
        return mimetype && mimetype.includes('json');
      },
    });

    const [fields, files] = await form.parse(req);
    const uploadedFile = files.file?.[0];

    if (!uploadedFile) {
      return res.status(400).json({ error: 'No JSON file uploaded' });
    }

    // Read and parse the JSON file
    const fileContent = fs.readFileSync(uploadedFile.filepath, 'utf8');
    let booksData;
    
    try {
      booksData = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    // Validate that it's an array
    if (!Array.isArray(booksData)) {
      return res.status(400).json({ error: 'JSON must contain an array of books' });
    }

    const results = {
      updated: 0,
      created: 0,
      errors: [],
      total: booksData.length
    };

    // Get all categories for validation
    let allCategories = await Category.find({ isDeleted: false });
    let categoryMap = new Map();
    allCategories.forEach(cat => {
      categoryMap.set(cat.name.toLowerCase(), cat._id);
      categoryMap.set(cat._id.toString(), cat._id);
    });

    // First pass: collect all missing categories
    const missingCategories = new Set();
    for (let i = 0; i < booksData.length; i++) {
      const bookData = booksData[i];
      
      if (bookData.categories && Array.isArray(bookData.categories)) {
        for (const category of bookData.categories) {
          let categoryName;
          
          if (typeof category === 'string') {
            categoryName = category;
          } else if (category && category.name) {
            categoryName = category.name;
          }
          
          if (categoryName && !categoryMap.has(categoryName.toLowerCase())) {
            missingCategories.add(categoryName);
          }
        }
      }
    }

    // Create missing categories
    if (missingCategories.size > 0) {
      const newCategories = [];
      for (const categoryName of missingCategories) {
        try {
          const newCategory = await Category.create({
            name: categoryName,
            description: `Auto-created category from bulk import`,
            isDeleted: false,
            createdBy: decoded.userId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          newCategories.push(newCategory);
        } catch (error) {
          console.error(`Failed to create category ${categoryName}:`, error);
        }
      }
      
      // Refresh category map with new categories
      allCategories = await Category.find({ isDeleted: false });
      categoryMap.clear();
      allCategories.forEach(cat => {
        categoryMap.set(cat.name.toLowerCase(), cat._id);
        categoryMap.set(cat._id.toString(), cat._id);
      });
    }

    // Process each book
    for (let i = 0; i < booksData.length; i++) {
      const bookData = booksData[i];
      
      try {
        // Validate required fields
        if (!bookData.title || typeof bookData.title !== 'string') {
          results.errors.push({
            index: i,
            error: 'Book title is required and must be a string',
            data: bookData
          });
          continue;
        }

        if (!bookData.author || typeof bookData.author !== 'string') {
          results.errors.push({
            index: i,
            error: 'Book author is required and must be a string',
            data: bookData
          });
          continue;
        }

        // driveUrl and driveFileId are now optional

        if (!bookData.categories || !Array.isArray(bookData.categories) || bookData.categories.length === 0) {
          results.errors.push({
            index: i,
            error: 'Book must have at least one category',
            data: bookData
          });
          continue;
        }

        // Validate and convert categories
        const categoryIds = [];
        for (const category of bookData.categories) {
          let categoryId;
          
          if (typeof category === 'string') {
            // Try to find by name first, then by ID
            categoryId = categoryMap.get(category.toLowerCase()) || categoryMap.get(category);
          } else if (category && category._id) {
            categoryId = categoryMap.get(category._id.toString());
          } else if (category && category.name) {
            categoryId = categoryMap.get(category.name.toLowerCase());
          }
          
          if (!categoryId) {
            results.errors.push({
              index: i,
              error: `Invalid category: ${JSON.stringify(category)}`,
              data: bookData
            });
            break;
          }
          
          categoryIds.push(categoryId);
        }

        if (categoryIds.length !== bookData.categories.length) {
          continue; // Skip this book due to category validation errors
        }

        // Extract Google Drive file ID (optional)
        let driveFileId = bookData.driveFileId;
        let driveUrl = bookData.driveUrl;
        
        if (!driveFileId && driveUrl) {
          driveFileId = extractFileId(driveUrl);
          // If extraction fails, we'll still proceed but without driveFileId
        }
        
        // If we have driveFileId but no driveUrl, construct the URL
        if (driveFileId && !driveUrl) {
          driveUrl = `https://drive.google.com/file/d/${driveFileId}/view`;
        }

        // Prepare book data
        const isPublished = bookData.isPublished || false;
        const status = bookData.status || (isPublished ? 'published' : 'draft');
        
        const processedData = {
          title: bookData.title.trim(),
          author: bookData.author.trim(),
          description: bookData.description || '',
          categories: categoryIds,
          status: status,
          isPublished: isPublished,
          fileSize: bookData.fileSize || null,
          pageCount: bookData.pageCount || null,
          images: bookData.images || [],
          isDeleted: false,
          // Always include driveUrl and driveFileId fields, even if empty
          driveUrl: driveUrl || null,
          driveFileId: driveFileId || null
        };

        // Check if book already exists (by title and author)
        const existingBook = await Book.findOne({
          title: { $regex: new RegExp(`^${processedData.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          author: { $regex: new RegExp(`^${processedData.author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          isDeleted: false
        });

        if (existingBook) {
          // Update existing book
          await Book.findByIdAndUpdate(
            existingBook._id,
            {
              $set: {
                ...processedData,
                updatedBy: decoded.userId,
                updatedAt: new Date()
              }
            },
            { runValidators: true }
          );
          results.updated++;
        } else {
          // Create new book
          await Book.create({
            ...processedData,
            createdBy: decoded.userId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          index: i,
          error: error.message,
          data: bookData
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(uploadedFile.filepath);

    return res.status(200).json({
      message: 'Bulk book import completed',
      results
    });

  } catch (error) {
    console.error('Bulk book import error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}