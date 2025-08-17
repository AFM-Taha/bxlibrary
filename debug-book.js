const fs = require('fs');
const mongoose = require('mongoose');
const Book = require('./models/Book.js').default;

// Read environment variables from .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
const envVars = {};
envFile.split('\n').forEach(line => {
  const equalIndex = line.indexOf('=');
  if (equalIndex > 0) {
    const key = line.substring(0, equalIndex).trim();
    const value = line.substring(equalIndex + 1).trim();
    if (key && value) {
      envVars[key] = value;
    }
  }
});

async function debugBook() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = envVars.MONGODB_URI;
    console.log('MONGODB_URI:', mongoUri ? 'Set' : 'Not set');
    await mongoose.connect(mongoUri);
    
    const book = await Book.findById('68a1fac6ca4aa097e9b3d3a9');
    
    if (book) {
      console.log('Book found:');
      console.log('Title:', book.title);
      console.log('Author:', book.author);
      console.log('DriveFileId:', book.driveFileId);
      console.log('DriveUrl:', book.driveUrl);
      console.log('Status:', book.status);
      console.log('IsPublished:', book.isPublished);
      
      if (book.driveFileId) {
        const embedUrl = `https://drive.google.com/file/d/${book.driveFileId}/preview`;
        console.log('Generated embed URL:', embedUrl);
      } else {
        console.log('ERROR: No driveFileId found!');
      }
      
      // Fix the driveFileId if it's incorrect
      if (book.driveFileId === 'https' || !book.driveFileId || book.driveFileId.includes('/')) {
        console.log('\nDetected invalid driveFileId, attempting to fix...');
        
        // Extract correct file ID from driveUrl
        const extractFileId = (url) => {
          if (!url) return null;
          const patterns = [
            /\/file\/d\/([a-zA-Z0-9-_]+)/,
            /id=([a-zA-Z0-9-_]+)/,
            /\/open\?id=([a-zA-Z0-9-_]+)/
          ];
          for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
          }
          return null;
        };
        
        const correctFileId = extractFileId(book.driveUrl);
        if (correctFileId) {
          console.log('Correct file ID should be:', correctFileId);
          
          // Update the book with correct driveFileId
          await Book.findByIdAndUpdate('68a1fac6ca4aa097e9b3d3a9', {
            driveFileId: correctFileId
          });
          
          console.log('Book updated with correct driveFileId');
          const newEmbedUrl = `https://drive.google.com/file/d/${correctFileId}/preview`;
          console.log('New embed URL:', newEmbedUrl);
        } else {
          console.log('Could not extract valid file ID from driveUrl:', book.driveUrl);
        }
      }
    } else {
      console.log('Book not found with ID: 68a1fac6ca4aa097e9b3d3a9');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

debugBook();