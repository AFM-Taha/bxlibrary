import React, { useRef, useEffect } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import Image from 'next/image';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const PostersSlider = ({ posters = [], autoSlideDelay = 3000, className = '' }) => {
  const swiperRef = useRef(null);

  const handleMouseEnter = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.autoplay.start();
    }
  };

  const handleMouseLeave = () => {
    if (swiperRef.current && swiperRef.current.swiper) {
      swiperRef.current.swiper.autoplay.stop();
      // Reset to first slide
      swiperRef.current.swiper.slideTo(0);
    }
  };

  return (
    <div 
      className={`posters-slider ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Swiper
        ref={swiperRef}
        modules={[Autoplay, Pagination, Navigation]}
        spaceBetween={30}
        slidesPerView={1}
        autoplay={{
          delay: autoSlideDelay,
          disableOnInteraction: false,
          pauseOnMouseEnter: false,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        navigation={false}
        loop={true}
        speed={800}
        effect="slide"
        className="h-full w-full"
        autoplayDisableOnInteraction={false}
        init={false} // Start with autoplay disabled
      >
        {posters.map((poster, index) => (
          <SwiperSlide key={index} className="relative">
            <div className="relative w-full h-64 md:h-80 lg:h-96 overflow-hidden rounded-lg">
              <Image
                src={poster.src || poster.image || poster.url}
                alt={poster.alt || poster.title || `Poster ${index + 1}`}
                fill
                className="object-cover transition-transform duration-300 hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority={index === 0}
              />
              {poster.title && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                  <h3 className="text-white text-lg font-semibold">{poster.title}</h3>
                  {poster.description && (
                    <p className="text-white/80 text-sm mt-1">{poster.description}</p>
                  )}
                </div>
              )}
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      <style jsx global>{`
        .posters-slider .swiper-pagination {
          bottom: 20px;
        }
        
        .posters-slider .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
        }
        
        .posters-slider .swiper-pagination-bullet-active {
          background: white;
        }
        
        .posters-slider .swiper-button-next,
        .posters-slider .swiper-button-prev {
          color: white;
          background: rgba(0, 0, 0, 0.3);
          border-radius: 50%;
          width: 40px;
          height: 40px;
        }
        
        .posters-slider .swiper-button-next:after,
        .posters-slider .swiper-button-prev:after {
          font-size: 16px;
        }
      `}</style>
    </div>
  );
};

export default PostersSlider;