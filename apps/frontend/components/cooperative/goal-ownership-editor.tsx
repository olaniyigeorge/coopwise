"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import GoalService from "@/services/goal-service";
import CooperativeService from "@/services/cooperative-service";
import type {
  ContractBasis,
  CooperativeMember,
  OwnershipShare,
} from "@/types/cooperative";

interface Row {
  rowId: string;
  shareId?: string; // set for shares that already exist on the server
  user_id: string;
  share_pct: string;
  basis: ContractBasis;
}

function blankRow(): Row {
  return {
    rowId: crypto.randomUUID(),
    user_id: "",
    share_pct: "",
    basis: "contribution_based",
  };
}

interface GoalOwnershipEditorProps {
  cooperativeId: string;
  goalId: string;
  goalName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

/**
 * Ownership allocation for pooled_for_shared goals, editable after the goal
 * exists. Members rarely all exist at goal-creation time, so this is the
 * place to top up shares as people join.
 */
export function GoalOwnershipEditor({
  cooperativeId,
  goalId,
  goalName,
  open,
  onOpenChange,
  onSaved,
}: GoalOwnershipEditorProps) {
  const [members, setMembers] = useState<CooperativeMember[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [original, setOriginal] = useState<Record<string, OwnershipShare>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [shares, memberList] = await Promise.all([
        GoalService.getOwnershipShares(goalId),
        CooperativeService.getCooperativeMembers(cooperativeId).catch(() => []),
      ]);
      setMembers(memberList);
      setOriginal(Object.fromEntries(shares.map((share) => [share.id, share])));
      setRows(
        shares.length > 0
          ? shares.map((share) => ({
              rowId: share.id,
              shareId: share.id,
              user_id: share.user_id,
              share_pct: String(share.share_pct),
              basis: share.basis,
            }))
          : [blankRow()]
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ownership shares");
      setRows([blankRow()]);
    } finally {
      setLoading(false);
    }
  }, [goalId, cooperativeId]);

  useEffect(() => {
    if (open) load();
  }, [open, load]);

  const total = rows.reduce((sum, row) => sum + (Number(row.share_pct) || 0), 0);
  const rowsValid = rows.every(
    (row) => !!row.user_id && Number(row.share_pct) > 0
  );
  const canSave = !loading && !saving && rowsValid && total <= 100;

  function updateRow(rowId: string, patch: Partial<Row>) {
    setRows((prev) =>
      prev.map((row) => (row.rowId === rowId ? { ...row, ...patch } : row))
    );
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      // Delete first so freeing a slice can't trip the 100% ceiling while
      // the remaining shares are being written.
      const keptIds = new Set(
        rows.map((row) => row.shareId).filter((id): id is string => !!id)
      );
      const removedIds = Object.keys(original).filter((id) => !keptIds.has(id));
      for (const shareId of removedIds) {
        await GoalService.deleteOwnershipShare(goalId, shareId);
      }

      for (const row of rows) {
        const sharePct = Number(row.share_pct);
        if (row.shareId) {
          const previous = original[row.shareId];
          const changed =
            Number(previous.share_pct) !== sharePct ||
            previous.basis !== row.basis;
          if (changed) {
            await GoalService.updateOwnershipShare(goalId, row.shareId, {
              share_pct: sharePct,
              basis: row.basis,
            });
          }
        } else {
          await GoalService.createOwnershipShare(goalId, {
            user_id: row.user_id,
            share_pct: sharePct,
            basis: row.basis,
          });
        }
      }

      onSaved?.();
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save ownership shares"
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ownership · {goalName}</DialogTitle>
          <DialogDescription>
            Who owns how much of this goal. Members who join later can be added
            here at any time.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-3 py-4">
            <div className="h-11 animate-pulse rounded-xl bg-content/[0.06]" />
            <div className="h-11 animate-pulse rounded-xl bg-content/[0.06]" />
          </div>
        ) : (
          <div className="space-y-3 py-2">
            {rows.map((row) => (
              <div
                key={row.rowId}
                className="grid grid-cols-1 gap-2 rounded-xl border border-content/10 p-3 sm:grid-cols-[1fr_90px_150px_auto] sm:items-end sm:border-0 sm:p-0"
              >
                <div className="space-y-1">
                  <Label className="text-xs">Member</Label>
                  <Select
                    value={row.user_id}
                    onValueChange={(value) => updateRow(row.rowId, { user_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {members.map((member) => (
                        <SelectItem key={member.user_id} value={member.user_id}>
                          {member.user?.full_name ||
                            member.user?.username ||
                            member.user_id}
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
                    value={row.share_pct}
                    onChange={(e) =>
                      updateRow(row.rowId, { share_pct: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Basis</Label>
                  <Select
                    value={row.basis}
                    onValueChange={(value) =>
                      updateRow(row.rowId, { basis: value as ContractBasis })
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
                  aria-label="Remove member"
                  onClick={() =>
                    setRows((prev) => prev.filter((r) => r.rowId !== row.rowId))
                  }
                  disabled={rows.length === 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setRows((prev) => [...prev, blankRow()])}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add member
            </Button>

            <p
              className={`text-sm ${
                total === 100 ? "text-content/50" : "text-[#8A6516] dark:text-[#E8BC63]"
              }`}
            >
              Total: {total}%{total !== 100 && " — shares should add up to 100%"}
            </p>
          </div>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full"
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            className="rounded-full bg-[#0E3B2E] text-white hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]"
          >
            {saving ? "Saving…" : "Save shares"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
