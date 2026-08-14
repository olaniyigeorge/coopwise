"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X, Plus } from "lucide-react";
import { useCooperativeCreationStore } from "@/stores/cooperative-creation-store";
import RulesService from "@/services/rules-service";
import type { DecisionType, DecisionMechanism } from "@/types/cooperative";

const DECISION_TYPE_LABELS: Record<DecisionType, string> = {
  payout_order: "Payout order",
  dispute_resolution: "Dispute resolution",
  exit_valuation: "Exit valuation",
  rule_amendment: "Rule amendment",
  new_member_approval: "New member approval",
};

const DECISION_TYPES = Object.keys(DECISION_TYPE_LABELS) as DecisionType[];

const MECHANISM_OPTIONS: { value: DecisionMechanism; label: string }[] = [
  { value: "admin", label: "Admin decides" },
  { value: "vote", label: "Member vote" },
  { value: "ai_suggested", label: "AI suggested" },
  { value: "rotation", label: "Rotation" },
  { value: "lottery", label: "Lottery" },
];

type KVPair = { key: string; value: string };

interface DecisionRulesStepProps {
  onContinue: () => void;
  onBack: () => void;
}

export function DecisionRulesStep({ onContinue, onBack }: DecisionRulesStepProps) {
  const cooperativeId = useCooperativeCreationStore((s) => s.cooperativeId);
  const decisionDrafts = useCooperativeCreationStore((s) => s.decisionDrafts);
  const toggleDecisionType = useCooperativeCreationStore((s) => s.toggleDecisionType);
  const updateDecisionDraft = useCooperativeCreationStore((s) => s.updateDecisionDraft);

  const [savingType, setSavingType] = useState<DecisionType | null>(null);
  const [savedTypes, setSavedTypes] = useState<Set<DecisionType>>(new Set());
  const [errorByType, setErrorByType] = useState<Partial<Record<DecisionType, string>>>({});

  // Local, per-type key/value builder for escalation_path — dict[str, Any]
  // on the backend with no fixed schema, so this isn&apos;t sourced from the
  // shared store.
  const [escalationPairs, setEscalationPairs] = useState<Record<DecisionType, KVPair[]>>(() =>
    DECISION_TYPES.reduce((acc, t) => {
      acc[t] = [];
      return acc;
    }, {} as Record<DecisionType, KVPair[]>)
  );

  function addPair(type: DecisionType) {
    setEscalationPairs((prev) => ({
      ...prev,
      [type]: [...prev[type], { key: "", value: "" }],
    }));
  }

  function updatePair(type: DecisionType, index: number, field: "key" | "value", val: string) {
    setEscalationPairs((prev) => ({
      ...prev,
      [type]: prev[type].map((p, i) => (i === index ? { ...p, [field]: val } : p)),
    }));
  }

  function removePair(type: DecisionType, index: number) {
    setEscalationPairs((prev) => ({
      ...prev,
      [type]: prev[type].filter((_, i) => i !== index),
    }));
  }

  function pairsToDict(pairs: KVPair[]): Record<string, string> | null {
    const entries = pairs.filter((p) => p.key.trim() !== "");
    if (entries.length === 0) return null;
    return Object.fromEntries(entries.map((p) => [p.key.trim(), p.value]));
  }

  async function handleSaveType(type: DecisionType) {
    if (!cooperativeId) return;
    const values = decisionDrafts[type].values;
    if (!values.mechanism?.trim()) {
      setErrorByType((prev) => ({ ...prev, [type]: "Mechanism is required" }));
      return;
    }
    setSavingType(type);
    setErrorByType((prev) => ({ ...prev, [type]: undefined as any }));
    try {
      await RulesService.createDecisionRule(cooperativeId, {
        decision_type: type,
        // Cast is a stopgap — decisionDrafts[type].values.mechanism is still
        // typed as plain `string` in the store. Send the store's type over
        // to DecisionMechanism to remove this cast.
        mechanism: values.mechanism.trim() as DecisionMechanism,
        escalation_path: pairsToDict(escalationPairs[type]),
      });
      setSavedTypes((prev) => new Set(prev).add(type));
    } catch (err) {
      setErrorByType((prev) => ({
        ...prev,
        [type]: err instanceof Error ? err.message : "Failed to save",
      }));
    } finally {
      setSavingType(null);
    }
  }

  if (!cooperativeId) {
    return (
      <p className="text-sm text-muted-foreground">
        Create the cooperative in Step 1 first.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">Decision rules</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Optional — set as many or as few as you want now. None of these
          block activation.
        </p>
      </div>

      <div className="space-y-3">
        {DECISION_TYPES.map((type) => {
          const draft = decisionDrafts[type];
          const saved = savedTypes.has(type);
          const pairs = escalationPairs[type];
          return (
            <Card key={type} className="p-4">
              <div className="flex items-center justify-between">
                <Label htmlFor={`decision-${type}`} className="font-medium">
                  {DECISION_TYPE_LABELS[type]}
                  {saved && (
                    <span className="ml-2 text-xs text-green-600 font-normal">Saved</span>
                  )}
                </Label>
                <Switch
                  id={`decision-${type}`}
                  checked={draft.enabled}
                  onCheckedChange={(checked) => toggleDecisionType(type, checked)}
                />
              </div>

              {draft.enabled && (
                <div className="mt-4 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`${type}-mechanism`}>Mechanism</Label>
                    <Select
                      value={draft.values.mechanism ?? ""}
                      onValueChange={(value) =>
                        updateDecisionDraft(type, { mechanism: value as DecisionMechanism })
                      }
                    >
                      <SelectTrigger id={`${type}-mechanism`}>
                        <SelectValue placeholder="Select a mechanism" />
                      </SelectTrigger>
                      <SelectContent>
                        {MECHANISM_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>
                            {opt.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Escalation path (optional)</Label>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => addPair(type)}
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" />
                        Add field
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Define any fields that fit this escalation path — e.g.
                      &apos;trigger&apos; / &apos;3 missed payments&apos;, &apos;action&apos; / &apos;notify admin&apos;.
                    </p>
                    {pairs.map((pair, i) => (
                      <div key={i} className="flex gap-2 items-center">
                        <Input
                          value={pair.key}
                          onChange={(e) => updatePair(type, i, "key", e.target.value)}
                          placeholder="Key (e.g. trigger)"
                          className="w-1/3"
                        />
                        <Input
                          value={pair.value}
                          onChange={(e) => updatePair(type, i, "value", e.target.value)}
                          placeholder="Value (e.g. notify admin)"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => removePair(type, i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>

                  {errorByType[type] && (
                    <p className="text-sm text-destructive">{errorByType[type]}</p>
                  )}
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      disabled={savingType === type}
                      onClick={() => handleSaveType(type)}
                    >
                      {savingType === type ? "Saving…" : saved ? "Save new version" : "Save"}
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <div className="flex justify-between">
        <Button variant="ghost" onClick={onBack}>
          Back
        </Button>
        <Button onClick={onContinue}>Continue</Button>
      </div>
    </div>
  );
}