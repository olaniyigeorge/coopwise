import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { generateOpenGraphMetadata, generateTwitterMetadata } from '@/lib/og-helpers'

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
        // No auth header needed for invite link preview
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

// Main page component - this just redirects to the join page with the code
export default async function InviteRedirectPage({ params }: { params: { code: string } }) {
  // Get the referer header to check if this is a bot or social media crawler
  const headersList = headers()
  const userAgent = headersList.get('user-agent') || ''
  const isBot = /bot|crawler|spider|pinterest|facebook|twitter|linkedin/i.test(userAgent)
  
  // For bots/crawlers, show a preview page with group details
  if (isBot) {
    const groupData = await getGroupByInviteCode(params.code)
    
    if (!groupData) {
      notFound()
    }
    
    return (
      <div className="max-w-2xl mx-auto p-6">
        <h1 className="text-2xl font-bold">Join {groupData.name} on CoopWise</h1>
        <p className="my-4">{groupData.description}</p>
        
        {groupData.rules && Array.isArray(groupData.rules) && groupData.rules.length > 0 && (
          <div className="mt-4">
            <h2 className="text-lg font-semibold">Group Rules</h2>
            <ul className="list-disc pl-5 mt-2">
              {groupData.rules.map((rule: any, index: number) => (
                <li key={index}>{rule.title} - {rule.description}</li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="mt-6">
          <p>Open this link on your mobile device or computer to join this group.</p>
        </div>
      </div>
    )
  }

  // For real users, redirect to the join page
  return {
    redirect: {
      destination: `/dashboard/join-group?code=${params.code}`,
      permanent: false,
    },
  }
} 