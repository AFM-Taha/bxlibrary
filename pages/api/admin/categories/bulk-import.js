import dbConnect from '../../../../lib/mongodb';
import { verifyToken } from '../../../../lib/jwt';
import Category from '../../../../models/Category';
import formidable from 'formidable';
import fs from 'fs';

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
      maxFileSize: 5 * 1024 * 1024, // 5MB limit
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
    let categoriesData;
    
    try {
      categoriesData = JSON.parse(fileContent);
    } catch (parseError) {
      return res.status(400).json({ error: 'Invalid JSON format' });
    }

    // Validate that it's an array
    if (!Array.isArray(categoriesData)) {
      return res.status(400).json({ error: 'JSON must contain an array of categories' });
    }

    const results = {
      updated: 0,
      created: 0,
      errors: [],
      total: categoriesData.length
    };

    // First, deduplicate the input data by name (case-insensitive)
    const uniqueCategories = new Map();
    const duplicatesInFile = [];
    
    for (let i = 0; i < categoriesData.length; i++) {
      const categoryData = categoriesData[i];
      
      if (!categoryData.name || typeof categoryData.name !== 'string') {
        results.errors.push({
          index: i,
          error: 'Category name is required and must be a string',
          data: categoryData
        });
        continue;
      }
      
      const normalizedName = categoryData.name.trim().toLowerCase();
      
      if (uniqueCategories.has(normalizedName)) {
        duplicatesInFile.push({
          index: i,
          error: `Duplicate category name in file: "${categoryData.name}"`,
          data: categoryData
        });
      } else {
        uniqueCategories.set(normalizedName, {
          ...categoryData,
          originalIndex: i
        });
      }
    }
    
    // Add duplicates to errors
    results.errors.push(...duplicatesInFile);
    
    // Process unique categories
    for (const [normalizedName, categoryData] of uniqueCategories) {
      try {
        // Prepare category data with defaults
        const processedData = {
          name: categoryData.name.trim(),
          description: categoryData.description || '',
          color: categoryData.color || '#3B82F6',
          isDeleted: false
        };

        // Check if category already exists in database
        const existingCategory = await Category.findOne({
          name: { $regex: new RegExp(`^${processedData.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') },
          isDeleted: false
        });

        if (existingCategory) {
          // Update existing category
          await Category.findByIdAndUpdate(
            existingCategory._id,
            {
              $set: {
                name: processedData.name,
                description: processedData.description,
                color: processedData.color,
                updatedAt: new Date()
              }
            },
            { runValidators: true }
          );
          results.updated++;
        } else {
          // Create new category
          await Category.create({
            ...processedData,
            createdBy: decoded.userId,
            createdAt: new Date(),
            updatedAt: new Date()
          });
          results.created++;
        }
      } catch (error) {
        results.errors.push({
          index: categoryData.originalIndex,
          error: error.message,
          data: categoryData
        });
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(uploadedFile.filepath);

    return res.status(200).json({
      message: 'Bulk import completed',
      results
    });

  } catch (error) {
    console.error('Bulk import error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}