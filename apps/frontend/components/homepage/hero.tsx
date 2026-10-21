"use client"

import Link from "next/link"
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  LayoutDashboard,
  ShieldCheck,
  Users,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import useAuthStore from "@/stores/auth-store"

export default function Hero() {
  const { isAuthenticated } = useAuthStore()

  return (
    <section className="relative overflow-hidden bg-brand-paper">
      {/* Warm light + ledger texture */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_50%_at_80%_0%,rgba(232,188,99,0.22),transparent_65%),radial-gradient(50%_45%_at_0%_30%,rgba(14,59,46,0.10),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(120deg, #0B1712 0px, #0B1712 1px, transparent 20px, transparent 22px)",
        }}
      />

      <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pb-24 sm:pt-14 lg:px-8 lg:pb-28">
        <div className="grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          {/* ── Copy ── */}
          <div className="text-center lg:text-left">
            <h1 className="font-display text-[2.6rem] font-bold leading-[1.04] tracking-tight text-brand-ink text-balance sm:text-6xl lg:text-[3.6rem]">
              Your Community Is an{" "}
              <span className="relative inline-block">
                <span className="relative z-10">Economic Organism.</span>
                <span
                  aria-hidden
                  className="absolute inset-x-0 bottom-0.5 z-0 h-[0.3em] -rotate-[0.6deg] rounded-sm bg-[#E8BC63]/55"
                />
              </span>{" "}
              We Build the Infrastructure to Help It Scale.
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-brand-ink/65 sm:text-lg lg:mx-0">
              Ajo, esusu, chamas — cooperative savings has moved money across Africa for
              generations. CoopWise gives communities the infrastructure to pool capital,
              govern ownership, and build businesses and assets together.
            </p>

            <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start">
              <Link
                href={isAuthenticated ? "/dashboard" : "/signup"}
                className="w-full sm:w-auto"
              >
                <Button className="group h-12 w-full rounded-full bg-[#0E3B2E] px-6 text-sm font-semibold text-white shadow-[0_16px_34px_-20px_rgba(14,59,46,0.95)] hover:bg-[#0B1712] sm:w-auto">
                  {isAuthenticated ? (
                    <>
                      Go to Dashboard
                      <LayoutDashboard className="h-4 w-4" />
                    </>
                  ) : (
                    <>
                      Start Your Cooperative
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                    </>
                  )}
                </Button>
              </Link>
              <Link href="/how-it-works" className="w-full sm:w-auto">
                <Button
                  variant="outline"
                  className="h-12 w-full rounded-full border-brand-ink/15 bg-white/55 px-6 text-sm font-semibold text-brand-ink/75 hover:border-brand-ink/25 hover:bg-white hover:text-brand-ink sm:w-auto"
                >
                  See How It Works
                </Button>
              </Link>
            </div>

            <div className="mt-7 flex items-start justify-center gap-2.5 lg:justify-start">
              <div className="tally-divider mt-0.5 w-6 shrink-0 text-brand-ink/70" />
              <p className="max-w-md text-xs leading-relaxed text-brand-ink/50">
                Built for groups who already trust each other. Governance, goals, and
                ownership — not just a shared wallet.
              </p>
            </div>
          </div>

          {/* ── Product mockup ── */}
          <div className="relative mx-auto w-full max-w-[430px] px-3 sm:px-6 lg:px-0">
            {/* Halo */}
            <div
              aria-hidden
              className="absolute -inset-6 rounded-[48px] bg-[radial-gradient(circle_at_70%_20%,rgba(232,188,99,0.35),transparent_60%),radial-gradient(circle_at_20%_80%,rgba(127,191,156,0.3),transparent_55%)] blur-2xl"
            />

            <div className="relative rotate-[-1.2deg] overflow-hidden rounded-[30px] bg-[#0B1712] p-5 text-brand-paper shadow-[0_40px_80px_-40px_rgba(11,23,18,0.75)] ring-1 ring-white/10 sm:p-6">
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_90%_0%,rgba(232,188,99,0.18),transparent_45%),radial-gradient(circle_at_0%_100%,rgba(127,191,156,0.14),transparent_45%)]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(120deg, #F7F4EC 0px, #F7F4EC 1px, transparent 18px, transparent 20px)",
                }}
              />

              <div className="relative">
                {/* Circle header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8BC63] font-display text-sm font-bold text-[#0B1712]">
                      OC
                    </span>
                    <div>
                      <p className="font-display text-sm font-bold tracking-tight">
                        Oja Connect
                      </p>
                      <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/40">
                        <Users className="h-3 w-3" />
                        12 members · Weekly
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-[#E8BC63]/30 bg-[#E8BC63]/10 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-[#E8BC63]">
                    Rotation 4/12
                  </span>
                </div>

                {/* Balance */}
                <div className="mt-7">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/35">
                    Group balance
                  </p>
                  <p className="mt-1.5 font-display text-[2rem] font-bold leading-none tracking-tight">
                    ₦2,480,000
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-[#7FBF9C]/10 px-2 py-1 text-[10px] font-semibold text-[#9ACFAC]">
                    <span className="h-1 w-1 rounded-full bg-[#7FBF9C]" />
                    +₦480,000 this cycle
                  </p>
                </div>

                {/* Progress */}
                <div className="mt-6">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="text-white/40">Cycle progress</span>
                    <span className="font-semibold text-white/70">68%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-[#7FBF9C] to-[#E8BC63]" />
                  </div>
                </div>

                {/* Members */}
                <div className="mt-5 flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2.5">
                  <div className="flex items-center">
                    {["MB", "CH", "AK", "TO"].map((initials, i) => (
                      <span
                        key={initials}
                        className={`-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-[#0B1712] text-[8px] font-bold first:ml-0 ${
                          i % 2 === 0
                            ? "bg-[#DFF0E4] text-[#17603F]"
                            : "bg-[#E8BC63] text-[#0B1712]"
                        }`}
                      >
                        {initials}
                      </span>
                    ))}
                    <span className="-ml-1.5 flex h-6 w-6 items-center justify-center rounded-full border border-[#0B1712] bg-white/10 text-[8px] font-bold text-white/60">
                      +8
                    </span>
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-medium text-[#9ACFAC]">
                    <BadgeCheck className="h-3 w-3" />
                    All 12 paid
                  </span>
                </div>

                {/* Next payout */}
                <div className="mt-3 flex items-center gap-3 rounded-xl bg-brand-paper px-3 py-2.5 text-brand-ink">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0E3B2E]/[0.08]">
                    <ShieldCheck className="h-4 w-4 text-[#0E3B2E]" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.12em] text-brand-ink/40">
                      Next payout · Fri 26 Oct
                    </p>
                    <p className="truncate text-[11px] font-semibold">
                      Mama Blessing · ₦240,000
                    </p>
                  </div>
                  <span className="font-display text-[10px] font-bold text-[#B8892B]">
                    #04
                  </span>
                </div>
              </div>
            </div>

            {/* Floating receipt chip */}
            <div className="absolute -left-2 top-16 hidden items-center gap-2 rounded-xl border border-brand-ink/10 bg-white px-3 py-2 shadow-[0_18px_40px_-25px_rgba(11,23,18,0.5)] sm:flex lg:-left-7">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#DFF0E4]">
                <CheckCircle2 className="h-4 w-4 text-[#17603F]" />
              </span>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-brand-ink/35">
                  Contribution received
                </p>
                <p className="font-display text-xs font-bold text-brand-ink">
                  ₦20,000 · just now
                </p>
              </div>
            </div>

            {/* Floating audit chip */}
            <div className="absolute -bottom-4 right-0 flex items-center gap-2 rounded-xl border border-brand-ink/10 bg-white px-3 py-2 shadow-[0_18px_40px_-25px_rgba(11,23,18,0.5)] lg:-right-5">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0E3B2E]">
                <ShieldCheck className="h-4 w-4 text-[#E8BC63]" />
              </span>
              <div>
                <p className="text-[9px] font-semibold uppercase tracking-wide text-brand-ink/35">
                  Ledger entry
                </p>
                <p className="font-display text-xs font-bold text-brand-ink">
                  Every kobo, auditable
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
