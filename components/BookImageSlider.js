import { useState, useEffect } from 'react'
import Image from 'next/image'

const BookImageSlider = ({
  images = [],
  title = 'Book',
  className = '',
  autoSlide = false,
  slideInterval = 3000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [startX, setStartX] = useState(0)
  const [currentX, setCurrentX] = useState(0)
  const [dragOffset, setDragOffset] = useState(0)

  // Auto-slide functionality
  useEffect(() => {
    if (!autoSlide || images.length <= 1 || isHovered || isDragging) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      )
    }, slideInterval)

    return () => clearInterval(interval)
  }, [autoSlide, images.length, slideInterval, isHovered, isDragging])

  // Handle manual navigation
  const goToSlide = (index) => {
    setCurrentIndex(index)
  }

  const goToPrevious = () => {
    setCurrentIndex(currentIndex === 0 ? images.length - 1 : currentIndex - 1)
  }

  const goToNext = () => {
    setCurrentIndex(currentIndex === images.length - 1 ? 0 : currentIndex + 1)
  }

  // Touch/Mouse drag handlers
  const handleStart = (clientX) => {
    setIsDragging(true)
    setStartX(clientX)
    setCurrentX(clientX)
  }

  const handleMove = (clientX) => {
    if (!isDragging) return
    setCurrentX(clientX)
    setDragOffset(clientX - startX)
  }

  const handleEnd = () => {
    if (!isDragging) return
    
    const threshold = 50 // Minimum distance to trigger slide
    const dragDistance = currentX - startX
    
    if (Math.abs(dragDistance) > threshold) {
      if (dragDistance > 0) {
        goToPrevious()
      } else {
        goToNext()
      }
    }
    
    setIsDragging(false)
    setDragOffset(0)
  }

  // Mouse events
  const handleMouseDown = (e) => {
    e.preventDefault()
    handleStart(e.clientX)
  }

  const handleMouseMove = (e) => {
    handleMove(e.clientX)
  }

  const handleMouseUp = () => {
    handleEnd()
  }

  // Touch events
  const handleTouchStart = (e) => {
    handleStart(e.touches[0].clientX)
  }

  const handleTouchMove = (e) => {
    handleMove(e.touches[0].clientX)
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  // Add global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, currentX, startX])

  // If no images, show placeholder
  if (!images || images.length === 0) {
    return (
      <div
        className={`relative bg-gray-200 dark:bg-gray-700 flex items-center justify-center ${className}`}
      >
        <div className='text-gray-400 dark:text-gray-500 text-center'>
          <svg
            className='w-12 h-12 mx-auto mb-2'
            fill='currentColor'
            viewBox='0 0 20 20'
          >
            <path
              fillRule='evenodd'
              d='M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z'
              clipRule='evenodd'
            />
          </svg>
          <p className='text-sm'>No Image</p>
        </div>
      </div>
    )
  }

  // Single image - no slider needed
  if (images.length === 1) {
    return (
      <div className={`relative ${className}`}>
        <Image
          src={images[0].url}
          alt={title}
          fill
          className='object-cover'
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        />
      </div>
    )
  }

  // Multiple images - full slider
  return (
    <div
      className={`relative group ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Main image */}
      <div 
        className='relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none'
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isDragging ? `translateX(${dragOffset}px)` : 'translateX(0)',
          transition: isDragging ? 'none' : 'transform 0.3s ease'
        }}
      >
        <Image
          src={images[currentIndex].url}
          alt={`${title} - Image ${currentIndex + 1}`}
          fill
          className='object-cover transition-opacity duration-300'
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        />
      </div>

      {/* Navigation arrows - always visible */}
      <button
        onClick={goToPrevious}
        className='absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-80 hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70'
        aria-label='Previous image'
      >
        <svg
          className='w-5 h-5'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M15 19l-7-7 7-7'
          />
        </svg>
      </button>

      <button
        onClick={goToNext}
        className='absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full opacity-80 hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70'
        aria-label='Next image'
      >
        <svg
          className='w-5 h-5'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M9 5l7 7-7 7'
          />
        </svg>
      </button>

      {/* Dots indicator */}
      <div className='absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2'>
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-200 border border-white ${
              index === currentIndex
                ? 'bg-white'
                : 'bg-transparent hover:bg-white hover:bg-opacity-50'
            }`}
            aria-label={`Go to image ${index + 1}`}
          />
        ))}
      </div>

      {/* Image counter */}
      <div className='absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded'>
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  )
}

export default BookImageSlider
