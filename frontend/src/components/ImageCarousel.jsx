import { useState } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Building2 } from "lucide-react";

export default function ImageCarousel({ images = [], title = "Property Image", onImageClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Normalize images to array of strings
  const imageList = images.map((img) => (typeof img === "string" ? img : img.image)).filter(Boolean);

  if (imageList.length === 0) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-slate-100 text-slate-400">
        <div className="text-center space-y-2">
          <Building2 className="mx-auto h-12 w-12 stroke-[1.5]" />
          <p className="text-xs font-medium">No Images Available</p>
        </div>
      </div>
    );
  }

  const prevSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  };

  const nextSlide = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  };

  const currentImg = imageList[currentIndex];

  return (
    <div 
      className="group relative h-full w-full overflow-hidden bg-slate-900 cursor-pointer"
      onClick={() => onImageClick && onImageClick(currentImg)}
    >
      <img
        src={currentImg}
        alt={`${title} - slide ${currentIndex + 1}`}
        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />

      {/* Gradient Overlay on Hover */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Navigation Arrows (if multiple images) */}
      {imageList.length > 1 && (
        <>
          <button
            onClick={prevSlide}
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-slate-800 shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white focus:outline-none"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/80 p-1.5 text-slate-800 shadow-md backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-white focus:outline-none"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </>
      )}

      {/* Badge Indicator */}
      <div className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md">
        {currentIndex + 1} / {imageList.length}
      </div>

      {/* Expand Icon on Hover */}
      <div className="absolute top-3 right-3 rounded-full bg-black/60 p-2 text-white backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">
        <Maximize2 className="h-3.5 w-3.5" />
      </div>

      {/* Dots Indicator */}
      {imageList.length > 1 && (
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          {imageList.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all ${
                currentIndex === idx ? "w-4 bg-white" : "w-1.5 bg-white/50"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
