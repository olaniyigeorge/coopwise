"use client"

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2, Share, Check, Copy, Info } from 'lucide-react'
import CooperativeService from '@/services/cooperative-service'
import { toast } from '@/components/ui/use-toast'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import type { Cooperative, CooperativeMember } from '@/types/cooperative'
import Link from 'next/link'

interface GroupDetailsViewProps {
  groupId: string
}

// Cooperative Header Component
const GroupHeader = ({ name, description, groupId }: { name: string; description: string; groupId: string }) => {
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteCode, setInviteCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const generateInviteCode = async () => {
    try {
      setIsLoading(true);
      const data = await CooperativeService.generateInviteCode(groupId);
      setInviteCode(data.invite_code || "");
      setShowInviteDialog(true);
    } catch (error) {
      console.error('Error generating invite code:', error);
      toast({
        title: "Error",
        description: "Failed to generate invite code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async () => {
    try {
      const shareableUrl = `${window.location.origin}/invite/${inviteCode}`;
      await navigator.clipboard.writeText(shareableUrl);

      toast({
        title: "Link copied!",
        description: "Cooperative invite link copied to clipboard",
        duration: 2000,
      });

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  return (
    <div className="mb-6">
      {/* Header content */}
      <div className="border rounded-md p-4">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{name}</h1>
            <p className="text-sm text-gray-600">{description}</p>
          </div>
          <Button
            variant="outline"
            className="flex items-center gap-1 text-sm"
            onClick={generateInviteCode}
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Share className="h-4 w-4" />
            )}
            Share invite
          </Button>
        </div>
      </div>

      {/* Invite Dialog */}
      <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share cooperative invite</DialogTitle>
            <DialogDescription>
              Share this invite code with people you want to join this cooperative.
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 mt-4">
            <div className="grid flex-1 gap-2">
              <label className="text-xs font-medium text-gray-500">
                Shareable Invite Link
              </label>
              <div className="flex w-fit items-center border rounded-md p-2 bg-gray-50">
                <span className="text-sm font-medium flex-1 truncate">
                  {window.location.origin}/invite/{inviteCode}
                </span>
              </div>
            </div>
            <Button
              type="button"
              size="icon"
              className="px-3"
              onClick={copyToClipboard}
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
              <span className="sr-only">Copy</span>
            </Button>
          </div>
          <div className="mt-4 space-y-3">
            <div className="bg-blue-50 p-3 rounded-md border border-blue-100">
              <h4 className="text-sm font-medium text-blue-800 flex items-center">
                <Info className="h-4 w-4 mr-2" />
                How to share this code
              </h4>
              <ol className="text-xs text-blue-800 mt-2 space-y-1 list-decimal ml-4">
                <li>Copy the invite code above</li>
                <li>Share it with the person you want to invite</li>
                <li>Ask them to go to the &ldquo;Join Cooperative&rdquo; page in CoopWise</li>
                <li>They should paste this code to join your cooperative</li>
              </ol>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Members list
const MembersList = ({ members }: { members: CooperativeMember[] }) => (
  <div className="bg-white rounded-md p-4">
    <div className="mb-3">
      <h2 className="text-base font-medium">Cooperative Members</h2>
      <p className="text-xs text-gray-500">{members.length} member{members.length === 1 ? '' : 's'}</p>
    </div>

    {members.length > 0 ? (
      <div className="space-y-4 mt-4">
        {members.map((member) => {
          const isAdmin = member.role === 'admin'
          const badgeClass = isAdmin
            ? "bg-purple-100 text-purple-800"
            : "bg-gray-100 text-gray-800"

          return (
            <div
              key={member.id}
              className="flex items-center justify-between border-b pb-3 last:border-b-0"
            >
              <p className="text-xs text-gray-500 font-mono">{member.user_id}</p>

              <div className="flex items-center gap-2">
                {member.role && (
                  <span className={`${badgeClass} text-xs px-2 py-0.5 rounded capitalize`}>
                    {member.role}
                  </span>
                )}
                {member.status && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded capitalize ${
                      member.status === 'accepted'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {member.status}
                  </span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    ) : (
      <div className="py-8 text-center">
        <p className="text-gray-500">No members have joined this cooperative yet.</p>
      </div>
    )}
  </div>
);

export default function GroupDetailsView({ groupId }: GroupDetailsViewProps) {
  const [cooperative, setCooperative] = useState<Cooperative | null>(null);
  const [members, setMembers] = useState<CooperativeMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const [coopData, memberData] = await Promise.all([
          CooperativeService.getCooperative(groupId),
          CooperativeService.getCooperativeMembers(groupId),
        ]);

        setCooperative(coopData);
        setMembers(memberData);
      } catch (err) {
        console.error('Error fetching cooperative details:', err);
        setError('Failed to load cooperative details');
        toast({
          title: "Error",
          description: "Failed to load cooperative details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchGroupData();
  }, [groupId]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-teal-700 mb-4" />
        <p className="text-gray-600">Loading cooperative details...</p>
      </div>
    );
  }

  // Show error state
  if (error || !cooperative) {
    return (
      <div className="text-center py-8">
        <h2 className="text-xl font-semibold mb-2">Cooperative not found</h2>
        <p className="text-gray-600 mb-4">{error || "The cooperative you're looking for doesn't exist."}</p>
        <Link href="/dashboard/my-group">
          <Button className="bg-teal-700 hover:bg-teal-800 text-white">
            Back to My Cooperatives
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4">
      {/* Cooperative Header */}
      <GroupHeader
        name={cooperative.name}
        description={cooperative.description || `${cooperative.name} Cooperative`}
        groupId={groupId}
      />

      {/* Lower sections in flex column */}
      <div className="flex flex-col gap-6">
        <MembersList members={members} />

        <div className="flex justify-end mb-8">
          <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
            Leave Cooperative
          </Button>
        </div>
      </div>
    </div>
  )
}