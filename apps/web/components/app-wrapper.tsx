"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notification-context";
import { Toaster } from "@/components/ui/toaster";

import {
  CrossmintProvider,
  CrossmintAuthProvider,
} from "@crossmint/client-sdk-react-ui";
import { FlowProvider } from "@onflow/react-sdk";
import flowJSON from "../flow.json";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

const CROSSMINT_APIKEY = process.env.NEXT_PUBLIC_CROSSMINT_APIKEY as string;

export function AppWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CrossmintProvider apiKey={CROSSMINT_APIKEY}>
        <CrossmintAuthProvider
          loginMethods={["email", "google"]}
          authModalTitle="Join CoopWise"
          termsOfServiceText="By continuing, you agree to CoopWise's Terms of Service"
          appearance={{
            colors: {
              accent: "#16a34a",       // your green brand color — change to match
              background: "#ffffff",
              textPrimary: "#111827",
              textSecondary: "#6b7280",
              border: "#e5e7eb",
            },
            borderRadius: "0.75rem",
          }}
          onLoginSuccess={() => console.log("Crossmint login success")}
        >
          <FlowProvider
            config={{
              accessNodeUrl: "https://access-testnet.onflow.org",
              flowNetwork: "testnet",
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
                <Toaster />
              </NotificationProvider>
            </AuthProvider>
          </FlowProvider>
        </CrossmintAuthProvider>
      </CrossmintProvider>
    </QueryClientProvider>
  );
}