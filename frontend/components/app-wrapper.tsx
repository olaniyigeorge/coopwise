"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth-context";
import { NotificationProvider } from "@/lib/notification-context";
import { Toaster } from "@/components/ui/toaster";

import { CampProvider } from "@campnetwork/origin/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

interface AppWrapperProps {
  children: React.ReactNode;
}

// "apiKey": "4f1a2c9c-008e-4a2e-8712-055fa04f9ffa",
const CAMP_CLIENT_ID  = process.env.CAMP_CLIENT_ID || "fce77d7a-8085-47ca-adff-306a933e76aa";

export function AppWrapper({ children }: AppWrapperProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <CampProvider clientId={CAMP_CLIENT_ID}>
        <AuthProvider>
          <NotificationProvider>
            {children}
            <Toaster />
          </NotificationProvider>
        </AuthProvider>
      </CampProvider>
    </QueryClientProvider>
  );
}