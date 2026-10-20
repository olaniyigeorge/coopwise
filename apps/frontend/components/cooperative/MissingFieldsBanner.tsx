"use client";

import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Shared across Step 6 (CooperativeNotConfiguredError) and Step 8
 * (IncompleteGoalContractError) — design doc §6. Both errors return a
 * precise `missing: string[]`, which is the whole point: don't collapse
 * this into a generic toast.
 */
interface MissingFieldsBannerProps {
  missing: string[];
  title?: string;
  /** Map a raw backend key (e.g. "governance", "beneficiary_user_id") to
   *  human copy. Falls back to the raw key if omitted. */
  getLabel?: (key: string) => string;
  /** Called when the user clicks a specific missing item — jump to the
   *  step/field it corresponds to. Omit to render a plain list. */
  onFix?: (key: string) => void;
  className?: string;
}

export function MissingFieldsBanner({
  missing,
  title = "Setup incomplete",
  getLabel,
  onFix,
  className,
}: MissingFieldsBannerProps) {
  if (missing.length === 0) return null;

  return (
    <div
      role="alert"
      className={cn(
        "rounded-2xl border border-[#EAD9AC] bg-[#FBF3DE] p-4 text-[#6B4E12]",
        "dark:border-[#5A4A22] dark:bg-[#2E2818] dark:text-[#E8BC63]",
        className
      )}
    >
      <div className="flex items-start gap-2.5">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold">{title}</p>
          <ul className="mt-1.5 space-y-1.5">
            {missing.map((key) => {
              const label = getLabel ? getLabel(key) : key;
              return (
                <li key={key} className="text-sm">
                  {onFix ? (
                    <button
                      type="button"
                      onClick={() => onFix(key)}
                      className="rounded-full border border-[#8A6516]/20 bg-white px-3 py-1 text-[11px] font-semibold transition-colors hover:bg-[#8A6516]/5 dark:border-[#E8BC63]/25 dark:bg-transparent dark:hover:bg-[#E8BC63]/10"
                    >
                      {label} — fix
                    </button>
                  ) : (
                    <span>{label}</span>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}