"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useGoalCreationStore } from "@/stores/goal-creation-store";
import GoalService from "@/services/goal-service";
import type { BeneficiaryPattern, GoalCategory } from "@/types/cooperative";

interface GoalBasicsStepProps {
  cooperativeId: string;
  onContinue: () => void;
}

export function GoalBasicsStep({ cooperativeId, onContinue }: GoalBasicsStepProps) {
  const goalId = useGoalCreationStore((s) => s.goalId);
  const setGoalId = useGoalCreationStore((s) => s.setGoalId);
  const basicsDraft = useGoalCreationStore((s) => s.basicsDraft);
  const updateBasicsDraft = useGoalCreationStore((s) => s.updateBasicsDraft);
  const selectedPatternCode = useGoalCreationStore((s) => s.selectedPatternCode);
  const selectPattern = useGoalCreationStore((s) => s.selectPattern);

  const [categories, setCategories] = useState<GoalCategory[]>([]);
  const [patterns, setPatterns] = useState<BeneficiaryPattern[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingCatalog(true);
    Promise.all([
      GoalService.getGoalCategories().catch(() => []),
      GoalService.getBeneficiaryPatterns().catch(() => []),
    ]).then(([cats, pats]) => {
      if (cancelled) return;
      setCategories(cats);
      setPatterns(pats);
      updateBasicsDraft({
        goal_category_id: basicsDraft.goal_category_id || cats[0]?.id,
      });
      if (!selectedPatternCode && pats[0]) {
        selectPattern(pats[0].code, pats[0].id);
      }
    }).finally(() => {
      if (!cancelled) setLoadingCatalog(false);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canSubmit =
    !!basicsDraft.name?.trim() &&
    basicsDraft.target_amount != null &&
    !!basicsDraft.target_date &&
    !!basicsDraft.goal_category_id &&
    !!basicsDraft.beneficiary_pattern_id;

  async function handleSubmit() {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const goal = await GoalService.createGoal(cooperativeId, {
        name: basicsDraft.name!.trim(),
        description: basicsDraft.description?.trim() || undefined,
        target_amount: Number(basicsDraft.target_amount),
        currency: basicsDraft.currency || "NGN",
        target_date: basicsDraft.target_date,
        goal_category_id: basicsDraft.goal_category_id!,
        beneficiary_pattern_id: basicsDraft.beneficiary_pattern_id!,
      });
      setGoalId(goal.id);
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create goal");
    } finally {
      setSubmitting(false);
    }
  }

  // Goal already created in an earlier pass of this draft — basics is a
  // one-shot POST, so once goalId exists just let people move on.
  if (goalId) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold">Goal basics</h2>
          <p className="text-sm text-muted-foreground mt-1">
            &quot;{basicsDraft.name}&quot; has already been created — continue to set up its
            terms.
          </p>
        </div>
        <div className="flex justify-end">
          <Button onClick={onContinue}>Continue</Button>
        </div>
      </div>
    );
  }

  if (loadingCatalog) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Goal basics</h2>
        <p className="text-sm text-muted-foreground mt-1">
          What is this goal for, how much, and by when.
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="goal-name">Name</Label>
          <Input
            id="goal-name"
            value={basicsDraft.name ?? ""}
            onChange={(e) => updateBasicsDraft({ name: e.target.value })}
            placeholder="e.g. End of Year Equipment Procurement"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="goal-description">Description</Label>
          <Textarea
            id="goal-description"
            value={basicsDraft.description ?? ""}
            onChange={(e) => updateBasicsDraft({ description: e.target.value })}
            placeholder="Brief details about what this goal aims to achieve..."
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 space-y-2">
            <Label htmlFor="target-amount">Target amount</Label>
            <Input
              id="target-amount"
              type="number"
              min={0}
              step="any"
              value={basicsDraft.target_amount ?? ""}
              onChange={(e) => updateBasicsDraft({ target_amount: Number(e.target.value) })}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select
              value={basicsDraft.currency || "NGN"}
              onValueChange={(v) => updateBasicsDraft({ currency: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="NGN">NGN (₦)</SelectItem>
                <SelectItem value="USD">USD ($)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="target-date">Target date</Label>
          <Input
            id="target-date"
            type="date"
            value={basicsDraft.target_date ?? ""}
            onChange={(e) => updateBasicsDraft({ target_date: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <Label>Goal category</Label>
          <Select
            value={basicsDraft.goal_category_id}
            onValueChange={(v) => updateBasicsDraft({ goal_category_id: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Beneficiary pattern</Label>
          <p className="text-xs text-muted-foreground">
            How the payout from this goal is structured — determines which terms you set next.
          </p>
          <div className="grid gap-2">
            {patterns.map((pat) => (
              <button
                key={pat.id}
                type="button"
                onClick={() => selectPattern(pat.code, pat.id)}
                className={cn(
                  "text-left rounded-md border p-3 text-sm transition-colors",
                  selectedPatternCode === pat.code
                    ? "border-primary bg-primary/5"
                    : "border-input hover:bg-muted/50"
                )}
              >
                <span className="font-medium">{pat.name}</span>
                {pat.description && (
                  <p className="text-xs text-muted-foreground mt-0.5">{pat.description}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end">
        <Button disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? "Creating…" : "Create goal and continue"}
        </Button>
      </div>
    </div>
  );
}
