import React from 'react';
import { useIsMobile } from '@/hooks/use-mobile';
import AdUnit from './AdUnit';

interface AdBannerProps {
  position: 'header' | 'footer' | 'sidebar' | 'between-content';
  className?: string;
}

const AdBanner: React.FC<AdBannerProps> = ({ position, className = '' }) => {
  const isMobile = useIsMobile();

  const getAdConfig = () => {
    switch (position) {
      case 'header':
        return {
          slot: '1234567890',
          format: 'horizontal' as const,
          className: `mb-4 ${className}`
        };
      case 'sidebar':
        return {
          slot: '1234567891', 
          format: isMobile ? ('rectangle' as const) : ('vertical' as const),
          className: `${className}`
        };
      case 'footer':
        return {
          slot: '1234567892',
          format: 'horizontal' as const, 
          className: `mt-4 ${className}`
        };
      case 'between-content':
        return {
          slot: '1234567893',
          format: 'rectangle' as const,
          className: `my-6 ${className}`
        };
      default:
        return {
          slot: '1234567890',
          format: 'rectangle' as const,
          className: className
        };
    }
  };

  const config = getAdConfig();

  return (
    <div className={`flex justify-center ${config.className}`}>
      <AdUnit
        slot={config.slot}
        format={config.format}
        className="glass-card rounded-lg p-2"
      />
    </div>
  );
};

export default AdBanner;