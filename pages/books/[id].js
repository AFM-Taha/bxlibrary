import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import toast from 'react-hot-toast'
import { CompactThemeToggle } from '../../components/ThemeToggle'
import BookImageSlider from '../../components/BookImageSlider'

// PDF Reader Component
function PDFReader({ book }) {
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(100)
  const maxPreviewPages = 4 // Non-authenticated users can only see first 4 pages
  const totalPages = 12 // Sample total pages

  // Sample book content - in a real app, this would come from your database
  const samplePages = {
    1: {
      title: 'Chapter 1: Introduction',
      content: `Welcome to this fascinating journey through the world of knowledge. This book will take you on an adventure that spans across multiple disciplines and perspectives.

In this opening chapter, we explore the fundamental concepts that will serve as the foundation for everything that follows. The ideas presented here are not just theoretical constructs, but practical tools that you can apply in your daily life.

As we embark on this intellectual voyage, remember that learning is not a destination but a continuous process. Each page you turn, each concept you grasp, brings you one step closer to a deeper understanding of the subject matter.

The journey ahead is filled with insights, discoveries, and moments of clarity that will reshape your perspective. Are you ready to begin?`,
    },
    2: {
      title: 'Understanding the Basics',
      content: `Building upon the foundation laid in the previous chapter, we now delve deeper into the core principles that govern our subject matter.

These fundamental concepts are like building blocks - each one supporting and reinforcing the others. As you progress through this material, you'll begin to see how these individual pieces fit together to form a comprehensive understanding.

Consider this analogy: learning is like constructing a house. You need a solid foundation before you can build the walls, and you need strong walls before you can add the roof. Each chapter in this book represents another level of your intellectual construction project.

Take your time with these concepts. There's no rush to move forward until you feel comfortable with the material presented here.`,
    },
    3: {
      title: 'Practical Applications',
      content: `Now that we've established the theoretical framework, it's time to see how these concepts apply in real-world scenarios.

The beauty of knowledge lies not just in understanding abstract ideas, but in being able to apply them practically. This chapter bridges the gap between theory and practice, showing you how to implement what you've learned.

Through carefully selected examples and case studies, you'll see how professionals in the field use these principles to solve complex problems and create innovative solutions.

Remember, the goal isn't just to memorize information, but to develop the ability to think critically and apply these concepts in new and creative ways.`,
    },
    4: {
      title: 'Advanced Concepts',
      content: `As we venture into more sophisticated territory, the concepts become more nuanced and interconnected.

This chapter challenges you to think beyond the basics and consider the subtle relationships between different ideas. The material here requires careful attention and may benefit from multiple readings.

Don't be discouraged if some concepts seem difficult at first. Advanced learning often involves periods of confusion followed by sudden clarity. This is a natural part of the learning process.

The insights you gain from mastering this material will serve as powerful tools in your intellectual toolkit, enabling you to tackle even more complex challenges in the future.`,
    },
  }

  const getCurrentPageContent = () => {
    if (currentPage <= maxPreviewPages) {
      return (
        samplePages[currentPage] || {
          title: `Page ${currentPage}`,
          content: 'Content not available in preview.',
        }
      )
    }
    return {
      title: 'Login Required',
      content:
        'This page is only available to registered users. Please login or purchase the book to continue reading.',
    }
  }

  const canNavigate = (direction) => {
    if (direction === 'prev') return currentPage > 1
    if (direction === 'next') return currentPage < totalPages
    return false
  }

  const navigate = (direction) => {
    if (direction === 'prev' && canNavigate('prev')) {
      setCurrentPage(currentPage - 1)
    } else if (direction === 'next' && canNavigate('next')) {
      setCurrentPage(currentPage + 1)
    }
  }

  const pageContent = getCurrentPageContent()
  const isLocked = currentPage > maxPreviewPages
  let pageNumber
  return (
    <div className='bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden'>
      {/* Thumbnail Grid View for Non-Authenticated Users */}
      <div className='p-4'>
        {/* Available Images Grid */}
        <div className='mb-6'>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-3'>
            Available Preview Pages
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4'>
            {book?.images?.map((image, index) => {
              pageNumber = index + 1

              return (
                <div
                  key={pageNumber}
                  className='relative aspect-[3/4] rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200'
                >
                  <img
                    src={image.url}
                    alt={`Page ${pageNumber}`}
                    className='w-full h-full object-cover rounded-lg'
                    onError={(e) => {
                      e.target.src =
                        'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEzIDJMMTMuMDkgMi4wOUwyMC45MSA5LjkxTDIxIDEwVjIwQzIxIDIxLjEgMjAuMSAyMiAxOSAyMkg1QzMuODkgMjIgMyAyMS4xIDMgMjBWNEMzIDIuODkgMy44OSAyIDUgMkgxM1pNMTkgMTBIMTRWNUgxOVYxMFoiIGZpbGw9IiM2Mzc0OGYiLz4KPHN2Zz4K'
                    }}
                  />

                  {/* Page number indicator */}
                  <div className='absolute bottom-2 left-2 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded'>
                    {pageNumber}
                  </div>
                </div>
              )
            })}

            {[1, 2].map((index) => (
              <div
                key={`locked-${index}`}
                className='relative aspect-[3/4] rounded-lg border-2 border-gray-200 dark:border-gray-600'
              >
                <img
                  src={
                    book?.images?.[0]?.url ||
                    book?.thumbnailUrl ||
                    'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEzIDJMMTMuMDkgMi4wOUwyMC45MSA5LjkxTDIxIDEwVjIwQzIxIDIxLjEgMjAuMSAyMiAxOSAyMkg1QzMuODkgMjIgMyAyMS4xIDMgMjBWNEMzIDIuODkgMy44OSAyIDUgMkgxM1pNMTkgMTBIMTRWNUgxOVYxMFoiIGZpbGw9IiM2Mzc0OGYiLz4KPHN2Zz4K'
                  }
                  alt={`Locked Page ${index}`}
                  className='w-full h-full object-cover rounded-lg filter blur-md'
                />

                {/* Lock overlay */}
                <div className='absolute inset-0 bg-black bg-opacity-60 rounded-lg flex items-center justify-center'>
                  <div className='text-center text-white'>
                    <svg
                      className='w-8 h-8 mx-auto mb-2'
                      fill='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path d='M12,17A2,2 0 0,0 14,15C14,13.89 13.1,13 12,13A2,2 0 0,0 10,15A2,2 0 0,0 12,17M18,8A2,2 0 0,1 20,10V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V10C4,8.89 4.9,8 6,8H7V6A5,5 0 0,1 12,1A5,5 0 0,1 17,6V8H18M12,3A3,3 0 0,0 9,6V8H15V6A3,3 0 0,0 12,3Z' />
                    </svg>
                    <div className='text-sm font-medium'>Login Required</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Locked Page Message */}
        {currentPage > maxPreviewPages && (
          <div className='mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
            <div className='p-6 text-center'>
              <svg
                className='w-12 h-12 mx-auto mb-4 text-gray-400'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                />
              </svg>
              <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                Premium Content
              </h3>
              <p className='text-gray-600 dark:text-gray-400 mb-4'>
                This page is only available to registered users. Login or
                purchase the book to continue reading.
              </p>
              <div className='flex flex-col sm:flex-row gap-2 justify-center'>
                <Link
                  href='/login'
                  className='bg-blue-600 text-white px-4 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors'
                >
                  Login
                </Link>
                <button
                  onClick={() => {
                    toast.success('Redirecting to purchase...')
                    window.open('#', '_blank')
                  }}
                  className='bg-green-600 text-white px-4 py-2 rounded-md font-medium hover:bg-green-700 transition-colors'
                >
                  Purchase
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BookDetailsPage() {
  const router = useRouter()
  const { id } = router.query
  const { user, logout } = useAuth()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (id) {
      fetchBook()
    }
  }, [id])

  const fetchBook = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/books/${id}`)

      if (response.ok) {
        const data = await response.json()
        setBook(data.book)
      } else if (response.status === 404) {
        setError('Book not found')
      } else {
        setError('Failed to load book details')
      }
    } catch (error) {
      console.error('Error fetching book:', error)
      setError('Failed to load book details')
    } finally {
      setLoading(false)
    }
  }

  const handleReadBook = () => {
    router.push(`/reader/${id}`)
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
        <nav className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between h-16'>
              <div className='flex items-center'>
                <Link href={user ? '/library' : '/'} className='flex-shrink-0'>
                  <h1 className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                    BX Library
                  </h1>
                </Link>
              </div>
              <div className='flex items-center space-x-4'>
                {user ? (
                  <>
                    <span className='text-gray-700 dark:text-gray-300'>
                      Welcome, {user?.name}
                    </span>
                    <CompactThemeToggle />
                    <Link
                      href='/account'
                      className='text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                    >
                      Account
                    </Link>
                    <button
                      onClick={handleLogout}
                      className='text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <CompactThemeToggle />
                    <Link
                      href='/login'
                      className='text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                    >
                      Login
                    </Link>
                    <Link
                      href='/register'
                      className='bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors'
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
        <div className='flex justify-center items-center py-20'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600'></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
        <nav className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex justify-between h-16'>
              <div className='flex items-center'>
                <Link href={user ? '/library' : '/'} className='flex-shrink-0'>
                  <h1 className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                    BX Library
                  </h1>
                </Link>
              </div>
              <div className='flex items-center space-x-4'>
                {user ? (
                  <>
                    <span className='text-gray-700 dark:text-gray-300'>
                      Welcome, {user?.name}
                    </span>
                    <CompactThemeToggle />
                    <Link
                      href='/account'
                      className='text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                    >
                      Account
                    </Link>
                    <button
                      onClick={handleLogout}
                      className='text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <CompactThemeToggle />
                    <Link
                      href='/login'
                      className='text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                    >
                      Login
                    </Link>
                    <Link
                      href='/register'
                      className='bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors'
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </nav>
        <div className='max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
          <div className='text-center'>
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
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
            <h3 className='text-lg font-medium text-gray-900 mb-2'>{error}</h3>
            <Link
              href='/library'
              className='text-blue-600 hover:text-blue-800 underline'
            >
              Return to Library
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className='min-h-screen bg-gray-50 dark:bg-gray-900'>
      {/* Navigation */}
      <nav className='bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700'>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
          <div className='flex justify-between h-16'>
            <div className='flex items-center'>
              <Link href={user ? '/library' : '/'} className='flex-shrink-0'>
                <h1 className='text-2xl font-bold text-blue-600 dark:text-blue-400'>
                  BX Library
                </h1>
              </Link>
            </div>
            <div className='flex items-center space-x-4'>
              {user ? (
                <>
                  <span className='text-gray-700 dark:text-gray-300'>
                    Welcome, {user?.name}
                  </span>
                  <CompactThemeToggle />
                  <Link
                    href='/account'
                    className='text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                  >
                    Account
                  </Link>
                  <button
                    onClick={handleLogout}
                    className='text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <CompactThemeToggle />
                  <Link
                    href='/login'
                    className='text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition-colors'
                  >
                    Login
                  </Link>
                  <Link
                    href='/register'
                    className='bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 rounded-md text-sm font-medium transition-colors'
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'>
        {/* Breadcrumb */}
        <nav className='flex mb-8' aria-label='Breadcrumb'>
          <ol className='inline-flex items-center space-x-1 md:space-x-3'>
            <li className='inline-flex items-center'>
              <Link
                href={user ? '/library' : '/'}
                className='inline-flex items-center text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400'
              >
                <svg
                  className='w-4 h-4 mr-2'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path d='M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z'></path>
                </svg>
                {user ? 'Library' : 'Home'}
              </Link>
            </li>
            <li>
              <div className='flex items-center'>
                <svg
                  className='w-6 h-6 text-gray-400'
                  fill='currentColor'
                  viewBox='0 0 20 20'
                >
                  <path
                    fillRule='evenodd'
                    d='M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z'
                    clipRule='evenodd'
                  ></path>
                </svg>
                <span className='ml-1 text-sm font-medium text-gray-500 dark:text-gray-400 md:ml-2'>
                  {book?.title}
                </span>
              </div>
            </li>
          </ol>
        </nav>

        <div className='bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'>
          <div className='md:flex'>
            {/* Book Cover */}
            <div className='md:flex-shrink-0'>
              <div className='h-96 w-full md:w-64'>
                <BookImageSlider
                  images={book?.images || []}
                  title={book?.title || 'Book'}
                  className='h-full w-full rounded-lg'
                  autoSlide={true}
                  slideInterval={5000}
                />
              </div>
            </div>

            {/* Book Details */}
            <div className='p-8 flex-1'>
              <div className='mb-6'>
                <h1 className='text-3xl font-bold text-gray-900 dark:text-white mb-2'>
                  {book?.title}
                </h1>
                <p className='text-xl text-gray-600 dark:text-gray-300 mb-4'>
                  by {book?.author}
                </p>

                {book?.category && (
                  <div className='mb-4'>
                    <span
                      className='inline-block px-3 py-1 text-sm font-medium rounded-full'
                      style={{
                        backgroundColor: book.category.color + '20',
                        color: book.category.color,
                      }}
                    >
                      {book.category.name}
                    </span>
                  </div>
                )}

                {book?.description && (
                  <div className='mb-6'>
                    <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                      Description
                    </h3>
                    <p className='text-gray-700 dark:text-gray-300 leading-relaxed'>
                      {book.description}
                    </p>
                  </div>
                )}

                <div className='mb-6'>
                  <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
                    Book Information
                  </h3>
                  <dl className='grid grid-cols-1 gap-x-4 gap-y-2 sm:grid-cols-2'>
                    <div>
                      <dt className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                        Added
                      </dt>
                      <dd className='text-sm text-gray-900 dark:text-gray-100'>
                        {new Date(book?.createdAt).toLocaleDateString()}
                      </dd>
                    </div>
                    <div>
                      <dt className='text-sm font-medium text-gray-500 dark:text-gray-400'>
                        Status
                      </dt>
                      <dd className='text-sm text-gray-900 dark:text-gray-100 capitalize'>
                        {book?.status}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Action Buttons */}
              <div className='flex flex-col sm:flex-row gap-4'>
                {user ? (
                  <>
                    <button
                      onClick={handleReadBook}
                      className='flex-1 bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center'
                    >
                      <svg
                        className='w-5 h-5 mr-2'
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
                      Read Book
                    </button>

                    <Link
                      href='/library'
                      className='flex-1 sm:flex-initial bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-md font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center'
                    >
                      <svg
                        className='w-5 h-5 mr-2'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M10 19l-7-7m0 0l7-7m-7 7h18'
                        />
                      </svg>
                      Back to Library
                    </Link>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        const previewSection =
                          document.getElementById('book-preview')
                        previewSection?.scrollIntoView({ behavior: 'smooth' })
                      }}
                      className='flex-1 bg-green-600 text-white px-6 py-3 rounded-md font-medium hover:bg-green-700 transition-colors flex items-center justify-center'
                    >
                      <svg
                        className='w-5 h-5 mr-2'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M15 12a3 3 0 11-6 0 3 3 0 016 0z'
                        />
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z'
                        />
                      </svg>
                      Preview
                    </button>

                    <button
                      onClick={() => {
                        toast.success('Redirecting to purchase...')
                        // Here you would integrate with your payment system
                        window.open('#', '_blank')
                      }}
                      className='flex-1 bg-blue-600 text-white px-6 py-3 rounded-md font-medium hover:bg-blue-700 transition-colors flex items-center justify-center'
                    >
                      <svg
                        className='w-5 h-5 mr-2'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m0 0h8m-8 0a2 2 0 100 4 2 2 0 000-4zm8 0a2 2 0 100 4 2 2 0 000-4z'
                        />
                      </svg>
                      Buy Now
                    </button>

                    <Link
                      href='/'
                      className='flex-1 sm:flex-initial bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-6 py-3 rounded-md font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center'
                    >
                      <svg
                        className='w-5 h-5 mr-2'
                        fill='none'
                        viewBox='0 0 24 24'
                        stroke='currentColor'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M10 19l-7-7m0 0l7-7m-7 7h18'
                        />
                      </svg>
                      Back to Home
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Section for Non-Authenticated Users */}
        {!user && (
          <div
            id='book-preview'
            className='mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden'
          >
            <div className='p-6'>
              <div className='flex items-center justify-between mb-6'>
                <h2 className='text-2xl font-bold text-gray-900 dark:text-white'>
                  Book Preview
                </h2>
                <div className='flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400'>
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    viewBox='0 0 24 24'
                    stroke='currentColor'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z'
                    />
                  </svg>
                  <span>Limited Preview - Login for Full Access</span>
                </div>
              </div>

              {/* PDF-like Reader */}
              <PDFReader book={book} />

              <div className='mt-6 text-center'>
                <p className='text-gray-600 dark:text-gray-400 mb-4'>
                  This is a limited preview. Purchase the book or login to
                  access the full content.
                </p>
                <div className='flex flex-col sm:flex-row gap-3 justify-center'>
                  <Link
                    href='/login'
                    className='bg-blue-600 text-white px-6 py-2 rounded-md font-medium hover:bg-blue-700 transition-colors'
                  >
                    Login to Read Full Book
                  </Link>
                  <button
                    onClick={() => {
                      toast.success('Redirecting to purchase...')
                      // Here you would integrate with your payment system
                      window.open('#', '_blank')
                    }}
                    className='bg-green-600 text-white px-6 py-2 rounded-md font-medium hover:bg-green-700 transition-colors'
                  >
                    Purchase Full Access
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function BookDetails() {
  return <BookDetailsPage />
}
