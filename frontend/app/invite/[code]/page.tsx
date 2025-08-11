import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { generateOpenGraphMetadata, generateTwitterMetadata } from '@/lib/og-helpers'
import InviteJoinHandler from '@/components/invite-join-handler'

// API base URL
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://coopwise.onrender.com'

// This function generates metadata for the page
export async function generateMetadata({ params }: { params: { code: string } }): Promise<Metadata> {
  // Fetch data for the group based on the invite code
  const groupData = await getGroupByInviteCode(params.code)
  
  // If no group is found, return default metadata
  if (!groupData) {
    return {
      title: 'Join Group | CoopWise',
      description: 'Join a savings group on CoopWise',
    }
  }

  // Group name and formatted description for social sharing
  const title = `Join ${groupData.name} on CoopWise`
  const description = groupData.description || 
    `Join this savings group and save money together with others. ${groupData.name} is looking for new members!`
  
  // Show some rules in the description if available
  let rulesPreview = ''
  if (groupData.rules && Array.isArray(groupData.rules) && groupData.rules.length > 0) {
    const rulesToShow = groupData.rules.slice(0, 2) // Just show first 2 rules
    rulesPreview = rulesToShow.map(rule => `• ${rule.title}`).join(' ')
    
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
      url: `/invite/${params.code}`
    }),
    twitter: generateTwitterMetadata({
      title,
      description: fullDescription,
      imagePath: imageUrl
    })
  }
}

// Helper function to fetch group details by invite code
async function getGroupByInviteCode(code: string) {
  try {
    const res = await fetch(`${API_URL}/api/v1/memberships/invite?invite_code=${code}`, {
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
    return data.group || null
  } catch (error) {
    console.error('Error fetching group by invite code:', error)
    return null
  }
}

export default async function InvitePage({ params }: { params: { code: string } }) {
  const code = params.code
  const groupData = await getGroupByInviteCode(code)
  
  // Return 404 if group not found
  if (!groupData) {
    notFound()
  }
  
  // Calculate member counts
  const totalMembers = groupData.memberCount || Math.floor(Math.random() * 8) + 1
  const maxToShow = 5
  
  // Fill with placeholder avatars for preview
  const memberAvatars = Array.from({ length: Math.min(totalMembers, maxToShow) }).map((_, i) => (
    <div key={i} className="relative w-8 h-8 sm:w-10 sm:h-10 -ml-1.5 sm:-ml-2 first:ml-0 rounded-full overflow-hidden border-2 border-white">
      <Image 
        src="/placeholder-user.jpg" 
        alt="Member"
        width={40}
        height={40}
        className="object-cover w-full h-full"
      />
    </div>
  ))
  
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
      
      <main className="flex-1 container mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden transition-all transform hover:shadow-md">
          {/* Group banner/header */}
          <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-r from-primary/30 to-primary/10 flex items-center justify-center">
            {groupData.image_url ? (
              <Image
                src={groupData.image_url}
                alt={groupData.name}
                fill
                className="object-cover"
                priority
              />
            ) : (
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white flex items-center justify-center">
                <Image 
                  src="/assets/icons/fluent_people-community-48-regular (1).svg"
                  alt="Group"
                  width={32}
                  height={32}
                  className="sm:w-10 sm:h-10"
                />
              </div>
            )}
            {/* Gradient overlay for text readability if there's an image */}
            {groupData.image_url && (
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40"></div>
            )}
            
            {/* Group name overlay on mobile */}
            <div className="absolute bottom-0 left-0 right-0 p-4 sm:hidden">
              <h1 className="text-xl font-bold text-white drop-shadow-sm">{groupData.name}</h1>
            </div>
          </div>
          
          {/* Group info */}
          <div className="p-4 sm:p-6">
            {/* Hide on mobile as we show it in the banner */}
            <h1 className="hidden sm:block text-2xl font-bold text-gray-900">{groupData.name}</h1>
            
            <div className="mt-3 flex items-center">
              <div className="flex items-center">
                {memberAvatars}
                {totalMembers > maxToShow && (
                  <div className="w-8 h-8 sm:w-10 sm:h-10 -ml-1.5 sm:-ml-2 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                    +{totalMembers - maxToShow}
                  </div>
                )}
              </div>
              <span className="ml-3 text-xs sm:text-sm text-gray-600">{totalMembers} members</span>
            </div>
            
            <div className="mt-4">
              <h2 className="text-sm font-medium text-gray-900">About this group</h2>
              <p className="mt-1 text-xs sm:text-sm text-gray-600">
                {groupData.description || "Join this savings group and save money together with others."}
              </p>
            </div>
            
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                <h3 className="text-xs font-medium text-gray-700">Contribution</h3>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  ₦{new Intl.NumberFormat().format(groupData.contribution_amount || 0)}
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                <h3 className="text-xs font-medium text-gray-700">Frequency</h3>
                <p className="mt-1 text-sm font-semibold text-gray-900 capitalize">
                  {groupData.contribution_frequency?.toLowerCase() || "Monthly"}
                </p>
              </div>
            </div>
            
            {/* Group rules */}
            {groupData.rules && groupData.rules.length > 0 && (
              <div className="mt-6">
                <h2 className="text-sm font-medium text-gray-900 mb-3">Group Rules</h2>
                <div className="bg-gray-50 rounded-md p-3 sm:p-4 border border-gray-100">
                  <ul className="space-y-2 sm:space-y-3">
                    {groupData.rules.map((rule: any, index: number) => (
                      <li key={index} className="flex">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-2"></span>
                        <div>
                          <h4 className="text-xs sm:text-sm font-medium text-gray-800">{rule.title}</h4>
                          {rule.description && (
                            <p className="text-xs text-gray-600 mt-0.5">{rule.description}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
            
            {/* CTA buttons */}
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-3">
              <InviteJoinHandler inviteCode={code} groupName={groupData.name} />
              
              <Link 
                href="/"
                className="flex-1 inline-flex justify-center items-center rounded-md bg-white border border-gray-300 px-4 sm:px-5 py-2.5 sm:py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Learn More About CoopWise
              </Link>
            </div>
          </div>
        </div>
        
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