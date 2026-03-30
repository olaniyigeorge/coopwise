"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft, Zap, Shield, Wallet } from "lucide-react";
import { useFlowWallet } from "@/lib/crossmint/use-flow-wallet";

export default function LoginPage() {
  const router = useRouter();
  const { login, walletStatus, isReady, error } = useFlowWallet();

  useEffect(() => {
    if (isReady) {
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get("returnUrl");
      const pendingInvite =
        typeof window !== "undefined"
          ? localStorage.getItem("pendingInviteCode")
          : null;

      if (returnUrl) {
        router.push(returnUrl);
      } else if (pendingInvite) {
        localStorage.removeItem("pendingInviteCode");
        localStorage.removeItem("pendingGroupName");
        router.push(`/invite/${pendingInvite}/join`);
      } else {
        router.push("/dashboard");
      }
    }
  }, [isReady, router]);

  const isLoading =
    walletStatus === "authenticating" ||
    walletStatus === "provisioning-wallet" ||
    walletStatus === "syncing-backend";

  const statusMessages: Record<string, string> = {
    authenticating: "Opening secure sign-in...",
    "provisioning-wallet": "Loading your wallet...",
    "syncing-backend": "Signing you in...",
    ready: "Welcome back! Redirecting...",
  };

  return (
    <div className="min-h-screen auth_bg flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

          {/* Header */}
          <div className="bg-primary px-8 pt-8 pb-10 text-center relative overflow-hidden">
            {/* Subtle decorative circles */}
            <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-white/5" />
            <div className="absolute -bottom-8 -left-4 w-20 h-20 rounded-full bg-white/5" />

            <Link href="/" className="inline-block mb-5 relative">
              <Image
                src="/assets/icons/coopwise-logo-white.svg"
                alt="CoopWise"
                width={110}
                height={30}
                className="mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </Link>
            <h1 className="text-xl font-bold text-white">Welcome back</h1>
            <p className="text-white/70 text-xs mt-1">Sign in to continue saving together</p>
          </div>

          {/* Body */}
          <div className="px-7 py-7 space-y-5">

            {/* Back link */}
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to home
            </Link>

            {/* Error state */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 leading-relaxed">
                {error}
              </div>
            )}

            {/* Loading status */}
            {isLoading && (
              <div className="p-3.5 bg-primary/5 border border-primary/15 rounded-xl flex items-center gap-3">
                <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
                <p className="text-xs text-primary font-medium">
                  {statusMessages[walletStatus] ?? "Please wait..."}
                </p>
              </div>
            )}

            {/* Main CTA */}
            <button
              onClick={login}
              disabled={isLoading}
              className={`w-full h-11 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-200
                ${isLoading
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "bg-primary hover:bg-primary/90 text-white shadow-sm hover:shadow-md active:scale-[0.99]"
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {statusMessages[walletStatus] ?? "Please wait..."}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z"
                      stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Continue with Email or Google
                </>
              )}
            </button>

            {/* Trust badges */}
            <div className="flex items-center justify-center gap-4 pt-1">
              {[
                { icon: Zap, label: "Gas-free" },
                { icon: Shield, label: "No password" },
                { icon: Wallet, label: "Smart wallet" },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-1 text-gray-400">
                  <Icon className="w-3 h-3" />
                  <span className="text-xs">{label}</span>
                </div>
              ))}
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-gray-100" />
              <span className="text-xs text-gray-300">or</span>
              <div className="flex-1 border-t border-gray-100" />
            </div>

            {/* Sign up link */}
            <p className="text-xs text-center text-gray-500">
              New to CoopWise?{" "}
              <Link
                href="/auth/signup"
                className="text-primary hover:text-primary/80 font-semibold"
              >
                Create an account
              </Link>
            </p>
          </div>

          {/* Footer */}
          <div className="px-7 pb-6 text-center border-t border-gray-50 pt-4">
            <p className="text-xs text-gray-300">
              Powered by{" "}
              <span className="font-medium text-gray-400">Flow Blockchain</span>
              {" · "}
              <span className="font-medium text-gray-400">Crossmint</span>
            </p>
          </div>
        </div>

        {/* Legacy login — optional; keep routes if needed */}
        {/* <p className="text-center text-xs text-gray-400 mt-4">
          Prefer password login?{" "}
          <Link href="/auth/login-legacy" className="underline hover:text-gray-600 transition-colors">
            Use legacy login
          </Link>
        </p> */}

      </div>
    </div>
  );
}