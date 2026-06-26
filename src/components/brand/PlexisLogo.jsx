import React from 'react';
import { Sparkles } from 'lucide-react';

export default function PlexisLogo({ width = 32, height = 32, className = '' }) {
  return (
    <div 
      className={`plexis-logo-container ${className}`} 
      style={{ 
        display: 'inline-flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: width,
        height: height
      }}
      aria-hidden="true"
    >
      <Sparkles 
        size={Math.min(width, height) * 0.8} 
        style={{
          color: '#6366f1',
          filter: 'drop-shadow(0 0 8px rgba(99, 102, 241, 0.5))',
          transition: 'color 0.3s ease, filter 0.3s ease'
        }}
      />
    </div>
  );
}
