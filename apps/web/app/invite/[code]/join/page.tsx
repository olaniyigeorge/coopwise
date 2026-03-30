// apps/web/app/invite/[code]/join/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import useAuthStore from "@/lib/stores/auth-store";
import CircleService, { Circle } from "@/lib/circle-service";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Loader2, Check, AlertTriangle, Users, ArrowRight } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function parseInviteCode(code: string): string | null {
  try {
    const stripped = code.replace(/^COOPWISE_/, "");
    const [, groupId] = stripped.split(":");
    return groupId ?? null;
  } catch {
    return null;
  }
}

function decodeInviteCode(encodedCode: string): { raw: string; groupId: string } | null {
  try {
      // Decode base64 back to raw invite code
      const rawCode = decodeURIComponent(encodedCode);
      // Format: CPW-INV-{inviter_id}:{group_id}
      const colonIdx = rawCode.lastIndexOf(":");
      if (colonIdx === -1) return null;
      const groupId = rawCode.slice(colonIdx + 1);
      return { raw: rawCode, groupId };
    } catch {
      return null;
    }
  }

export default function JoinCirclePage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuthStore();
  const code = params.code as string;

  // Decode once — use raw code for API calls, groupId for navigation
  const decoded = decodeInviteCode(code);
  const circleId = decoded?.groupId;

  const [circle, setCircle] = useState<Circle | null>(null);
  const [isLoadingCircle, setIsLoadingCircle] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [joined, setJoined] = useState(false);
  const [error, setError] = useState<string | null>(null);

  



  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      localStorage.setItem("pendingInviteCode", decoded?.raw ?? code);
      router.replace(
        `/auth/login?returnUrl=${encodeURIComponent(`/invite/${code}/join`)}`
      );
    }
  }, [user]);

  // Fetch circle preview
  useEffect(() => {
    if (!circleId) return;

    CircleService.getPublicCircle(circleId)
      .then(setCircle)
      .catch(() => setError("Circle not found."))
      .finally(() => setIsLoadingCircle(false));
  }, [circleId, user]);

  // Clear pending invite from localStorage on landing
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("pendingInviteCode");
      localStorage.removeItem("pendingCircleId");
    }
  }, []);

  const handleJoin = async () => {
    if (!circleId) return;
    setIsJoining(true);
    setError(null);
    try {
      await CircleService.joinCircle(circleId);
      setJoined(true);
      toast({
        title: "You've joined!",
        description: `Welcome to "${circle?.name}".`,
        className: "border-green-500",
      });
      setTimeout(() => router.push(`/dashboard/circle/${circleId}`), 1800);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail || err?.message || "Failed to join. Try again.";
      setError(msg);
      toast({ title: "Couldn't join", description: msg, variant: "destructive" });
    } finally {
      setIsJoining(false);
    }
  };

  if (!user || isLoadingCircle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!circle || !circleId) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
          <p className="font-medium text-gray-900 mb-1">Invalid invite link</p>
          <p className="text-sm text-gray-500 mb-4">
            This link may have expired or be incorrect.
          </p>
          <Button variant="outline" onClick={() => router.push("/dashboard")}>
            Go to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b px-4 py-3 flex items-center gap-2">
        <Image
          src="/assets/icons/coopwise-logo-white.svg"
          alt="CoopWise"
          width={28}
          height={28}
        />
        <span className="font-bold text-base">CoopWise</span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-br from-[#06413F] to-[#0a6360] text-white p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-2">
              <Users className="w-6 h-6" />
            </div>
            <h1 className="text-lg font-bold">{circle.name}</h1>
            <p className="text-white/70 text-sm">
              {circle.member_count} / {circle.member_count} members
            </p>
          </div>

          <div className="p-5 space-y-4">
            {joined ? (
              <div className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-6 h-6 text-green-600" />
                </div>
                <p className="font-semibold text-gray-900">You're in!</p>
                <p className="text-sm text-gray-500 mt-1">Redirecting to your circle…</p>
              </div>
            ) : (
              <>
                <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-3 space-y-1">
                  <p>
                    <span className="text-gray-400">Contribution:</span>{" "}
                    <strong>
                      {circle.contribution_amount.toLocaleString()} {circle.currency}
                    </strong>
                  </p>
                  <p>
                    <span className="text-gray-400">Frequency:</span>{" "}
                    <strong className="capitalize">{circle.payout_schedule}</strong>
                  </p>
                  <p>
                    <span className="text-gray-400">Payout strategy:</span>{" "}
                    <strong className="capitalize">{circle.payout_schedule}</strong>
                  </p>
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <Button
                  className="w-full bg-primary hover:bg-primary/90"
                  onClick={handleJoin}
                  disabled={isJoining}
                >
                  {isJoining ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 mr-2" />
                  )}
                  {isJoining ? "Joining…" : "Confirm and join"}
                </Button>

                <Link
                  href="/dashboard"
                  className="block text-center text-sm text-gray-400 hover:text-gray-600"
                >
                  Cancel
                </Link>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}