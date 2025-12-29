// Request deduplication utility to prevent duplicate API calls
const activeRequests = new Map();

export const deduplicateRequest = async (key, requestFn) => {
  // If same request is already in progress, return the existing promise
  if (activeRequests.has(key)) {
    return activeRequests.get(key);
  }

  // Create new request promise
  const promise = requestFn()
    .finally(() => {
      // Clean up after request completes
      activeRequests.delete(key);
    });

  // Store the promise
  activeRequests.set(key, promise);
  
  return promise;
};

// Clear all pending requests (useful for cleanup)
export const clearPendingRequests = () => {
  activeRequests.clear();
};

// Get count of active requests (for debugging)
export const getActiveRequestCount = () => {
  return activeRequests.size;
};
