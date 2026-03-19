"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notification-context";
import { Toaster } from "@/components/ui/toaster";

import { CampProvider } from "@campnetwork/origin/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { CampAuthListener } from "./CampAuthListener";

const queryClient = new QueryClient();

interface AppWrapperProps {
  children: React.ReactNode;
}

// "apiKey": "4f1a2c9c-008e-4a2e-8712-055fa04f9ffa",
const CAMP_CLIENT_ID  = process.env.CAMP_CLIENT_ID || "fce77d7a-8085-47ca-adff-306a933e76aa";
const CAMP_REDIRECT_URI = process.env.NEXT_PUBLIC_CAMP_REDIRECT as string || "http://localhost:3000/camp-auth/sync";

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <CampProvider 
        clientId={CAMP_CLIENT_ID}
        redirectUri={CAMP_REDIRECT_URI}
      >
        <AuthProvider>
          <CampAuthListener />
          <NotificationProvider>
            {children}
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </CampProvider>
    </QueryClientProvider>
  );
}