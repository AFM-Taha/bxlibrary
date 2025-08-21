import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useAuth } from '../../contexts/AuthContext'
import ProtectedRoute from '../../components/ProtectedRoute'
import toast from 'react-hot-toast'

function ReaderPage() {
  const router = useRouter()
  const { id } = router.query
  const { user } = useAuth()
  const [book, setBook] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [darkMode, setDarkMode] = useState(false)
  const [zoom, setZoom] = useState(100)
  const [showWatermark, setShowWatermark] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(0)
  const [readerMode, setReaderMode] = useState('drive_embed') // 'drive_embed' or 'pdf_stream'
  // Header is now always visible - removed toggle functionality

  useEffect(() => {
    if (id) {
      fetchBook()
      fetchSettings()
      loadSavedProgress()
    }
  }, [id])

  useEffect(() => {
    // Save reading progress periodically
    const interval = setInterval(() => {
      if (book && currentPage > 0) {
        saveProgress()
      }
    }, 30000) // Save every 30 seconds

    return () => clearInterval(interval)
  }, [book, currentPage])

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/books/${id}`)
      if (!response.ok) {
        throw new Error('Book not found')
      }
      const data = await response.json()
      setBook(data.book)
    } catch (error) {
      setError(error.message)
      toast.error('Failed to load book')
    } finally {
      setLoading(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings')
      if (response.ok) {
        const data = await response.json()
        setReaderMode(data.settings?.readerMode || 'drive_embed')
        setShowWatermark(data.settings?.showWatermark !== false)
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error)
    }
  }

  const loadSavedProgress = () => {
    try {
      const saved = localStorage.getItem(`book-progress-${id}`)
      if (saved) {
        const progress = JSON.parse(saved)
        setCurrentPage(progress.page || 1)
      }
    } catch (error) {
      console.error('Failed to load saved progress:', error)
    }
  }

  const saveProgress = () => {
    try {
      const progress = {
        page: currentPage,
        timestamp: new Date().toISOString(),
      }
      localStorage.setItem(`book-progress-${id}`, JSON.stringify(progress))
    } catch (error) {
      console.error('Failed to save progress:', error)
    }
  }

  const toggleDarkMode = () => {
    setDarkMode((prev) => !prev)
  }

  const goBack = () => {
    router.back()
  }

  const getWatermarkText = () => {
    const timestamp = new Date().toLocaleString()
    return `${user?.email} - ${timestamp}`
  }

  const getDriveEmbedUrl = () => {
    if (!book?.driveFileId) return ''
    return `https://drive.google.com/file/d/${book.driveFileId}/preview?usp=embed&chrome=false&toolbar=false`
  }

  if (loading) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4'></div>
          <p className='text-gray-600'>Loading book...</p>
        </div>
      </div>
    )
  }

  if (error || !book) {
    return (
      <div className='min-h-screen bg-gray-100 flex items-center justify-center'>
        <div className='text-center'>
          <div className='text-red-500 text-6xl mb-4'>📚</div>
          <h1 className='text-2xl font-bold text-gray-900 mb-2'>
            Book Not Found
          </h1>
          <p className='text-gray-600 mb-4'>
            {error || 'The requested book could not be found.'}
          </p>
          <Link
            href='/library'
            className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors'
          >
            Back to Library
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Back Button */}
      <div className='fixed bg-white z-50 flex items-center justify-center toggle-button-container'>
        <button
          onClick={goBack}
          className={`p-1 rounded-full transition-all ${
            darkMode
              ? 'text-gray-600 hover:text-gray-800'
              : 'text-gray-600 hover:text-gray-800'
          }`}
          title='Go Back'
        >
          <svg
            className='h-4 w-4 transform transition-transform duration-200'
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
        </button>
      </div>

      {/* Reader Header - Always Visible */}
      <div
        className={`${
          darkMode ? 'bg-gray-900 border-gray-900' : 'bg-white border-gray-900'
        }  border-b-[15px] px-5 py-3 transition-all duration-300`}
      >
        <div className='flex  items-center  justify-between'>
          {/* Page Navigation */}
          <div className=''>
            <h1
              className={`text-lg  font-semibold ${
                darkMode ? 'text-white' : 'text-gray-900'
              }`}
            >
              {book.title && book.title.length > 20 ? `${book.title.slice(0, 20)}...` : book.title}
            </h1>
            <span
              className={`text-xs ${
                darkMode ? 'text-gray-400' : 'text-gray-600'
              }`}
            >
              {'   '}
              _by {book.author && book.author.length > 20 ? `${book.author.slice(0, 20)}...` : book.author}
            </span>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`p-2 rounded ${
              darkMode
                ? 'bg-yellow-600 text-white'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title='Toggle Dark Mode'
          >
            {darkMode ? (
              <svg
                className='h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z'
                />
              </svg>
            ) : (
              <svg
                className='h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z'
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Reader Content */}
      <div className='relative  h-screen pt-0'>
        {readerMode === 'drive_embed' ? (
          // Google Drive Embed Mode
          <div className='h-full  relative drive-embed-container'>
            <iframe
              src={getDriveEmbedUrl()}
              className='w-full h-full'
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left',
                width: `${10000 / zoom}%`,
                height: `${10000 / zoom}%`,
              }}
              title={book.title}
            />

            {/* Watermark Overlay */}
            {showWatermark && (
              <div className='absolute bottom-4 right-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded pointer-events-none'>
                {getWatermarkText()}
              </div>
            )}
          </div>
        ) : (
          <div className='h-full flex items-center justify-center'>
            <div className='text-center'>
              <div className='text-6xl mb-4'>📄</div>
              <h2
                className={`text-xl font-semibold mb-2 ${
                  darkMode ? 'text-white' : 'text-gray-900'
                }`}
              >
                PDF.js Reader
              </h2>
              <p
                className={`${
                  darkMode ? 'text-gray-400' : 'text-gray-600'
                } mb-4`}
              >
                PDF.js integration would be implemented here for enhanced
                reading experience.
              </p>
              <p
                className={`text-sm ${
                  darkMode ? 'text-gray-500' : 'text-gray-500'
                }`}
              >
                This would include features like text selection, search, and
                better page navigation.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Reader() {
  return (
    <ProtectedRoute>
      <ReaderPage />
    </ProtectedRoute>
  )
}
