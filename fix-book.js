import mongoose from 'mongoose';
import fs from 'fs';
import Book from './models/Book.js';

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

async function fixBook() {
  try {
    console.log('Connecting to MongoDB...');
    const mongoUri = envVars.MONGODB_URI;
    await mongoose.connect(mongoUri);
    
    // Use a sample Google Drive file ID for testing
    // This is a public Google Drive file ID that should work for testing
    const sampleFileId = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
    const newDriveUrl = `https://drive.google.com/file/d/${sampleFileId}/view`;
    
    console.log('Updating book with proper Google Drive URL...');
    console.log('New driveUrl:', newDriveUrl);
    console.log('New driveFileId:', sampleFileId);
    
    const result = await Book.findByIdAndUpdate(
      '68a1fac6ca4aa097e9b3d3a9',
      {
        driveUrl: newDriveUrl,
        driveFileId: sampleFileId
      },
      { new: true }
    );
    
    if (result) {
      console.log('Book updated successfully!');
      console.log('Title:', result.title);
      console.log('Author:', result.author);
      console.log('DriveFileId:', result.driveFileId);
      console.log('DriveUrl:', result.driveUrl);
      console.log('Embed URL:', `https://drive.google.com/file/d/${result.driveFileId}/preview`);
    } else {
      console.log('Book not found!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixBook();