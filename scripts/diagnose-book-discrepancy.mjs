import mongoose from 'mongoose';
import Book from '../models/Book.js';
import Category from '../models/Category.js';

async function diagnoseBookDiscrepancy() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb+srv://tahanjtech:meVhBzNSUg6OM2pl@cluster0.o6ikkja.mongodb.net/bx-library?retryWrites=true&w=majority');
    console.log('Connected to MongoDB');

    // Get all books (admin view)
    const allBooks = await Book.find({ isDeleted: { $ne: true } })
      .populate('categories', 'name')
      .lean();
    
    console.log(`\nAdmin Dashboard Books (Total: ${allBooks.length}):`);
    allBooks.forEach((book, index) => {
      console.log(`${index + 1}. "${book.title}" - Status: ${book.status}, Categories: ${book.categories?.length || 0}`);
    });

    // Get published books (library view)
    const publishedBooks = await Book.find({ 
      status: 'published',
      isDeleted: { $ne: true }
    })
      .populate('categories', 'name')
      .lean();
    
    console.log(`\nLibrary Page Books (Total: ${publishedBooks.length}):`);
    publishedBooks.forEach((book, index) => {
      console.log(`${index + 1}. "${book.title}" - Categories: ${book.categories?.length || 0}`);
    });

    // Find books that are published but might have category issues
    const booksWithoutCategories = await Book.find({ 
      status: 'published',
      isDeleted: { $ne: true },
      $or: [
        { categories: { $exists: false } },
        { categories: { $size: 0 } },
        { categories: null }
      ]
    }).lean();
    
    if (booksWithoutCategories.length > 0) {
      console.log(`\nBooks without valid categories (${booksWithoutCategories.length}):`);
      booksWithoutCategories.forEach((book, index) => {
        console.log(`${index + 1}. "${book.title}" - Categories: ${JSON.stringify(book.categories)}`);
      });
    }

    // Check for any other potential issues
    const booksWithIssues = await Book.find({ 
      status: 'published',
      isDeleted: { $ne: true }
    }).lean();
    
    console.log(`\nDetailed analysis:`);
    console.log(`- Total books in database: ${allBooks.length}`);
    console.log(`- Published books: ${publishedBooks.length}`);
    console.log(`- Books without categories: ${booksWithoutCategories.length}`);
    
    // Check if any books have invalid category references
    const booksWithInvalidCategories = [];
    for (const book of booksWithIssues) {
      if (book.categories && book.categories.length > 0) {
        // Try to populate categories to see if any are invalid
        const populatedBook = await Book.findById(book._id).populate('categories').lean();
        if (!populatedBook.categories || populatedBook.categories.some(cat => !cat)) {
          booksWithInvalidCategories.push(book);
        }
      }
    }
    
    if (booksWithInvalidCategories.length > 0) {
      console.log(`- Books with invalid category references: ${booksWithInvalidCategories.length}`);
    }

  } catch (error) {
    console.error('Error diagnosing book discrepancy:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the diagnosis
diagnoseBookDiscrepancy();