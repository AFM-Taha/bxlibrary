import fetch from 'node-fetch';

async function testBooksAPI() {
  try {
    console.log('Testing /api/books endpoint...');
    
    // Test the public books API
    const response = await fetch('http://localhost:3000/api/books?page=1&limit=12');
    
    if (response.ok) {
      const data = await response.json();
      console.log('\nAPI Response:');
      console.log(`- Success: ${data.success}`);
      console.log(`- Total books: ${data.total}`);
      console.log(`- Total pages: ${data.totalPages}`);
      console.log(`- Current page: ${data.pagination?.currentPage}`);
      console.log(`- Books returned: ${data.books?.length || 0}`);
      
      if (data.books && data.books.length > 0) {
        console.log('\nFirst few books:');
        data.books.slice(0, 5).forEach((book, index) => {
          console.log(`${index + 1}. "${book.title}" by ${book.author}`);
        });
      }
      
      // Test page 2 if there are more books
      if (data.totalPages > 1) {
        console.log('\n--- Testing Page 2 ---');
        const page2Response = await fetch('http://localhost:3000/api/books?page=2&limit=12');
        if (page2Response.ok) {
          const page2Data = await page2Response.json();
          console.log(`Page 2 books returned: ${page2Data.books?.length || 0}`);
          if (page2Data.books && page2Data.books.length > 0) {
            console.log('Page 2 books:');
            page2Data.books.forEach((book, index) => {
              console.log(`${index + 1}. "${book.title}" by ${book.author}`);
            });
          }
        }
      }
    } else {
      console.log(`API Error: ${response.status} ${response.statusText}`);
      const errorText = await response.text();
      console.log('Error details:', errorText);
    }
  } catch (error) {
    console.error('Error testing books API:', error.message);
  }
}

// Run the test
testBooksAPI();