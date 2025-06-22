import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
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
    <div key={i} className="relative w-10 h-10 -ml-2 first:ml-0 rounded-full overflow-hidden border-2 border-white">
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
      <header className="bg-white border-b shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center">
            <Image 
              src="/images/coopwise-logo.svg"
              alt="CoopWise"
              width={36}
              height={36}
              className="mr-2"
            />
            <span className="font-bold text-lg text-gray-900">CoopWise</span>
          </div>
          <div>
            <a 
              href="/auth/login" 
              className="text-sm font-medium text-primary hover:underline"
            >
              Log in
            </a>
            <a 
              href="/auth/signup" 
              className="ml-4 inline-block rounded-md bg-primary px-3.5 py-1.5 text-sm font-medium text-white hover:bg-primary/90"
            >
              Sign up
            </a>
          </div>
        </div>
      </header>
      
      <main className="flex-1 container mx-auto max-w-3xl px-4 py-8">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Group banner/header */}
          <div className="relative h-40 bg-gradient-to-r from-primary/30 to-primary/10 flex items-center justify-center">
            {groupData.image_url ? (
              <Image
                src={groupData.image_url}
                alt={groupData.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center">
                <Image 
                  src="/assets/icons/fluent_people-community-48-regular (1).svg"
                  alt="Group"
                  width={40}
                  height={40}
                />
              </div>
            )}
            {/* Gradient overlay for text readability if there's an image */}
            {groupData.image_url && (
              <div className="absolute inset-0 bg-black/20"></div>
            )}
          </div>
          
          {/* Group info */}
          <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900">{groupData.name}</h1>
            
            <div className="mt-3 flex items-center">
              <div className="flex items-center">
                {memberAvatars}
                {totalMembers > maxToShow && (
                  <div className="w-10 h-10 -ml-2 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium">
                    +{totalMembers - maxToShow}
                  </div>
                )}
              </div>
              <span className="ml-3 text-sm text-gray-600">{totalMembers} members</span>
            </div>
            
            <div className="mt-4">
              <h2 className="text-sm font-medium text-gray-900">About this group</h2>
              <p className="mt-1 text-sm text-gray-600">
                {groupData.description || "Join this savings group and save money together with others."}
              </p>
            </div>
            
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-3 rounded-md">
                <h3 className="text-xs font-medium text-gray-700">Contribution</h3>
                <p className="mt-1 text-sm font-semibold text-gray-900">
                  ₦{new Intl.NumberFormat().format(groupData.contribution_amount || 0)}
                </p>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-md">
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
                <div className="bg-gray-50 rounded-md p-4">
                  <ul className="space-y-3">
                    {groupData.rules.map((rule: any, index: number) => (
                      <li key={index} className="flex">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary mt-2 mr-2"></span>
                        <div>
                          <h4 className="text-sm font-medium text-gray-800">{rule.title}</h4>
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
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <InviteJoinHandler inviteCode={code} groupName={groupData.name} />
              
              <a 
                href="/"
                className="flex-1 inline-flex justify-center items-center rounded-md bg-white border border-gray-300 px-5 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Learn More About CoopWise
              </a>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t py-6">
        <div className="container mx-auto px-4 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} CoopWise. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
} 