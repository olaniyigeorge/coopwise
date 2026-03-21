"use client";

/**
 * useFlowWallet — the bridge between Crossmint auth and CoopWise.
 *
 * What this hook does:
 *   1. Watches for Crossmint auth state changes (user logs in / wallet is ready)
 *   2. When both user + wallet are available, calls the backend sync endpoint
 *   3. Stores the returned JWT + user in our Zustand auth store
 *   4. Exposes { flowAddress, walletStatus, user, isReady }
 *
 * Usage:
 *   const { flowAddress, isReady, walletStatus } = useFlowWallet()
 *
 * "isReady" = user is authenticated AND Flow wallet is provisioned AND backend is synced.
 */

import { useEffect, useState, useCallback } from "react";
import {
  useCrossmintAuth,
  useWallet,
} from "@crossmint/client-sdk-react-ui";
import useAuthStore from "@/lib/stores/auth-store";
import { syncCrossmintUser } from "./sync-service";

export type WalletSyncStatus =
  | "idle"
  | "authenticating"
  | "provisioning-wallet"
  | "syncing-backend"
  | "ready"
  | "error";

export interface UseFlowWalletReturn {
  /** The user's Flow blockchain address (e.g. "0xABCDEF1234567890") */
  flowAddress: string | null;
  /** Overall status of the wallet + auth pipeline */
  walletStatus: WalletSyncStatus;
  /** True once Flow address is available and backend is synced */
  isReady: boolean;
  /** Error message if something went wrong */
  error: string | null;
  /** Trigger login modal manually (e.g. from a button) */
  login: () => void;
  /** Sign out from both Crossmint and our backend */
  logout: () => void;
}

export function useFlowWallet(): UseFlowWalletReturn {
  const { user: crossmintUser, login: crossmintLogin, logout: crossmintLogout } =
    useCrossmintAuth();
  const { wallet, status: walletProvisionStatus } = useWallet();

  const { setUser, setIsAuthenticated, logout: storeLogout } = useAuthStore();

  const [walletStatus, setWalletStatus] = useState<WalletSyncStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [synced, setSynced] = useState(false);

  const flowAddress = wallet?.address ?? null;

  useEffect(() => {
    // No Crossmint user yet → idle
    if (!crossmintUser) {
      setWalletStatus("idle");
      setSynced(false);
      return;
    }

    // User authenticated but wallet still provisioning
    if (walletProvisionStatus !== "loaded-with-wallet") {
      setWalletStatus("provisioning-wallet");
      return;
    }

    // Wallet ready but haven't synced to backend yet
    if (wallet?.address && !synced) {
      setWalletStatus("syncing-backend");

      const email =
        crossmintUser.email ??
        (crossmintUser as any)?.linkedAccounts?.find(
          (a: any) => a.type === "email"
        )?.email ??
        "";

      syncCrossmintUser({
        crossmint_user_id: crossmintUser.userId,
        email,
        flow_address: wallet.address,
      })
        .then(({ user }) => {
          // Hydrate our Zustand auth store with the backend user
          setUser(user);
          setIsAuthenticated(true);
          setSynced(true);
          setWalletStatus("ready");
          setError(null);
        })
        .catch((err) => {
          console.error("[CoopWise] Backend sync failed:", err);
          setError(
            err?.response?.data?.detail ??
              "Could not connect to CoopWise servers. Please try again."
          );
          setWalletStatus("error");
        });
    }

    if (synced) {
      setWalletStatus("ready");
    }
  }, [crossmintUser, wallet, walletProvisionStatus, synced, setUser, setIsAuthenticated]);

  const login = useCallback(() => {
    setWalletStatus("authenticating");
    setError(null);
    crossmintLogin();
  }, [crossmintLogin]);

  const logout = useCallback(() => {
    crossmintLogout();
    storeLogout();
    setSynced(false);
    setWalletStatus("idle");
    setError(null);
  }, [crossmintLogout, storeLogout]);

  return {
    flowAddress,
    walletStatus,
    isReady: walletStatus === "ready",
    error,
    login,
    logout,
  };
}
