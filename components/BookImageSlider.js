import { useState, useEffect } from 'react'
import Image from 'next/image'

const BookImageSlider = ({
  images = [],
  title = 'Book',
  className = '',
  autoSlide = true,
  slideInterval = 3000,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)

  // Auto-slide functionality
  useEffect(() => {
    if (!autoSlide || images.length <= 1 || isHovered) return

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === images.length - 1 ? 0 : prevIndex + 1
      )
    }, slideInterval)

    return () => clearInterval(interval)
  }, [autoSlide, images.length, slideInterval, isHovered])

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
      <div className='relative w-full h-full overflow-hidden'>
        <Image
          src={images[currentIndex].url}
          alt={`${title} - Image ${currentIndex + 1}`}
          fill
          className='object-cover transition-opacity duration-300'
          sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
        />
      </div>

      {/* Navigation arrows - only show on hover */}
      <button
        onClick={goToPrevious}
        className='absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70'
        aria-label='Previous image'
      >
        <svg
          className='w-4 h-4'
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
        className='absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70'
        aria-label='Next image'
      >
        <svg
          className='w-4 h-4'
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
      <div className='absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1'>
        {images.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-2 h-2 rounded-full transition-all duration-200 ${
              index === currentIndex
                ? 'bg-white'
                : 'bg-white bg-opacity-50 hover:bg-opacity-75'
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
