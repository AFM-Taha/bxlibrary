import { withAdminAuth } from '../../../../lib/auth';
import dbConnect from '../../../../lib/mongodb';
import Category from '../../../../models/Category';
import Book from '../../../../models/Book';
import mongoose from 'mongoose';

async function handler(req, res) {
  await dbConnect();

  const { id } = req.query;

  // Validate category ID
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid category ID' });
  }

  switch (req.method) {
    case 'GET':
      return await getCategory(req, res, id);
    case 'PUT':
      return await updateCategory(req, res, id);
    case 'POST':
      // Handle restore action
      if (req.body.action === 'restore') {
        return await restoreCategory(req, res, id);
      }
      return res.status(400).json({ error: 'Invalid action' });
    case 'DELETE':
      return await deleteCategory(req, res, id);
    default:
      return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function getCategory(req, res, categoryId) {
  try {
    const category = await Category.findById(categoryId)
      .populate('createdBy', 'name email')
      .lean();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Get book count for this category
    const bookCount = await Book.countDocuments({
      category: categoryId,
      isDeleted: { $ne: true }
    });

    const categoryData = {
      ...category,
      bookCount
    };

    res.status(200).json({ category: categoryData });
  } catch (error) {
    console.error('Get category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function updateCategory(req, res, categoryId) {
  try {
    const { name, description, color } = req.body;
    const adminUserId = req.user._id;

    // Find category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.isDeleted) {
      return res.status(400).json({ error: 'Cannot update deleted category' });
    }

    let hasChanges = false;

    // Update name
    if (name && name.trim() !== category.name) {
      if (name.trim().length === 0) {
        return res.status(400).json({ error: 'Category name is required' });
      }

      if (name.trim().length > 100) {
        return res.status(400).json({ error: 'Category name must be less than 100 characters' });
      }

      // Check for duplicate name (case-insensitive, excluding current category and deleted)
      const existingCategory = await Category.findOne({
        name: { $regex: `^${name.trim()}$`, $options: 'i' },
        _id: { $ne: categoryId },
        isDeleted: { $ne: true }
      });

      if (existingCategory) {
        return res.status(400).json({ error: 'Category name already exists' });
      }

      category.name = name.trim();
      hasChanges = true;
    }

    // Update description
    if (description !== undefined && description !== category.description) {
      if (description && description.length > 500) {
        return res.status(400).json({ error: 'Description must be less than 500 characters' });
      }

      category.description = description?.trim() || '';
      hasChanges = true;
    }

    // Update color
    if (color && color !== category.color) {
      if (!/^#[0-9A-F]{6}$/i.test(color)) {
        return res.status(400).json({ error: 'Invalid color format. Use hex format (#RRGGBB)' });
      }

      category.color = color;
      hasChanges = true;
    }

    if (!hasChanges) {
      return res.status(400).json({ error: 'No changes provided' });
    }

    category.updatedBy = adminUserId;
    await category.save();

    // Get book count
    const bookCount = await Book.countDocuments({
      category: categoryId,
      isDeleted: { $ne: true }
    });

    // Return updated category data
    const categoryData = {
      id: category._id,
      name: category.name,
      description: category.description,
      color: category.color,
      bookCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt
    };

    res.status(200).json({
      message: 'Category updated successfully',
      category: categoryData
    });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function deleteCategory(req, res, categoryId) {
  try {
    const { force = false } = req.query;
    const adminUserId = req.user._id;

    // Find category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (category.isDeleted && !force) {
      return res.status(400).json({ error: 'Category is already deleted' });
    }

    // Check if category has books
    const bookCount = await Book.countDocuments({
      category: categoryId,
      isDeleted: { $ne: true }
    });

    if (bookCount > 0 && force !== 'true') {
      return res.status(400).json({
        error: 'Cannot delete category with books. Move books to another category first or use force delete.',
        bookCount
      });
    }

    if (force === 'true') {
      // Hard delete - remove category completely from database
      // First, remove category reference from all books
      await Book.updateMany(
        { category: categoryId },
        { $unset: { category: 1 }, updatedBy: adminUserId }
      );

      // Delete the category permanently
      await Category.findByIdAndDelete(categoryId);

      res.status(200).json({ 
        message: 'Category permanently deleted from database' 
      });
    } else {
      // Soft delete - mark as deleted
      category.isDeleted = true;
      category.deletedAt = new Date();
      category.deletedBy = adminUserId;
      await category.save();

      res.status(200).json({ 
        message: 'Category deleted successfully' 
      });
    }
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function restoreCategory(req, res, categoryId) {
  try {
    const adminUserId = req.user._id;

    // Find deleted category
    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    if (!category.isDeleted) {
      return res.status(400).json({ error: 'Category is not deleted' });
    }

    // Check for name conflicts with active categories
    const existingCategory = await Category.findOne({
      name: { $regex: `^${category.name}$`, $options: 'i' },
      _id: { $ne: categoryId },
      isDeleted: { $ne: true }
    });

    if (existingCategory) {
      return res.status(400).json({ 
        error: 'Cannot restore: A category with this name already exists' 
      });
    }

    // Restore category
    category.isDeleted = false;
    category.deletedAt = undefined;
    category.deletedBy = undefined;
    await category.save();

    res.status(200).json({ 
      message: 'Category restored successfully',
      category: {
        id: category._id,
        name: category.name,
        description: category.description,
        color: category.color
      }
    });
  } catch (error) {
    console.error('Restore category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export default withAdminAuth(handler);