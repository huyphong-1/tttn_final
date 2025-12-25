// Environment configuration
const config = {
  // App Information
  APP_NAME: import.meta.env.VITE_APP_NAME || 'TechPhone',
  APP_URL: import.meta.env.VITE_APP_URL || 'http://localhost:5173',
  API_URL: import.meta.env.VITE_API_URL || 'http://localhost:5173/api',
  
  // Supabase Configuration
  SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
  
  // Feature Flags
  ENABLE_ANALYTICS: import.meta.env.VITE_ENABLE_ANALYTICS === 'true',
  ENABLE_ERROR_REPORTING: import.meta.env.VITE_ENABLE_ERROR_REPORTING === 'true',
  MAINTENANCE_MODE: import.meta.env.VITE_MAINTENANCE_MODE === 'true',
  
  // Analytics
  GA_TRACKING_ID: import.meta.env.VITE_GA_TRACKING_ID,
  HOTJAR_ID: import.meta.env.VITE_HOTJAR_ID,
  
  // Environment
  IS_DEVELOPMENT: import.meta.env.DEV,
  IS_PRODUCTION: import.meta.env.PROD,
  MODE: import.meta.env.MODE,
};

// Validation
const requiredEnvVars = ['VITE_SUPABASE_URL', 'VITE_SUPABASE_ANON_KEY'];

requiredEnvVars.forEach(envVar => {
  if (!import.meta.env[envVar]) {
    console.error(`Missing required environment variable: ${envVar}`);
  }
});

export default config;
