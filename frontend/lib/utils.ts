import { ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Combine clsx and tailwind-merge to intelligently handle conflicting Tailwind classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(...inputs))
}

// Format a number as Nigerian Naira currency
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}