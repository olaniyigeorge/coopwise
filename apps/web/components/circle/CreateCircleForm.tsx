"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Users, Coins, Calendar } from "lucide-react";
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
import { toast } from "@/components/ui/use-toast";
import CircleService, { CreateCirclePayload } from "@/lib/circle-service";

type PayoutSchedule = "weekly" | "biweekly" | "monthly";
type RotationOrder = "sequential" | "random";
type Currency = "NGN" | "KES" | "GHS";

const CURRENCY_LABELS: Record<Currency, { symbol: string; label: string }> = {
  NGN: { symbol: "₦", label: "Nigerian Naira" },
  KES: { symbol: "KSh", label: "Kenyan Shilling" },
  GHS: { symbol: "GH₵", label: "Ghanaian Cedi" },
};

const SCHEDULE_LABELS: Record<PayoutSchedule, string> = {
  weekly: "Weekly",
  biweekly: "Every 2 weeks",
  monthly: "Monthly",
};

export function CreateCircleForm() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [weeklyAmount, setWeeklyAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [payoutSchedule, setPayoutSchedule] = useState<PayoutSchedule>("weekly");
  const [rotationOrder, setRotationOrder] = useState<RotationOrder>("sequential");
  const [memberPhones, setMemberPhones] = useState<string[]>([""]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txPhase, setTxPhase] = useState<"idle" | "creating" | "sealing">("idle");

  const currSymbol = CURRENCY_LABELS[currency].symbol;

  const handlePhoneChange = (idx: number, value: string) => {
    const updated = [...memberPhones];
    updated[idx] = value;
    setMemberPhones(updated);
  };

  const addPhone = () => setMemberPhones((prev) => [...prev, ""]);

  const removePhone = (idx: number) =>
    setMemberPhones((prev) => prev.filter((_, i) => i !== idx));

  const validatePhones = (phones: string[]): string[] => {
    return phones
      .map((p) => p.trim())
      .filter((p) => p.length > 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(weeklyAmount.replace(/[^\d.]/g, ""));
    if (!name.trim()) {
      toast({ title: "Circle name is required", variant: "destructive" });
      return;
    }
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Enter a valid contribution amount", variant: "destructive" });
      return;
    }

    const cleanPhones = validatePhones(memberPhones);

    const payload: CreateCirclePayload = {
      name: name.trim(),
      member_phones: cleanPhones,
      weekly_amount_local: amount,
      currency,
      payout_schedule: payoutSchedule,
      rotation_order: rotationOrder,
    };

    try {
      setIsSubmitting(true);
      setTxPhase("creating");

      const { circle_id, tx_id } = await CircleService.createCircle(payload);

      // Wait for the Flow blockchain transaction to seal (~5–15 s on testnet)
      setTxPhase("sealing");
      await CircleService.waitForTx(tx_id);

      toast({
        title: "Circle created!",
        description: `"${name}" is live on the Flow blockchain.`,
        className: "border-green-500 bg-green-50",
      });

      router.push(`/dashboard/circle/${circle_id}`);
    } catch (err: any) {
      const msg =
        err?.response?.data?.detail ||
        err?.message ||
        "Failed to create circle. Please try again.";
      toast({ title: "Error", description: msg, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setTxPhase("idle");
    }
  };

  const submitLabel = () => {
    if (txPhase === "creating") return "Submitting to blockchain…";
    if (txPhase === "sealing") return "Waiting for confirmation…";
    return "Create Circle";
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Circle name */}
      <div className="space-y-1.5">
        <Label htmlFor="circle-name">Circle name</Label>
        <Input
          id="circle-name"
          placeholder="e.g. Lagos Girls Monthly Ajo"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isSubmitting}
          required
        />
      </div>

      {/* Contribution amount + currency */}
      <div className="space-y-1.5">
        <Label>Contribution amount per round</Label>
        <div className="flex gap-2">
          <Select
            value={currency}
            onValueChange={(v) => setCurrency(v as Currency)}
            disabled={isSubmitting}
          >
            <SelectTrigger className="w-[120px] shrink-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(CURRENCY_LABELS) as Currency[]).map((c) => (
                <SelectItem key={c} value={c}>
                  {c} ({CURRENCY_LABELS[c].symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              {currSymbol}
            </span>
            <Input
              type="text"
              inputMode="numeric"
              className="pl-8"
              placeholder="5,000"
              value={weeklyAmount}
              onChange={(e) => setWeeklyAmount(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          CoopWise converts this to USDC on-chain. Your group sees{" "}
          <strong>only ✓ / ✗</strong> — individual amounts stay private (Zama
          FHE).
        </p>
      </div>

      {/* Payout schedule */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4" /> Payout schedule
        </Label>
        <Select
          value={payoutSchedule}
          onValueChange={(v) => setPayoutSchedule(v as PayoutSchedule)}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(SCHEDULE_LABELS) as PayoutSchedule[]).map((s) => (
              <SelectItem key={s} value={s}>
                {SCHEDULE_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Rotation order */}
      <div className="space-y-1.5">
        <Label className="flex items-center gap-1.5">
          <Coins className="w-4 h-4" /> Rotation order
        </Label>
        <Select
          value={rotationOrder}
          onValueChange={(v) => setRotationOrder(v as RotationOrder)}
          disabled={isSubmitting}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="sequential">Sequential (fixed order)</SelectItem>
            <SelectItem value="random">Random (shuffled)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Member phone numbers */}
      <div className="space-y-2">
        <Label className="flex items-center gap-1.5">
          <Users className="w-4 h-4" /> Invite members (phone numbers)
        </Label>
        <p className="text-xs text-muted-foreground">
          Members must already have a CoopWise account. Leave blank to create a
          private circle and invite later.
        </p>
        {memberPhones.map((phone, idx) => (
          <div key={idx} className="flex gap-2">
            <Input
              type="tel"
              placeholder="+2348012345678"
              value={phone}
              onChange={(e) => handlePhoneChange(idx, e.target.value)}
              disabled={isSubmitting}
              className="flex-1"
            />
            {memberPhones.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removePhone(idx)}
                disabled={isSubmitting}
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            )}
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={addPhone}
          disabled={isSubmitting}
        >
          <Plus className="w-3.5 h-3.5" /> Add member
        </Button>
      </div>

      {/* Blockchain status hint */}
      {txPhase === "sealing" && (
        <div className="rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
          Waiting for the Flow blockchain to confirm your circle… This usually
          takes 5–15 seconds.
        </div>
      )}

      <Button
        type="submit"
        className="w-full bg-primary hover:bg-primary/90 text-white"
        disabled={isSubmitting}
      >
        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
        {submitLabel()}
      </Button>
    </form>
  );
}
