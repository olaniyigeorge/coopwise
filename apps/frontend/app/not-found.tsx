import Link from "next/link";
import { ArrowRight, Home, LayoutDashboard, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";

// Eight member slots around the circle; index 5 is the empty one —
// the "missing" page in the rotation.
const SLOT_COUNT = 8;
const EMPTY_SLOT_INDEX = 5;
const RADIUS = 58;
const CENTER = 72;

function CircleMotif() {
  const slots = Array.from({ length: SLOT_COUNT }, (_, i) => {
    const angle = (i / SLOT_COUNT) * 2 * Math.PI - Math.PI / 2;
    return {
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
      isEmpty: i === EMPTY_SLOT_INDEX,
    };
  });

  return (
    <svg
      viewBox="0 0 144 144"
      className="mx-auto h-44 w-44"
      role="img"
      aria-label="A rotating savings circle with one open slot"
    >
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        className="stroke-brand-ink/15 motion-safe:animate-[spin_45s_linear_infinite]"
        strokeWidth="1.25"
        strokeDasharray="2 7"
        strokeLinecap="round"
        style={{ transformBox: "fill-box", transformOrigin: "center" }}
      />

      {slots.map((slot, i) =>
        slot.isEmpty ? (
          <circle
            key={i}
            cx={slot.x}
            cy={slot.y}
            r="7"
            fill="none"
            className="stroke-brand-gold"
            strokeWidth="1.75"
            strokeDasharray="2.5 3"
          />
        ) : (
          <circle
            key={i}
            cx={slot.x}
            cy={slot.y}
            r="7"
            className={i % 2 === 0 ? "fill-[#0E3B2E]/85" : "fill-brand-ink/15"}
          />
        )
      )}

      <circle cx={CENTER} cy={CENTER} r="26" className="fill-brand-paper" />
      <text
        x={CENTER}
        y={CENTER + 5}
        textAnchor="middle"
        className="fill-brand-ink font-display text-[17px] font-bold tracking-tight"
      >
        404
      </text>
    </svg>
  );
}

function LedgerRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed border-brand-ink/10 py-2.5 last:border-0">
      <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-brand-ink/35">
        {label}
      </span>
      <span className="text-xs font-medium text-brand-ink/70">{value}</span>
    </div>
  );
}

export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-brand-paper">
      {/* Soft paper grain + a hint of green light from the top corner. */}
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(14,59,46,0.10),transparent_45%),radial-gradient(circle_at_85%_85%,rgba(184,137,43,0.12),transparent_45%)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(11,23,18,0.05) 0px, rgba(11,23,18,0.05) 1px, transparent 1px, transparent 96px)",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto grid min-h-screen w-full max-w-6xl items-center gap-12 px-5 py-14 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
        {/* ── Copy ── */}
        <div className="text-center lg:text-left">
          <div className="mb-7 flex flex-col items-center gap-3 lg:mb-9 lg:items-start">
            <Link
              href="/"
              className="inline-flex items-center gap-2.5"
              aria-label="CoopWise home"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full border border-brand-gold/40 bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/images/coopwise-logo.svg"
                  alt=""
                  className="h-4 w-4 object-contain"
                />
              </span>
              <span className="font-display text-base font-bold tracking-tight text-brand-ink">
                CoopWise
              </span>
            </Link>

            <p className="inline-flex items-center gap-2 rounded-full border border-brand-gold/30 bg-brand-gold/[0.08] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-gold">
              <SearchX className="h-3 w-3" />
              Error 404
            </p>
          </div>

          <h1 className="mt-5 font-display text-4xl font-bold leading-[1.05] tracking-tight text-brand-ink sm:text-5xl lg:text-[3.4rem]">
            This page isn&apos;t
            <br className="hidden sm:block" /> in your circle.
          </h1>

          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-brand-ink/55 sm:text-base lg:mx-0">
            The link may be broken, or the page has moved on since it was
            shared. Your ledger is still exactly where you left it.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row lg:justify-start">
            <Link href="/dashboard">
              <Button className="h-11 w-full rounded-xl px-5 text-sm font-semibold sm:w-auto">
                <LayoutDashboard className="h-4 w-4" />
                Back to dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <Link href="/">
              <Button
                variant="outline"
                className="h-11 w-full rounded-xl border-brand-ink/15 px-5 text-sm font-semibold text-brand-ink/70 hover:border-brand-teal/40 hover:bg-white sm:w-auto"
              >
                <Home className="h-4 w-4" />
                Go to homepage
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-[11px] leading-relaxed text-brand-ink/35">
            If you typed the address yourself, check the spelling — route names
            are case-sensitive.
          </p>
        </div>

        {/* ── Ledger card ── */}
        <div className="relative mx-auto w-full max-w-sm lg:mx-0 lg:justify-self-end">
          <div className="relative overflow-hidden rounded-[28px] border border-brand-ink/10 bg-white p-6 shadow-[0_30px_70px_-35px_rgba(11,23,18,0.45)] sm:p-7">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-ink/40">
                CoopWise ledger
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-brand-ink/30">
                Entry no. 0000
              </span>
            </div>

            <div className="my-5 h-px tally-divider text-brand-ink/50" />

            <CircleMotif />

            <div className="mt-5">
              <LedgerRow label="Record" value="Not found" />
              <LedgerRow label="Status" value="Missing" />
              <LedgerRow label="Action" value="Return to dashboard" />
            </div>

            {/* Stamp, slightly off-axis — the way a paper ledger would be marked. */}
            <div className="pointer-events-none absolute -right-3 bottom-10 rotate-[-14deg] rounded-md border-2 border-brand-gold/50 px-3 py-1.5 opacity-70">
              <span className="font-display text-sm font-bold uppercase tracking-[0.22em] text-brand-gold">
                Void
              </span>
            </div>
          </div>

          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.18em] text-brand-ink/30 lg:text-right">
            Ref. {new Date().getFullYear()} · page not found
          </p>
        </div>
      </div>
    </div>
  );
}
