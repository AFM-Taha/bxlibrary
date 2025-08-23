import React, { useRef, useEffect } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import Image from 'next/image'

// Import Swiper styles
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

const BookImageSlider = ({
  images = [],
  title = 'Book',
  className = '',
  slideInterval = 1000,
}) => {
  const swiperRef = useRef(null)

  const handleMouseEnter = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      // Configure autoplay settings and start
      swiperRef.current.swiper.autoplay.delay = slideInterval
      swiperRef.current.swiper.autoplay.start()
    }
  }

  const handleMouseLeave = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.autoplay.stop()
      // Reset to first slide
      swiperRef.current.swiper.slideTo(0)
    }
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

  // Multiple images - Swiper slider
  return (
    <div
      className={`book-image-slider ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Swiper
        ref={swiperRef}
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={false}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        navigation={false}
        loop={true}
        speed={800}
        effect='slide'
        className='h-full w-full'
        allowTouchMove={true}
      >
        {images.map((image, index) => (
          <SwiperSlide key={index} className='relative'>
            <div className='relative w-full h-full overflow-hidden'>
              <Image
                src={image.url}
                alt={`${title} - Image ${index + 1}`}
                fill
                className='object-cover transition-transform duration-300 hover:scale-105'
                sizes='(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw'
                priority={index === 0}
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .book-image-slider .swiper-pagination {
          bottom: 16px;
          z-index: 10;
        }

        .book-image-slider .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
          width: 12px;
          height: 12px;
          border: 2px solid white;
        }

        .book-image-slider .swiper-pagination-bullet-active {
          background: white;
        }

        .book-image-slider .swiper-button-next,
        .book-image-slider .swiper-button-prev {
          color: white;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 50%;
          width: 40px;
          height: 40px;
          margin-top: -20px;
        }

        .book-image-slider .swiper-button-next:after,
        .book-image-slider .swiper-button-prev:after {
          font-size: 16px;
        }
      `}</style>
    </div>
  )
}

export default BookImageSlider
