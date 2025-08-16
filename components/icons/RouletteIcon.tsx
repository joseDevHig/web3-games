
import React from 'react';

export const RouletteIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="w-full h-full">
    <circle cx="12" cy="12" r="10" strokeWidth="1.5"/>
    <circle cx="12" cy="12" r="6" strokeWidth="1"/>
    <circle cx="12" cy="12" r="2" fill="currentColor"/>
    {Array.from({ length: 16 }).map((_, i) => (
      <line
        key={i}
        x1="12"
        y1="12"
        x2="12"
        y2="2"
        transform={`rotate(${i * (360 / 16)}, 12, 12)`}
      />
    ))}
    <circle cx="16" cy="7" r="1" fill="white"/>
  </svg>
);
