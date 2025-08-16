import React from 'react';

export const DominoIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <g transform="rotate(-25 12 12)">
      <rect x="4" y="8" width="8" height="12" rx="1.5" fill="white" stroke="black" strokeWidth="0.5" />
      <line x1="4" y1="14" x2="12" y2="14" stroke="black" strokeWidth="0.5" />
      {/* Top part: 3 dots */}
      <circle cx="6" cy="11" r="0.8" fill="black" />
      <circle cx="8" cy="11" r="0.8" fill="black" />
      <circle cx="10" cy="11" r="0.8" fill="black" />
      {/* Bottom part: 3 dots */}
      <circle cx="6" cy="17" r="0.8" fill="black" />
      <circle cx="8" cy="17" r="0.8" fill="black" />
      <circle cx="10" cy="17" r="0.8" fill="black" />
    </g>
    <g transform="rotate(15 12 12)">
      <rect x="11" y="5" width="8" height="12" rx="1.5" fill="white" stroke="black" strokeWidth="0.5" />
      <line x1="11" y1="11" x2="19" y2="11" stroke="black" strokeWidth="0.5" />
      {/* Top part: 2 dots */}
      <circle cx="13" cy="8" r="0.8" fill="black" />
      <circle cx="17" cy="8" r="0.8" fill="black" />
      {/* Bottom part: 1 dot */}
      <circle cx="15" cy="14" r="0.8" fill="black" />
    </g>
  </svg>
);
