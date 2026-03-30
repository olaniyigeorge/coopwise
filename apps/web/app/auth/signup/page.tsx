"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Loader2, Shield, Wallet, Zap } from "lucide-react";
import { useFlowWallet } from "@/lib/crossmint/use-flow-wallet";

export default function SignupPage() {
  const router = useRouter();
  const { login, walletStatus, isReady, flowAddress, error } = useFlowWallet();

  // As soon as the wallet is ready and backend is synced, redirect to profile setup
  useEffect(() => {
    if (isReady) {
      const searchParams = new URLSearchParams(window.location.search);
      const returnUrl = searchParams.get("returnUrl");
      const pendingInvite =
        typeof window !== "undefined"
          ? localStorage.getItem("pendingInviteCode")
          : null;

      if (returnUrl?.includes("/invite/") || pendingInvite) {
        router.push(returnUrl ?? `/invite/${pendingInvite}`);
      } else {
        router.push("/auth/profile-setup");
      }
    }
  }, [isReady, router]);

  const isLoading =
    walletStatus === "authenticating" ||
    walletStatus === "provisioning-wallet" ||
    walletStatus === "syncing-backend";

  const statusMessages: Record<string, string> = {
    authenticating: "Opening secure sign-in...",
    "provisioning-wallet": "Creating your Flow wallet — this takes a few seconds...",
    "syncing-backend": "Setting up your CoopWise account...",
    ready: "All set! Redirecting...",
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
                  // fallback if SVG path differs
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </Link>
            <h1 className="text-2xl font-bold text-white mt-2">
              Join CoopWise
            </h1>
            <p className="text-white/80 text-sm mt-1">
              Save together. Grow together. No crypto knowledge needed.
            </p>
          </div>

          {/* Body */}
          <div className="px-8 py-8">
            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="flex flex-col items-center text-center gap-1">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-gray-600 font-medium">No seed phrase</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Gas-free</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xs text-gray-600 font-medium">Auto wallet</span>
              </div>
            </div>

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

            {/* Flow address pill (shown once wallet is ready) */}
            {flowAddress && (
              <div className="mb-5 p-3 bg-green-50 border border-green-200 rounded-xl">
                <p className="text-xs text-green-700 font-medium mb-1">
                  Your Flow wallet is ready
                </p>
                <p className="text-xs text-green-600 font-mono break-all">
                  {flowAddress}
                </p>
              </div>
            )}

            {/* Main CTA — triggers Crossmint auth modal */}
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

            <p className="text-xs text-gray-400 text-center mt-4 leading-relaxed">
              By continuing, you agree to CoopWise&apos;s{" "}
              <Link href="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>

            {/* Divider */}
            <div className="flex items-center my-5">
              <div className="flex-1 border-t border-gray-100" />
              <span className="px-3 text-xs text-gray-400">or</span>
              <div className="flex-1 border-t border-gray-100" />
            </div>

            <p className="text-sm text-center text-gray-600">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="text-primary hover:text-primary/90 font-medium"
              >
                Sign In
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

        {/* Legacy signup — optional; keep routes if needed */}
        {/* <p className="text-center text-xs text-gray-400 mt-4">
          Prefer the old signup?{" "}
          <Link href="/auth/signup-legacy" className="underline hover:text-gray-600">
            Use legacy form
          </Link>
        </p> */}
      </div>
    </div>
  );
}
