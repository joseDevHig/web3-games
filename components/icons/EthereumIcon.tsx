
import React from 'react';

export const EthereumIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M12 2L11.5 3.5L12 4L12.5 3.5L12 2Z" fill="#343434"/>
    <path d="M12 9.5L11.5 11L12 14L12.5 11L12 9.5Z" fill="#343434"/>
    <path d="M12 15L11.5 16.5L12 22L12.5 16.5L12 15Z" fill="#343434"/>
    <path d="M12 2L5 11L12 14L12 2Z" fill="#8C8C8C"/>
    <path d="M12 2L19 11L12 14L12 2Z" fill="#3C3C3B"/>
    <path d="M12 15L5 12L12 22L12 15Z" fill="#8C8C8C"/>
    <path d="M12 15L19 12L12 22L12 15Z" fill="#3C3C3B"/>
    <path d="M5 11L12 14L19 11L12 9.5L5 11Z" fill="#141414"/>
  </svg>
);
