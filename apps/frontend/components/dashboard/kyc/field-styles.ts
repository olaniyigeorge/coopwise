/**
 * Shared KYC form primitives. The four stage forms used to each declare
 * their own near-identical class strings; keeping them here means a field
 * renders the same in light and dark mode and on every stage.
 */
export const kycInputClass =
  "w-full rounded-xl border border-content/15 bg-canvas/60 px-3.5 py-2.5 text-sm text-content placeholder:text-content/30 shadow-[inset_0_1px_2px_rgba(11,23,18,0.03)] transition-colors focus:border-[#0E3B2E] focus:outline-none focus:ring-2 focus:ring-[#0E3B2E]/15 dark:focus:border-[#7FBF9C] dark:focus:ring-[#7FBF9C]/20"

export const kycLabelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-content/50"

export const kycHintClass = "mt-1.5 text-[11px] leading-relaxed text-content/40"
