"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, ArrowLeft } from "lucide-react";
import { useFlowWallet } from "@/lib/crossmint/use-flow-wallet";

export default function LoginPage() {
  const router = useRouter();
  const { login, walletStatus, isReady, error } = useFlowWallet();

  // Redirect once fully authenticated + synced
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
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          {/* Header */}
          <div className="bg-primary px-8 py-8 text-center">
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/assets/icons/coopwise-logo-white.svg"
                alt="CoopWise"
                width={120}
                height={32}
                className="mx-auto"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </Link>
            <h1 className="text-2xl font-bold text-white mt-2">
              Welcome Back
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Sign in to your CoopWise account
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {/* Back button */}
            <Link
              href="/"
              className="flex items-center text-sm text-gray-500 hover:text-gray-700 mb-6 w-fit"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back to home
            </Link>

            {/* Error state */}
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Status message while loading */}
            {isLoading && (
              <div className="mb-5 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center gap-3">
                <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                <p className="text-sm text-primary font-medium">
                  {statusMessages[walletStatus] ?? "Please wait..."}
                </p>
              </div>
            )}

            {/* Main CTA */}
            <button
              onClick={login}
              disabled={isLoading}
              className={`w-full h-12 rounded-xl font-semibold text-sm flex items-center justify-center gap-3 transition-all duration-200
                ${
                  isLoading
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-primary hover:bg-primary/90 text-white shadow-md hover:shadow-lg"
                }`}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {statusMessages[walletStatus] ?? "Please wait..."}
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none">
                    <path d="M20 4H4C2.9 4 2 4.9 2 6v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M2 10h20" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  Continue with Email or Google
                </>
              )}
            </button>

            <p className="text-xs text-gray-400 text-center mt-4">
              No password required · No seed phrase · Gas-free
            </p>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-100" />
              <span className="px-3 text-xs text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-100" />
            </div>

            <p className="text-sm text-center text-gray-600">
              New to CoopWise?{" "}
              <Link
                href="/auth/signup"
                className="text-primary hover:text-primary/90 font-medium"
              >
                Create Account
              </Link>
            </p>
          </div>

          {/* Footer note */}
          <div className="px-8 pb-6 text-center">
            <p className="text-xs text-gray-400">
              Powered by{" "}
              <span className="font-semibold text-gray-500">
                Flow Blockchain
              </span>{" "}
              ·{" "}
              <span className="font-semibold text-gray-500">
                Crossmint Smart Wallets
              </span>
            </p>
          </div>
        </div>

        {/* Legacy link */}
        <p className="text-center text-xs text-gray-400 mt-4">
          Prefer password login?{" "}
          <Link href="/auth/login-legacy" className="underline hover:text-gray-600">
            Use legacy login
          </Link>
        </p>
      </div>
    </div>
  );
}
