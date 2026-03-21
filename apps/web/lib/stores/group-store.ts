import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import GroupService from '../group-service';

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
  // UI-specific fields
  memberCount?: number;
  totalSaved?: number;
  progress?: number;
  nextContribution?: {
    amount: number;
    dueDate: string;
    daysLeft: number;
  };
  nextPayout?: {
    amount: number;
    recipient: string;
    date: string;
  };
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

interface GroupState {
  myGroups: Group[];
  availableGroups: Group[];
  currentGroup: Group | null;
  groupMembers: GroupMember[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchMyGroups: () => Promise<void>;
  fetchAvailableGroups: () => Promise<void>;
  fetchGroupById: (groupId: string) => Promise<void>;
  fetchGroupMembers: (groupId: string) => Promise<void>;
  createGroup: (groupData: Partial<Group>) => Promise<Group>;
  joinGroup: (inviteCode: string) => Promise<void>;
  generateInviteCode: (groupId: string) => Promise<string>;
  clearError: () => void;
}

const useGroupStore = create<GroupState>()(
  persist(
    (set, get) => ({
      myGroups: [],
      availableGroups: [],
      currentGroup: null,
      groupMembers: [],
      isLoading: false,
      error: null,
      
      fetchMyGroups: async () => {
        set({ isLoading: true, error: null });
        try {
          const groups = await GroupService.getUserGroups();
          set({ myGroups: groups, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch your groups', 
            isLoading: false 
          });
        }
      },
      
      fetchAvailableGroups: async () => {
        set({ isLoading: true, error: null });
        try {
          const groups = await GroupService.getAvailableGroups();
          set({ availableGroups: groups, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch available groups', 
            isLoading: false 
          });
        }
      },
      
      fetchGroupById: async (groupId: string) => {
        set({ isLoading: true, error: null });
        try {
          const group = await GroupService.getGroupById(groupId);
          set({ currentGroup: group, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch group details', 
            isLoading: false 
          });
        }
      },
      
      fetchGroupMembers: async (groupId: string) => {
        set({ isLoading: true, error: null });
        try {
          const members = await GroupService.getGroupMembers(groupId);
          set({ groupMembers: members, isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to fetch group members', 
            isLoading: false 
          });
        }
      },
      
      createGroup: async (groupData: Partial<Group>) => {
        set({ isLoading: true, error: null });
        try {
          const newGroup = await GroupService.createGroup(groupData);
          set(state => ({ 
            myGroups: [...state.myGroups, newGroup],
            currentGroup: newGroup,
            isLoading: false 
          }));
          return newGroup;
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to create group', 
            isLoading: false 
          });
          throw error;
        }
      },
      
      joinGroup: async (inviteCode: string) => {
        set({ isLoading: true, error: null });
        try {
          await GroupService.joinGroup(inviteCode);
          // Refresh my groups after joining
          await get().fetchMyGroups();
          set({ isLoading: false });
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to join group', 
            isLoading: false 
          });
          throw error;
        }
      },
      
      generateInviteCode: async (groupId: string) => {
        set({ isLoading: true, error: null });
        try {
          const inviteCode = await GroupService.generateInviteCode(groupId);
          set({ isLoading: false });
          return inviteCode;
        } catch (error: any) {
          set({ 
            error: error.message || 'Failed to generate invite code', 
            isLoading: false 
          });
          throw error;
        }
      },
      
      clearError: () => set({ error: null })
    }),
    {
      name: 'group-storage',
      // Only store basic group data for performance
      partialize: (state) => ({ 
        myGroups: state.myGroups,
        currentGroup: state.currentGroup
      }),
    }
  )
);

export default useGroupStore; 