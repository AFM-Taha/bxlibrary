import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import BookImageSlider from '../components/BookImageSlider';
import ThemeToggle from '../components/ThemeToggle';

// Add custom CSS for line-clamp
const customStyles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

export default function Home() {
  const { user, isAuthenticated, loading } = useAuth();
  const { isDark } = useTheme();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalCategories: 0,
    totalUsers: 0
  });
  const [categories, setCategories] = useState([]);
  const [featuredBooks, setFeaturedBooks] = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [previewBook, setPreviewBook] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchPublicStats();
    fetchCategories();
    fetchFeaturedBooks();
  }, []);

  const fetchPublicStats = async () => {
    try {
      const response = await fetch('/api/public/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/public/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories?.slice(0, 6) || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchFeaturedBooks = async () => {
    try {
      const response = await fetch('/api/public/books?limit=8&sort=newest');
      if (response.ok) {
        const data = await response.json();
        setFeaturedBooks(data.books || []);
      }
    } catch (error) {
      console.error('Failed to fetch featured books:', error);
    } finally {
      setLoadingData(false);
    }
  };

  const handlePreview = (book) => {
    setPreviewBook(book);
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
    setPreviewBook(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Head>
        <title>BX Library - Your Digital Reading Companion</title>
        <meta name="description" content="Access thousands of books online with BX Library. Read, discover, and enjoy your favorite books anytime, anywhere." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <style dangerouslySetInnerHTML={{ __html: customStyles }} />
      </Head>
      {/* Navigation */}
      <nav className="bg-white dark:bg-gray-800 shadow-lg border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">BX Library</h1>
              </div>
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <a href="#categories" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">
                  Categories
                </a>
                <a href="#featured-books" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">
                  Featured Books
                </a>
                <Link href="/contact" className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 text-sm font-medium transition-colors">
                  Contact
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <ThemeToggle />
              {isAuthenticated ? (
                <Link
                  href="/library"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Go to Library
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Get Started
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Banner Section */}
      <div className="relative bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-800/20 to-purple-800/20 mix-blend-multiply" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
              <span className="block">Discover Your Next</span>
              <span className="block text-yellow-300">Great Read</span>
            </h1>
            <p className="mt-6 max-w-3xl mx-auto text-xl text-blue-100 sm:text-2xl">
              Explore thousands of books across every genre. From bestsellers to hidden gems, 
              your perfect book is waiting to be discovered.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              {!isAuthenticated ? (
                <>
                  <Link
                    href="/login"
                    className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-blue-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    Start Reading Free
                    <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </Link>
                  <a
                    href="#featured"
                    className="inline-flex items-center px-8 py-4 border-2 border-white text-lg font-medium rounded-lg text-white hover:bg-white hover:text-blue-700 transition-all duration-200"
                  >
                    Browse Books
                  </a>
                </>
              ) : (
                <Link
                  href="/library"
                  className="inline-flex items-center px-8 py-4 border border-transparent text-lg font-medium rounded-lg text-blue-700 bg-white hover:bg-gray-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                >
                  Go to Your Library
                  <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </Link>
              )}
            </div>
            
            {/* Stats in banner */}
            <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl font-bold text-white">{stats.totalBooks.toLocaleString()}+</div>
                <div className="text-blue-100">Books Available</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl font-bold text-white">{stats.totalCategories}+</div>
                <div className="text-blue-100">Categories</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <div className="text-3xl font-bold text-white">{stats.totalUsers.toLocaleString()}+</div>
                <div className="text-blue-100">Happy Readers</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <svg className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2" width="404" height="404" fill="none" viewBox="0 0 404 404">
            <defs>
              <pattern id="85737c0e-0916-41d7-917f-596dc7edfa27" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect x="0" y="0" width="4" height="4" className="text-white" fill="currentColor" opacity="0.1" />
              </pattern>
            </defs>
            <rect width="404" height="404" fill="url(#85737c0e-0916-41d7-917f-596dc7edfa27)" />
          </svg>
        </div>
      </div>

      {/* Categories Section */}
      <div id="categories" className="bg-gray-50 dark:bg-gray-800 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Explore by Category
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              Discover books across all your favorite genres
            </p>
          </div>
          
          {loadingData ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-sm animate-pulse">
                  <div className="w-12 h-12 bg-gray-200 dark:bg-gray-600 rounded-lg mb-4 mx-auto"></div>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-2/3 mx-auto"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
              {categories.map((category) => (
                <div
                  key={category._id}
                  className="bg-white dark:bg-gray-700 rounded-xl p-6 shadow-sm hover:shadow-lg dark:hover:shadow-gray-900/25 transition-all duration-200 cursor-pointer group hover:-translate-y-1"
                  onClick={() => {
                    if (isAuthenticated) {
                      router.push(`/library?category=${category._id}`);
                    } else {
                      router.push('/login');
                    }
                  }}
                >
                  <div 
                    className="w-12 h-12 rounded-lg mb-4 mx-auto flex items-center justify-center text-white font-bold text-lg"
                    style={{ backgroundColor: category.color || '#3B82F6' }}
                  >
                    {category.name.charAt(0).toUpperCase()}
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white text-center mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                    {category.bookCount || 0} books
                  </p>
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link
              href={isAuthenticated ? "/library" : "/login"}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/70 transition-colors"
            >
              View All Categories
              <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* Featured Books Section */}
      <div id="featured" className="bg-white dark:bg-gray-900 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">
              Featured Books
            </h2>
            <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
              Discover our most popular and recommended reads
            </p>
          </div>
          
          {loadingData ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-8">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-gray-300 dark:bg-gray-600 aspect-[2/3] rounded-lg mb-2"></div>
                  <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded mb-1"></div>
                  <div className="h-2 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3 mb-8">
              {featuredBooks.map((book) => (
                <div key={book._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
                  {isAuthenticated ? (
                    <Link href={`/books/${book._id}`}>
                      <div className="aspect-[2/3] rounded-t-lg overflow-hidden">
                        <BookImageSlider
                          images={book.images || []}
                          title={book.title}
                          className="w-full h-full"
                          autoSlide={false}
                          slideInterval={4000}
                        />
                      </div>
                      <div className="p-2">
                        <h3 className="font-medium text-gray-900 dark:text-white text-xs mb-1 line-clamp-2 leading-tight">{book.title}</h3>
                        <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">{book.author}</p>
                        {book.category && (
                          <span className="inline-block px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full truncate">
                            {book.category.name}
                          </span>
                        )}
                      </div>
                    </Link>
                  ) : (
                    <Link href={`/books/${book._id}`}>
                      <div className="cursor-pointer">
                        <div className="aspect-[2/3] rounded-t-lg overflow-hidden relative">
                          <BookImageSlider
                            images={book.images || []}
                            title={book.title}
                            className="w-full h-full"
                            autoSlide={false}
                            slideInterval={4000}
                          />
                        </div>
                        <div className="p-2">
                          <h3 className="font-medium text-gray-900 dark:text-white text-xs mb-1 line-clamp-2 leading-tight">{book.title}</h3>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1 truncate">{book.author}</p>
                          {book.category && (
                            <span className="inline-block px-1.5 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 rounded-full truncate mb-2">
                              {book.category.name}
                            </span>
                          )}

                        </div>
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
          
          <div className="text-center mt-12">
            <Link
              href={isAuthenticated ? "/library" : "/login"}
              className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            >
              {isAuthenticated ? 'Browse All Books' : 'Login to Access Library'}
              <svg className="ml-2 -mr-1 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-blue-600">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Join thousands of readers</span>
            <span className="block">Start your premium reading experience</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-blue-200">
            Get unlimited access to our entire library with personalized recommendations and exclusive content.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-blue-50 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center justify-center px-6 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-blue-600 transition-colors"
            >
              View Plans
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 md:flex md:items-center md:justify-between lg:px-8">
          <div className="flex justify-center space-x-6 md:order-2">
            <Link href="/terms" className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400">
              Terms of Service
            </Link>
            <Link href="/privacy" className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400">
              Privacy Policy
            </Link>
            <Link href="/contact" className="text-gray-400 dark:text-gray-500 hover:text-gray-500 dark:hover:text-gray-400">
              Contact
            </Link>
          </div>
          <div className="mt-8 md:mt-0 md:order-1">
            <p className="text-center text-base text-gray-400 dark:text-gray-500">
              &copy; 2024 BX Library. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* Preview Modal */}
      {showPreview && previewBook && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl max-h-[90vh] w-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{previewBook.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">by {previewBook.author}</p>
              </div>
              <button
                onClick={closePreview}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
              <div className="text-center mb-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Book Preview - Thumbnail View</p>
                <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  Subscribe to read full content
                </div>
              </div>
              
              {previewBook.images && previewBook.images.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {previewBook.images.slice(0, 8).map((image, index) => (
                    <div key={index} className="relative">
                      <div className="aspect-[3/4] rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        <img
                          src={image}
                          alt={`${previewBook.title} - Page ${index + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                          <span className="text-white text-xs font-medium bg-black bg-opacity-60 px-2 py-1 rounded">
                            Page {index + 1}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {previewBook.images.length > 8 && (
                    <div className="aspect-[3/4] rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                      <div className="text-center text-gray-600 dark:text-gray-400">
                        <svg className="w-8 h-8 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path d="M10 4a2 2 0 100-4 2 2 0 000 4z" />
                          <path d="M10 20a2 2 0 100-4 2 2 0 000 4z" />
                        </svg>
                        <p className="text-xs font-medium">+{previewBook.images.length - 8} more pages</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Preview Not Available</h4>
                  <p className="text-gray-600 dark:text-gray-400">No preview images available for this book.</p>
                </div>
              )}
              
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => router.push('/login')}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                  >
                    Subscribe Now to Read Full Book
                  </button>
                  <button
                    onClick={closePreview}
                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
