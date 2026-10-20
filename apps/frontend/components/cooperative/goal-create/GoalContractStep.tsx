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
import { MissingFieldsBanner } from "@/components/cooperative/MissingFieldsBanner";
import { getApiErrorDetail } from "@/lib/api-error";
import { useGoalCreationStore } from "@/stores/goal-creation-store";
import GoalService from "@/services/goal-service";
import CooperativeService from "@/services/cooperative-service";
import type {
  CooperativeMember,
  CreateGoalContractPayload,
  ExitRuleType,
  ValuationMethod,
} from "@/types/cooperative";

const FIELD_LABELS: Record<string, string> = {
  visibility: "Visibility",
  withdrawal_restriction: "Withdrawal restriction",
  beneficiary_user_id: "Beneficiary",
  exit_rule_type: "Exit rule",
  valuation_method: "Valuation method",
  claim_eligibility_criteria: "Claim eligibility criteria",
  deadline: "Deadline",
};

interface GoalContractStepProps {
  cooperativeId: string;
  onContinue: () => void;
  onBack: () => void;
}

export function GoalContractStep({ cooperativeId, onContinue, onBack }: GoalContractStepProps) {
  const goalId = useGoalCreationStore((s) => s.goalId);
  const selectedPatternCode = useGoalCreationStore((s) => s.selectedPatternCode);
  const contractDraft = useGoalCreationStore((s) => s.contractDraft) as Record<string, unknown>;
  const updateContractDraft = useGoalCreationStore((s) => s.updateContractDraft);
  const contractMissing = useGoalCreationStore((s) => s.contractMissing);
  const setContractMissing = useGoalCreationStore((s) => s.setContractMissing);

  const needsBeneficiary = selectedPatternCode === "pooled_for_one";
  const needsExitRule = selectedPatternCode === "pooled_for_shared";
  const needsClaimCriteria = selectedPatternCode === "pooled_contingent";

  // The backend rejects any field a pattern doesn't allow (deadline is not
  // valid for pooled_for_shared, for example), and requires a different set
  // per pattern. Drive both the form and the POST body from this list.
  const allowsDeadline =
    selectedPatternCode === "rotating_tracked" ||
    selectedPatternCode === "pooled_for_one";
  const requiresVisibility = selectedPatternCode === "rotating_tracked";
  const requiresWithdrawal =
    selectedPatternCode === "rotating_tracked" ||
    selectedPatternCode === "pooled_for_one";

  const [members, setMembers] = useState<CooperativeMember[]>([]);
  const [claimCriteriaText, setClaimCriteriaText] = useState(
    contractDraft.claim_eligibility_criteria
      ? JSON.stringify(contractDraft.claim_eligibility_criteria, null, 2)
      : ""
  );
  const [claimCriteriaError, setClaimCriteriaError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!needsBeneficiary) return;
    CooperativeService.getCooperativeMembers(cooperativeId)
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [cooperativeId, needsBeneficiary]);

  const canSubmit =
    (!requiresVisibility || !!contractDraft.visibility) &&
    (!requiresWithdrawal || !!contractDraft.withdrawal_restriction) &&
    (!allowsDeadline || !!contractDraft.deadline) &&
    (!needsBeneficiary || !!contractDraft.beneficiary_user_id) &&
    (!needsExitRule || (!!contractDraft.exit_rule_type && !!contractDraft.valuation_method)) &&
    (!needsClaimCriteria || claimCriteriaText.trim().length > 0) &&
    !claimCriteriaError;

  async function handleSubmit() {
    if (!goalId || !canSubmit) return;

    let claimEligibilityCriteria: Record<string, unknown> | undefined;
    if (needsClaimCriteria && claimCriteriaText.trim()) {
      try {
        claimEligibilityCriteria = JSON.parse(claimCriteriaText);
      } catch {
        setClaimCriteriaError("Not valid JSON");
        return;
      }
    }

    // Only include fields this beneficiary pattern accepts; sending an
    // allowed-looking but disallowed field returns a 422.
    const payload: CreateGoalContractPayload = {};
    if (contractDraft.visibility) payload.visibility = contractDraft.visibility as string;
    if (contractDraft.withdrawal_restriction) {
      payload.withdrawal_restriction = contractDraft.withdrawal_restriction as string;
    }
    if (needsBeneficiary && contractDraft.beneficiary_user_id) {
      payload.beneficiary_user_id = contractDraft.beneficiary_user_id as string;
    }
    if (needsExitRule) {
      payload.exit_rule_type = contractDraft.exit_rule_type as ExitRuleType;
      payload.valuation_method = contractDraft.valuation_method as ValuationMethod;
    }
    if (needsClaimCriteria && claimEligibilityCriteria) {
      payload.claim_eligibility_criteria = claimEligibilityCriteria;
    }
    if (allowsDeadline && contractDraft.deadline) {
      payload.deadline = contractDraft.deadline as string;
    }

    setSubmitting(true);
    setError(null);
    setContractMissing(null);
    try {
      await GoalService.createGoalContract(goalId, payload);
      onContinue();
    } catch (err) {
      const detail = getApiErrorDetail(err);
      if (detail?.missing) {
        setContractMissing(detail.missing as string[]);
        setError(detail.message || "Some required fields are missing.");
      } else if (detail?.error === "GoalContractAlreadyExistsError") {
        // Resumed draft — contract already saved in an earlier pass.
        onContinue();
      } else {
        setError(err instanceof Error ? err.message : "Failed to save goal terms");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Goal terms</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Terms specific to the &quot;{selectedPatternCode?.replace(/_/g, " ")}&quot; pattern.
        </p>
      </div>

      {contractMissing && contractMissing.length > 0 && (
        <MissingFieldsBanner
          title="Some required fields are missing"
          missing={contractMissing}
          getLabel={(key) => FIELD_LABELS[key] ?? key}
        />
      )}

      <div className="space-y-4">
        {needsBeneficiary && (
          <div className="space-y-2">
            <Label>Beneficiary</Label>
            <Select
              value={(contractDraft.beneficiary_user_id as string) ?? ""}
              onValueChange={(v) => updateContractDraft({ beneficiary_user_id: v })}
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
        )}

        {needsExitRule && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Exit rule</Label>
              <Select
                value={(contractDraft.exit_rule_type as string) ?? ""}
                onValueChange={(v) => updateContractDraft({ exit_rule_type: v as ExitRuleType })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select exit rule" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="buyout">Buyout</SelectItem>
                  <SelectItem value="dissolve_and_split">Dissolve and split</SelectItem>
                  <SelectItem value="vote_to_sell">Vote to sell</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Valuation method</Label>
              <Select
                value={(contractDraft.valuation_method as string) ?? ""}
                onValueChange={(v) =>
                  updateContractDraft({ valuation_method: v as ValuationMethod })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="contribution_based">Contribution based</SelectItem>
                  <SelectItem value="market_appraisal">Market appraisal</SelectItem>
                  <SelectItem value="negotiated">Negotiated</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {needsClaimCriteria && (
          <div className="space-y-2">
            <Label htmlFor="claim-criteria">Claim eligibility criteria (JSON)</Label>
            <Textarea
              id="claim-criteria"
              value={claimCriteriaText}
              onChange={(e) => {
                setClaimCriteriaText(e.target.value);
                setClaimCriteriaError(null);
              }}
              placeholder='{"trigger_type": "manual_request", "conditions": []}'
              rows={4}
              className="font-mono text-xs"
            />
            {claimCriteriaError && (
              <p className="text-xs text-destructive">{claimCriteriaError}</p>
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Visibility</Label>
            <Select
              value={(contractDraft.visibility as string) ?? ""}
              onValueChange={(v) => updateContractDraft({ visibility: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="group">Group — visible to all members</SelectItem>
                <SelectItem value="private">Private — beneficiary and admins only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Withdrawal restriction</Label>
            <Select
              value={(contractDraft.withdrawal_restriction as string) ?? ""}
              onValueChange={(v) => updateContractDraft({ withdrawal_restriction: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="locked_until_deadline">Locked until deadline</SelectItem>
                <SelectItem value="flexible">Flexible</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {allowsDeadline && (
          <div className="space-y-2">
            <Label htmlFor="deadline">Deadline</Label>
            <Input
              id="deadline"
              type="date"
              value={(contractDraft.deadline as string) ?? ""}
              onChange={(e) => updateContractDraft({ deadline: e.target.value })}
            />
          </div>
        )}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? "Saving…" : "Save and continue"}
        </Button>
      </div>
    </div>
  );
}
