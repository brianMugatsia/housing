import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Maximize2, Building2, ImageOff } from "lucide-react";

export const resolveImageUrl = (img) => {
  if (!img) return "";
  const rawUrl = typeof img === "string" ? img : img.image || img.url || "";
  if (!rawUrl) return "";
  if (
    rawUrl.startsWith("http://") || 
    rawUrl.startsWith("https://") || 
    rawUrl.startsWith("data:") || 
    rawUrl.startsWith("blob:")
  ) {
    return rawUrl;
  }
  const backendBase = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api")
    .replace(/\/api\/?$/, "")
    .replace(/\/+$/, "");
  const cleanPath = rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`;
  return `${backendBase}${cleanPath}`;
};

export default function ImageCarousel({ 
  images = [], 
  title = "Property Image", 
  onImageClick,
  aspectRatio = "aspect-[16/10]",
  showThumbnails = false,
  autoPlay = false,
  autoPlayInterval = 5000,
  rounded = "rounded-2xl"
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const [imageError, setImageError] = useState({});
  const timerRef = useRef(null);

  // Normalize images to array of resolved strings
  const imageList = (Array.isArray(images) ? images : [images])
    .map(resolveImageUrl)
    .filter(Boolean);

  const prevSlide = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? imageList.length - 1 : prev - 1));
  }, [imageList.length]);

  const nextSlide = useCallback((e) => {
    if (e) e.stopPropagation();
    setCurrentIndex((prev) => (prev === imageList.length - 1 ? 0 : prev + 1));
  }, [imageList.length]);

  // Touch Swipe Handlers for mobile responsiveness
  const handleTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;
    if (isLeftSwipe && imageList.length > 1) {
      if (e) e.stopPropagation();
      nextSlide();
    }
    if (isRightSwipe && imageList.length > 1) {
      if (e) e.stopPropagation();
      prevSlide();
    }
  };

  // Optional Autoplay
  useEffect(() => {
    if (autoPlay && imageList.length > 1) {
      timerRef.current = setInterval(nextSlide, autoPlayInterval);
      return () => clearInterval(timerRef.current);
    }
  }, [autoPlay, imageList.length, autoPlayInterval, nextSlide]);

  if (imageList.length === 0) {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400 ${rounded}`}>
        <div className="text-center space-y-2 p-6">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm text-slate-400">
            <Building2 className="h-6 w-6 stroke-[1.5]" />
          </div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">No Visuals Available</p>
        </div>
      </div>
    );
  }

  const currentImg = imageList[currentIndex];
  const hasError = imageError[currentIndex];

  return (
    <div className="flex flex-col gap-3 w-full h-full">
      {/* Main Carousel Screen */}
      <div 
        className={`group relative h-full w-full overflow-hidden bg-slate-900 select-none ${rounded} ${onImageClick ? "cursor-pointer" : ""}`}
        onClick={() => onImageClick && onImageClick(currentImg, currentIndex)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => timerRef.current && clearInterval(timerRef.current)}
      >
        {hasError ? (
          <div className="flex h-full w-full items-center justify-center bg-slate-800 text-slate-400">
            <div className="text-center space-y-2">
              <ImageOff className="mx-auto h-8 w-8 text-slate-500" />
              <p className="text-xs">Photo unavailable</p>
            </div>
          </div>
        ) : (
          <img
            key={currentImg}
            src={currentImg}
            alt={`${title} - photo ${currentIndex + 1}`}
            onError={() => setImageError((prev) => ({ ...prev, [currentIndex]: true }))}
            className="h-full w-full object-cover transition-all duration-500 group-hover:scale-105"
            loading="lazy"
          />
        )}

        {/* Ambient Top and Bottom Dark Gradient for high legibility */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Previous / Next Arrow Controls */}
        {imageList.length > 1 && (
          <div className="absolute inset-y-0 inset-x-2 flex items-center justify-between pointer-events-none">
            <button
              onClick={prevSlide}
              type="button"
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/20 shadow-lg opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Previous photo"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={nextSlide}
              type="button"
              className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md border border-white/20 shadow-lg opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-all hover:bg-black/80 hover:scale-110 active:scale-95 cursor-pointer"
              aria-label="Next photo"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        {/* Slide Counter Badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-1 text-[11px] font-bold text-white backdrop-blur-md border border-white/10 shadow-sm pointer-events-none">
          <span>{currentIndex + 1}</span>
          <span className="opacity-50">/</span>
          <span>{imageList.length}</span>
        </div>

        {/* Enlarge Indicator */}
        {onImageClick && (
          <div className="absolute top-3 right-3 rounded-full bg-black/50 p-2 text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 pointer-events-none">
            <Maximize2 className="h-3.5 w-3.5" />
          </div>
        )}

        {/* Expandable Modern Indicator Pills */}
        {imageList.length > 1 && (
          <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-1.5 pointer-events-auto">
            {imageList.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 cursor-pointer ${
                  currentIndex === idx 
                    ? "w-6 bg-white shadow-sm shadow-white/50" 
                    : "w-1.5 bg-white/50 hover:bg-white/80"
                }`}
                aria-label={`Jump to photo ${idx + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Interactive Filmstrip Thumbnails (used on detail showcase) */}
      {showThumbnails && imageList.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {imageList.map((imgUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all cursor-pointer ${
                currentIndex === idx 
                  ? "border-slate-900 ring-2 ring-slate-900/20 scale-105" 
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img
                src={imgUrl}
                alt={`Thumbnail ${idx + 1}`}
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
