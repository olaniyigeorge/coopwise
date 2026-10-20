"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'
import { CheckCircle2, Info, Loader2 } from 'lucide-react'

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"
import CooperativeService from '@/services/cooperative-service'
import CooperativePreviewCard from '@/components/dashboard/cooperative-preview'
import type { CooperativePreview } from '@/types/cooperative'

// Invite codes are 8 characters. Trim/uppercase so a pasted or hand-typed
// code matches the stored one regardless of case.
const inviteCodeSchema = z.object({
  inviteCode: z
    .string()
    .trim()
    .min(6, { message: "Enter the invite code you were given." })
    .max(8, { message: "Invite codes are 8 characters." }),
})

// Update the component props interface
interface JoinGroupFormProps {
  initialCode?: string | null;
}

export default function JoinGroupForm({ initialCode }: JoinGroupFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [verifying, setVerifying] = useState(false)
  const [joining, setJoining] = useState(false)
  const [showGroupDetails, setShowGroupDetails] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [preview, setPreview] = useState<CooperativePreview | null>(null)
  // What the server actually did with the invite (active vs. queued).
  const [joinedImmediately, setJoinedImmediately] = useState(true)
  const [currentInviteCode, setCurrentInviteCode] = useState("")
  
  const form = useForm<z.infer<typeof inviteCodeSchema>>({
    resolver: zodResolver(inviteCodeSchema),
    defaultValues: {
      inviteCode: initialCode || "",
    },
  })
  
  // Function to verify the invite code
  const onVerifyCode = useCallback(async (values: z.infer<typeof inviteCodeSchema>) => {
    setVerifying(true)
    const code = values.inviteCode.trim().toUpperCase()
    setCurrentInviteCode(code)

    try {
      // Call the API to verify the invite code
      const response = await CooperativeService.verifyInviteCode(code) as {
        membership?: { group_id: string; status?: string }
      };

      // Extract cooperative data from the response
      if (response && response.membership) {
        const membership = response.membership;

        // Check if the user has already joined this cooperative
        if (membership.status && membership.status.toLowerCase() == 'accepted') {
          toast({
            title: "Already Joined",
            description: "You have already joined or requested to join this cooperative.",
            variant: "default",
          });

          // Still fetch and show cooperative details
        }

        // Get cooperative details
        try {
          const cooperative = await CooperativeService.getCooperativePreview(membership.group_id);

          if (cooperative) {
            setPreview(cooperative);
            setShowGroupDetails(true);
          }
        } catch (error: any) {
          console.error("Error fetching cooperative details:", error);
          toast({
            title: "Error",
            description: error.message || "Could not fetch cooperative details. Please try again.",
            variant: "destructive",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Invalid invite code or cooperative not found.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error("Error verifying invite code:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to verify invite code. Please try again.",
        variant: "destructive",
      });
    } finally {
      setVerifying(false);
    }
  }, [toast])

  // Auto-verify code if passed via URL
  useEffect(() => {
    if (initialCode && initialCode.length >= 6) {
      form.setValue('inviteCode', initialCode.trim().toUpperCase())
      // Delay verification slightly to ensure form is ready
      setTimeout(() => {
        const values = { inviteCode: initialCode.trim().toUpperCase() }
        onVerifyCode(values)
      }, 500)
    }
  }, [initialCode, form, onVerifyCode])
  
  // Function to join the group
  async function onJoinGroup() {
    setJoining(true);
    
    try {
      // Call the API to accept the invite code
      const membership = await CooperativeService.acceptInviteCode(currentInviteCode) as { status?: string };
      setJoinedImmediately((membership?.status ?? 'active').toLowerCase() === 'active');

      // Close the group details modal and show success
      setShowGroupDetails(false);
      
      // Always show success modal after attempting to join
      setShowSuccessModal(true);
      
      // Notify user of success
      toast({
        title: "Done",
        description: "Your request has been recorded.",
        variant: "default",
      });
    } catch (error: any) {
      console.error("Error joining group:", error);
      
      // Close the group details dialog
      setShowGroupDetails(false);
      
      // Show error toast
      toast({
        title: "Error",
        description: error.message || "Failed to join group. Please try again.",
        variant: "destructive",
      });
    } finally {
      setJoining(false);
    }
  }
  

  
  return (
    <div>
      {/* Main Form */}
      <div className="rounded-[24px] border border-content/[0.06] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onVerifyCode)} className="space-y-5">
            <div className="space-y-4">
              <p className="text-sm leading-relaxed text-content/55">
                Enter an invite code you received from a group admin or member to
                join their saving group.
              </p>

              <div className="rounded-2xl border border-content/10 bg-content/[0.02] p-3.5">
                <h4 className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-content/55">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
                    <Info className="h-3.5 w-3.5" />
                  </span>
                  How to join
                </h4>
                <ol className="mt-2 list-decimal space-y-1 pl-9 text-xs leading-relaxed text-content/50">
                  <li>Paste the invite code you received</li>
                  <li>Review the group details</li>
                  <li>Confirm to join the group</li>
                  <li>Wait for approval (if the group requires it)</li>
                </ol>
              </div>

              <FormField
                control={form.control}
                name="inviteCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[11px] font-semibold uppercase tracking-[0.16em] text-content/45">
                      Invite code
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="K7M2Q9XA"
                        {...field}
                        maxLength={8}
                        autoCapitalize="characters"
                        autoComplete="off"
                        spellCheck={false}
                        className="h-14 rounded-2xl border-content/10 bg-content/[0.02] text-center font-display text-xl font-bold uppercase tracking-[0.3em] text-content placeholder:font-normal placeholder:tracking-[0.2em] placeholder:text-content/25 focus-visible:border-[#0E3B2E]/40 focus-visible:ring-2 focus-visible:ring-[#0E3B2E]/15 dark:focus-visible:border-[#7FBF9C]/40 dark:focus-visible:ring-[#7FBF9C]/20"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button
              type="submit"
              className="h-12 w-full rounded-full bg-[#0E3B2E] text-sm font-semibold text-white hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]"
              disabled={verifying}
            >
              {verifying ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying…
                </>
              ) : "Verify code"}
            </Button>
          </form>
        </Form>

        <div className="mt-6 border-t border-content/[0.06] pt-5">
          <div className="rounded-2xl border border-content/10 bg-content/[0.02] p-4">
            <p className="text-sm font-medium text-content/70">
              Need an invite code?
            </p>
            <p className="mt-1 text-sm leading-relaxed text-content/45">
              Ask an admin or any member of the group you want to join. Codes are
              8 characters and can be typed in any case.
            </p>
          </div>
        </div>
      </div>
      
      {/* Group Details Modal */}
      <Dialog open={showGroupDetails} onOpenChange={setShowGroupDetails}>
        <DialogContent className="max-h-[90dvh] gap-5 overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-xl font-bold">
              Join this cooperative?
            </DialogTitle>
            <DialogDescription>
              Review the details below before you confirm.
            </DialogDescription>
          </DialogHeader>

          {preview && <CooperativePreviewCard preview={preview} />}

          <div className="rounded-2xl border border-content/10 bg-content/[0.02] p-4">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-content/55">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
                <Info className="h-3.5 w-3.5" />
              </span>
              What happens next
            </p>
            <p className="mt-2 text-sm leading-relaxed text-content/50">
              {preview?.admission === 'member_vote'
                ? 'Members of this cooperative vote on your request. You’ll be notified as soon as there’s a decision.'
                : preview?.admission === 'admin_approval'
                  ? 'An admin reviews your request. You’ll be notified as soon as there’s a decision.'
                  : 'You’ll be admitted straight away and can start contributing immediately.'}
            </p>
          </div>

          <DialogFooter className="flex-row gap-2 space-x-0 sm:space-x-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowGroupDetails(false)}
              className="h-11 flex-1 rounded-full border-content/15 bg-transparent text-sm font-semibold text-content/70 hover:bg-content/[0.04] hover:text-content"
              disabled={joining}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onJoinGroup}
              className="h-11 flex-1 rounded-full bg-[#0E3B2E] text-sm font-semibold text-white hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]"
              disabled={joining}
            >
              {joining ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining…
                </>
              ) : "Confirm and join"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Success Modal */}
      <Dialog open={showSuccessModal} onOpenChange={setShowSuccessModal}>
        <DialogContent className="gap-4 text-center sm:max-w-md">
          <div className="mt-2 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DFF0E4] dark:bg-[#1C3A2C]">
              <CheckCircle2 className="h-9 w-9 text-[#17603F] dark:text-[#B7E3C3]" strokeWidth={1.8} />
            </div>
          </div>

          <DialogTitle className="font-display text-2xl font-bold">
            {joinedImmediately ? `You've joined ${preview?.name ?? 'the group'}!` : 'Request sent'}
          </DialogTitle>
          <DialogDescription className="text-center leading-relaxed">
            {joinedImmediately ? (
              <>You&apos;re in — you can start contributing right away.</>
            ) : preview?.admission === 'member_vote' ? (
              <>Members of {preview?.name} will vote on your request. You&apos;ll be notified of the result.</>
            ) : (
              <>An admin of {preview?.name} will review your request. You&apos;ll be notified of the result.</>
            )}
          </DialogDescription>

          {!joinedImmediately && (
            <div className="rounded-2xl border border-content/10 bg-content/[0.02] p-4 text-left">
              <h4 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-content/55">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#DFF0E4] text-[#17603F] dark:bg-[#1C3A2C] dark:text-[#B7E3C3]">
                  <Info className="h-3.5 w-3.5" />
                </span>
                What happens next
              </h4>
              <ul className="mt-2 list-disc space-y-1.5 pl-9 text-xs leading-relaxed text-content/50">
                <li>
                  {preview?.admission === 'member_vote'
                    ? 'Existing members vote on your request'
                    : 'An admin reviews your request'}
                </li>
                <li>You can&apos;t contribute until you&apos;re admitted</li>
                <li>You&apos;ll be notified as soon as there&apos;s a decision</li>
              </ul>
            </div>
          )}

          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push('/dashboard/join-group')}
              className="h-11 flex-1 rounded-full border-content/15 bg-transparent text-sm font-semibold text-content/70 hover:bg-content/[0.04] hover:text-content"
            >
              Join another
            </Button>
            <Button
              type="button"
              onClick={() => router.push('/dashboard/my-group')}
              className="h-11 flex-1 rounded-full bg-[#0E3B2E] text-sm font-semibold text-white hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]"
            >
              My groups
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 