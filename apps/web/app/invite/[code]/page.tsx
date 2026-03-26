// apps/web/app/invite/[code]/page.tsx
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Loader2, Users, ArrowRight, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import CircleService, { PublicCirclePreview } from "@/lib/circle-service";
import useAuthStore from "@/lib/stores/auth-store";

const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦", KES: "KSh", GHS: "GH₵", USD: "$",
};

export default function InvitePreviewPage() {
  const params = useParams();
  const code = params.code as string;
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [group, setGroup] = useState<PublicCirclePreview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    console.log("\nCalling service for public circle\n")
    CircleService.getPublicCircleByInvite(code)
      .then((data) => {
        if (!data) { setNotFound(true); return; }
        setGroup(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [params.code]);

  const handleJoin = () => {
    const encodedCode = btoa(code);

    if (isAuthenticated) {
      // Already logged in — go straight to the join confirmation page
      router.push(`/invite/${params.code}/join`);
      return;
    }
    // Not logged in — stash invite code, redirect to login
    localStorage.setItem("pendingInviteCode", code);
    if (group?.name) localStorage.setItem("pendingGroupName", group.name);
    router.push(
      `/auth/login?returnUrl=${encodeURIComponent(`/invite/${encodedCode}/join`)}`
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (notFound || !group) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
          <h1 className="text-lg font-semibold">Invalid invite link</h1>
          <p className="text-sm text-muted-foreground">
            This link may have expired or is no longer valid.
          </p>
          <Button variant="outline" onClick={() => router.push("/")}>
            Go home
          </Button>
        </div>
      </div>
    );
  }

  const sym = CURRENCY_SYMBOLS[group.currency] ?? group.currency;
  const spotsLeft = group.max_members - group.member_count;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/assets/icons/coopwise-logo.svg"
              alt="CoopWise"
              width={28}
              height={28}
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="font-semibold text-sm">CoopWise</span>
          </Link>
          <div className="flex items-center gap-3 text-sm">
            {
              !isAuthenticated &&
              <> <Link href="/auth/login" className="text-primary font-medium">
              Log in
            </Link>
            <Link
              href="/auth/signup"
              className="bg-primary text-white px-3 py-1.5 rounded-lg font-medium"
            >
              Sign up
            </Link></>
            }
           
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-8 space-y-4">
        {/* Circle card */}
        <div className="bg-gradient-to-br from-[#06413F] to-[#0a6360] rounded-2xl p-5 text-white space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight">{group.name}</h1>
              <p className="text-white/70 text-xs capitalize">
                {group.coop_model} · {group.contribution_frequency}
              </p>
            </div>
          </div>

          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-extrabold">
              {sym}
              {group.contribution_amount.toLocaleString()}
            </span>
            <span className="text-white/60 text-sm">/ round</span>
          </div>

          <div className="flex items-center justify-between text-xs text-white/60">
            <span>
              {group.member_count} / {group.max_members} members
            </span>
            <span
              className={
                spotsLeft <= 2 ? "text-amber-300 font-medium" : "text-white/60"
              }
            >
              {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
            </span>
          </div>
        </div>

        {/* Description */}
        {group.description && (
          <div className="bg-white rounded-xl p-4 border text-sm text-muted-foreground">
            {group.description}
          </div>
        )}

        {/* Terms */}
        <div className="bg-white rounded-xl p-4 border space-y-2">
          <h2 className="text-sm font-medium">What you're agreeing to</h2>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li>
              Contribute{" "}
              <span className="font-medium text-foreground">
                {sym}
                {group.contribution_amount.toLocaleString()}
              </span>{" "}
              every {group.contribution_frequency}
            </li>
            <li>
              Your contributions are private — no other member sees your
              balance
            </li>
            <li>Payouts are automatic to your registered bank account</li>
            <li>Transactions are recorded on the Flow blockchain</li>
          </ul>
        </div>

        {/* CTA */}
        <Button
          className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-semibold rounded-xl"
          onClick={handleJoin}
          disabled={spotsLeft <= 0 || group.status === "completed"}
        >
          {spotsLeft <= 0
            ? "Circle is full"
            : group.status === "completed"
            ? "Circle is complete"
            : "Join this circle"}
          {spotsLeft > 0 && group.status !== "completed" && (
            <ArrowRight className="w-4 h-4 ml-2" />
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          Powered by Flow Blockchain · Crossmint Smart Wallets
        </p>
      </main>
    </div>
  );
}