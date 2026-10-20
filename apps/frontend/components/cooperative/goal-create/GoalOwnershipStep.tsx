"use client";

import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getApiErrorDetail } from "@/lib/api-error";
import { useGoalCreationStore } from "@/stores/goal-creation-store";
import GoalService from "@/services/goal-service";
import CooperativeService from "@/services/cooperative-service";
import type { CooperativeMember, ContractBasis } from "@/types/cooperative";

interface GoalOwnershipStepProps {
  cooperativeId: string;
  onContinue: () => void;
  onBack: () => void;
}

export function GoalOwnershipStep({ cooperativeId, onContinue, onBack }: GoalOwnershipStepProps) {
  const goalId = useGoalCreationStore((s) => s.goalId);
  const ownershipShares = useGoalCreationStore((s) => s.ownershipShares);
  const addOwnershipRow = useGoalCreationStore((s) => s.addOwnershipRow);
  const updateOwnershipRow = useGoalCreationStore((s) => s.updateOwnershipRow);
  const removeOwnershipRow = useGoalCreationStore((s) => s.removeOwnershipRow);
  const clearOwnershipRows = useGoalCreationStore((s) => s.clearOwnershipRows);
  const ownershipTotalPct = useGoalCreationStore((s) => s.ownershipTotalPct);

  const [members, setMembers] = useState<CooperativeMember[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRowIds, setSavedRowIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    CooperativeService.getCooperativeMembers(cooperativeId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [cooperativeId]);

  useEffect(() => {
    // Read live state, not the closed-over selector value — React
    // StrictMode double-invokes this effect synchronously with the same
    // stale closure, which would otherwise add two rows instead of one.
    if (useGoalCreationStore.getState().ownershipShares.length === 0) addOwnershipRow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalPct = ownershipTotalPct();
  const rowsComplete = ownershipShares.every(
    (row) => !!row.user_id && row.share_pct != null && row.share_pct > 0 && !!row.basis
  );
  const canSubmit = ownershipShares.length > 0 && rowsComplete && totalPct === 100;

  async function handleSubmit() {
    if (!goalId || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      for (const row of ownershipShares) {
        if (savedRowIds.has(row._rowId)) continue;
        await GoalService.createOwnershipShare(goalId, {
          user_id: row.user_id!,
          share_pct: row.share_pct!,
          basis: row.basis!,
          vested_at: row.vested_at ?? undefined,
        });
        setSavedRowIds((prev) => new Set(prev).add(row._rowId));
      }
      onContinue();
    } catch (err) {
      const detail = getApiErrorDetail(err);
      if (detail?.error === "OwnershipShareOverallocatedError") {
        setError(
          `Shares total ${detail.total_pct}% — must add up to exactly 100%.`
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to save ownership shares");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Ownership shares</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Who owns how much of this goal — must add up to exactly 100%. Not
          everyone here yet? Skip and finish it from the cooperative&apos;s Goals
          tab at any time.
        </p>
      </div>

      <div className="space-y-3">
        {ownershipShares.map((row) => (
          <div key={row._rowId} className="grid grid-cols-[1fr_100px_140px_auto] gap-2 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Member</Label>
              <Select
                value={row.user_id ?? ""}
                onValueChange={(v) => updateOwnershipRow(row._rowId, { user_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m) => (
                    <SelectItem key={m.user_id} value={m.user_id}>
                      {m.user?.full_name || m.user?.username || m.user_id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Share %</Label>
              <Input
                type="number"
                min={0}
                max={100}
                step="any"
                value={row.share_pct ?? ""}
                onChange={(e) =>
                  updateOwnershipRow(row._rowId, { share_pct: Number(e.target.value) })
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Basis</Label>
              <Select
                value={row.basis ?? "contribution_based"}
                onValueChange={(v) =>
                  updateOwnershipRow(row._rowId, { basis: v as ContractBasis })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contribution_based">Contribution based</SelectItem>
                  <SelectItem value="negotiated">Negotiated</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeOwnershipRow(row._rowId)}
              disabled={ownershipShares.length === 1}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}

        <Button type="button" variant="outline" size="sm" onClick={() => addOwnershipRow()}>
          Add member
        </Button>

        <p className={`text-sm ${totalPct === 100 ? "text-muted-foreground" : "text-destructive"}`}>
          Total: {totalPct}% {totalPct !== 100 && "(must be exactly 100%)"}
        </p>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between gap-2">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            type="button"
            disabled={submitting}
            onClick={() => {
              // Nothing was persisted; don't let the review step show these
              // rows as if they had been.
              clearOwnershipRows();
              onContinue();
            }}
          >
            Skip for now
          </Button>
          <Button disabled={!canSubmit || submitting} onClick={handleSubmit}>
            {submitting ? "Saving…" : "Save and continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
