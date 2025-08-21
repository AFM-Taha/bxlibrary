import mongoose from 'mongoose';
import Book from '../models/Book.js';

async function checkTotalBooks() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://tahanjtech:meVhBzNSUg6OM2pl@cluster0.o6ikkja.mongodb.net/bx-library?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');

    // Get total books count (what admin dashboard should show)
    const totalBooks = await Book.countDocuments({ isDeleted: { $ne: true } });
    console.log(`\nTotal Books (Admin Dashboard should show): ${totalBooks}`);

    // Get published books count (what library page shows)
    const publishedBooks = await Book.countDocuments({ 
      status: 'published',
      isDeleted: { $ne: true }
    });
    console.log(`Published Books (Library page shows): ${publishedBooks}`);

    // Get books by status
    const statusCounts = await Book.aggregate([
      { $match: { isDeleted: { $ne: true } } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\nBooks by status:');
    statusCounts.forEach(item => {
      console.log(`- ${item._id || 'undefined'}: ${item.count} books`);
    });

    // Get some sample books to verify data
    const sampleBooks = await Book.find({ isDeleted: { $ne: true } })
      .select('title author status createdAt')
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();

    console.log('\nSample books (latest 10):');
    sampleBooks.forEach((book, index) => {
      console.log(`${index + 1}. "${book.title}" by ${book.author} (Status: ${book.status})`);
    });

  } catch (error) {
    console.error('Error checking total books:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the check
checkTotalBooks();