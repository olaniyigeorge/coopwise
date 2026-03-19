"use client";
import { useCampConnect } from "@/hooks/useCampConnect";
import { useAuthState } from "@campnetwork/origin/react";
import { useEffect } from "react";

export function CampAuthListener() {
  const { authenticated } = useAuthState();
  const { connectAndExchange } = useCampConnect();

  // Whenever authenticated changes to "true", run exchange
  useEffect(() => {
    if (authenticated) {
      connectAndExchange();
    }
  }, [authenticated]);

  // return <CampModal />
  return null
}
