// src/components/ImageGallery.jsx
// Full-width image gallery/slider for the vehicle detail page.
// Shows multiple angles built from Tesla's compositor API.

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function ImageGallery({ images = [], alt = 'Vehicle' }) {
  const [current, setCurrent] = useState(0)

  if (images.length === 0) return null

  const prev = () => setCurrent(i => (i === 0 ? images.length - 1 : i - 1))
  const next = () => setCurrent(i => (i === images.length - 1 ? 0 : i + 1))

  return (
    <div className="relative bg-[#1a1a1a] rounded-2xl overflow-hidden">
      {/* Main image */}
      <div className="aspect-video relative">
        <img
          src={images[current]}
          alt={`${alt} — view ${current + 1}`}
          className="w-full h-full object-contain"
        />

        {images.length > 1 && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full
                         bg-black/60 hover:bg-black/80 text-text transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full
                         bg-black/60 hover:bg-black/80 text-text transition-colors"
              aria-label="Next image"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}

        {/* Indicator dots */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2 h-2 rounded-full transition-all ${
                i === current ? 'bg-text scale-125' : 'bg-white/40'
              }`}
              aria-label={`Go to image ${i + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="flex gap-2 p-3 overflow-x-auto">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`flex-shrink-0 w-20 aspect-video rounded-lg overflow-hidden border-2 transition-all ${
                i === current ? 'border-accent' : 'border-transparent opacity-60 hover:opacity-90'
              }`}
            >
              <img src={src} alt={`Thumbnail ${i + 1}`} className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
