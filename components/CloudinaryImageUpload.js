import { useState } from 'react'
import { toast } from 'react-hot-toast'

const CloudinaryImageUpload = ({ images = [], onChange, maxImages = 5 }) => {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const uploadToCloudinary = async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append(
      'upload_preset',
      process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'ml_default',
    )
    formData.append('folder', 'book-covers')

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: 'POST',
          body: formData,
        },
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        console.error('Cloudinary API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
        })
        throw new Error(
          `Upload failed: ${response.status} ${response.statusText} - ${errorData.error?.message || 'Unknown error'}`,
        )
      }

      const data = await response.json()
      return {
        url: data.secure_url,
        publicId: data.public_id,
        alt: file.name.split('.')[0],
      }
    } catch (error) {
      console.error('Cloudinary upload error:', error)
      throw error
    }
  }

  const handleFileSelect = async (files) => {
    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(uploadToCloudinary)
      const uploadedImages = await Promise.all(uploadPromises)

      const newImages = [...images, ...uploadedImages]
      onChange(newImages)
      toast.success(`${uploadedImages.length} image(s) uploaded successfully`)
    } catch (error) {
      toast.error('Failed to upload images')
    } finally {
      setUploading(false)
    }
  }

  const handleFileInput = (e) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) {
      handleFileSelect(files)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  const removeImage = (index) => {
    const newImages = images.filter((_, i) => i !== index)
    onChange(newImages)
  }

  const moveImage = (fromIndex, toIndex) => {
    const newImages = [...images]
    const [movedImage] = newImages.splice(fromIndex, 1)
    newImages.splice(toIndex, 0, movedImage)
    onChange(newImages)
  }

  return (
    <div className='space-y-4'>
      <label className='block text-sm font-medium text-secondary-700 dark:text-secondary-300 mb-2'>
        Book Cover Images (Max {maxImages})
      </label>

      {/* Upload Area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragOver
            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
            : 'border-secondary-300 dark:border-secondary-600 hover:border-primary-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type='file'
          multiple
          accept='image/*'
          onChange={handleFileInput}
          className='hidden'
          id='image-upload'
          disabled={uploading || images.length >= maxImages}
        />
        <label
          htmlFor='image-upload'
          className={`cursor-pointer ${
            uploading || images.length >= maxImages ? 'cursor-not-allowed' : ''
          }`}
        >
          <div className='space-y-2'>
            <svg
              className='mx-auto h-12 w-12 text-secondary-400'
              stroke='currentColor'
              fill='none'
              viewBox='0 0 48 48'
            >
              <path
                d='M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02'
                strokeWidth={2}
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
            <div className='text-sm text-secondary-600 dark:text-secondary-400'>
              {uploading ? (
                <span>Uploading...</span>
              ) : images.length >= maxImages ? (
                <span>Maximum images reached</span>
              ) : (
                <>
                  <span className='font-medium text-primary-600 hover:text-primary-500'>
                    Click to upload
                  </span>
                  <span> or drag and drop</span>
                </>
              )}
            </div>
            <p className='text-xs text-secondary-500 dark:text-secondary-400'>
              PNG, JPG, GIF up to 10MB ({images.length}/{maxImages})
            </p>
          </div>
        </label>
      </div>

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4'>
          {images.map((image, index) => (
            <div key={index} className='relative group'>
              <div className='aspect-square rounded-lg overflow-hidden bg-secondary-100 dark:bg-secondary-800'>
                <img
                  src={image.url}
                  alt={image.alt || `Book cover ${index + 1}`}
                  className='w-full h-full object-cover'
                />
              </div>

              {/* Image Controls */}
              <div className='absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2'>
                {/* Move Left */}
                {index > 0 && (
                  <button
                    type='button'
                    onClick={() => moveImage(index, index - 1)}
                    className='p-1 bg-white rounded-full text-secondary-700 hover:bg-secondary-100 transition-colors'
                    title='Move left'
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
                )}

                {/* Remove */}
                <button
                  type='button'
                  onClick={() => removeImage(index)}
                  className='p-1 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors'
                  title='Remove image'
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
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>

                {/* Move Right */}
                {index < images.length - 1 && (
                  <button
                    type='button'
                    onClick={() => moveImage(index, index + 1)}
                    className='p-1 bg-white rounded-full text-secondary-700 hover:bg-secondary-100 transition-colors'
                    title='Move right'
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
                )}
              </div>

              {/* Image Order Badge */}
              <div className='absolute top-2 left-2 bg-primary-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium'>
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default CloudinaryImageUpload
