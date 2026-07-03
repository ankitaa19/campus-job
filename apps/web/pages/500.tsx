import React from 'react';
import Link from 'next/link';

export default function Custom500() {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#f8f9fa',
      color: '#333',
      padding: '2rem'
    }}>
      <div style={{ textAlign: 'center', maxWidth: '600px' }}>
        <h1 style={{ fontSize: '6rem', margin: 0, fontWeight: 'bold', color: '#dc3545' }}>
          500
        </h1>
        <h2 style={{ fontSize: '2rem', marginTop: '1rem', marginBottom: '1rem' }}>
          Server Error
        </h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#666' }}>
          Something went wrong on our end. We're working to fix this issue. Please try again later.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#dc3545',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.25rem',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            Go Home
          </Link>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#dc3545',
              border: '1px solid #dc3545',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  );
}