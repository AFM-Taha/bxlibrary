import mongoose from 'mongoose';
import Book from '../models/Book.js';

async function updateBookStatus() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://tahanjtech:meVhBzNSUg6OM2pl@cluster0.o6ikkja.mongodb.net/bx-library?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');

    // Update all books that have isPublished: true but status: 'draft'
    const result = await Book.updateMany(
      { 
        isPublished: true,
        status: 'draft',
        isDeleted: { $ne: true }
      },
      { 
        $set: { status: 'published' }
      }
    );

    console.log(`Updated ${result.modifiedCount} books from draft to published status`);

    // Also update any books without isPublished field but should be published
    const result2 = await Book.updateMany(
      { 
        status: 'draft',
        isDeleted: { $ne: true },
        isPublished: { $exists: false }
      },
      { 
        $set: { 
          status: 'published',
          isPublished: true
        }
      }
    );

    console.log(`Updated ${result2.modifiedCount} additional books to published status`);

    // Show current book status distribution
    const statusCounts = await Book.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    console.log('\nCurrent book status distribution:');
    statusCounts.forEach(item => {
      console.log(`${item._id}: ${item.count} books`);
    });

  } catch (error) {
    console.error('Error updating book status:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the update
updateBookStatus();