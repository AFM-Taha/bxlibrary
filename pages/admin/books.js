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

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/admin/books', {
        credentials: 'include'
      });
      if (response.ok) {
        const data = await response.json();
        setBooks(data.books || []);
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
        images: formData.images,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
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
        fetchBooks();
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
        images: formData.images,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
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
        fetchBooks();
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
        fetchBooks();
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
    setFormData({
      title: book.title,
      author: book.author,
      description: book.description || '',
      categories: book.categories ? book.categories.map(cat => cat._id || cat) : [],
      googleDriveFileId: book.driveFileId || book.driveUrl || '',
      images: book.images || [],
      tags: book.tags ? book.tags.join(', ') : '',
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
      tags: '',
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
        fetchBooks(); // Refresh the books list
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
                              {book.title}
                            </div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">
                              {book.description && book.description.length > 50
                                ? `${book.description.substring(0, 50)}...`
                                : book.description
                              }
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-300">
                        {book.author}
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
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </Link>
                          <button
                            onClick={() => openEditModal(book)}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteBook(book.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Tags (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="fiction, mystery, bestseller"
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