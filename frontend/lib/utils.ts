import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Combine clsx and tailwind-merge to intelligently handle conflicting Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}