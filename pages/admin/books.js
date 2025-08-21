import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { toast } from 'react-hot-toast';
import { CompactThemeToggle } from '../../components/ThemeToggle';
import CloudinaryImageUpload from '../../components/CloudinaryImageUpload';
import BookImageSlider from '../../components/BookImageSlider';

function AdminBooks() {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showBulkUploadModal, setShowBulkUploadModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [bulkUploadFile, setBulkUploadFile] = useState(null);
  const [bulkUploadLoading, setBulkUploadLoading] = useState(false);
  const [bulkUploadResults, setBulkUploadResults] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBooks, setTotalBooks] = useState(0);
  const [booksPerPage] = useState(20);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchTimeout, setSearchTimeout] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    categories: [],
    googleDriveFileId: '',
    images: [],
    tags: '',
    isPublic: true
  });

  useEffect(() => {
    fetchBooks();
    fetchCategories();
  }, []);

  const fetchBooks = async (page = 1, search = '') => {
    try {
      const searchParam = search ? `&search=${encodeURIComponent(search)}` : '';
      const response = await fetch(`/api/admin/books?page=${page}&limit=${booksPerPage}${searchParam}`, {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalBooks(data.pagination?.totalCount || 0);
        setCurrentPage(page);
      } else {
        toast.error('Failed to fetch books');
      }
    } catch (error) {
      console.error('Error fetching books:', error);
      toast.error('Failed to fetch books');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSearch = (value) => {
    setSearchTerm(value);
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
    
    // Set new timeout for debounced search
    const newTimeout = setTimeout(() => {
      setCurrentPage(1); // Reset to first page when searching
      fetchBooks(1, value);
    }, 500);
    
    setSearchTimeout(newTimeout);
  };

  // Effect to handle search term changes
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout);
      }
    };
  }, [searchTimeout]);

  const handleCreateBook = async (e) => {
    e.preventDefault();
    
    // Client-side validation
    if (!formData.categories || formData.categories.length === 0) {
      toast.error('Please select at least one category');
      return;
    }
    
    if (formData.categories.length > 5) {
      toast.error('Please select no more than 5 categories');
      return;
    }
    
    if (!formData.googleDriveFileId) {
      toast.error('Please provide a Google Drive File ID');
      return;
    }
    
    try {
      // Helper function to extract file ID from Google Drive URL or return the ID if already provided
      const extractFileId = (input) => {
        if (!input) return '';
        
        // If it's already a file ID (no slashes), return as is
        if (!input.includes('/')) {
          return input;
        }
        
        // Extract file ID from various Google Drive URL formats
        const patterns = [
          /\/file\/d\/([a-zA-Z0-9-_]+)/,
          /id=([a-zA-Z0-9-_]+)/,
          /\/open\?id=([a-zA-Z0-9-_]+)/
        ];
        
        for (const pattern of patterns) {
          const match = input.match(pattern);
          if (match) {
            return match[1];
          }
        }
        
        return input; // Return as is if no pattern matches
      };
      
      const fileId = extractFileId(formData.googleDriveFileId);
      
      const bookData = {
        title: formData.title,
        author: formData.author,
        description: formData.description,
        categoryIds: formData.categories,
        status: formData.isPublic ? 'published' : 'draft',
        images: formData.images
      };

      // Only include driveUrl if fileId exists
      if (fileId) {
        bookData.driveUrl = `https://drive.google.com/file/d/${fileId}/view`;
      } else {
        bookData.driveUrl = null;
      }
      
      console.log('Sending book data:', bookData);

      const response = await fetch('/api/admin/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(bookData)
      });

      if (response.ok) {
        toast.success('Book created successfully');
        setShowCreateModal(false);
        resetForm();
        fetchBooks(currentPage, searchTerm);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to create book');
      }
    } catch (error) {
      console.error('Error creating book:', error);
      toast.error('Failed to create book');
    }
  };

  const handleUpdateBook = async (e) => {
    e.preventDefault();
    try {
      // Helper function to extract file ID from Google Drive URL or return the ID if already provided
      const extractFileId = (input) => {
        if (!input) return '';
        
        // If it's already a file ID (no slashes), return as is
        if (!input.includes('/')) {
          return input;
        }
        
        // Extract file ID from various Google Drive URL formats
        const patterns = [
          /\/file\/d\/([a-zA-Z0-9-_]+)/,
          /id=([a-zA-Z0-9-_]+)/,
          /\/open\?id=([a-zA-Z0-9-_]+)/
        ];
        
        for (const pattern of patterns) {
          const match = input.match(pattern);
          if (match) {
            return match[1];
          }
        }
        
        return input; // Return as is if no pattern matches
      };
      
      const fileId = extractFileId(formData.googleDriveFileId);
      
      const bookData = {
        title: formData.title,
        author: formData.author,
        description: formData.description,
        driveUrl: `https://drive.google.com/file/d/${fileId}/view`,
        categoryIds: formData.categories,
        status: formData.isPublic ? 'published' : 'draft',
        images: formData.images
      };
      


      const response = await fetch(`/api/admin/books/${editingBook.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify(bookData)
      });

      if (response.ok) {
        toast.success('Book updated successfully');
        setEditingBook(null);
        resetForm();
        fetchBooks(currentPage, searchTerm);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to update book');
      }
    } catch (error) {
      console.error('Error updating book:', error);
      toast.error('Failed to update book');
    }
  };

  const handleDeleteBook = async (bookId) => {
    if (!confirm('Are you sure you want to delete this book?')) return;

    try {
      const response = await fetch(`/api/admin/books/${bookId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        toast.success('Book deleted successfully');
        // If we're on the last page and it becomes empty, go to previous page
        const newCurrentPage = books.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
        fetchBooks(newCurrentPage, searchTerm);
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to delete book');
      }
    } catch (error) {
      console.error('Error deleting book:', error);
      toast.error('Failed to delete book');
    }
  };

  const openEditModal = (book) => {
    setEditingBook(book);
    
    // Ensure categories are always extracted as IDs
    const categoryIds = book.categories ? book.categories.map(cat => {
      if (typeof cat === 'string') return cat;
      if (cat.id) return cat.id;
      if (cat._id) return cat._id;
      return cat;
    }) : [];
    

    
    setFormData({
      title: book.title,
      author: book.author,
      description: book.description || '',
      categories: categoryIds,
      googleDriveFileId: book.driveFileId || book.driveUrl || '',
      images: book.images || [],
      isPublic: book.isPublic !== false
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      categories: [],
      googleDriveFileId: '',
      images: [],
      isPublic: true
    });
  };

  const handleBulkUpload = async () => {
    if (!bulkUploadFile) {
      toast.error('Please select a JSON file');
      return;
    }

    setBulkUploadLoading(true);
    const formData = new FormData();
    formData.append('file', bulkUploadFile);

    try {
      const response = await fetch('/api/admin/books/bulk-import', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();

      if (response.ok) {
        setBulkUploadResults(result.results);
        toast.success(`Bulk upload completed! Created: ${result.results.created}, Updated: ${result.results.updated}`);
        fetchBooks(currentPage, searchTerm); // Refresh the books list
      } else {
        toast.error(result.error || 'Bulk upload failed');
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
      toast.error('Failed to upload books');
    } finally {
      setBulkUploadLoading(false);
    }
  };

  const resetBulkUpload = () => {
    setBulkUploadFile(null);
    setBulkUploadResults(null);
    setShowBulkUploadModal(false);
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingBook(null);
    resetForm();
  };

  const handleTogglePublish = async (book) => {
    try {
      const action = book.status === 'published' ? 'unpublish' : 'publish';
      const response = await fetch(`/api/admin/books/${book.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ action })
      });

      if (response.ok) {
        toast.success(`Book ${action === 'publish' ? 'published' : 'unpublished'} successfully`);
        fetchBooks(currentPage, searchTerm);
      } else {
        const data = await response.json();
        toast.error(data.error || `Failed to ${action} book`);
      }
    } catch (error) {
      console.error('Error toggling book status:', error);
      toast.error('Failed to update book status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading books...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute requireAdmin={true}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 shadow border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <Link href="/admin" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  ← Back to Dashboard
                </Link>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-2">Book Management</h1>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Manage books in the library
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <CompactThemeToggle />
                <button
                  onClick={() => setShowBulkUploadModal(true)}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Bulk Upload
                </button>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Add Book
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Search Bar */}
          <div className="mb-6">
            <div className="max-w-md">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search Books
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                </div>
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search by title, author, or description..."
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md leading-5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Book
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Added
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {books.map((book) => (
                    <tr key={book.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-8">
                            <BookImageSlider
                              images={book.images || []}
                              title={book.title}
                              className="h-12 w-8 rounded"
                              autoSlide={false}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {book.title && book.title.length > 25
                                ? `${book.title.substring(0, 25)}...`
                                : book.title
                              }
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {book.description && book.description.length > 35
                                ? `${book.description.substring(0, 35)}...`
                                : book.description
                              }
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {book.author && book.author.length > 20
                          ? `${book.author.substring(0, 20)}...`
                          : book.author
                        }
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1">
                          {book.categories && book.categories.length > 0 ? (
                            book.categories.map((category, index) => (
                              <span key={category._id || index} className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                {category.name}
                              </span>
                            ))
                          ) : (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                              Uncategorized
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          book.isPublic !== false
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {book.isPublic !== false ? 'Public' : 'Private'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {new Date(book.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <Link
                            href={`/books/${book.id}`}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleTogglePublish(book)}
                            className={`p-1 ${
                              book.status === 'published'
                                ? 'text-green-600 hover:text-green-900'
                                : 'text-gray-600 hover:text-gray-900'
                            }`}
                            title={book.status === 'published' ? 'Unpublish' : 'Publish'}
                          >
                            {book.status === 'published' ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                              </svg>
                            )}
                          </button>
                          <button
                            onClick={() => openEditModal(book)}
                            className="text-primary-600 hover:text-primary-900 p-1"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book.id)}
                            className="text-red-600 hover:text-red-900 p-1"
                            title="Delete"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="bg-white dark:bg-gray-800 px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-gray-700 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => fetchBooks(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => fetchBooks(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      Showing{' '}
                      <span className="font-medium">{(currentPage - 1) * booksPerPage + 1}</span>
                      {' '}to{' '}
                      <span className="font-medium">
                        {Math.min(currentPage * booksPerPage, totalBooks)}
                      </span>
                      {' '}of{' '}
                      <span className="font-medium">{totalBooks}</span>
                      {' '}results
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                      <button
                        onClick={() => fetchBooks(currentPage - 1, searchTerm)}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Previous</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Page Numbers */}
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={pageNum}
                            onClick={() => fetchBooks(pageNum, searchTerm)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === currentPage
                                ? 'z-10 bg-primary-50 dark:bg-primary-900 border-primary-500 text-primary-600 dark:text-primary-400'
                                : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      
                      <button
                        onClick={() => fetchBooks(currentPage + 1, searchTerm)}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="sr-only">Next</span>
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Create/Edit Modal */}
        {(showCreateModal || editingBook) && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                  {editingBook ? 'Edit Book' : 'Add New Book'}
                </h3>
                <form onSubmit={editingBook ? handleUpdateBook : handleCreateBook}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Title *
                      </label>
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Author *
                      </label>
                      <input
                        type="text"
                        value={formData.author}
                        onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Categories (Select 1-5)
                      </label>
                      <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-md p-2 bg-white dark:bg-gray-700">
                        {categories.map((category) => (
                          <label key={category._id} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-600 p-1 rounded">
                            <input
                              type="checkbox"
                              checked={formData.categories.includes(category._id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  if (formData.categories.length < 5) {
                                    setFormData({ 
                                      ...formData, 
                                      categories: [...formData.categories, category._id] 
                                    });
                                  }
                                } else {
                                  setFormData({ 
                                    ...formData, 
                                    categories: formData.categories.filter(id => id !== category._id) 
                                  });
                                }
                              }}
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="text-sm text-gray-900 dark:text-white">{category.name}</span>
                          </label>
                        ))}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Selected: {formData.categories.length}/5
                      </p>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Google Drive URL or File ID
                      </label>
                      {editingBook && editingBook.driveUrl && (
                        <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700 rounded border">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Current Drive URL:</p>
                          <a 
                            href={editingBook.driveUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline break-all"
                          >
                            {editingBook.driveUrl}
                          </a>
                        </div>
                      )}
                      <input
                        type="text"
                        value={formData.googleDriveFileId}
                        onChange={(e) => setFormData({ ...formData, googleDriveFileId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        placeholder="Paste Google Drive URL or File ID (e.g., https://drive.google.com/file/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/view)"
                        required
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <CloudinaryImageUpload
                      images={formData.images}
                      onChange={(images) => setFormData({ ...formData, images })}
                      maxImages={5}
                    />
                  </div>

                  <div className="mb-6">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={formData.isPublic}
                        onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-300 focus:ring focus:ring-primary-200 focus:ring-opacity-50"
                      />
                      <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Make this book public</span>
                    </label>
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md"
                    >
                      {editingBook ? 'Update Book' : 'Add Book'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Bulk Upload Modal */}
        {showBulkUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Bulk Upload Books
                  </h2>
                  <button
                    onClick={resetBulkUpload}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-6">
                  {/* File Upload Section */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Upload JSON File
                    </label>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6">
                      <div className="text-center">
                        <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <div className="mt-4">
                          <label htmlFor="bulk-file-upload" className="cursor-pointer">
                            <span className="mt-2 block text-sm font-medium text-gray-900 dark:text-white">
                              {bulkUploadFile ? bulkUploadFile.name : 'Choose JSON file or drag and drop'}
                            </span>
                            <input
                              id="bulk-file-upload"
                              type="file"
                              accept=".json"
                              onChange={(e) => setBulkUploadFile(e.target.files[0])}
                              className="sr-only"
                            />
                          </label>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                            JSON files up to 10MB
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* JSON Format Example */}
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Expected JSON Format:
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Note: driveUrl is optional. Books can be created without Google Drive links.
                    </p>
                    <pre className="bg-gray-100 dark:bg-gray-700 p-3 rounded text-xs overflow-x-auto">
{`[
  {
    "title": "Book Title",
    "author": "Author Name",
    "description": "Book description (optional)",
    "categories": ["Category Name 1", "Category Name 2"],
    "driveUrl": "https://drive.google.com/file/d/FILE_ID/view",
    "isPublished": true
  },
  {
    "title": "Another Book",
    "author": "Another Author",
    "description": "Book without drive URL",
    "categories": ["Category Name"],
    "isPublished": false
  }
]`}
                    </pre>
                  </div>

                  {/* Upload Results */}
                  {bulkUploadResults && (
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Upload Results:
                      </h3>
                      <div className="text-sm space-y-1">
                        <p className="text-green-600 dark:text-green-400">
                          ✓ Created: {bulkUploadResults.created} books
                        </p>
                        <p className="text-blue-600 dark:text-blue-400">
                          ↻ Updated: {bulkUploadResults.updated} books
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          Total processed: {bulkUploadResults.total} books
                        </p>
                        {bulkUploadResults.errors.length > 0 && (
                          <div className="mt-2">
                            <p className="text-red-600 dark:text-red-400">
                              ✗ Errors: {bulkUploadResults.errors.length}
                            </p>
                            <div className="mt-1 max-h-32 overflow-y-auto">
                              {bulkUploadResults.errors.slice(0, 5).map((error, index) => (
                                <p key={index} className="text-xs text-red-500 dark:text-red-400">
                                  Row {error.index + 1}: {error.error}
                                </p>
                              ))}
                              {bulkUploadResults.errors.length > 5 && (
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  ... and {bulkUploadResults.errors.length - 5} more errors
                                </p>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                    <button
                      onClick={resetBulkUpload}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 rounded-md"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleBulkUpload}
                      disabled={!bulkUploadFile || bulkUploadLoading}
                      className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed rounded-md"
                    >
                      {bulkUploadLoading ? 'Uploading...' : 'Upload Books'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}

export default AdminBooks;