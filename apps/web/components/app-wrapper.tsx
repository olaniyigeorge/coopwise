"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notification-context";
import {
  CrossmintProvider,
  CrossmintAuthProvider,
  CrossmintWalletProvider,
} from "@crossmint/client-sdk-react-ui";
import { FlowProvider } from "@onflow/react-sdk";
import flowJSON from "../flow.json";

const CROSSMINT_API_KEY = process.env.NEXT_PUBLIC_CROSSMINT_API_KEY as string;

export function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <CrossmintProvider apiKey={CROSSMINT_API_KEY}>
      <CrossmintAuthProvider
        loginMethods={["email", "google"]}
        authModalTitle="Join CoopWise"
        termsOfServiceText="By continuing, you agree to CoopWise's Terms of Service and Privacy Policy."
        appearance={{
          colors: {
            accent: "#06413F",
            background: "#ffffff",
            textPrimary: "#111827",
            textSecondary: "#6b7280",
            border: "#e5e7eb",
          },
          borderRadius: "0.75rem",
        }}
      >
        {/* createOnLogin="all-users" auto-provisions a Flow smart wallet on every login — no seed phrases */}
        <CrossmintWalletProvider
          createOnLogin={{ 
            chain: "solana", 
            signer: { type: "email" } 
          }} 
        >
          <FlowProvider
            config={{
              accessNodeUrl:
                process.env.NEXT_PUBLIC_FLOW_NETWORK === "mainnet"
                  ? "https://access-mainnet.onflow.org"
                  : "https://access-testnet.onflow.org",
              flowNetwork:
                (process.env.NEXT_PUBLIC_FLOW_NETWORK as any) ?? "testnet",
              appDetailTitle: "CoopWise",
              appDetailIcon: "https://coopwise.app/assets/icons/logo.svg",
              appDetailDescription: "African cooperative savings, reimagined",
              appDetailUrl: "https://coopwise.app",
            }}
            flowJson={flowJSON}
          > 
            <AuthProvider>
              <NotificationProvider>
                {children}
              </NotificationProvider>
            </AuthProvider>
          </FlowProvider>
        </CrossmintWalletProvider>
      </CrossmintAuthProvider>
    </CrossmintProvider>
  );
}
