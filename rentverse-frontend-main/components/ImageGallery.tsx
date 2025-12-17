import Image from 'next/image'
import { useState } from 'react'
import { Home } from 'lucide-react'

interface ImageGalleryProps {
  images: [string, string, string, string, string]
}

function ImageGallery({ images }: ImageGalleryProps) {
  const [mainImage, ...gridImages] = images
  const [imageErrors, setImageErrors] = useState<boolean[]>(
    new Array(images.length).fill(false)
  )

  const handleImageError = (index: number) => {
    setImageErrors(prev => {
      const newErrors = [...prev]
      newErrors[index] = true
      return newErrors
    })
  }

  return (
    <div className="w-full max-w-7xl mx-auto grid grid-cols-2 gap-2 h-96">
      {/* Main large image on the left */}
      <div className="relative rounded-l-lg overflow-hidden">
        {imageErrors[0] ? (
          <div className="w-full h-full bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
            <div className="text-center">
              <Home className="w-16 h-16 text-teal-400 mx-auto mb-2" />
              <p className="text-teal-600 font-medium">No image available</p>
            </div>
          </div>
        ) : (
          <Image
            src={mainImage}
            alt="Main property image"
            fill
            className="object-cover"
            priority
            onError={() => handleImageError(0)}
          />
        )}
      </div>

      {/* Grid of 4 smaller images on the right */}
      <div className="grid grid-cols-2 grid-rows-2 gap-2">
        {gridImages.map((image, index) => (
          <div
            key={index}
            className={`relative overflow-hidden ${
              index === 1 ? 'rounded-tr-lg' :
                index === 3 ? 'rounded-br-lg' : ''
            }`}
          >
            {imageErrors[index + 1] ? (
              <div className="w-full h-full bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
                <div className="text-center">
                  <Home className="w-8 h-8 text-teal-400 mx-auto mb-1" />
                  <p className="text-xs text-teal-600 font-medium">No image</p>
                </div>
              </div>
            ) : (
              <Image
                src={image}
                alt={`Property image ${index + 2}`}
                fill
                className="object-cover"
                onError={() => handleImageError(index + 1)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default ImageGallery
