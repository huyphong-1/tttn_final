// Script để migrate tablet images từ Supabase sang Cloudinary
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import FormData from 'form-data';
import CryptoJS from 'crypto-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cloudinary config
const CLOUDINARY_CONFIG = {
  cloud_name: 'dhhfdhnmr',
  api_key: '414761388984424',
  api_secret: 'Tp4y5jwgYiBW7A11dPmX0QegZBs'
};

// Upload function for Node.js
async function uploadToCloudinary(buffer, filename, folder = 'tablets') {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const stringToSign = `timestamp=${timestamp}${CLOUDINARY_CONFIG.api_secret}`;
  const signature = CryptoJS.SHA1(stringToSign).toString();
  
  const formData = new FormData();
  formData.append('file', buffer, { filename });
  formData.append('api_key', CLOUDINARY_CONFIG.api_key);
  formData.append('timestamp', timestamp);
  formData.append('signature', signature);
  formData.append('folder', folder);
  
  const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloud_name}/image/upload`;
  
  const response = await fetch(uploadUrl, {
    method: 'POST',
    body: formData
  });
  
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Cloudinary upload failed: ${response.status} - ${errorText}`);
  }
  
  return await response.json();
}

// Migration function
async function migrateTabletImages(tabletUrls) {
  const results = [];
  
  console.log(`[Migration] Starting migration of ${tabletUrls.length} images to Cloudinary`);
  
  for (let i = 0; i < tabletUrls.length; i++) {
    const url = tabletUrls[i];
    console.log(`[Migration] Processing image ${i + 1}/${tabletUrls.length}: ${url}`);
    
    try {
      // Download image from Supabase
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status}`);
      }
      
      // Get image buffer
      const buffer = await response.buffer();
      const filename = url.split('/').pop() || `image-${i + 1}.jpg`;
      
      console.log(`[Migration] Downloaded ${filename}, size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);
      
      // Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(buffer, filename, 'tablets');
      
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
  console.log(`[Migration] Completed: ${successCount}/${tabletUrls.length} images migrated successfully`);
  
  const cloudinaryUrls = results
    .filter(result => result.success)
    .map(result => result.cloudinaryUrl);
  
  return {
    success: results.every(r => r.success),
    originalUrls: tabletUrls,
    cloudinaryUrls: cloudinaryUrls,
    migrationResults: results
  };
}

const tabletUrls = [
  "https://hswxfkfxajpthlewbniu.supabase.co/storage/v1/object/public/product-images/tablets/tablet-035/front.jpg",
  "https://hswxfkfxajpthlewbniu.supabase.co/storage/v1/object/public/product-images/tablets/tablet-035/back.jpg",
  "https://hswxfkfxajpthlewbniu.supabase.co/storage/v1/object/public/product-images/tablets/tablet-035/side.jpg"
];

async function runMigration() {
  console.log('🚀 Bắt đầu migrate tablet images từ Supabase sang Cloudinary...\n');
  
  try {
    const result = await migrateTabletImages(tabletUrls);
    
    console.log('\n📊 KẾT QUẢ MIGRATION:');
    console.log('='.repeat(50));
    console.log(`✅ Thành công: ${result.success ? 'CÓ' : 'KHÔNG'}`);
    console.log(`📸 Số ảnh gốc: ${result.originalUrls.length}`);
    console.log(`☁️  Số ảnh đã upload: ${result.cloudinaryUrls.length}`);
    
    if (result.cloudinaryUrls.length > 0) {
      console.log('\n🔗 CLOUDINARY URLs MỚI:');
      result.cloudinaryUrls.forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
      
      console.log('\n📋 ARRAY ĐỂ COPY:');
      console.log(JSON.stringify(result.cloudinaryUrls, null, 2));
    }
    
    console.log('\n📝 CHI TIẾT MIGRATION:');
    result.migrationResults.forEach((item, index) => {
      if (item.success) {
        console.log(`✅ ${index + 1}. ${item.filename} → ${item.cloudinaryUrl}`);
      } else {
        console.log(`❌ ${index + 1}. ${item.originalUrl} → ERROR: ${item.error}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Lỗi migration:', error);
  }
}

// Chạy migration
runMigration();
