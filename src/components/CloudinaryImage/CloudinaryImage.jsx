import React, { useState, useEffect } from 'react';
import { getOptimizedImageUrl, getImageUrls } from '../../utils/cloudinaryUtils';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';

const CloudinaryImage = ({
  publicId,
  alt = '',
  preset = 'PRODUCT_CARD',
  customTransforms = {},
  className = '',
  fallbackSrc = 'https://via.placeholder.com/400x400/e2e8f0/64748b?text=No+Image',
  loading = 'lazy',
  onClick = null,
  showFullRes = false,
  enableProgressiveLoading = true,
  ...props
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [shouldLoadImage, setShouldLoadImage] = useState(!enableProgressiveLoading);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);
  
  // Use intersection observer for better lazy loading
  const { ref, inView } = useIntersectionObserver({
    threshold: 0.1,
    rootMargin: '100px', // Load khi còn cách 100px
    once: true
  });

  // Effect để trigger loading khi element vào viewport
  useEffect(() => {
    if (inView && enableProgressiveLoading && !hasAttemptedLoad) {
      setShouldLoadImage(true);
      setHasAttemptedLoad(true);
    }
  }, [inView, enableProgressiveLoading, hasAttemptedLoad]);

  // Nếu không có publicId, hiển thị fallback
  if (!publicId) {
    return (
      <div ref={ref} className={`relative ${className}`}>
        <img
          src={fallbackSrc}
          alt={alt}
          className="w-full h-full object-cover"
          loading={loading}
          {...props}
        />
      </div>
    );
  }

  // Get optimized URL hoặc full resolution URLs
  const imageUrl = showFullRes 
    ? getImageUrls(publicId).original
    : getOptimizedImageUrl(publicId, preset, customTransforms);

  // Get placeholder URL for progressive loading
  const placeholderUrl = enableProgressiveLoading 
    ? getOptimizedImageUrl(publicId, 'PLACEHOLDER', {})
    : null;

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageError = (e) => {
    if (!imageError) {
      setImageError(true);
      e.target.src = fallbackSrc;
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      {/* Placeholder image (blurred, low quality) */}
      {enableProgressiveLoading && placeholderUrl && !shouldLoadImage && (
        <img
          src={placeholderUrl}
          alt={alt}
          className="w-full h-full object-cover filter blur-sm opacity-60"
          loading="eager"
        />
      )}
      
      {/* Main image - only load when in viewport */}
      {shouldLoadImage && (
        <img
          src={imageUrl}
          alt={alt}
          className={`
            transition-opacity duration-500
            ${imageLoaded ? 'opacity-100' : 'opacity-0'}
            ${onClick ? 'cursor-pointer' : ''}
            w-full h-full object-cover
            ${enableProgressiveLoading && !imageLoaded ? 'absolute inset-0' : ''}
          `}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={onClick}
          {...props}
        />
      )}
      
      {/* Loading skeleton - chỉ hiển thị khi không có placeholder */}
      {!imageLoaded && !imageError && (!enableProgressiveLoading || !placeholderUrl) && shouldLoadImage && (
        <div className="absolute inset-0 bg-slate-700 animate-pulse rounded" />
      )}
      
      {/* Fallback khi không load được và không có placeholder */}
      {!shouldLoadImage && !enableProgressiveLoading && (
        <div className="w-full h-full bg-slate-700 animate-pulse rounded" />
      )}
    </div>
  );
};

export default CloudinaryImage;
