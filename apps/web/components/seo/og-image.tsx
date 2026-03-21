import React from 'react';
import Image from 'next/image';

interface OGImageProps {
  priority?: boolean;
  className?: string;
}

/**
 * Component for rendering the Open Graph image with optimized loading
 * This component can be used directly in pages that need to show the OG image visibly
 */
export const OGImage: React.FC<OGImageProps> = ({ 
  priority = false,
  className = ''
}) => {
  return (
    <div className={`relative w-full ${className}`}>
      <Image
        src="/assets/images/OG Image_coopwise-1.png"
        alt="CoopWise - Save Money Together, The Smarter Way"
        priority={priority}
        width={1200}
        height={630}
        className="w-full h-auto object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        quality={90}
      />
    </div>
  );
};

export default OGImage; 