
import React from 'react';

export const BlackjackIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <g transform="rotate(-15 12 12)">
      <rect x="5" y="4" width="10" height="14" rx="2" fill="white" stroke="black" strokeWidth="1"/>
      <path d="M8 7 L10 7 M9 6 L9 8" stroke="red" strokeWidth="1.5" />
      <text x="6" y="17" fontSize="3" fill="black" fontFamily="serif" fontWeight="bold">A</text>
    </g>
    <g transform="rotate(15 12 12)">
      <rect x="9" y="5" width="10" height="14" rx="2" fill="white" stroke="black" strokeWidth="1"/>
      <path d="M15 11.5 L17 11.5" stroke="black" strokeWidth="1.5"/>
      <text x="10" y="18" fontSize="3" fill="black" fontFamily="serif" fontWeight="bold">J</text>
    </g>
  </svg>
);
