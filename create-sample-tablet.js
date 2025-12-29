// Script để tạo sample tablet images và upload lên Cloudinary
import fetch from 'node-fetch';
import FormData from 'form-data';
import CryptoJS from 'crypto-js';

// Cloudinary config
const CLOUDINARY_CONFIG = {
  cloud_name: 'dhhfdhnmr',
  api_key: '414761388984424',
  api_secret: 'Tp4y5jwgYiBW7A11dPmX0QegZBs'
};

// Sample tablet images từ các nguồn public
const sampleTabletImages = [
  {
    url: 'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=800&h=800&fit=crop',
    name: 'tablet-front.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=800&h=800&fit=crop',
    name: 'tablet-back.jpg'
  },
  {
    url: 'https://images.unsplash.com/photo-1585790050230-5dd28404ccb9?w=800&h=800&fit=crop',
    name: 'tablet-side.jpg'
  }
];

// Upload function for Cloudinary
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

// Create sample tablet images
async function createSampleTabletImages() {
  const results = [];
  
  console.log(`[Sample] Creating ${sampleTabletImages.length} sample tablet images...`);
  
  for (let i = 0; i < sampleTabletImages.length; i++) {
    const image = sampleTabletImages[i];
    console.log(`[Sample] Processing ${i + 1}/${sampleTabletImages.length}: ${image.name}`);
    
    try {
      // Download sample image
      const response = await fetch(image.url);
      if (!response.ok) {
        throw new Error(`Failed to fetch sample image: ${response.status}`);
      }
      
      // Get image buffer
      const buffer = await response.buffer();
      
      console.log(`[Sample] Downloaded ${image.name}, size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`);
      
      // Upload to Cloudinary
      const cloudinaryResult = await uploadToCloudinary(buffer, image.name, 'tablets');
      
      results.push({
        name: image.name,
        cloudinaryUrl: cloudinaryResult.secure_url || cloudinaryResult.url,
        publicId: cloudinaryResult.public_id,
        success: true
      });
      
      console.log(`[Sample] ✅ Uploaded ${image.name} to Cloudinary: ${cloudinaryResult.secure_url}`);
      
    } catch (error) {
      console.error(`[Sample] ❌ Failed to create ${image.name}:`, error);
      results.push({
        name: image.name,
        error: error.message,
        success: false
      });
    }
  }
  
  const successCount = results.filter(r => r.success).length;
  console.log(`[Sample] Completed: ${successCount}/${sampleTabletImages.length} images created successfully`);
  
  const cloudinaryUrls = results
    .filter(result => result.success)
    .map(result => result.cloudinaryUrl);
  
  return {
    success: results.every(r => r.success),
    cloudinaryUrls: cloudinaryUrls,
    results: results
  };
}

async function runSampleCreation() {
  console.log('🚀 Tạo sample tablet images và upload lên Cloudinary...\n');
  
  try {
    const result = await createSampleTabletImages();
    
    console.log('\n📊 KẾT QUẢ TẠO SAMPLE:');
    console.log('='.repeat(50));
    console.log(`✅ Thành công: ${result.success ? 'CÓ' : 'KHÔNG'}`);
    console.log(`☁️  Số ảnh đã upload: ${result.cloudinaryUrls.length}`);
    
    if (result.cloudinaryUrls.length > 0) {
      console.log('\n🔗 CLOUDINARY URLs MỚI:');
      result.cloudinaryUrls.forEach((url, index) => {
        console.log(`${index + 1}. ${url}`);
      });
      
      console.log('\n📋 ARRAY ĐỂ COPY VÀO DATABASE:');
      console.log(JSON.stringify(result.cloudinaryUrls, null, 2));
      
      console.log('\n💾 ĐỂ LƯU VÀO PRODUCT:');
      console.log(`image: "${result.cloudinaryUrls[0]}"`);
    }
    
    console.log('\n📝 CHI TIẾT:');
    result.results.forEach((item, index) => {
      if (item.success) {
        console.log(`✅ ${index + 1}. ${item.name} → ${item.cloudinaryUrl}`);
      } else {
        console.log(`❌ ${index + 1}. ${item.name} → ERROR: ${item.error}`);
      }
    });
    
  } catch (error) {
    console.error('❌ Lỗi tạo sample:', error);
  }
}

// Chạy tạo sample
runSampleCreation();
