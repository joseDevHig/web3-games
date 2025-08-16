
import React from 'react';

export const PokerIcon: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
    <g transform="rotate(-20 12 12) translate(-2, 0)">
      <rect x="4" y="5" width="8" height="12" rx="1" fill="white" stroke="black" strokeWidth="0.5"/>
      <text x="5" y="15" fontSize="2" fill="red" fontWeight="bold">A♥</text>
    </g>
     <g transform="rotate(-10 12 12) translate(-1, 0)">
      <rect x="6" y="5" width="8" height="12" rx="1" fill="white" stroke="black" strokeWidth="0.5"/>
      <text x="7" y="15" fontSize="2" fill="red" fontWeight="bold">K♥</text>
    </g>
    <g transform="rotate(0 12 12)">
      <rect x="8" y="5" width="8" height="12" rx="1" fill="white" stroke="black" strokeWidth="0.5"/>
      <text x="9" y="15" fontSize="2" fill="red" fontWeight="bold">Q♥</text>
    </g>
     <g transform="rotate(10 12 12) translate(1, 0)">
      <rect x="10" y="5" width="8" height="12" rx="1" fill="white" stroke="black" strokeWidth="0.5"/>
      <text x="11" y="15" fontSize="2" fill="red" fontWeight="bold">J♥</text>
    </g>
     <g transform="rotate(20 12 12) translate(2, 0)">
      <rect x="12" y="5" width="8" height="12" rx="1" fill="white" stroke="black" strokeWidth="0.5"/>
      <text x="12.5" y="15" fontSize="2" fill="red" fontWeight="bold">10♥</text>
    </g>
  </svg>
);
