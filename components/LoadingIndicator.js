// components/LoadingIndicator.js
import React from 'react';

export default function LoadingIndicator({ message = 'Loading...', size = 'medium' }) {
  // Define spinner sizes
  const sizes = {
    small: {
      width: '24px',
      height: '24px',
      border: '3px'
    },
    medium: {
      width: '40px',
      height: '40px',
      border: '4px'
    },
    large: {
      width: '60px',
      height: '60px',
      border: '5px'
    }
  };
  
  const selectedSize = sizes[size] || sizes.medium;
  
  return (
    <div className="loading">
      <div 
        className="loading-spinner"
        style={{
          width: selectedSize.width,
          height: selectedSize.height,
          border: `${selectedSize.border} solid rgba(0, 0, 0, 0.1)`,
          borderTop: `${selectedSize.border} solid var(--color-primary)`,
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          marginBottom: '1rem'
        }}
      ></div>
      <p>{message}</p>
    </div>
  );
}
