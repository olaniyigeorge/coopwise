import React from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

interface GroupOGImageProps {
  groupName: string;
  description?: string;
  rules?: Array<{title: string; description: string;}>;
  imageUrl?: string;
  memberCount?: number;
  maxMembers?: number;
  priority?: boolean;
  className?: string;
}

/**
 * Component for rendering a styled OpenGraph image for group invites
 * This creates a visually appealing card for social media sharing
 */
export const GroupOGImage: React.FC<GroupOGImageProps> = ({ 
  groupName,
  description,
  rules = [],
  imageUrl,
  memberCount = 0,
  maxMembers = 10,
  priority = false,
  className = ''
}) => {
  // Limit rules to show (to avoid overcrowding)
  const displayRules = rules?.slice(0, 2) || [];
  
  return (
    <div className={`relative w-full ${className}`}>
      <Card className="overflow-hidden border-0 shadow-lg">
        {/* Banner image at top */}
        <div className="relative w-full h-[330px]">
          <Image
            src={imageUrl || '/assets/images/OG Image_coopwise-1.png'}
            alt={groupName}
            priority={priority}
            width={1200}
            height={630}
            className="w-full h-full object-cover"
          />
          {/* Gradient overlay for text readability */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/5"></div>
          
          {/* CoopWise branding overlay */}
          <div className="absolute top-4 left-4 flex items-center">
            <Image 
              src="/images/coopwise-logo.svg" 
              alt="CoopWise"
              width={32}
              height={32}
              className="mr-2"
            />
            <span className="text-white font-semibold text-lg drop-shadow-md">CoopWise</span>
          </div>
        </div>
        
        <CardContent className="p-6 bg-white">
          <div className="mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">{groupName}</h2>
            {description && (
              <p className="text-gray-600 text-sm line-clamp-2">{description}</p>
            )}
          </div>
          
          {displayRules.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Group Rules:</h3>
              <ul className="space-y-1">
                {displayRules.map((rule, index) => (
                  <li key={index} className="text-xs text-gray-600 flex items-start">
                    <span className="inline-block w-1 h-1 rounded-full bg-primary mt-1.5 mr-2"></span>
                    <span className="line-clamp-1">{rule.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center">
              <span className="text-xs text-gray-500">
                {memberCount}/{maxMembers} Members
              </span>
            </div>
            <div className="bg-primary/10 px-3 py-1 rounded-full">
              <span className="text-xs font-medium text-primary">Join Now</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GroupOGImage; 