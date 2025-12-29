import { useEffect, useRef, useState } from 'react';

export const useIntersectionObserver = (options = {}) => {
  const [inView, setInView] = useState(false);
  const [hasBeenInView, setHasBeenInView] = useState(false);
  const elementRef = useRef(null);
  const observerRef = useRef(null);

  const defaultOptions = {
    threshold: 0.1,
    rootMargin: '50px', // Load ảnh khi còn cách 50px
    ...options
  };

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    // Nếu đã từng in view và once=true, không cần observe nữa
    if (hasBeenInView && options.once) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        const isIntersecting = entry.isIntersecting;
        setInView(isIntersecting);
        
        if (isIntersecting) {
          setHasBeenInView(true);
          // Nếu once=true, ngừng observe sau lần đầu
          if (options.once) {
            observerRef.current?.unobserve(element);
          }
        }
      },
      defaultOptions
    );

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.unobserve(element);
      observerRef.current?.disconnect();
    };
  }, [hasBeenInView, options.once, defaultOptions.threshold, defaultOptions.rootMargin]);

  return {
    ref: elementRef,
    inView: hasBeenInView || inView,
    hasBeenInView
  };
};
