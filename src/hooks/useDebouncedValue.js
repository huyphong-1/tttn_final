import { useEffect, useState, useRef } from "react";

export const useDebouncedValue = (value, delay = 300) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  const timerRef = useRef();

  useEffect(() => {
    // Clear previous timer nếu có
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    // Nếu value empty string, update ngay lập tức để reset filters nhanh
    if (value === '' || value === null || value === undefined) {
      setDebouncedValue(value);
      return;
    }

    // Set timer cho non-empty values
    timerRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [value, delay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return debouncedValue;
};
