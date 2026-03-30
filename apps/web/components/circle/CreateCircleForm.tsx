"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Loader2, Users, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // Ensure you have this UI component
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";
import CircleService from "@/lib/circle-service";

// Aligning with Backend Enums
type ContributionFrequency = "daily" | "weekly" | "biweekly" | "monthly";
type PayoutStrategy = "rotating" | "random" | "fixed";
type CooperativeModel = "coop" | "ajo" | "esusu" | "chama";
type Currency = "NGN" | "KES" | "GHS";

const CURRENCY_LABELS: Record<Currency, { symbol: string }> = {
  NGN: { symbol: "₦" },
  KES: { symbol: "KSh" },
  GHS: { symbol: "GH₵" },
};

export function CreateCircleForm() {
  const router = useRouter();

  // 1. Basic Info
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  
  // 2. Financials
  const [contributionAmount, setContributionAmount] = useState("");
  const [currency, setCurrency] = useState<Currency>("NGN");
  const [frequency, setFrequency] = useState<ContributionFrequency>("weekly");
  
  // 3. Logic & Strategy
  const [payoutStrategy, setPayoutStrategy] = useState<PayoutStrategy>("rotating");
  const [coopModel, setCoopModel] = useState<CooperativeModel>("ajo");
  const [rotationOrder, setRotationOrder] = useState("sequential");
  
  // 4. Members
  const [maxMembers, setMaxMembers] = useState("5");
  const [memberPhones, setMemberPhones] = useState<string[]>([""]);

  // 5. State Helpers
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txPhase, setTxPhase] = useState<"idle" | "creating" | "sealing">("idle");

  // Auto-calculate target amount for the UI
  const targetAmount = (parseFloat(contributionAmount) || 0) * (parseInt(maxMembers) || 0);

  const handlePhoneChange = (idx: number, value: string) => {
    const updated = [...memberPhones];
    updated[idx] = value;
    setMemberPhones(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const amount = parseFloat(contributionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    const cleanPhones = memberPhones.map(p => p.trim()).filter(p => p.length > 0);

    // Matching CoopGroupCreate exactly
    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      contribution_amount: amount,
      currency: currency,
      contribution_frequency: frequency,
      payout_strategy: payoutStrategy,
      coop_model: coopModel,
      max_members: parseInt(maxMembers),
      target_amount: targetAmount,
      rotation_order: rotationOrder,
      member_phones: cleanPhones,
      status: "pending", // Backend usually expects this as initial state
      rules: [], // Optional: add logic for custom rules later
    };

    try {
      setIsSubmitting(true);
      setTxPhase("creating");

      const { circle_id, tx_id } = await CircleService.createCircle(
        payload as import("@/lib/circle-service").CreateCirclePayload
      );

      if (tx_id) {
        setTxPhase("sealing");
        await CircleService.waitForTx(tx_id);
      }

      toast({
        title: "Circle created!",
        description: `"${name}" is active on the Flow blockchain.`,
      });

      router.push(`/dashboard/circle/${circle_id}`);
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.message || "Creation failed";
      toast({ title: "Error", description: String(msg), variant: "destructive" });
    } finally {
      setIsSubmitting(false);
      setTxPhase("idle");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto pb-10">
      {/* SECTION: BASIC INFO */}
      <div className="space-y-4 border-b pb-6">
        <div className="space-y-1.5">
          <Label htmlFor="name">Circle Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Family Savings" required disabled={isSubmitting} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="desc">Description (Optional)</Label>
          <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="What is this group for?" disabled={isSubmitting} />
        </div>
      </div>

      {/* SECTION: FINANCIALS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Contribution Amount</Label>
          <div className="flex gap-2">
            <Select value={currency} onValueChange={(v) => setCurrency(v as Currency)} disabled={isSubmitting}>
              <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="NGN">NGN</SelectItem>
                <SelectItem value="KES">KES</SelectItem>
                <SelectItem value="GHS">GHS</SelectItem>
              </SelectContent>
            </Select>
            <Input type="number" value={contributionAmount} onChange={(e) => setContributionAmount(e.target.value)} placeholder="5000" required disabled={isSubmitting} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Frequency</Label>
          <Select value={frequency} onValueChange={(v) => setFrequency(v as ContributionFrequency)} disabled={isSubmitting}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="biweekly">Bi-Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SECTION: STRATEGY & MEMBERS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Max Members</Label>
          <Input type="number" value={maxMembers} onChange={(e) => setMaxMembers(e.target.value)} min="2" disabled={isSubmitting} />
        </div>

        <div className="space-y-1.5">
          <Label>Cooperative Model</Label>
          <Select value={coopModel} onValueChange={(v) => setCoopModel(v as CooperativeModel)} disabled={isSubmitting}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="coop">Fixed Cooperative</SelectItem>
              <SelectItem value="ajo">ROSCA (Rotating)</SelectItem>
              <SelectItem value="esusu">Fixed Savings</SelectItem>
              <SelectItem value="chama">Chamas</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* SECTION: MEMBERS PRE-INVITE */}
      <div className="space-y-3">
        <Label className="flex items-center gap-2"><Users className="w-4 h-4" /> Member Invitations</Label>
        {memberPhones.map((phone, idx) => (
          <div key={idx} className="flex gap-2">
            <Input type="tel" placeholder="+234..." value={phone} onChange={(e) => handlePhoneChange(idx, e.target.value)} disabled={isSubmitting} />
            {memberPhones.length > 1 && (
              <Button type="button" variant="ghost" size="icon" onClick={() => setMemberPhones(prev => prev.filter((_, i) => i !== idx))}><Trash2 className="w-4 h-4 text-destructive" /></Button>
            )}
          </div>
        ))}
        <Button type="button" variant="outline" size="sm" onClick={() => setMemberPhones(p => [...p, ""])} disabled={isSubmitting}>
          <Plus className="w-4 h-4 mr-2" /> Add Member
        </Button>
      </div>

      {/* SUMMARY BOX */}
      <div className="bg-muted/50 p-4 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Total Circle Target:</span>
          <span className="font-bold">{CURRENCY_LABELS[currency].symbol}{targetAmount.toLocaleString()}</span>
        </div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-widest flex items-center gap-1">
          <Target className="w-3 h-3" /> SECURED BY FLOW BLOCKCHAIN & ZAMA FHE
        </p>
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            {txPhase === "creating" ? "Initializing on Flow..." : "Waiting for Sealing..."}
          </>
        ) : (
          "Create Circle"
        )}
      </Button>
    </form>
  );
}