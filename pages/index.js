import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../contexts/AuthContext'
import ProtectedRoute from '../components/ProtectedRoute'
import { CompactThemeToggle } from '../components/ThemeToggle'
import BookImageSlider from '../components/BookImageSlider'
import { User, LogOut, LogIn } from 'lucide-react'

function LibraryPage() {
  const { user, logout } = useAuth()
  const router = useRouter()
  const [books, setBooks] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [initialLoad, setInitialLoad] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [sortBy, setSortBy] = useState('newest')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBooks, setTotalBooks] = useState(0)
  const [showFilters, setShowFilters] = useState(false)

  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/categories', {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setCategories(data.categories || [])
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }, [])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const fetchBooks = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 16,
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        sort: sortBy,
      })

      const response = await fetch(`/api/books?${params}`, {
        credentials: 'include'
      })
      if (response.ok) {
        const data = await response.json()
        setBooks(data.books || [])
        setTotalPages(data.totalPages || 1)
        setTotalBooks(data.total || 0)
      }
    } catch (error) {
      console.error('Failed to fetch books:', error)
    } finally {
      setLoading(false)
      setInitialLoad(false)
    }
  }, [currentPage, searchTerm, selectedCategory, sortBy])

  useEffect(() => {
    fetchBooks()
  }, [fetchBooks])

  const handleSearch = (e) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchBooks()
  }

  const handleCategoryChange = (categoryId) => {
    setSelectedCategory(categoryId)
    setCurrentPage(1)
  }

  const handleSortChange = (newSort) => {
    setSortBy(newSort)
    setCurrentPage(1)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Navigation */}
      <nav className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <Link href='/' className='flex-shrink-0'>
                <h1 className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                  BX Library
                </h1>
              </Link>
            </div>
            <div className='flex items-center space-x-4'>
              <CompactThemeToggle />
              {user ? (
                <>
                  <Link
                    href='/account'
                    className='text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center'
                    title='Account'
                  >
                    <User size={18} />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className='text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center'
                    title='Log Out'
                  >
                    <LogOut size={18} />
                    <span className='ml-2'>Log Out</span>
                  </button>
                </>
              ) : (
                <Link
                  href='/login'
                  className='text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center'
                  title='Log In'
                >
                  <LogIn size={18} />
                  <span className='ml-2'>Log In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Search and Filters */}
        <div
          className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 px-4 pt-4 mb-8 ${
            showFilters ? 'pb-4' : 'pb-0 md:pb-4'
          }`}
        >
          <form onSubmit={handleSearch} className='mb-4'>
            <div className='flex gap-2'>
              <div className='flex-1'>
                <input
                  type='text'
                  placeholder='Search books by title or author...'
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className='w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400'
                />
              </div>
              <button
                type='submit'
                className='px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center'
                title='Search'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
                  />
                </svg>
              </button>
              <button
                type='button'
                onClick={() => setShowFilters(!showFilters)}
                className='md:hidden px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center'
                title='Toggle Filters'
              >
                <svg
                  className='w-5 h-5'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                  xmlns='http://www.w3.org/2000/svg'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z'
                  />
                </svg>
              </button>
            </div>
          </form>

          <div
            className={`flex flex-wrap gap-4 items-center ${
              showFilters ? 'block' : 'hidden md:flex'
            }`}
          >
            {/* Category Filter */}
            <div className='flex items-center space-x-2'>
              <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Category:
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className='px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white'
              >
                <option value=''>All Categories</option>
                {categories.map((category) => (
                  <option key={category._id} value={category._id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Sort Options */}
            <div className='flex items-center space-x-2'>
              <label className='text-sm font-medium text-gray-700 dark:text-gray-300'>
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className='px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white'
              >
                <option value='newest'>Newest First</option>
                <option value='oldest'>Oldest First</option>
                <option value='title-asc'>Title A-Z</option>
                <option value='title-desc'>Title Z-A</option>
                <option value='author-asc'>Author A-Z</option>
                <option value='author-desc'>Author Z-A</option>
              </select>
            </div>

            {/* Clear Filters */}
            {(searchTerm || selectedCategory) && (
              <button
                onClick={() => {
                  setSearchTerm('')
                  setSelectedCategory('')
                  setCurrentPage(1)
                }}
                className='text-sm text-blue-600 hover:text-blue-800 underline'
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Header */}
        <div className='mb-8'>
          <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
            Library
          </h1>
          <p className='text-gray-600 dark:text-gray-400'>
            Discover and read from our collection of{' '}
            {totalBooks.toLocaleString()} books
          </p>
        </div>

        {/* Books Grid */}
        {loading || initialLoad ? (
          <div className='flex justify-center items-center py-12'>
            <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
          </div>
        ) : books.length === 0 ? (
          <div className='text-center py-12'>
            <svg
              className='mx-auto h-12 w-12 text-gray-400 mb-4'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253'
              />
            </svg>
            <h3 className='text-lg font-medium text-gray-900 dark:text-white mb-2'>
              No books found
            </h3>
            <p className='text-gray-500 dark:text-gray-400'>
              {searchTerm || selectedCategory
                ? 'Try adjusting your search criteria or filters.'
                : 'No books are available at the moment.'}
            </p>
          </div>
        ) : (
          <>
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-8'>
              {books.map((book) => (
                <div
                  key={book._id}
                  className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow'
                >
                  <Link href={`/books/${book._id}`}>
                    <div className='aspect-[2/3] rounded-t-lg overflow-hidden'>
                      <BookImageSlider
                        images={book.images || []}
                        title={book.title}
                        className='w-full h-full'
                        autoSlide={false}
                        slideInterval={4000}
                      />
                    </div>
                    <div className='p-2'>
                      <h3 className='font-medium text-gray-900 dark:text-white text-xs mb-1 line-clamp-2 leading-tight'>
                        {book.title}
                      </h3>
                      <p className='text-xs text-gray-600 dark:text-gray-400 mb-1 truncate'>
                        {book.author}
                      </p>
                      {book.category && (
                        <span className='inline-block px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full truncate'>
                          {book.category.name}
                        </span>
                      )}
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className='flex justify-center items-center space-x-2'>
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className='px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Previous
                </button>

                <div className='flex space-x-1'>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum
                    if (totalPages <= 5) {
                      pageNum = i + 1
                    } else if (currentPage <= 3) {
                      pageNum = i + 1
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i
                    } else {
                      pageNum = currentPage - 2 + i
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 text-sm font-medium rounded-md ${
                          currentPage === pageNum
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  })}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className='px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

export default function Home() {
  return <LibraryPage />
}
