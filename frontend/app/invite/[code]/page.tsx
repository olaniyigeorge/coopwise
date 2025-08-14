import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { generateOpenGraphMetadata, generateTwitterMetadata } from '@/lib/og-helpers'
import PublicGroupPreview from '@/components/invite/public-group-preview'

// This function generates metadata for the page
export async function generateMetadata({ params }: { params: Promise<{ code: string }> }): Promise<Metadata> {
  // Fetch data for the group based on the invite code
  const { code } = await params
  const groupData = await getPublicGroupInfo(code)
  
  // If no group is found, return default metadata
  if (!groupData || !groupData.exists) {
    return {
      title: 'Join Group | CoopWise',
      description: 'Join a savings group on CoopWise',
    }
  }

  // Group name and formatted description for social sharing
  const title = groupData.name 
    ? `Join ${groupData.name} on CoopWise`
    : 'Join a Savings Group on CoopWise'
  
  const description = groupData.description || 
    `Join this savings group and save money together with others. ${groupData.name || 'This group'} is looking for new members!`
  
  // Show some rules in the description if available
  let rulesPreview = ''
  if (groupData.rules && Array.isArray(groupData.rules) && groupData.rules.length > 0) {
    const rulesToShow = groupData.rules.slice(0, 2) // Just show first 2 rules
    rulesPreview = rulesToShow.map((rule: any) => `• ${rule.title}`).join(' ')
    
    if (rulesPreview) {
      rulesPreview = `\nGroup rules include: ${rulesPreview}`
    }
  }
  
  // Combine description with rules preview
  const fullDescription = `${description}${rulesPreview}`
  
  // Get image URL - use group image if available or default
  const imageUrl = groupData.image_url || '/assets/images/OG Image_coopwise-1.png'

  return {
    title,
    description: fullDescription,
    openGraph: generateOpenGraphMetadata({
      title,
      description: fullDescription,
      imagePath: imageUrl,
      url: `/invite/${code}`
    }),
    twitter: generateTwitterMetadata({
      title,
      description: fullDescription,
      imagePath: imageUrl
    })
  }
}

// Helper function to fetch public group information by invite code
async function getPublicGroupInfo(code: string) {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/groups/public/invite/${code}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      next: { revalidate: 60 } // Cache for 1 minute
    })

    if (!res.ok) {
      return null
    }

    const data = await res.json()
    return data
  } catch (error) {
    console.error('Error fetching public group info:', error)
    return null
  }
}

export default async function InvitePage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params
  const groupData = await getPublicGroupInfo(code)
  
  // Return 404 if group not found
  if (!groupData || !groupData.exists) {
    notFound()
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header with logo */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 sm:py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image 
              src="/images/coopwise-logo.svg"
              alt="CoopWise"
              width={32}
              height={32}
              className="mr-2"
              priority
            />
            <span className="font-bold text-lg text-gray-900">CoopWise</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <a 
              href="/auth/login" 
              className="text-sm font-medium text-primary hover:underline"
            >
              Log in
            </a>
            <a 
              href="/auth/signup" 
              className="inline-block rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-primary/90 transition"
            >
              Sign up
            </a>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto max-w-3xl px-4 py-6 sm:py-8 overflow-hidden">
        {/* Show public group preview for unauthenticated users */}
        <PublicGroupPreview inviteCode={code} groupData={groupData} />
        
        {/* Additional info card */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-4 sm:p-6 border-l-4 border-primary">
          <h2 className="text-sm sm:text-base font-semibold text-gray-900 mb-2">Why join a savings group?</h2>
          <p className="text-xs sm:text-sm text-gray-600">
            Cooperative savings groups help you save money more effectively through structured group contributions 
            and commitment. Join this group to start building wealth together with others.
          </p>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t py-4 sm:py-6 mt-6">
        <div className="container mx-auto px-4 text-center text-xs sm:text-sm text-gray-600">
          <p>© {new Date().getFullYear()} CoopWise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
} 