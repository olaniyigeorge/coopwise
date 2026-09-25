import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import CooperativeService from '../services/cooperative-service';
import type { Cooperative, CooperativeMember } from '@/types/cooperative';

export type { Cooperative as Group };
export type { CooperativeMember as GroupMember };

interface GroupState {
  myGroups: Cooperative[];
  availableGroups: Cooperative[];
  currentGroup: Cooperative | null;
  groupMembers: CooperativeMember[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMyGroups: () => Promise<void>;
  fetchAvailableGroups: () => Promise<void>;
  fetchGroupById: (groupId: string) => Promise<void>;
  fetchGroupMembers: (groupId: string) => Promise<void>;
  clearError: () => void;
}

const useGroupStore = create<GroupState>()(
  persist(
    (set) => ({
      myGroups: [],
      availableGroups: [],
      currentGroup: null,
      groupMembers: [],
      isLoading: false,
      error: null,

      fetchMyGroups: async () => {
        set({ isLoading: true, error: null });
        try {
          const groups = await CooperativeService.listMyCooperatives();
          set({ myGroups: groups, isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch your cooperatives',
            isLoading: false
          });
        }
      },

      fetchAvailableGroups: async () => {
        set({ isLoading: true, error: null });
        try {
          const groups = await CooperativeService.listCooperatives();
          set({ availableGroups: groups, isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch available cooperatives',
            isLoading: false
          });
        }
      },

      fetchGroupById: async (groupId: string) => {
        set({ isLoading: true, error: null });
        try {
          const group = await CooperativeService.getCooperative(groupId);
          set({ currentGroup: group, isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch cooperative details',
            isLoading: false
          });
        }
      },

      fetchGroupMembers: async (groupId: string) => {
        set({ isLoading: true, error: null });
        try {
          const members = await CooperativeService.getCooperativeMembers(groupId);
          set({ groupMembers: members, isLoading: false });
        } catch (error: any) {
          set({
            error: error.message || 'Failed to fetch cooperative members',
            isLoading: false
          });
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
