"use client";

import { useState, useCallback } from "react";
import * as fcl from "@onflow/fcl";
import axios from "axios";
import AuthService from "@/lib/auth-service";
import { CONTRIBUTE_CDC } from "@/lib/flow/config";

// ─── Types ───────────────────────────────────────────────────────────────────

export type ContributionStatus =
  | "idle"
  | "encrypting"   // asking backend to generate Zama-encrypted amount
  | "signing"      // FCL shows biometric / passkey prompt to user
  | "confirming"   // waiting for Flow blockchain to seal the tx
  | "done"
  | "error";

export interface ContributionResult {
  txId: string;
  explorerUrl: string;
}

export interface UseContributionReturn {
  contribute: () => Promise<ContributionResult | null>;
  enableAutoPay: (enable: boolean) => Promise<void>;
  status: ContributionStatus;
  error: string | null;
  txId: string | null;
  isAutoPay: boolean;
  reset: () => void;
}

// ─── Utility ─────────────────────────────────────────────────────────────────

/**
 * Convert a "0x…" hex string to a Uint8Array (FCL wants [UInt8]).
 * Works for both "0x"-prefixed and raw hex.
 */
function hexToBytes(hex: string): number[] {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  const bytes: number[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    bytes.push(parseInt(clean.slice(i, i + 2), 16));
  }
  return bytes;
}

const FLOW_NETWORK = process.env.NEXT_PUBLIC_FLOW_NETWORK ?? "testnet";
const EXPLORER_BASE =
  FLOW_NETWORK === "mainnet"
    ? "https://flowscan.io/tx"
    : "https://testnet.flowscan.io/tx";

// ─── Hook ────────────────────────────────────────────────────────────────────

/**
 * useContribution — Feature 3 (Contribute to a Circle)
 *
 * Flow:
 *   1. GET /api/v1/circles/{id}/contribute  → backend encrypts amount via Zama relayer
 *   2. FCL prompts user biometrics (passkey), signs + submits Contribute.cdc
 *   3. fcl.tx(txId).onceSealed() polls until tx is confirmed on Flow (~5–15 s)
 *
 * CoopWise pays gas — the user pays nothing, no crypto knowledge required.
 */
export function useContribution(circleId: number | string): UseContributionReturn {
  const id = typeof circleId === "string" ? parseInt(circleId, 10) : circleId;

  const [status, setStatus] = useState<ContributionStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [txId, setTxId] = useState<string | null>(null);
  const [isAutoPay, setIsAutoPay] = useState(false);

  const reset = useCallback(() => {
    setStatus("idle");
    setError(null);
    setTxId(null);
  }, []);

  const contribute = useCallback(async (): Promise<ContributionResult | null> => {
    try {
      setStatus("encrypting");
      setError(null);
      setTxId(null);

      // Step 1 — ask backend to encrypt the contribution amount via Zama relayer
      const { data } = await axios.post(
        `/api/v1/circles/${id}/contribute`,
        {},
        { headers: AuthService.getAuthHeader() }
      );

      const {
        encrypted_amount,
        input_proof,
        circle_chain_id,
      }: { encrypted_amount: string; input_proof: string; circle_chain_id: number } = data;

      setStatus("signing");

      // Step 2 — FCL triggers the biometric / passkey prompt, signs & submits
      const submittedTxId: string = await fcl.mutate({
        cadence: CONTRIBUTE_CDC,
        args: (arg: (v: unknown, t: unknown) => unknown, t: Record<string, unknown>) => [
          arg(circle_chain_id.toString(), t["UInt64"]),
          arg(hexToBytes(encrypted_amount), t["Array"](t["UInt8"])),
          arg(hexToBytes(input_proof), t["Array"](t["UInt8"])),
        ],
        proposer: fcl.currentUser,
        authorizations: [fcl.currentUser],
        // payer is the CoopWise fee-payer account configured via FCL service config
        // (set in FlowProvider via the backend's account key — user pays zero gas)
        limit: 9999,
      });

      setTxId(submittedTxId);
      setStatus("confirming");

      // Step 3 — poll until the tx seals on Flow (~5–15 s on testnet)
      await fcl.tx(submittedTxId).onceSealed();

      setStatus("done");

      return {
        txId: submittedTxId,
        explorerUrl: `${EXPLORER_BASE}/${submittedTxId}`,
      };
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { detail?: string } }; message?: string })
          ?.response?.data?.detail ??
        (err as { message?: string })?.message ??
        "Contribution failed. Please try again.";
      setError(message);
      setStatus("error");
      return null;
    }
  }, [id]);

  /**
   * Toggle auto-pay for this circle.
   * Enabling: backend registers a session key on the user's Flow account
   *           (limited-weight key, can only call Contribute.cdc for this circle).
   * Disabling: backend revokes the session key.
   */
  const enableAutoPay = useCallback(
    async (enable: boolean) => {
      try {
        await axios.post(
          `/api/v1/circles/${id}/auto-pay`,
          { enabled: enable },
          { headers: AuthService.getAuthHeader() }
        );
        setIsAutoPay(enable);
      } catch (err: unknown) {
        const message =
          (err as { response?: { data?: { detail?: string } }; message?: string })
            ?.response?.data?.detail ??
          (err as { message?: string })?.message ??
          "Failed to update auto-pay setting.";
        setError(message);
      }
    },
    [id]
  );

  return { contribute, enableAutoPay, status, error, txId, isAutoPay, reset };
}
