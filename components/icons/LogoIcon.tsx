import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
    <rect width="100" height="100" rx="24" fill="#2563EB"/>
    <path d="M50 28V72" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M28 50H42L48 40L52 60L58 50H72" stroke="white" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
