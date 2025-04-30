import React from 'react';

export const BronzeBadge = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="#cd7f32" />
    <circle cx="50" cy="50" r="35" fill="#cd7f32" stroke="#e0a466" strokeWidth="3" />
    <path d="M50 15 L55 30 L70 30 L60 40 L65 55 L50 45 L35 55 L40 40 L30 30 L45 30 Z" fill="#ffcc80" />
  </svg>
);

export const SilverBadge = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="#c0c0c0" />
    <circle cx="50" cy="50" r="35" fill="#c0c0c0" stroke="#d8d8d8" strokeWidth="3" />
    <path d="M50 15 L55 30 L70 30 L60 40 L65 55 L50 45 L35 55 L40 40 L30 30 L45 30 Z" fill="#f5f5f5" />
  </svg>
);

export const GoldBadge = ({ size = 40 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="40" fill="#ffd700" />
    <circle cx="50" cy="50" r="35" fill="#ffd700" stroke="#ffeb3b" strokeWidth="3" />
    <path d="M50 15 L55 30 L70 30 L60 40 L65 55 L50 45 L35 55 L40 40 L30 30 L45 30 Z" fill="#fff59d" />
  </svg>
);