"use client"

import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

/**
 * Track colour is picked from the `checked` prop rather than two
 * `data-[state=…]` colour utilities. Both utilities target the same
 * background property, so having them in one merged class list made the
 * result depend on tailwind-merge's handling of the arbitrary variant;
 * deriving the colour here keeps checked/unchecked unambiguous everywhere.
 */
const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, checked, ...props }, ref) => (
  <SwitchPrimitives.Root
    checked={checked}
    className={cn(
      // min-h-0/min-w-0 undo the global base rule that forces every button to
      // 40×40px — without them the track renders huge and "swollen".
      "peer inline-flex h-5 w-9 min-h-0 min-w-0 shrink-0 cursor-pointer items-center rounded-full border-0 p-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
      checked
        ? "bg-[#0E3B2E] dark:bg-[#1F7A54]"
        : "bg-content/15",
      className
    )}
    {...props}
    ref={ref}
  >
    <SwitchPrimitives.Thumb
      className={cn(
        "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
      )}
    />
  </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }
