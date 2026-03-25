// components/invite/InvitePreviewCard.tsx
"use client";

import { useRouter } from "next/navigation";
import { Users, Calendar, Coins, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Circle } from "@/lib/circle-service";

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦", KES: "KSh", GHS: "GH₵", USD: "$", USDC: "$",
};

export default function InvitePreviewCard({
  circle,
  inviteCode,
}: {
  circle: Circle;
  inviteCode: string;
}) {
  const router = useRouter();

  const handleJoin = () => {
    // Unauthenticated — store intent and redirect to login
    if (typeof window !== "undefined") {
      localStorage.setItem("pendingInviteCode", inviteCode);
      localStorage.setItem("pendingCircleId", `${circle.id}`);
    }
    router.push(
      `/auth/login?returnUrl=${encodeURIComponent(`/invite/${inviteCode}/join`)}`
    );
  };

  const sym = CURRENCY_SYMBOLS[circle.currency] ?? circle.currency;

  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
      {/* Circle header */}
      <div className="bg-gradient-to-br from-[#06413F] to-[#0a6360] text-white p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold">{circle.name}</h1>
            <p className="text-white/70 text-sm">
              {circle.member_count} / {circle.member_count} members
            </p>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="p-6 space-y-4">
        {circle.description && (
          <p className="text-sm text-gray-600">{circle.description}</p>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Coins className="w-3.5 h-3.5" />
              Contribution
            </div>
            <p className="font-semibold text-gray-900">
              {sym}{circle.contribution_amount.toLocaleString()}
            </p>
          </div>
          <div className="bg-gray-50 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              Frequency
            </div>
            <p className="font-semibold text-gray-900 capitalize">
              {circle.contribution_frequency}
            </p>
          </div>
        </div>

        <Button
          className="w-full bg-primary hover:bg-primary/90 text-white"
          onClick={handleJoin}
        >
          Join this circle
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>

        <p className="text-center text-xs text-gray-400">
          You'll be asked to log in or create an account
        </p>
      </div>
    </div>
  );
}