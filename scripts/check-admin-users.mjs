import mongoose from 'mongoose';
import User from '../models/User.js';

async function checkAdminUsers() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect('mongodb+srv://tahanjtech:meVhBzNSUg6OM2Pl@cluster0.o6ikkja.mongodb.net/bx-library?retryWrites=true&w=majority');
    console.log('Connected to MongoDB successfully!');

    // Find all admin users
    const adminUsers = await User.find({ role: 'admin' }).select('email name status createdAt lastLogin');
    
    console.log('\nAdmin Users Found:');
    console.log('==================');
    
    if (adminUsers.length === 0) {
      console.log('No admin users found in the database!');
    } else {
      adminUsers.forEach((user, index) => {
        console.log(`${index + 1}. Email: ${user.email}`);
        console.log(`   Name: ${user.name}`);
        console.log(`   Status: ${user.status}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Last Login: ${user.lastLogin || 'Never'}`);
        console.log('   ---');
      });
    }
    
    // Also check all users
    const allUsers = await User.find({}).select('email name role status');
    console.log(`\nTotal users in database: ${allUsers.length}`);
    
    console.log('\nAll Users:');
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.email} - ${user.name} (${user.role}) - ${user.status}`);
    });
    
  } catch (error) {
    console.error('Error checking admin users:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\nDatabase connection closed');
  }
}

// Run the check
checkAdminUsers();