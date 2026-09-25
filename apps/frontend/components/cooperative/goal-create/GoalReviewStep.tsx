"use client";

import { Button } from "@/components/ui/button";
import { useGoalCreationStore } from "@/stores/goal-creation-store";

interface GoalReviewStepProps {
  onDone: () => void;
  onBack: () => void;
}

export function GoalReviewStep({ onDone, onBack }: GoalReviewStepProps) {
  const basicsDraft = useGoalCreationStore((s) => s.basicsDraft);
  const selectedPatternCode = useGoalCreationStore((s) => s.selectedPatternCode);
  const contractDraft = useGoalCreationStore((s) => s.contractDraft) as Record<string, unknown>;
  const ownershipShares = useGoalCreationStore((s) => s.ownershipShares);
  const reset = useGoalCreationStore((s) => s.reset);

  function handleDone() {
    reset();
    onDone();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Review</h2>
        <p className="text-sm text-muted-foreground mt-1">
          &quot;{basicsDraft.name}&quot; is set up — review before you finish.
        </p>
      </div>

      <dl className="space-y-3 text-sm rounded-md border p-4">
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Target</dt>
          <dd>
            {basicsDraft.target_amount} {basicsDraft.currency} by {basicsDraft.target_date}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted-foreground">Pattern</dt>
          <dd className="capitalize">{selectedPatternCode?.replace(/_/g, " ")}</dd>
        </div>
        {Object.entries(contractDraft)
          .filter(([, v]) => v !== undefined && v !== "")
          .map(([key, value]) => (
            <div key={key} className="flex justify-between">
              <dt className="text-muted-foreground capitalize">{key.replace(/_/g, " ")}</dt>
              <dd className="max-w-[60%] truncate text-right">
                {typeof value === "object" ? JSON.stringify(value) : String(value)}
              </dd>
            </div>
          ))}
        {ownershipShares.length > 0 && (
          <div>
            <dt className="text-muted-foreground mb-1">Ownership shares</dt>
            <dd>
              <ul className="space-y-1">
                {ownershipShares.map((row) => (
                  <li key={row._rowId} className="flex justify-between">
                    <span>{row.user_id}</span>
                    <span>{row.share_pct}%</span>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
      </dl>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={handleDone}>Done</Button>
      </div>
    </div>
  );
}
