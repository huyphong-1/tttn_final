import React from 'react';

const TestPage = () => {
  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">🚀 Test Page - Production Debug</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Environment Variables */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">VITE_API_BASE_URL:</span>
                <span className="ml-2 text-green-400">{import.meta.env.VITE_API_BASE_URL || 'undefined'}</span>
              </div>
              <div>
                <span className="text-slate-400">VITE_SUPABASE_URL:</span>
                <span className="ml-2 text-green-400">{import.meta.env.VITE_SUPABASE_URL || 'undefined'}</span>
              </div>
              <div>
                <span className="text-slate-400">VITE_CLOUDINARY_CLOUD_NAME:</span>
                <span className="ml-2 text-green-400">{import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'undefined'}</span>
              </div>
              <div>
                <span className="text-slate-400">NODE_ENV:</span>
                <span className="ml-2 text-green-400">{import.meta.env.NODE_ENV || 'undefined'}</span>
              </div>
              <div>
                <span className="text-slate-400">MODE:</span>
                <span className="ml-2 text-green-400">{import.meta.env.MODE || 'undefined'}</span>
              </div>
              <div>
                <span className="text-slate-400">PROD:</span>
                <span className="ml-2 text-green-400">{import.meta.env.PROD ? 'true' : 'false'}</span>
              </div>
            </div>
          </div>

          {/* API Test */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">API Test</h2>
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/health');
                  const data = await response.json();
                  alert(`API Response: ${JSON.stringify(data, null, 2)}`);
                } catch (error) {
                  alert(`API Error: ${error.message}`);
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded mb-4"
            >
              Test /api/health
            </button>
            
            <button 
              onClick={async () => {
                try {
                  const response = await fetch('/api/products?limit=1');
                  const data = await response.json();
                  alert(`Products API: ${JSON.stringify(data, null, 2)}`);
                } catch (error) {
                  alert(`Products API Error: ${error.message}`);
                }
              }}
              className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded ml-2"
            >
              Test /api/products
            </button>
          </div>

          {/* Build Info */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Build Info</h2>
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-slate-400">Build Time:</span>
                <span className="ml-2 text-green-400">{new Date().toISOString()}</span>
              </div>
              <div>
                <span className="text-slate-400">User Agent:</span>
                <span className="ml-2 text-green-400 break-all">{navigator.userAgent}</span>
              </div>
              <div>
                <span className="text-slate-400">Location:</span>
                <span className="ml-2 text-green-400">{window.location.href}</span>
              </div>
            </div>
          </div>

          {/* Console Test */}
          <div className="bg-slate-800 p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-4">Console Test</h2>
            <button 
              onClick={() => {
                console.log('🚀 Test log from production');
                console.error('🔥 Test error from production');
                console.warn('⚠️ Test warning from production');
                alert('Check browser console for logs');
              }}
              className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
            >
              Test Console Logs
            </button>
          </div>
        </div>

        <div className="mt-8 p-6 bg-green-900/20 border border-green-600 rounded-lg">
          <h3 className="text-lg font-semibold text-green-400 mb-2">✅ Success!</h3>
          <p className="text-green-300">
            If you can see this page, React is working and the build is successful!
          </p>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
