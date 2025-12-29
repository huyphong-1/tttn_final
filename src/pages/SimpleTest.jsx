import React from 'react';

const SimpleTest = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1e293b',
      color: 'white',
      padding: '20px',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        🚀 SIMPLE TEST - NO TAILWIND
      </h1>
      
      <div style={{ 
        backgroundColor: '#334155', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>✅ React is Working!</h2>
        <p>If you see this, React components are rendering successfully.</p>
        <p>Build time: {new Date().toISOString()}</p>
        <p>Location: {typeof window !== 'undefined' ? window.location.href : 'Server'}</p>
      </div>

      <div style={{ 
        backgroundColor: '#334155', 
        padding: '20px', 
        borderRadius: '8px',
        marginBottom: '20px'
      }}>
        <h2>Environment Check</h2>
        <p>NODE_ENV: {process.env.NODE_ENV || 'undefined'}</p>
        <p>VITE_API_BASE_URL: {import.meta.env.VITE_API_BASE_URL || 'undefined'}</p>
        <p>MODE: {import.meta.env.MODE || 'undefined'}</p>
        <p>PROD: {import.meta.env.PROD ? 'true' : 'false'}</p>
      </div>

      <button 
        onClick={() => alert('Button works!')}
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '16px'
        }}
      >
        Test Button
      </button>

      <div style={{ 
        backgroundColor: '#065f46', 
        padding: '20px', 
        borderRadius: '8px',
        marginTop: '20px',
        border: '2px solid #10b981'
      }}>
        <h3 style={{ color: '#10b981' }}>SUCCESS!</h3>
        <p style={{ color: '#6ee7b7' }}>
          This page uses NO external dependencies, NO Tailwind, NO complex components.
          If this shows, the basic React build is working.
        </p>
      </div>
    </div>
  );
};

export default SimpleTest;
