// components/CrossmintAuthListener.tsx
"use client";

import { useEffect } from "react";
// import { useAuth } from "@crossmint/client-sdk-react-ui";
import { useAuthStore } from "@/lib/hooks/use-app-store";

export function CrossmintAuthListener() {
  // const { user, status } = useAuth();
  const { setUser, setIsAuthenticated, setLoading } = useAuthStore();

  // useEffect(() => {
  //   if (status === "logged-in" && user) {
  //     syncWithBackend(user);
  //   }
  //   if (status === "logged-out") {
  //     setIsAuthenticated(false);
  //     setUser(null);
  //   }
  // }, [status, user]);

  // async function syncWithBackend(crossmintUser: typeof user) {
  //   setLoading(true);
  //   try {
  //     const res = await fetch("/api/auth/exchange", {
  //       method: "POST",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify({
  //         crossmintUserId: crossmintUser?.userId,
  //         email: crossmintUser?.email,
  //       }),
  //     });

  //     if (!res.ok) throw new Error(await res.text());

  //     const data = await res.json();
  //     setUser(data.user);
  //     setIsAuthenticated(true);
  //   } catch (err) {
  //     console.error("Backend sync failed:", err);
  //   } finally {
  //     setLoading(false);
  //   }
  // }

  return null;
}