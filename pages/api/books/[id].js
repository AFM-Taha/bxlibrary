import dbConnect from '../../../lib/mongodb';
import Book from '../../../models/Book';
import { isValidObjectId } from 'mongoose';

async function handler(req, res) {
  const { id } = req.query;

  if (!isValidObjectId(id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid book ID'
    });
  }

  if (req.method === 'GET') {
    try {
      await dbConnect();

      const book = await Book.findOne({
        _id: id,
        status: 'published',
        isDeleted: { $ne: true }
      }).populate('category', 'name color').lean();

      if (!book) {
        return res.status(404).json({
          success: false,
          message: 'Book not found'
        });
      }

      res.status(200).json({
        success: true,
        book
      });
    } catch (error) {
      console.error('Error fetching book:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch book'
      });
    }
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}

export default handler;