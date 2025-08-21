import fetch from 'node-fetch';

async function testAdminDashboard() {
  try {
    console.log('Testing Admin Dashboard APIs...');
    
    // Test admin books API
    console.log('\n1. Testing /api/admin/books...');
    const booksResponse = await fetch('http://localhost:3000/api/admin/books');
    
    if (booksResponse.ok) {
      const booksData = await booksResponse.json();
      console.log('Admin Books API Response:');
      console.log(`- Total books: ${booksData.pagination?.totalCount || 'N/A'}`);
      console.log(`- Books returned: ${booksData.books?.length || 0}`);
      console.log(`- Current page: ${booksData.pagination?.currentPage || 'N/A'}`);
      console.log(`- Total pages: ${booksData.pagination?.totalPages || 'N/A'}`);
      
      if (booksData.books && booksData.books.length > 0) {
        console.log('\nFirst few books:');
        booksData.books.slice(0, 5).forEach((book, index) => {
          console.log(`${index + 1}. "${book.title}" by ${book.author} (Status: ${book.status})`);
        });
      }
    } else {
      console.log(`Admin Books API Error: ${booksResponse.status} ${booksResponse.statusText}`);
      const errorText = await booksResponse.text();
      console.log('Error details:', errorText);
    }
    
    // Test regular books API for comparison
    console.log('\n2. Testing /api/books for comparison...');
    const regularBooksResponse = await fetch('http://localhost:3000/api/books');
    
    if (regularBooksResponse.ok) {
      const regularBooksData = await regularBooksResponse.json();
      console.log('Regular Books API Response:');
      console.log(`- Total books: ${regularBooksData.total || 'N/A'}`);
      console.log(`- Books returned: ${regularBooksData.books?.length || 0}`);
      console.log(`- Current page: ${regularBooksData.pagination?.currentPage || 'N/A'}`);
      console.log(`- Total pages: ${regularBooksData.totalPages || 'N/A'}`);
    } else {
      console.log(`Regular Books API Error: ${regularBooksResponse.status} ${regularBooksResponse.statusText}`);
      const errorText = await regularBooksResponse.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('Error testing admin dashboard:', error.message);
  }
}

// Run the test
testAdminDashboard();