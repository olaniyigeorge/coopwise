// components/admin/kyc/RejectDialog.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, Loader2 } from "lucide-react";

interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onConfirm: (reason: string) => Promise<void> | void;
}

const MIN_REASON_LENGTH = 10;
const MAX_REASON_LENGTH = 500;

export function RejectDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
}: RejectDialogProps) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const trimmedLength = reason.trim().length;
  const tooShort = trimmedLength < MIN_REASON_LENGTH;

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

  function handleOpenChange(next: boolean) {
    if (!next) setReason("");
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="rounded-2xl border-content/10 bg-surface sm:max-w-md">
        <DialogHeader>
          <span className="mb-1 flex h-9 w-9 items-center justify-center rounded-full bg-red-500/10 text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4" />
          </span>
          <DialogTitle className="font-display text-base font-bold text-content">
            {title}
          </DialogTitle>
          {description && (
            <DialogDescription className="text-xs leading-relaxed text-content/50">
              {description}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-1.5">
          <label
            htmlFor="rejection-reason"
            className="text-[10px] font-semibold uppercase tracking-[0.12em] text-content/40"
          >
            Reason
          </label>
          <Textarea
            id="rejection-reason"
            autoFocus
            value={reason}
            maxLength={MAX_REASON_LENGTH}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Be specific about what the applicant needs to fix."
            rows={4}
            className="resize-none rounded-xl border-content/15 bg-canvas/60 text-sm text-content placeholder:text-content/30 focus-visible:border-[#0E3B2E]/40 focus-visible:ring-[#0E3B2E]/15 dark:focus-visible:border-[#7FBF9C]/45 dark:focus-visible:ring-[#7FBF9C]/20"
          />
          <div className="flex items-center justify-between gap-3 text-[11px]">
            {reason.length > 0 && tooShort ? (
              <span className="text-red-600 dark:text-red-400">
                Add a bit more detail ({MIN_REASON_LENGTH} characters minimum).
              </span>
            ) : (
              <span className="text-content/35">
                The applicant sees this note.
              </span>
            )}
            <span className="tabular-nums text-content/30">
              {reason.length}/{MAX_REASON_LENGTH}
            </span>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={submitting}
            className="rounded-xl text-content/55 hover:bg-content/[0.05] hover:text-content"
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={tooShort || submitting}
            className="gap-1.5 rounded-xl bg-red-600 px-4 font-semibold text-white hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-500"
          >
            {submitting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Rejecting…
              </>
            ) : (
              "Confirm rejection"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
