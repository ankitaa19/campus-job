import React from 'react';
import { NextPageContext } from 'next';

interface ErrorProps {
  statusCode?: number;
  hasGetInitialPropsRun?: boolean;
  err?: Error;
}

function ErrorPage({ statusCode }: ErrorProps) {
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      alignItems: 'center', 
      justifyContent: 'center', 
      minHeight: '100vh',
      fontFamily: 'sans-serif',
      backgroundColor: '#f8f9fa',
      color: '#333'
    }}>
      <h1 style={{ fontSize: '4rem', margin: 0 }}>
        {statusCode ? statusCode : 'Client-side error'}
      </h1>
      <p style={{ fontSize: '1.2rem', marginTop: '1rem', textAlign: 'center' }}>
        {statusCode === 404
          ? 'This page could not be found.'
          : statusCode
          ? `A server-side error ${statusCode} occurred on server`
          : 'An error occurred on client'}
      </p>
      <button 
        onClick={() => window.location.href = '/'}
        style={{
          marginTop: '2rem',
          padding: '0.75rem 1.5rem',
          backgroundColor: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '0.25rem',
          cursor: 'pointer',
          fontSize: '1rem'
        }}
      >
        Go Home
      </button>
    </div>
  );
}

ErrorPage.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};

export default ErrorPage;