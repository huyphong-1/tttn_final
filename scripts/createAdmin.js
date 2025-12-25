// Script để tạo admin user
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key để bypass RLS

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('🚀 Bắt đầu tạo admin user...');

    // Thông tin admin user
    const adminEmail = 'admin@techphone.com';
    const adminPassword = 'admin123456'; // Đổi password này trong production
    const adminData = {
      email: adminEmail,
      password: adminPassword,
      email_confirm: true, // Tự động confirm email
    };

    console.log(`📧 Tạo auth user: ${adminEmail}`);

    // 1. Tạo user trong Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser(adminData);

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log('⚠️  User đã tồn tại, đang cập nhật profile...');
        
        // Lấy user hiện tại
        const { data: existingUsers } = await supabase.auth.admin.listUsers();
        const existingUser = existingUsers.users.find(u => u.email === adminEmail);
        
        if (existingUser) {
          // Cập nhật profile cho user hiện tại
          await updateUserProfile(existingUser.id);
          return;
        }
      }
      throw authError;
    }

    console.log('✅ Tạo auth user thành công');

    // 2. Tạo profile trong database
    await updateUserProfile(authUser.user.id);

    console.log('🎉 Tạo admin user hoàn tất!');
    console.log('📋 Thông tin đăng nhập:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);
    console.log('⚠️  Hãy đổi password sau khi đăng nhập lần đầu!');

  } catch (error) {
    console.error('❌ Lỗi khi tạo admin user:', error.message);
    process.exit(1);
  }
}

async function updateUserProfile(userId) {
  console.log('👤 Tạo/cập nhật profile...');

  const profileData = {
    id: userId,
    email: 'admin@techphone.com',
    full_name: 'Administrator',
    role: 'admin',
    phone: '0123456789',
    address: '123 Admin Street',
    city: 'Hà Nội',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { error: profileError } = await supabase
    .from('profiles')
    .upsert(profileData, { 
      onConflict: 'id',
      ignoreDuplicates: false 
    });

  if (profileError) {
    throw new Error(`Lỗi khi tạo profile: ${profileError.message}`);
  }

  console.log('✅ Tạo profile thành công');
}

// Chạy script
createAdminUser();
