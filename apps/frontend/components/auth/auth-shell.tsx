"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Lock, Target, Users } from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Shared field styling for the auth screens. Kept here (rather than in
 * each form) so the whole sign-in / sign-up / password-reset flow looks
 * like one surface even though the forms are separate components.
 */
export const authFieldClass =
  "h-11 w-full rounded-xl border border-brand-ink/15 bg-white/80 px-3.5 text-sm text-brand-ink placeholder:text-brand-ink/35 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] transition-colors focus-visible:border-brand-teal focus-visible:ring-2 focus-visible:ring-brand-teal/20 focus-visible:ring-offset-0"

export const authLabelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-brand-ink/50"

const TRUST_POINTS = [
  {
    icon: Target,
    title: "Goals you can point at",
    body: "Rent, stock, land, a business. Every contribution moves something real forward — and every member can see it.",
  },
  {
    icon: Users,
    title: "Governance, not guesswork",
    body: "Membership, shares and votes live on the record, so ownership is explicit from day one.",
  },
  {
    icon: Lock,
    title: "Your money stays yours",
    body: "No pooled custody. Contributions and payouts move directly to your cooperative's account.",
  },
]

interface AuthShellProps {
  /** Small kicker above the title, e.g. “Welcome back”. */
  eyebrow?: string
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  /** Optional back control rendered at the top of the card. */
  backHref?: string
  backLabel?: string
  /** Wider card for two-column forms. */
  wide?: boolean
}

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
  footer,
  backHref,
  backLabel = "Back",
  wide = false,
}: AuthShellProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-ink">
      {/* Photographic backdrop, tinted down so the paper card always wins. */}
      <div className="auth_bg absolute inset-0 opacity-45" aria-hidden="true" />
      <div
        className="absolute inset-0 bg-gradient-to-br from-brand-ink/95 via-brand-ink/85 to-[#0E3B2E]/90"
        aria-hidden="true"
      />
      {/* A ledger rule running across the page for texture. */}
      <div
        className="pointer-events-none absolute inset-x-0 top-24 hidden h-px bg-gradient-to-r from-transparent via-white/10 to-transparent lg:block"
        aria-hidden="true"
      />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-4 py-8 sm:px-6 lg:gap-20 lg:px-8">
        {/* ── Brand panel ── */}
        <aside className="hidden min-w-0 flex-1 lg:block">
          <Link href="/" className="inline-flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#0E3B2E]">
                <Image
                  src="/assets/icons/logo.svg"
                  alt=""
                  width={22}
                  height={22}
                  className="h-5 w-5 object-contain"
                />
              </span>
            </span>
            <span className="font-display text-lg font-bold tracking-tight text-brand-paper">
              CoopWise
            </span>
          </Link>

          <p className="mt-10 text-[11px] font-semibold uppercase tracking-[0.24em] text-brand-gold">
            Capital, pooled with purpose
          </p>
          <h2 className="mt-3 max-w-md font-display text-4xl font-bold leading-[1.08] tracking-tight text-brand-paper">
            Pool what you have.
            <br />
            Fund what you plan.
            <br />
            Own what you build.
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/55">
            Ajo, esusu, chamas — the trust is already there. CoopWise gives your
            circle the infrastructure to become an economic entity: a shared
            ledger, agreed rules, and a record of what you own together.
          </p>

          <div className="mt-8 max-w-sm space-y-5">
            {TRUST_POINTS.map(({ icon: Icon, title: pointTitle, body }) => (
              <div key={pointTitle} className="flex items-start gap-3.5">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-[#E8BC63]">
                  <Icon className="h-4 w-4" strokeWidth={1.8} />
                </span>
                <div>
                  <p className="text-sm font-semibold text-brand-paper">
                    {pointTitle}
                  </p>
                  <p className="mt-0.5 text-xs leading-relaxed text-white/45">
                    {body}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 h-px w-40 tally-divider text-brand-gold/60" />
          <p className="mt-4 text-[11px] text-white/35">
            CoopWise © {new Date().getFullYear()} · Built for Nigerian
            cooperatives
          </p>
        </aside>

        {/* ── Form card ── */}
        <main className="mx-auto w-full max-w-[440px] lg:mx-0">
          <div
            className={cn(
              "rounded-[28px] border border-brand-gold/25 bg-brand-paper p-6 shadow-[0_40px_90px_-40px_rgba(0,0,0,0.65)] sm:p-8",
              wide && "sm:max-w-none"
            )}
          >
            {backHref && (
              <Link
                href={backHref}
                className="mb-5 inline-flex items-center gap-1.5 text-xs font-semibold text-brand-ink/45 transition-colors hover:text-brand-teal"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {backLabel}
              </Link>
            )}

            {/* Mobile brand mark — the aside is hidden here. */}
            <div className="mb-5 flex items-center justify-center lg:hidden">
              <Link href="/" className="inline-flex items-center gap-2.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-brand-gold/40 bg-white">
                  <Image
                    src="/images/coopwise-logo.svg"
                    alt="CoopWise"
                    width={22}
                    height={22}
                    className="h-5 w-5 object-contain"
                  />
                </span>
                <span className="font-display text-base font-bold tracking-tight text-brand-ink">
                  CoopWise
                </span>
              </Link>
            </div>

            <header className="text-center lg:text-left">
              {eyebrow && (
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-gold">
                  {eyebrow}
                </p>
              )}
              <h1 className="mt-1.5 font-display text-[26px] font-bold leading-tight tracking-tight text-brand-ink">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1.5 text-sm leading-relaxed text-brand-ink/55">
                  {subtitle}
                </p>
              )}
            </header>

            <div className="mt-6">{children}</div>

            {footer && (
              <div className="mt-6 border-t border-brand-ink/10 pt-5 text-center text-sm text-brand-ink/55">
                {footer}
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-[11px] leading-relaxed text-white/40 lg:text-left">
            By continuing you agree to CoopWise&apos;s terms of service and
            privacy policy.
          </p>
        </main>
      </div>
    </div>
  )
}

/** Small “or” rule used between primary and social sign-in. */
export function AuthDivider({ label = "or" }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.14em] text-brand-ink/35">
      <span className="h-px flex-1 tally-divider text-brand-ink/30" />
      {label}
      <span className="h-px flex-1 tally-divider text-brand-ink/30" />
    </div>
  )
}
