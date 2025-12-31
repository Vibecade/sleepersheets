import React, { useEffect, useRef, useState } from 'react';
import { useIsMobile } from '@/hooks/use-mobile';

interface AdUnitProps {
  slot: string;
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  className?: string;
  responsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

const AdUnit: React.FC<AdUnitProps> = ({ 
  slot, 
  format = 'auto', 
  className = '',
  responsive = true 
}) => {
  const adRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  const [isAdSenseAvailable, setIsAdSenseAvailable] = useState(false);

  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle && Array.isArray(window.adsbygoogle)) {
        setIsAdSenseAvailable(true);
        window.adsbygoogle.push({});
      }
    } catch (error) {
      console.error('AdSense error:', error);
      setIsAdSenseAvailable(false);
    }
  }, []);

  // Don't render anything if AdSense isn't configured
  if (!isAdSenseAvailable) {
    return null;
  }

  const getAdSize = () => {
    if (!responsive) return {};
    
    if (isMobile) {
      switch (format) {
        case 'rectangle':
          return { width: 300, height: 250 };
        case 'horizontal':
          return { width: 320, height: 100 };
        default:
          return { width: 320, height: 50 };
      }
    } else {
      switch (format) {
        case 'rectangle':
          return { width: 300, height: 250 };
        case 'vertical':
          return { width: 160, height: 600 };
        case 'horizontal':
          return { width: 728, height: 90 };
        default:
          return { width: 728, height: 90 };
      }
    }
  };

  const adSize = getAdSize();

  return (
    <div className={`ad-container ${className}`} ref={adRef}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          ...adSize
        }}
        data-ad-client="ca-pub-5433071234567890"
        data-ad-slot={slot}
        data-ad-format={responsive ? 'auto' : undefined}
        data-full-width-responsive={responsive ? 'true' : 'false'}
      />
    </div>
  );
};

export default AdUnit;