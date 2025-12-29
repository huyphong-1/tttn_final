import { uploadImageToCloudinary } from './cloudinaryUtils.js';

/**
 * Migrate images from Supabase to Cloudinary
 * @param {string[]} supabaseUrls - Array of Supabase image URLs
 * @param {string} folder - Cloudinary folder to upload to
 * @returns {Promise<object[]>} Array of Cloudinary upload results
 */
export const migrateImagesToCloudinary = async (supabaseUrls, folder = 'migrated') => {
  const results = [];
  
  console.log(`[Migration] Starting migration of ${supabaseUrls.length} images to Cloudinary`);
  
  for (let i = 0; i < supabaseUrls.length; i++) {
    const url = supabaseUrls[i];
    console.log(`[Migration] Processing image ${i + 1}/${supabaseUrls.length}: ${url}`);
    
    try {
      // Download image from Supabase
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      // Get image blob
      const blob = await response.blob();
      
      // Create File object from blob
      const filename = url.split('/').pop() || `image-${i + 1}.jpg`;
      const file = new File([blob], filename, { type: blob.type });
      
      console.log(`[Migration] Downloaded ${filename}, size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Upload to Cloudinary
      const cloudinaryResult = await uploadImageToCloudinary(file, folder);
      
      results.push({
        originalUrl: url,
        cloudinaryUrl: cloudinaryResult.secure_url || cloudinaryResult.url,
        publicId: cloudinaryResult.public_id,
        filename: filename,
        success: true
      });
      
      console.log(`[Migration] ✅ Uploaded ${filename} to Cloudinary: ${cloudinaryResult.secure_url}`);
      
    } catch (error) {
      console.error(`[Migration] ❌ Failed to migrate ${url}:`, error);
      results.push({
        originalUrl: url,
        error: error.message,
        success: false
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`[Migration] Completed: ${successCount}/${supabaseUrls.length} images migrated successfully`);
  
  return results;
};

/**
 * Migrate specific tablet images
 * @param {string[]} tabletUrls - Tablet image URLs from Supabase
 * @returns {Promise<object>} Migration result with Cloudinary URLs
 */
export const migrateTabletImages = async (tabletUrls) => {
  console.log('[Migration] Starting tablet images migration...');
  
  const migrationResults = await migrateImagesToCloudinary(tabletUrls, 'tablets');
  
  const cloudinaryUrls = migrationResults
    .filter(result => result.success)
    .map(result => result.cloudinaryUrl);
  
  return {
    success: migrationResults.every(r => r.success),
    originalUrls: tabletUrls,
    cloudinaryUrls: cloudinaryUrls,
    migrationResults: migrationResults
  };
};
