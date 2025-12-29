// Cấu hình Cloudinary
export const CLOUDINARY_CONFIG = {
  cloud_name: import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'dhhfdhnmr',
  api_key: import.meta.env.VITE_CLOUDINARY_API_KEY || '414761388984424',
  api_secret: import.meta.env.VITE_CLOUDINARY_API_SECRET || 'Tp4y5jwgYiBW7A11dPmX0QegZBs'
};

// Upload preset cho unsigned uploads - thử các preset khác nhau
export const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'unsigned_preset';

// Folder organization trong Cloudinary
export const CLOUDINARY_FOLDERS = {
  PRODUCTS: 'techphone/products',
  CATEGORIES: 'techphone/categories',
  USERS: 'techphone/users',
  BANNERS: 'techphone/banners'
};

// Image transformation presets
export const IMAGE_TRANSFORMS = {
  // Product thumbnails
  PRODUCT_THUMB: {
    width: 200,
    height: 200,
    crop: 'fill',
    quality: 70, // Giảm quality cho thumbnails
    format: 'auto'
  },
  
  // Product cards
  PRODUCT_CARD: {
    width: 300,
    height: 300,
    crop: 'fill',
    quality: 75, // Giảm từ auto xuống 75
    format: 'auto'
  },
  
  // Product detail images
  PRODUCT_DETAIL: {
    width: 600,
    height: 600,
    crop: 'fill',
    quality: 80, // Giảm từ auto xuống 80
    format: 'auto'
  },
  
  // Category banners
  CATEGORY_BANNER: {
    width: 1000,
    height: 350,
    crop: 'fill',
    quality: 70,
    format: 'auto'
  },
  
  // User avatars
  USER_AVATAR: {
    width: 120,
    height: 120,
    crop: 'fill',
    quality: 70,
    format: 'auto',
    radius: 'max'
  },
  
  // Thêm low-quality placeholder preset
  PLACEHOLDER: {
    width: 50,
    height: 50,
    crop: 'fill',
    quality: 30,
    format: 'auto',
    blur: 200
  }
};

// Allowed file types
export const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

// Max file size (5MB)
export const MAX_FILE_SIZE = 5 * 1024 * 1024;
