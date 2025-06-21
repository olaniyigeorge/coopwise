/**
 * Helper functions for generating Open Graph metadata for different pages
 */

/**
 * Generates Open Graph metadata for pages
 */
export function generateOpenGraphMetadata({
  title = 'CoopWise | Smart Cooperative Savings Groups',
  description = 'Join CoopWise to create, manage, and grow your savings groups. Track contributions, schedule payouts, and build wealth together.',
  imagePath = '/assets/images/OG Image_coopwise-1.png',
  url = '',
}: {
  title?: string;
  description?: string;
  imagePath?: string;
  url?: string;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://coopwise-seven.vercel.app';
  
  return {
    title,
    description,
    url: url ? `${baseUrl}${url}` : baseUrl,
    siteName: 'CoopWise',
    images: [
      {
        url: imagePath,
        width: 1200,
        height: 630,
        alt: title,
      },
    ],
    locale: 'en_US',
    type: 'website',
  };
}

/**
 * Generates Twitter card metadata for pages
 */
export function generateTwitterMetadata({
  title = 'CoopWise | Smart Cooperative Savings Groups',
  description = 'Join CoopWise to create, manage, and grow your savings groups.',
  imagePath = '/assets/images/OG Image_coopwise-1.png',
}: {
  title?: string;
  description?: string;
  imagePath?: string;
}) {
  return {
    card: 'summary_large_image',
    title,
    description,
    images: [imagePath],
    creator: '@coopwise',
  };
} 