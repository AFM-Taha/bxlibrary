import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '../../contexts/AuthContext';
import ProtectedRoute from '../../components/ProtectedRoute';
import toast from 'react-hot-toast';

function ReaderPage() {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [fitToWidth, setFitToWidth] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [readerMode, setReaderMode] = useState('drive_embed'); // 'drive_embed' or 'pdf_stream'
  const iframeRef = useRef(null);

  useEffect(() => {
    if (id) {
      fetchBook();
      fetchSettings();
      loadSavedProgress();
    }
  }, [id]);

  useEffect(() => {
    // Save reading progress periodically
    const interval = setInterval(() => {
      if (book && currentPage > 0) {
        saveProgress();
      }
    }, 30000); // Save every 30 seconds

    return () => clearInterval(interval);
  }, [book, currentPage]);

  const fetchBook = async () => {
    try {
      const response = await fetch(`/api/books/${id}`);
      if (!response.ok) {
        throw new Error('Book not found');
      }
      const data = await response.json();
      setBook(data.book);
    } catch (error) {
      setError(error.message);
      toast.error('Failed to load book');
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setReaderMode(data.settings?.readerMode || 'drive_embed');
        setShowWatermark(data.settings?.showWatermark !== false);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  const loadSavedProgress = () => {
    try {
      const saved = localStorage.getItem(`book-progress-${id}`);
      if (saved) {
        const progress = JSON.parse(saved);
        setCurrentPage(progress.page || 1);
      }
    } catch (error) {
      console.error('Failed to load saved progress:', error);
    }
  };

  const saveProgress = () => {
    try {
      const progress = {
        page: currentPage,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`book-progress-${id}`, JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 25, 50));
  };

  const handleResetZoom = () => {
    setZoom(100);
  };

  const toggleFitToWidth = () => {
    setFitToWidth(prev => !prev);
  };

  const toggleDarkMode = () => {
    setDarkMode(prev => !prev);
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const getWatermarkText = () => {
    const timestamp = new Date().toLocaleString();
    return `${user?.email} - ${timestamp}`;
  };

  const getDriveEmbedUrl = () => {
    if (!book?.driveFileId) return '';
    return `https://drive.google.com/file/d/${book.driveFileId}/preview`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading book...</p>
        </div>
      </div>
    );
  }

  if (error || !book) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">📚</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Book Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested book could not be found.'}</p>
          <Link
            href="/library"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
          >
            Back to Library
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Reader Header */}
      <div className={`${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-4 py-3`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Link
              href="/library"
              className={`${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
              <h1 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                {book.title}
              </h1>
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                by {book.author}
              </p>
            </div>
          </div>

          {/* Reader Controls */}
          <div className="flex items-center space-x-2">
            {/* Page Navigation */}
            {readerMode === 'pdf_stream' && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className={`p-2 rounded ${darkMode ? 'text-gray-300 hover:text-white disabled:text-gray-600' : 'text-gray-600 hover:text-gray-900 disabled:text-gray-400'} disabled:cursor-not-allowed`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className={`p-2 rounded ${darkMode ? 'text-gray-300 hover:text-white disabled:text-gray-600' : 'text-gray-600 hover:text-gray-900 disabled:text-gray-400'} disabled:cursor-not-allowed`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center space-x-1">
              <button
                onClick={handleZoomOut}
                className={`p-2 rounded ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                title="Zoom Out"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
              </button>
              <span className={`text-sm px-2 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                {zoom}%
              </span>
              <button
                onClick={handleZoomIn}
                className={`p-2 rounded ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                title="Zoom In"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
              </button>
              <button
                onClick={handleResetZoom}
                className={`p-2 rounded ${darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                title="Reset Zoom"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>

            {/* View Options */}
            <button
              onClick={toggleFitToWidth}
              className={`p-2 rounded ${fitToWidth ? 'bg-blue-600 text-white' : darkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
              title="Fit to Width"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>

            <button
              onClick={toggleDarkMode}
              className={`p-2 rounded ${darkMode ? 'bg-yellow-600 text-white' : 'text-gray-600 hover:text-gray-900'}`}
              title="Toggle Dark Mode"
            >
              {darkMode ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Reader Content */}
      <div className="relative h-screen pt-16">
        {readerMode === 'drive_embed' ? (
          // Google Drive Embed Mode
          <div className="h-full relative">
            <iframe
              ref={iframeRef}
              src={getDriveEmbedUrl()}
              className="w-full h-full border-0"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top left',
                width: `${10000 / zoom}%`,
                height: `${10000 / zoom}%`
              }}
              title={book.title}
            />
            
            {/* Watermark Overlay */}
            {showWatermark && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded pointer-events-none">
                {getWatermarkText()}
              </div>
            )}
          </div>
        ) : (
          // PDF.js Mode (placeholder - would need actual PDF.js implementation)
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <h2 className={`text-xl font-semibold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                PDF.js Reader
              </h2>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                PDF.js integration would be implemented here for enhanced reading experience.
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                This would include features like text selection, search, and better page navigation.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="fixed bottom-4 left-4">
        <details className={`${darkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} rounded-lg shadow-lg`}>
          <summary className="px-3 py-2 cursor-pointer text-sm font-medium">
            Keyboard Shortcuts
          </summary>
          <div className="px-3 py-2 text-xs space-y-1 border-t">
            <div>← → : Navigate pages</div>
            <div>+ - : Zoom in/out</div>
            <div>0 : Reset zoom</div>
            <div>F : Fit to width</div>
            <div>D : Toggle dark mode</div>
            <div>Esc : Back to library</div>
          </div>
        </details>
      </div>
    </div>
  );
}

export default function Reader() {
  return (
    <ProtectedRoute>
      <ReaderPage />
    </ProtectedRoute>
  );
}