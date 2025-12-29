import { 
  CLOUDINARY_CONFIG, 
  CLOUDINARY_FOLDERS, 
  ALLOWED_FILE_TYPES, 
  MAX_FILE_SIZE,
  IMAGE_TRANSFORMS 
} from '../config/cloudinaryConfig';
import CryptoJS from 'crypto-js';

/**
 * Upload single image to Cloudinary
 * @param {File} file - Image file to upload
 * @param {string} folder - Folder path in Cloudinary (optional)
 * @param {object} options - Additional upload options
 * @returns {Promise<object>} Upload result with URL and public_id
 */
// Tạo signature cho signed upload với crypto-js
const generateSignature = (params, apiSecret) => {
  const stringToSign = Object.keys(params)
    .sort()
    .map(key => `${key}=${params[key]}`)
    .join('&');
  
  return CryptoJS.SHA1(stringToSign + apiSecret).toString();
};

export const uploadImageToCloudinary = async (file, folder = 'uploads', options = {}) => {
  console.log('[Cloudinary] Starting upload:', { 
    fileName: file.name, 
    fileSize: file.size, 
    fileType: file.type,
    cloudName: CLOUDINARY_CONFIG.cloud_name,
    apiKey: CLOUDINARY_CONFIG.api_key ? 'SET' : 'NOT_SET',
    apiSecret: CLOUDINARY_CONFIG.api_secret ? 'SET' : 'NOT_SET',
    folder: folder
  });
  
  // Test simple unsigned upload first
  console.log('[Cloudinary] Attempting simple unsigned upload...');
  
  // Validate file
  if (!file) {
    throw new Error('Không có file để upload');
  }

  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('Định dạng file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WebP');
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File quá lớn. Kích thước tối đa là 5MB');
  }

  try {
    // Use signed upload since unsigned presets need to be configured
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Create signature for signed upload (no folder to avoid complications)
    const paramsToSign = {
      timestamp: timestamp
    };
    
    console.log('[Cloudinary] Using signed upload with params:', paramsToSign);
    
    // Generate signature: timestamp + api_secret
    const stringToSign = `timestamp=${timestamp}${CLOUDINARY_CONFIG.api_secret}`;
    const signature = CryptoJS.SHA1(stringToSign).toString();
    
    console.log('[Cloudinary] String to sign:', stringToSign);
    console.log('[Cloudinary] Generated signature:', signature);
    
    // Create FormData for signed upload
    const formData = new FormData();
    formData.append('file', file);
    formData.append('api_key', CLOUDINARY_CONFIG.api_key);
    formData.append('timestamp', timestamp);
    formData.append('signature', signature);
    
    console.log('[Cloudinary] FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(`  ${key}:`, typeof value === 'object' ? `[File: ${value.name}]` : value);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`;
    console.log('[Cloudinary] Upload URL:', uploadUrl);
    
    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    console.log('[Cloudinary] Response status:', response.status);
    console.log('[Cloudinary] Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('[Cloudinary] Raw response:', responseText);

    if (!response.ok) {
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch (e) {
        errorData = { error: { message: responseText } };
      }
      console.error('[Cloudinary] Upload error:', errorData);
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${responseText}`);
    }

    const result = JSON.parse(responseText);
    console.log('[Cloudinary] Upload success:', { public_id: result.public_id, url: result.secure_url });
    
    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resource_type: result.resource_type,
      created_at: result.created_at
    };

  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error(error.message || 'Có lỗi xảy ra khi upload ảnh');
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {FileList|Array} files - Array of image files
 * @param {string} folder - Folder path in Cloudinary
 * @param {object} options - Additional upload options
 * @returns {Promise<Array>} Array of upload results
 */
export const uploadMultipleImages = async (files, folder = CLOUDINARY_FOLDERS.PRODUCTS, options = {}) => {
  const fileArray = Array.from(files);
  const uploadPromises = fileArray.map((file, index) => {
    const fileOptions = {
      ...options,
      public_id: options.public_id ? `${options.public_id}_${index + 1}` : undefined
    };
    return uploadImageToCloudinary(file, folder, fileOptions);
  });

  try {
    const results = await Promise.all(uploadPromises);
    return {
      success: true,
      results,
      count: results.length
    };
  } catch (error) {
    throw new Error(`Upload multiple images failed: ${error.message}`);
  }
};

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Public ID của ảnh cần xóa
 * @returns {Promise<object>} Delete result
 */
export const deleteImageFromCloudinary = async (publicId) => {
  if (!publicId) {
    throw new Error('Public ID không được để trống');
  }

  try {
    // Tạo signature để xác thực (cần implement trên server)
    // Vì đây là client-side, ta sẽ gọi API endpoint riêng để delete
    const response = await fetch('/api/cloudinary/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ public_id: publicId })
    });

    if (!response.ok) {
      throw new Error('Xóa ảnh thất bại');
    }

    const result = await response.json();
    return result;

  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Có lỗi xảy ra khi xóa ảnh');
  }
};

/**
 * Generate optimized image URL with transformations
 * @param {string} publicId - Public ID của ảnh
 * @param {string} preset - Transformation preset name
 * @param {object} customTransforms - Custom transformation parameters
 * @returns {string} Optimized image URL
 */
export const getOptimizedImageUrl = (publicId, preset = 'PRODUCT_THUMB', customTransforms = {}) => {
  if (!publicId) return 'https://via.placeholder.com/400x400/e2e8f0/64748b?text=No+Image';

  // Handle different publicId formats
  let cleanPublicId = publicId;
  
  // If publicId contains folder path, use as is
  if (typeof publicId === 'string') {
    // If it's already a full Cloudinary URL, return it as is
    if (publicId.includes('res.cloudinary.com')) {
      return publicId;
    }
    
    // Remove any leading/trailing slashes
    cleanPublicId = publicId.replace(/^\/+|\/+$/g, '');
    
    // If it's already a full URL, extract public ID
    if (publicId.includes('cloudinary.com')) {
      const urlParts = publicId.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
        cleanPublicId = urlParts.slice(uploadIndex + 1).join('/');
      }
    }
  }

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/image/upload`;
  
  // Get preset transforms
  const presetTransforms = IMAGE_TRANSFORMS[preset] || IMAGE_TRANSFORMS.PRODUCT_THUMB;
  
  // Merge preset with custom transforms
  const transforms = { ...presetTransforms, ...customTransforms };
  
  // Build transformation string
  const transformString = Object.entries(transforms)
    .map(([key, value]) => `${key}_${value}`)
    .join(',');

  return `${baseUrl}/${transformString}/${cleanPublicId}`;
};

/**
 * Generate multiple sizes of the same image
 * @param {string} publicId - Public ID của ảnh
 * @returns {object} Object chứa URLs cho different sizes
 */
export const getImageUrls = (publicId) => {
  const fallbackUrl = 'https://via.placeholder.com/400x400/e2e8f0/64748b?text=No+Image';
  
  if (!publicId) {
    return {
      thumbnail: fallbackUrl,
      card: fallbackUrl,
      detail: fallbackUrl,
      original: fallbackUrl
    };
  }

  // If it's already a full Cloudinary URL, return it for all sizes
  if (typeof publicId === 'string' && publicId.includes('res.cloudinary.com')) {
    return {
      thumbnail: publicId,
      card: publicId,
      detail: publicId,
      original: publicId
    };
  }

  // Clean publicId same as in getOptimizedImageUrl
  let cleanPublicId = publicId;
  if (typeof publicId === 'string') {
    cleanPublicId = publicId.replace(/^\/+|\/+$/g, '');
    if (publicId.includes('cloudinary.com')) {
      const urlParts = publicId.split('/');
      const uploadIndex = urlParts.findIndex(part => part === 'upload');
      if (uploadIndex !== -1 && uploadIndex < urlParts.length - 1) {
        cleanPublicId = urlParts.slice(uploadIndex + 1).join('/');
      }
    }
  }

  return {
    thumbnail: getOptimizedImageUrl(publicId, 'PRODUCT_THUMB'),
    card: getOptimizedImageUrl(publicId, 'PRODUCT_CARD'),
    detail: getOptimizedImageUrl(publicId, 'PRODUCT_DETAIL'),
    original: `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/image/upload/${cleanPublicId}`
  };
};

/**
 * Extract public ID from Cloudinary URL
 * @param {string} cloudinaryUrl - Full Cloudinary URL
 * @returns {string} Public ID
 */
export const extractPublicIdFromUrl = (cloudinaryUrl) => {
  if (!cloudinaryUrl || typeof cloudinaryUrl !== 'string') return '';
  
  try {
    // Pattern để extract public ID từ Cloudinary URL
    const pattern = /\/(?:v\d+\/)?([^\/]+(?:\/[^\/]+)*?)(?:\.[^.\/]+)?$/;
    const match = cloudinaryUrl.match(pattern);
    
    if (match && match[1]) {
      // Remove transformation parameters nếu có
      return match[1].split('/').pop().split('?')[0];
    }
    
    return '';
  } catch (error) {
    console.error('Error extracting public ID:', error);
    return '';
  }
};

/**
 * Validate image file before upload
 * @param {File} file - File cần validate
 * @returns {object} Validation result
 */
export const validateImageFile = (file) => {
  const errors = [];

  if (!file) {
    errors.push('Không có file để upload');
  } else {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      errors.push('Định dạng file không được hỗ trợ. Chỉ chấp nhận JPG, PNG, WebP');
    }

    if (file.size > MAX_FILE_SIZE) {
      errors.push('File quá lớn. Kích thước tối đa là 5MB');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * Get image metadata from URL
 * @param {string} imageUrl - Cloudinary image URL
 * @returns {Promise<object>} Image metadata
 */
export const getImageMetadata = async (imageUrl) => {
  try {
    // Extract public ID
    const publicId = extractPublicIdFromUrl(imageUrl);
    
    if (!publicId) {
      throw new Error('Invalid Cloudinary URL');
    }

    // Get metadata từ Cloudinary API
    const metadataUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloud_name}/image/upload/fl_getinfo/${publicId}.json`;
    
    const response = await fetch(metadataUrl);
    
    if (!response.ok) {
      throw new Error('Cannot fetch image metadata');
    }

    const metadata = await response.json();
    
    return {
      public_id: metadata.public_id,
      format: metadata.format,
      width: metadata.width,
      height: metadata.height,
      bytes: metadata.bytes,
      created_at: metadata.created_at
    };

  } catch (error) {
    console.error('Error getting image metadata:', error);
    return null;
  }
};
