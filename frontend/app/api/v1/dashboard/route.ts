import { NextRequest, NextResponse } from 'next/server';

// Define interfaces for the activity and insight objects
interface Activity {
  id?: string;
  type?: string;
  description?: string;
  created_at?: string;
  amount?: number;
  status?: string;
}

interface Insight {
  title?: string;
  description?: string;
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header is required' },
        { status: 401 }
      );
    }

    // Call the real API endpoint
    const response = await fetch('https://coopwise.onrender.com/api/v1/dashboard/', {
      method: 'GET',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    });

    // Get response as text first to handle potential JSON parsing errors
    const responseText = await response.text();
    console.log(`Dashboard API response status: ${response.status}`);
    
    let data;
    try {
      // Try to parse the response as JSON
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error('Error parsing JSON response:', e);
      // If parsing fails, return the raw text
      return NextResponse.json(
        { error: 'Invalid response from server', raw_response: responseText },
        { status: 500 }
      );
    }

    // If request was not successful, pass through the error
    if (!response.ok) {
      console.error('Dashboard API error response:', data);
      return NextResponse.json(data, { status: response.status });
    }

    // Keep the groups data from the API response
    const groups = {
      user_groups: data.groups?.user_groups || [],
      suggested_groups: data.groups?.suggested_groups || []
    };

    // Transform the API data to match our frontend structure
    const transformedData = {
      // Use the savings data from the API if available, or create default structure
      savings: data.savings || {
        total: data.summary?.your_savings || 0,
        goal: data.targets?.savings_target || 0,
        progress: data.summary?.your_savings && data.targets?.savings_target 
          ? Math.round((data.summary.your_savings / data.targets.savings_target) * 100) 
          : 0
      },
      
      // Wallet data
      wallet: data.wallet || {
        balance: 0
      },
      
      // Next contribution data
      nextContribution: data.nextContribution || {
        groupName: data.summary?.next_contribution?.group_name || '',
        amount: data.summary?.next_contribution?.amount || 0,
        dueDate: data.summary?.next_contribution?.due_date || '',
        hasUpcoming: data.summary?.next_contribution !== null
      },
      
      // Next payout data
      nextPayout: data.nextPayout || {
        groupName: data.summary?.next_payout?.group_name || '',
        amount: data.summary?.next_payout?.amount || 0,
        dueDate: data.summary?.next_payout?.due_date || '',
        hasUpcoming: data.summary?.next_payout !== null
      },
      
      // Recent activity data
      recentActivity: data.recentActivity || data.activities?.map((activity: Activity) => ({
        id: activity.id || String(Math.random()),
        type: activity.type || 'Activity',
        description: activity.description || '',
        date: activity.created_at || new Date().toISOString(),
        amount: activity.amount || undefined,
        status: activity.status || undefined
      })) || [],
      
      // Savings goal data
      savingsGoal: data.savingsGoal || {
        name: data.user?.savings_purpose || 'Default Goal',
        current: data.summary?.your_savings || 0,
        target: data.targets?.savings_target || 0,
        progress: data.summary?.your_savings && data.targets?.savings_target 
          ? Math.round((data.summary.your_savings / data.targets.savings_target) * 100) 
          : 0,
        remaining: data.targets?.savings_target 
          ? data.targets.savings_target - (data.summary?.your_savings || 0) 
          : 0
      },
      
      // AI insights data
      aiInsights: data.aiInsights || {
        available: data.ai_insights && data.ai_insights.length > 0,
        insights: data.ai_insights?.map((insight: Insight) => ({
          title: insight.title || 'Insight',
          description: insight.description || ''
        })) || []
      },
      
      // Include the original groups data
      groups
    };

    // Return the transformed data
    return NextResponse.json(transformedData);
  } catch (error) {
    console.error('Dashboard API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 