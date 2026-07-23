// components/admin/kyc/RejectDialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: (reason: string) => Promise<void> | void;
}

const MIN_REASON_LENGTH = 10;

export function RejectDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: RejectDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const tooShort = reason.trim().length < MIN_REASON_LENGTH;

  async function handleConfirm() {
    if (tooShort) return;
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
      setReason("");
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-brand-paper border-brand-ink/10">
        <DialogHeader>
          <DialogTitle className="font-display text-brand-ink">
            {title}
          </DialogTitle>
        </DialogHeader>
        {description && (
          <p className="text-sm text-brand-secondary">{description}</p>
        )}
        <div className="space-y-1.5">
          <Textarea
            autoFocus
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason shown to the applicant — be specific about what to fix."
            rows={4}
            className="bg-white/60 border-brand-ink/15 focus:border-brand-teal"
          />
          {reason.length > 0 && tooShort && (
            <p className="text-xs text-red-700">
              Add a bit more detail ({MIN_REASON_LENGTH} characters minimum).
            </p>
          )}
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={tooShort || submitting}
            className="bg-red-700 hover:bg-red-800 text-white"
          >
            {submitting ? "Rejecting…" : "Confirm rejection"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}