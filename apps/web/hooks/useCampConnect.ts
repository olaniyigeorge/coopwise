"use client";

import { useAuthStore } from "@/lib/hooks/use-app-store";

export function useCampConnect() {
  const { setUser, setIsAuthenticated, setLoading   } = useAuthStore();

  const connectAndExchange = async () => {
    // Intentionally disabled for now. This hook used to depend on
    // `@campnetwork/origin/react`, which is not installed in production builds.
    setLoading(false);
    throw new Error("Camp connect is currently disabled.");
  };

  return { connectAndExchange };
}
