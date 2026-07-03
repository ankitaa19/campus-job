import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Custom404() {
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
        <h1 style={{ fontSize: '6rem', margin: 0, fontWeight: 'bold', color: '#007bff' }}>
          404
        </h1>
        <h2 style={{ fontSize: '2rem', marginTop: '1rem', marginBottom: '1rem' }}>
          Page Not Found
        </h2>
        <p style={{ fontSize: '1.2rem', marginBottom: '2rem', color: '#666' }}>
          The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            textDecoration: 'none',
            borderRadius: '0.25rem',
            fontSize: '1rem',
            fontWeight: '500'
          }}>
            Go Home
          </Link>
          <button 
            onClick={() => window.history.back()}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: 'transparent',
              color: '#007bff',
              border: '1px solid #007bff',
              borderRadius: '0.25rem',
              cursor: 'pointer',
              fontSize: '1rem',
              fontWeight: '500'
            }}
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}