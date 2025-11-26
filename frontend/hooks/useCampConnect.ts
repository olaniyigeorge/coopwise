import { useAuth } from "@campnetwork/origin/react";

export function useCampConnect() {
  const auth = useAuth();

  const connectAndExchange = async () => {
    console.log("\nConnecting and exchanging tokens with Camp...\n");
    // Step 1 — trigger Camp modal/wallet connect
    // await auth.connect();
    if (!auth.jwt || !auth.clientId || !auth.userId) {
      throw new Error("User is not authenticated with Camp");
    }

    // Step 2 — get Origin wallet address + JWT
    const originJwt = auth.jwt;
    const walletAddress = auth.walletAddress;

    if (!originJwt || !walletAddress) {
      throw new Error("Failed to authenticate with Camp");
    }

    // Step 3 — send to your backend for token exchange
    const res = await fetch("/api/auth/exchange", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ originJwt, walletAddress })
    });

    if (!res.ok) {
      const err = await res.text();
      throw new Error(err || "Backend auth failed");
    }

    const data = await res.json();

    // example: { accessToken, user }
    return data;
  };

  return { connectAndExchange };
}
