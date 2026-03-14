import { memo } from 'react';

const Icon = memo(({ path, className }) => (
  <svg 
    className={className}
    fill="none" 
    stroke="currentColor" 
    viewBox="0 0 24 24"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d={path} 
    />
  </svg>
));

export default Icon;