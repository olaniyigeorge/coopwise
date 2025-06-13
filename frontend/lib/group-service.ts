import axios from 'axios';
import AuthService from './auth-service';

// Define API endpoints using proxy routes
const GROUP_ENDPOINTS = {
  LIST: '/api/groups',
  MY_GROUPS: '/api/groups/me',
  CREATE: '/api/groups/create',
  DETAILS: (id: string) => `/api/groups/${id}`,
  EXT_DETAILS: (id: string) => `/api/groups/ext/${id}`,
  JOIN: (id: string) => `/api/groups/${id}/join`,
  VERIFY_INVITE: '/api/memberships/invite',
  ACCEPT_INVITE: '/api/memberships/accept-invite',
  MEMBERS: (id: string) => `/api/groups/${id}/members`,
  INVITE: '/api/memberships/invite',
};

// Define types
export interface Group {
  id: string;
  name: string;
  creator_id: string;
  description: string;
  contribution_amount: number;
  contribution_frequency: string;
  payout_strategy: string;
  coop_model: string;
  max_members: number;
  target_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  // UI specific properties
  memberCount?: number;
}

// Define types for group creation
export interface GroupCreateData {
  name: string;
  creator_id: string;
  description?: string;
  contribution_amount: number;
  contribution_frequency: string;
  payout_strategy?: string;
  coop_model?: string;
  max_members: number;
  target_amount?: number;
  status?: string;
  rules?: { title: string; description: string; }[];
}

// Define types for group details
export interface GroupDetails extends Group {
  members?: any[];
  contributions?: any[];
  rules?: string[];
}

export interface GroupMember {
  id: string;
  user_id: string;
  group_id: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Populated fields
  user?: {
    id: string;
    full_name: string;
    email: string;
    phone_number: string;
  };
}

// Group service
const GroupService = {
  // Get all available groups (discovery)
  async getGroups() {
    try {
      const response = await axios.get(GROUP_ENDPOINTS.LIST, {
        headers: AuthService.getAuthHeader()
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching groups:', error);
      return []; // Return empty array instead of throwing to prevent UI breaks
    }
  },
  
  // Get user's groups
  async getMyGroups() {
    try {
      const response = await axios.get(GROUP_ENDPOINTS.MY_GROUPS, {
        headers: AuthService.getAuthHeader()
      });
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching my groups:', error);
      return []; // Return empty array instead of throwing to prevent UI breaks
    }
  },
  
  // Get group details
  async getGroupDetails(id: string) {
    try {
      const response = await axios.get(GROUP_ENDPOINTS.DETAILS(id), {
        headers: AuthService.getAuthHeader()
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error fetching group ${id}:`, error);
      return null;
    }
  },

  async getGroupExtDetails(id: string) {
    try {
      const response = await axios.get(GROUP_ENDPOINTS.EXT_DETAILS(id), {
        headers: AuthService.getAuthHeader()
      });
      return response.data;
    } catch (error) {
      console.error(`Error fetching extended group data ${id}:`, error);
      return null;
    }
  },
  
  // Create a new group
  async createGroup(data: GroupCreateData) {
    try {
      console.log('Creating new group:', data);
      
      // Make sure we're only sending fields that the API expects
      const cleanedData = {
        name: data.name,
        creator_id: data.creator_id,
        description: data.description || "",
        contribution_amount: data.contribution_amount,
        contribution_frequency: data.contribution_frequency,
        payout_strategy: data.payout_strategy || "rotating",
        coop_model: data.coop_model || "ajo",
        max_members: data.max_members,
        target_amount: data.target_amount || 0,
        status: data.status || "active",
        // Explicitly not including rules as they cause 422 errors
        rules: data.rules || null
      };
      
      console.log('Cleaned data for API:', cleanedData);

      const response = await axios.post(GROUP_ENDPOINTS.CREATE, cleanedData, {
        headers: {
          ...AuthService.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Group creation response:', response.data);
      
      // Immediately fetch updated groups list to refresh the UI
      await this.getMyGroups();
      
      return response.data;
    } catch (error: any) {
      console.error('Error creating group:', error);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  },
  
  // Join a group
  async joinGroup(groupId: string, data: any = {}) {
    try {
      const response = await axios.post(GROUP_ENDPOINTS.JOIN(groupId), data, {
        headers: {
          ...AuthService.getAuthHeader(),
          'Content-Type': 'application/json'
        }
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error joining group ${groupId}:`, error);
      throw error;
    }
  },

  // Verify an invite code (first step of joining a group)
  async verifyInviteCode(inviteCode: string) {
    try {
      console.log('Verifying invite code:', inviteCode);
      
      const response = await axios.get(`${GROUP_ENDPOINTS.VERIFY_INVITE}?invite_code=${inviteCode}`, {
        headers: AuthService.getAuthHeader()
      });
      
      console.log('Invite code verification response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Error verifying invite code:', error);
      console.error('Response data:', error.response?.data);
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to verify invite code';
      
      throw new Error(errorMessage);
    }
  },
  
  // Accept an invite code (second step of joining a group)
  async acceptInviteCode(inviteCode: string) {
    try {
      console.log('Accepting invite code:', inviteCode);
      
      const response = await axios.post(GROUP_ENDPOINTS.ACCEPT_INVITE, 
        { invite_code: inviteCode },
        {
          headers: {
            ...AuthService.getAuthHeader(),
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('Invite code acceptance response:', response.data);
      
      return response.data;
    } catch (error: any) {
      console.error('Error accepting invite code:', error);
      console.error('Response data:', error.response?.data);
      
      // Show more detailed error message
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          'Failed to accept invite code';
      
      throw new Error(errorMessage);
    }
  },

  // Methods added for Zustand store integration
  
  // Get available groups (alias for getGroups for better naming in Zustand)
  async getAvailableGroups() {
    return this.getGroups();
  },
  
  // Get group by ID (alias for getGroupDetails for better naming in Zustand)
  async getGroupById(id: string) {
    return this.getGroupDetails(id);
  },
  
  // Get user's groups (alias for getMyGroups for better naming in Zustand)
  async getUserGroups() {
    return this.getMyGroups();
  },
  
  // Get members of a group
  async getGroupMembers(groupId: string) {
    try {
      const response = await axios.get(GROUP_ENDPOINTS.MEMBERS(groupId), {
        headers: AuthService.getAuthHeader()
      });
      
      return response.data || [];
    } catch (error) {
      console.error(`Error fetching members for group ${groupId}:`, error);
      return []; // Return empty array instead of throwing to prevent UI breaks
    }
  },
  
  // Generate invite code for a group
  async generateInviteCode(groupId: string) {
    try {
      const response = await axios.get(`${GROUP_ENDPOINTS.INVITE}?group_id=${groupId}`, {
        headers: AuthService.getAuthHeader()
      });
      
      return response.data.invite_code || response.data.code || '';
    } catch (error) {
      console.error(`Error generating invite code for group ${groupId}:`, error);
      throw error;
    }
  },
  
  // // Join a group with invite code
  // async joinGroup(inviteCode: string) {
  //   try {
  //     // First verify the invite code
  //     const verification = await this.verifyInviteCode(inviteCode);
      
  //     // Then accept the invite
  //     const result = await this.acceptInviteCode(inviteCode);
      
  //     return result;
  //   } catch (error) {
  //     console.error(`Error joining group with invite code:`, error);
  //     throw error;
  //   }
  // }
};

export default GroupService; 