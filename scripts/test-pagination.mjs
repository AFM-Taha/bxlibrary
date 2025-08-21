import fetch from 'node-fetch';

async function testPagination() {
  try {
    console.log('Testing Book Management Pagination...');
    
    // Test first page
    console.log('\n1. Testing page 1...');
    const page1Response = await fetch('http://localhost:3000/api/admin/books?page=1&limit=20');
    
    if (page1Response.ok) {
      const page1Data = await page1Response.json();
      console.log('Page 1 Results:');
      console.log(`- Total books: ${page1Data.pagination?.totalCount || 'N/A'}`);
      console.log(`- Books on this page: ${page1Data.books?.length || 0}`);
      console.log(`- Current page: ${page1Data.pagination?.currentPage || 'N/A'}`);
      console.log(`- Total pages: ${page1Data.pagination?.totalPages || 'N/A'}`);
      
      // Test second page if it exists
      if (page1Data.pagination?.totalPages > 1) {
        console.log('\n2. Testing page 2...');
        const page2Response = await fetch('http://localhost:3000/api/admin/books?page=2&limit=20');
        
        if (page2Response.ok) {
          const page2Data = await page2Response.json();
          console.log('Page 2 Results:');
          console.log(`- Books on this page: ${page2Data.books?.length || 0}`);
          console.log(`- Current page: ${page2Data.pagination?.currentPage || 'N/A'}`);
          
          // Show first few books from each page to verify they're different
          console.log('\n3. Comparing first books from each page:');
          if (page1Data.books?.length > 0) {
            console.log(`Page 1 first book: "${page1Data.books[0].title}" by ${page1Data.books[0].author}`);
          }
          if (page2Data.books?.length > 0) {
            console.log(`Page 2 first book: "${page2Data.books[0].title}" by ${page2Data.books[0].author}`);
          }
        } else {
          console.log(`Page 2 API Error: ${page2Response.status} ${page2Response.statusText}`);
        }
      } else {
        console.log('\nOnly one page of books exists.');
      }
    } else {
      console.log(`Page 1 API Error: ${page1Response.status} ${page1Response.statusText}`);
      const errorText = await page1Response.text();
      console.log('Error details:', errorText);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testPagination();