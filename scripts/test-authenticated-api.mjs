// Test script to verify authenticated API calls work
// This simulates what happens when a user is logged in

import fetch from 'node-fetch';

async function testAuthenticatedAPI() {
  try {
    console.log('Testing authenticated API calls...');
    
    // First, let's try to login to get authentication cookies
    console.log('\n1. Attempting login...');
    const loginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'admin@bxlibrary.com',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.log(`Login failed: ${loginResponse.status} ${loginResponse.statusText}`);
      const errorData = await loginResponse.json();
      console.log('Login error:', errorData);
      return;
    }
    
    const loginData = await loginResponse.json();
    console.log('Login successful!');
    console.log(`User: ${loginData.user.name} (${loginData.user.role})`);
    
    // Extract cookies from login response
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('Received cookies:', cookies);
    
    if (!cookies) {
      console.log('No cookies received from login!');
      return;
    }
    
    // Now test the books API with authentication
    console.log('\n2. Testing /api/books with authentication...');
    const booksResponse = await fetch('http://localhost:3000/api/books?page=1&limit=12', {
      headers: {
        'Cookie': cookies
      }
    });
    
    if (booksResponse.ok) {
      const booksData = await booksResponse.json();
      console.log('\nBooks API Response:');
      console.log(`- Success: ${booksData.success}`);
      console.log(`- Total books: ${booksData.total}`);
      console.log(`- Total pages: ${booksData.totalPages}`);
      console.log(`- Current page: ${booksData.pagination?.currentPage}`);
      console.log(`- Books returned: ${booksData.books?.length || 0}`);
      
      if (booksData.books && booksData.books.length > 0) {
        console.log('\nFirst few books:');
        booksData.books.slice(0, 5).forEach((book, index) => {
          console.log(`${index + 1}. "${book.title}" by ${book.author} (Status: ${book.status})`);
        });
      }
      
      // Test page 2 if there are more books
      if (booksData.totalPages > 1) {
        console.log('\n3. Testing Page 2...');
        const page2Response = await fetch('http://localhost:3000/api/books?page=2&limit=12', {
          headers: {
            'Cookie': cookies
          }
        });
        if (page2Response.ok) {
          const page2Data = await page2Response.json();
          console.log(`Page 2 books returned: ${page2Data.books?.length || 0}`);
          if (page2Data.books && page2Data.books.length > 0) {
            console.log('Page 2 books:');
            page2Data.books.forEach((book, index) => {
              console.log(`${index + 1}. "${book.title}" by ${book.author} (Status: ${book.status})`);
            });
          }
        }
      }
    } else {
      console.log(`Books API Error: ${booksResponse.status} ${booksResponse.statusText}`);
      const errorText = await booksResponse.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('Error testing authenticated API:', error.message);
  }
}

// Run the test
testAuthenticatedAPI();