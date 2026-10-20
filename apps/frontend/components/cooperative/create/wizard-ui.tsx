"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/**
 * Shared primitives for the create-cooperative wizard. They mirror the
 * dashboard landing design system (surface cards, pill controls, deep-green
 * primary, theme-aware content tokens) so both surfaces stay in step.
 */

/** Form controls: border and focus ring follow the landing palette. The
 *  important modifiers are deliberate — the shared shadcn inputs define their
 *  own custom token colors, which tailwind-merge can't reason about. */
export const fieldClassName =
  "h-11 w-full rounded-2xl !border-content/10 !bg-content/[0.02] px-4 text-sm text-content placeholder:!text-content/35 transition-colors focus:border-[#0E3B2E]/40 focus:!ring-[#0E3B2E]/20 focus-visible:border-[#0E3B2E]/40 focus-visible:!ring-[#0E3B2E]/20 dark:focus:border-[#7FBF9C]/40 dark:focus:!ring-[#7FBF9C]/20 dark:focus-visible:border-[#7FBF9C]/40 dark:focus-visible:!ring-[#7FBF9C]/20";

export const labelClassName =
  "text-[11px] font-semibold uppercase tracking-[0.16em] text-content/45";

export function WizardPanel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "rounded-[24px] bg-surface p-5 shadow-[0_1px_2px_rgba(11,23,18,0.04)] lg:p-6",
        className
      )}
    >
      {children}
    </section>
  );
}

export function WizardStepHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
}) {
  return (
    <div>
      {eyebrow && (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-content/40">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-1 font-display text-xl font-bold tracking-tight text-content sm:text-2xl">
        {title}
      </h2>
      {description && (
        <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-content/50">
          {description}
        </p>
      )}
    </div>
  );
}

interface WizardButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}

export function WizardButton({
  className,
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: WizardButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0E3B2E]/25 disabled:pointer-events-none disabled:opacity-40 dark:focus-visible:ring-[#7FBF9C]/30",
        size === "md" ? "h-11 px-5 text-sm" : "h-9 px-4 text-xs",
        variant === "primary" &&
          "bg-[#0E3B2E] text-white hover:bg-[#0A2E24] dark:bg-[#7FBF9C] dark:text-[#0B1712] dark:hover:bg-[#93CBAE]",
        variant === "secondary" &&
          "border border-content/10 text-content/75 hover:border-content/20 hover:bg-content/[0.03] hover:text-content",
        variant === "ghost" && "text-content/55 hover:bg-content/[0.04] hover:text-content",
        className
      )}
      {...props}
    />
  );
}

export function WizardField({
  label,
  htmlFor,
  hint,
  optional,
  className,
  children,
}: {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-baseline justify-between gap-2">
        <Label htmlFor={htmlFor} className={labelClassName}>
          {label}
        </Label>
        {optional && (
          <span className="text-[11px] text-content/35">Optional</span>
        )}
      </div>
      {children}
      {hint && (
        <p className="text-[11px] leading-relaxed text-content/40">{hint}</p>
      )}
    </div>
  );
}

export function WizardActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-content/[0.06] pt-5",
        className
      )}
    >
      {children}
    </div>
  );
}
