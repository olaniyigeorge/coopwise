import { z } from "zod"

export const savingFrequencyValues = ["daily", "weekly", "monthly"] as const

export const onboardingSchema = z.object({
  username: z
    .string()
    .min(3, "At least 3 characters")
    .max(20, "Keep it under 20 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Letters, numbers, and underscores only"),
  profile_picture_url: z.string().optional(),
  savings_purpose: z.string().min(1, "Choose or describe what you're saving for"),
  target_savings_amount: z.coerce
    .number({ invalid_type_error: "Enter an amount" })
    .positive("Must be greater than 0"),
  saving_frequency: z.enum(savingFrequencyValues, {
    errorMap: () => ({ message: "Choose how often you'll contribute" }),
  }),
})

export type OnboardingFormValues = z.infer<typeof onboardingSchema>

// Field groups per wizard step — used to scope form.trigger() validation per-step
export const onboardingStepFields: Record<string, (keyof OnboardingFormValues)[]> = {
  identity: ["username", "profile_picture_url"],
  purpose: ["savings_purpose"],
  target: ["target_savings_amount"],
  frequency: ["saving_frequency"],
  review: [],
}