import React from 'react';

export default function PlexisLogo({ width = 32, height = 32, className = '' }) {
  return (
    <svg 
      width={width} 
      height={height} 
      viewBox="0 0 48 48" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="plexisGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
        <linearGradient id="plexisGradDark" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
        <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>
      
      {/* Outer hexagon / data node shape */}
      <path 
        d="M24 4L42 14.3923V33.6077L24 44L6 33.6077V14.3923L24 4Z" 
        fill="url(#plexisGradDark)" 
        fillOpacity="0.2"
        stroke="url(#plexisGrad)" 
        strokeWidth="2"
      />
      
      {/* Inner P-shape abstract node */}
      <path 
        d="M18 16H28C31.3137 16 34 18.6863 34 22C34 25.3137 31.3137 28 28 28H18V36" 
        stroke="url(#plexisGrad)" 
        strokeWidth="4" 
        strokeLinecap="round" 
        strokeLinejoin="round"
        filter="url(#glow)"
      />
      
      {/* AI Spark element */}
      <circle cx="28" cy="22" r="3" fill="#ffffff" />
    </svg>
  );
}
