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
        "rounded-md border border-amber-300 bg-amber-50 p-4 text-amber-900",
        "dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
        className
      )}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-sm">{title}</p>
          <ul className="mt-1 space-y-1">
            {missing.map((key) => {
              const label = getLabel ? getLabel(key) : key;
              return (
                <li key={key} className="text-sm">
                  {onFix ? (
                    <button
                      type="button"
                      onClick={() => onFix(key)}
                      className="underline underline-offset-2 hover:no-underline"
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