import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import { toast } from 'react-hot-toast';
import { CompactThemeToggle } from '../../components/ThemeToggle';

function AdminBooks() {
  const { user } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    description: '',
    category: '',
    googleDriveFileId: '',
    coverImage: '',
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
    if (!formData.category) {
      toast.error('Please select a category');
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
        driveUrl: `https://drive.google.com/file/d/${fileId}/view`,
        categoryId: formData.category,
        status: formData.isPublic ? 'published' : 'draft',
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag)
      };
      
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
        categoryId: formData.category,
        status: formData.isPublic ? 'published' : 'draft',
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
      category: book.category?._id || book.category || '',
      googleDriveFileId: book.driveFileId || book.driveUrl || '',
      coverImage: book.coverImage || '',
      tags: book.tags ? book.tags.join(', ') : '',
      isPublic: book.isPublic !== false
    });
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      description: '',
      category: '',
      googleDriveFileId: '',
      coverImage: '',
      tags: '',
      isPublic: true
    });
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
                            {book.coverImage ? (
                              <img
                                className="h-12 w-8 object-cover rounded"
                                src={book.coverImage}
                                alt={book.title}
                              />
                            ) : (
                              <div className="h-12 w-8 bg-gray-200 rounded flex items-center justify-center">
                                <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                </svg>
                              </div>
                            )}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                          {book.category?.name || 'Uncategorized'}
                        </span>
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
                        Category
                      </label>
                      <select
                        value={formData.category}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        required
                      >
                        <option value="">Select a category</option>
                        {categories.map((category) => (
                          <option key={category._id} value={category._id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
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
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Cover Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.coverImage}
                      onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="https://example.com/cover.jpg"
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
      </div>
    </ProtectedRoute>
  );
}

export default AdminBooks;