import Link from "next/link";
import { Home, LayoutDashboard } from "lucide-react";
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
      width="144"
      height="144"
      className="mx-auto"
      role="img"
      aria-label="A rotating savings circle with one open slot"
    >
      <circle
        cx={CENTER}
        cy={CENTER}
        r={RADIUS}
        fill="none"
        className="stroke-brand-ink/10"
        strokeWidth="1.5"
        strokeDasharray="3 5"
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
            className={i % 2 === 0 ? "fill-primary/80" : "fill-brand-ink/15"}
          />
        )
      )}

      <text
        x={CENTER}
        y={CENTER + 5}
        textAnchor="middle"
        className="fill-brand-ink font-mono text-[15px] font-medium tracking-tight"
      >
        404
      </text>
    </svg>
  );
}

export default function NotFoundPage() {
  return (
    <div className="h-screen w-full flex items-center justify-center p-6 bg-brand-paper">
      <div className="w-full max-w-md rounded-2xl border border-brand-ink/10 bg-white p-8 text-center shadow-sm">
        <CircleMotif />

        <p className="mt-5 font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-brand-gold">
          Error 404
        </p>
        <h1 className="mt-2 font-display text-2xl font-bold text-brand-ink tracking-tight">
          This link isn&apos;t in your circle
        </h1>
        <p className="mt-2 text-sm text-brand-ink/55 leading-relaxed">
          The page you followed doesn&apos;t exist, or it&apos;s moved on since. Check the address, or head back to somewhere that does.
        </p>

        <div className="mt-7 flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/dashboard">
            <Button size="sm" className="w-full sm:w-auto gap-1.5">
              <LayoutDashboard className="w-3.5 h-3.5" />
              Go to Dashboard
            </Button>
          </Link>
          <Link href="/">
            <Button
              variant="outline"
              size="sm"
              className="w-full sm:w-auto gap-1.5 border-brand-ink/15 text-brand-ink/70 hover:border-primary hover:text-primary"
            >
              <Home className="w-3.5 h-3.5" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}