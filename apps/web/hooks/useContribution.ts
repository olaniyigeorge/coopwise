"use client";

import { useState, useCallback } from "react";
import * as fcl from "@onflow/fcl";
import axios from "axios";
import AuthService from "@/lib/auth-service";
import { CONTRIBUTE_CDC } from "@/lib/flow/config";

export type ContributionStatus =
  | "idle"
  | "encrypting"
  | "signing"
  | "confirming"
  | "done"
  | "error";

export interface ContributionResult {
  txId: string | null;
  explorerUrl: string | null;
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

export function useContribution(circleId: number | string): UseContributionReturn {
  const id = `${circleId}`;

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

      const { data } = await axios.post(
        `/api/v1/circles/${id}/contribute`,
        {},
        { headers: AuthService.getAuthHeader() }
      );

      const {
        encrypted_amount,
        input_proof,
        circle_chain_id,
        tx_id,
        explorer_url,
      }: {
        encrypted_amount?: string;
        input_proof?: string;
        circle_chain_id?: number;
        tx_id?: string | null;
        explorer_url?: string | null;
      } = data;

      if (!encrypted_amount || !input_proof || !circle_chain_id) {
        setTxId(tx_id ?? null);
        setStatus("confirming");
        setStatus("done");

        return {
          txId: tx_id ?? null,
          explorerUrl: explorer_url ?? null,
        };
      }

      setStatus("signing");

      const submittedTxId: string = await fcl.mutate({
        cadence: CONTRIBUTE_CDC,
        args: (arg: any, t: any) => [
          arg(circle_chain_id.toString(), t.UInt64),
          arg(hexToBytes(encrypted_amount), t.Array(t.UInt8)),
          arg(hexToBytes(input_proof), t.Array(t.UInt8)),
        ],
        proposer: fcl.currentUser,
        authorizations: [fcl.currentUser],
        limit: 9999,
      });

      setTxId(submittedTxId);
      setStatus("confirming");

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
        const status = (err as { response?: { status?: number } })?.response?.status;
        const message =
          (err as { response?: { data?: { detail?: string } }; message?: string })
            ?.response?.data?.detail ??
          (err as { message?: string })?.message ??
          "Failed to update auto-pay setting.";
        if (status === 501) {
          setError(
            "Auto-pay is not available on the server yet. Your choice was not saved."
          );
          setIsAutoPay(false);
          return;
        }
        setError(message);
      }
    },
    [id]
  );

  return { contribute, enableAutoPay, status, error, txId, isAutoPay, reset };
}
