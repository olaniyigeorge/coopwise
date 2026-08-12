"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCooperativeCreationStore } from "@/stores/cooperative-creation-store";
import RulesService from "@/services/rules-service";
import type { JoinType, KycLevelRequired, RemovalPolicy } from "@/types/cooperative";

// UNCONFIRMED enum values — swap once schema confirmed.
const JOIN_TYPES: { value: JoinType; label: string }[] = [
  { value: "open", label: "Open — anyone can join" },
  { value: "invite_only", label: "Invite only" },
  { value: "approval_required", label: "Requires approval" },
];

const KYC_LEVELS: { value: KycLevelRequired; label: string }[] = [
  { value: "none", label: "None" },
  { value: "basic", label: "Basic" },
  { value: "full", label: "Full" },
];

const REMOVAL_POLICIES: { value: RemovalPolicy; label: string }[] = [
  { value: "admin", label: "Admin" },
  { value: "vote", label: "Vote" },
  { value: "auto_on_default", label: "Automatic (rule-based)" },
];

interface MembershipRuleFormProps {
  onContinue: () => void;
  onBack: () => void;
}

export function MembershipRuleForm({ onContinue, onBack }: MembershipRuleFormProps) {
  const cooperativeId = useCooperativeCreationStore((s) => s.cooperativeId);
  const draft = useCooperativeCreationStore((s) => s.membershipDraft);
  const updateDraft = useCooperativeCreationStore((s) => s.updateMembershipDraft);
  const markRuleSaved = useCooperativeCreationStore((s) => s.markRuleSaved);

  const [loadingActive, setLoadingActive] = useState(true);
  const [hasActive, setHasActive] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cooperativeId) return;
    let cancelled = false;
    setLoadingActive(true);
    RulesService.getActiveMembershipRule(cooperativeId)
      .then((rule) => {
        if (cancelled) return;
        setHasActive(true);
        updateDraft({
          join_type: rule.join_type,
          min_members: rule.min_members,
          max_members: rule.max_members,
          public_discovery: rule.public_discovery,
          kyc_level_required: rule.kyc_level_required,
          exit_notice_days: rule.exit_notice_days,
          removal_policy: rule.removal_policy,
        });
      })
      .catch(() => {
        if (!cancelled) setHasActive(false);
      })
      .finally(() => {
        if (!cancelled) setLoadingActive(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cooperativeId]);

  const canSubmit =
    !!draft.join_type &&
    draft.min_members != null &&
    draft.public_discovery != null &&
    !!draft.kyc_level_required &&
    draft.exit_notice_days != null &&
    !!draft.removal_policy;

  async function handleSubmit() {
    if (!cooperativeId || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      await RulesService.createMembershipRule(cooperativeId, {
        join_type: draft.join_type!,
        min_members: draft.min_members!,
        max_members: draft.max_members ?? null,
        public_discovery: draft.public_discovery!,
        kyc_level_required: draft.kyc_level_required!,
        exit_notice_days: draft.exit_notice_days!,
        removal_policy: draft.removal_policy!,
      });
      markRuleSaved("membership");
      onContinue();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save membership rule");
    } finally {
      setSubmitting(false);
    }
  }

  if (!cooperativeId) {
    return (
      <p className="text-sm text-muted-foreground">
        Create the cooperative in Step 1 first.
      </p>
    );
  }

  if (loadingActive) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Membership rule</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {hasActive
            ? "This saves a new version — history is kept, nothing is overwritten."
            : "Who can join, and how membership is managed."}
        </p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Join type</Label>
          <Select
            value={draft.join_type}
            onValueChange={(v) => updateDraft({ join_type: v as JoinType })}
          >
            <SelectTrigger>
              <SelectValue placeholder="How do people join?" />
            </SelectTrigger>
            <SelectContent>
              {JOIN_TYPES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="min-members">Minimum members</Label>
            <Input
              id="min-members"
              type="number"
              min={1}
              value={draft.min_members ?? ""}
              onChange={(e) => updateDraft({ min_members: Number(e.target.value) })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="max-members">Maximum members (optional)</Label>
            <Input
              id="max-members"
              type="number"
              min={1}
              value={draft.max_members ?? ""}
              onChange={(e) =>
                updateDraft({ max_members: e.target.value ? Number(e.target.value) : null })
              }
            />
          </div>
        </div>

        <div className="flex items-center justify-between rounded-md border p-3">
          <Label htmlFor="public-discovery">Discoverable publicly</Label>
          <Switch
            id="public-discovery"
            checked={!!draft.public_discovery}
            onCheckedChange={(checked) => updateDraft({ public_discovery: checked })}
          />
        </div>

        <div className="space-y-2">
          <Label>KYC level required</Label>
          <Select
            value={draft.kyc_level_required}
            onValueChange={(v) => updateDraft({ kyc_level_required: v as KycLevelRequired })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a KYC level" />
            </SelectTrigger>
            <SelectContent>
              {KYC_LEVELS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="exit-notice-days">Exit notice period (days)</Label>
          <Input
            id="exit-notice-days"
            type="number"
            min={0}
            value={draft.exit_notice_days ?? ""}
            onChange={(e) => updateDraft({ exit_notice_days: Number(e.target.value) })}
          />
        </div>

        <div className="space-y-2">
          <Label>Removal policy</Label>
          <Select
            value={draft.removal_policy}
            onValueChange={(v) => updateDraft({ removal_policy: v as RemovalPolicy })}
          >
            <SelectTrigger>
              <SelectValue placeholder="How are members removed?" />
            </SelectTrigger>
            <SelectContent>
              {REMOVAL_POLICIES.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button disabled={!canSubmit || submitting} onClick={handleSubmit}>
          {submitting ? "Saving…" : hasActive ? "Save new version" : "Save and continue"}
        </Button>
      </div>
    </div>
  );
}