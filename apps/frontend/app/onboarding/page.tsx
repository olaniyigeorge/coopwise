"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { AnimatePresence, motion } from "framer-motion"
import {
  Camera,
  Loader2,
  Home,
  Briefcase,
  ShieldCheck,
  GraduationCap,
  Heart,
  Plane,
  Sparkles,
  ArrowLeft,
  ArrowRight,
  Pencil,
} from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormControl, FormMessage } from "@/components/ui/form"
import {
  onboardingSchema,
  onboardingStepFields,
  type OnboardingFormValues,
} from "@/helpers/validators/onboarding-schemas"
import { completeOnboarding, uploadAvatar } from "@/services/onboarding-service"
import useAuthStore from "@/stores/auth-store"

type StepId = "identity" | "purpose" | "target" | "frequency" | "review"

const STEPS: { id: StepId; title: string; subtitle: string }[] = [
  { id: "identity", title: "What should we call you?", subtitle: "Your handle inside the cooperative" },
  { id: "purpose", title: "What are you saving for?", subtitle: "This shapes how we nudge you" },
  { id: "target", title: "What's your target?", subtitle: "Round numbers are fine — you can adjust later" },
  { id: "frequency", title: "How often will you contribute?", subtitle: "Match it to how income actually arrives" },
  { id: "review", title: "One last look", subtitle: "Confirm before we open your ledger" },
]

const PURPOSE_OPTIONS = [
  { value: "Rent or housing", icon: Home },
  { value: "Business capital", icon: Briefcase },
  { value: "Emergency fund", icon: ShieldCheck },
  { value: "School fees", icon: GraduationCap },
  { value: "Wedding or ceremony", icon: Heart },
  { value: "Travel", icon: Plane },
]

const FREQUENCY_OPTIONS: { value: OnboardingFormValues["saving_frequency"]; label: string; blurb: string }[] = [
  { value: "daily", label: "Daily", blurb: "Small and steady, every single day" },
  { value: "weekly", label: "Weekly", blurb: "Like most cooperative rounds" },
  { value: "monthly", label: "Monthly", blurb: "Aligned with payday" },
]

const AMOUNT_PRESETS = [50_000, 100_000, 250_000, 500_000, 1_000_000]

// ---- Tally progress: four verticals fill in as steps complete, the fifth ----
// ---- diagonal stroke closes the bundle the instant onboarding finishes ----
const TallyProgress = ({ completed }: { completed: number }) => {
  const verticals = [12, 34, 56, 78]
  return (
    <svg viewBox="0 0 120 44" className="w-24 h-9" fill="none">
      {verticals.map((x, i) => (
        <motion.line
          key={x}
          x1={x}
          y1={6}
          x2={x}
          y2={38}
          strokeWidth={5}
          strokeLinecap="round"
          stroke={i < completed ? "#B8892B" : "#B8892B33"}
          initial={false}
          animate={{ opacity: i < completed ? 1 : 0.5 }}
          transition={{ duration: 0.25 }}
        />
      ))}
      <motion.line
        x1={2}
        y1={40}
        x2={96}
        y2={4}
        strokeWidth={5}
        strokeLinecap="round"
        stroke="#B8892B"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={completed >= 5 ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
        transition={{ duration: 0.5, ease: "easeInOut" }}
      />
    </svg>
  )
}

const OnboardingWizard = () => {
  const router = useRouter()
  const setUser = useAuthStore((s) => s.setUser)
  const user = useAuthStore((s) => s.user)

  const [stepIndex, setStepIndex] = useState(0)
  const [direction, setDirection] = useState(1)
  const [rootError, setRootError] = useState<string | null>(null)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [customPurpose, setCustomPurpose] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const step = STEPS[stepIndex]

  const form = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onChange",
    defaultValues: {
      username: user?.username ?? "",
      profile_picture_url: user?.profile_picture_url ?? "",
      savings_purpose: "",
      target_savings_amount: undefined,
      saving_frequency: undefined,
    },
  })

  const values = form.watch()

  const handleAvatarPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const goTo = (index: number, dir: number) => {
    setRootError(null)
    setDirection(dir)
    setStepIndex(index)
  }

  const handleNext = async () => {
    const fields = onboardingStepFields[step.id]
    const valid = fields.length === 0 || (await form.trigger(fields))
    if (!valid) return
    if (stepIndex < STEPS.length - 1) goTo(stepIndex + 1, 1)
  }

  const handleBack = () => {
    if (stepIndex > 0) goTo(stepIndex - 1, -1)
  }

  const onSubmit = async (data: OnboardingFormValues) => {
    setRootError(null)
    try {
      let profile_picture_url = data.profile_picture_url
      if (avatarFile) {
        const uploadResult = await uploadAvatar(user!.id, avatarFile)
        profile_picture_url = uploadResult.profile_picture_url
      }
      const payload = { ...data, profile_picture_url }
      const result = await completeOnboarding(user!.id, payload)
      setUser(result.user)
      setJustCompleted(true)
      setTimeout(() => router.push("/dashboard"), 650)
    } catch (error: any) {
      setRootError(error?.detail ?? "Something went wrong. Try again.")
    }
  }

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
  }

  return (
    <div className="bg-brand-paper min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white rounded-2xl border border-brand-gold/20 shadow-xl p-8 space-y-6">
        {/* Header: tally progress + step title */}
        <div className="flex flex-col items-center gap-4">
          <TallyProgress completed={justCompleted ? 5 : stepIndex} />
          <div className="text-center space-y-1">
            <h1 className="font-display text-xl text-brand-ink">{step.title}</h1>
            <p className="text-sm text-brand-secondary">{step.subtitle}</p>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="relative min-h-[190px]">
              <AnimatePresence mode="wait" custom={direction}>
                <motion.div
                  key={step.id}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.22, ease: "easeOut" }}
                  className="space-y-5"
                >
                  {step.id === "identity" && (
                    <div className="space-y-5">
                      <div className="flex flex-col items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-dashed border-brand-gold/40 flex items-center justify-center bg-brand-paper touch-manipulation"
                        >
                          {avatarPreview ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={avatarPreview} alt="Profile preview" className="w-full h-full object-cover" />
                          ) : (
                            <Camera className="w-5 h-5 text-brand-gold" />
                          )}
                          <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-brand-ink flex items-center justify-center">
                            <Pencil className="w-3 h-3 text-brand-gold" />
                          </span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleAvatarPick}
                        />
                        <p className="text-xs text-brand-secondary">Optional — add it anytime later</p>
                      </div>

                      <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <Input placeholder="Your handle" autoComplete="off" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

                  {step.id === "purpose" && (
                    <FormField
                      control={form.control}
                      name="savings_purpose"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-3">
                              <div className="grid grid-cols-2 gap-2">
                                {PURPOSE_OPTIONS.map(({ value, icon: Icon }) => {
                                  const selected = field.value === value
                                  return (
                                    <button
                                      key={value}
                                      type="button"
                                      onClick={() => {
                                        setCustomPurpose(false)
                                        field.onChange(value)
                                      }}
                                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors touch-manipulation
                                        ${
                                          selected
                                            ? "border-brand-teal bg-brand-teal/5 text-brand-teal font-medium"
                                            : "border-brand-gold/20 text-brand-ink"
                                        }`}
                                    >
                                      <Icon className="w-4 h-4 shrink-0" />
                                      {value}
                                    </button>
                                  )
                                })}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setCustomPurpose(true)
                                    field.onChange("")
                                  }}
                                  className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm text-left transition-colors touch-manipulation
                                    ${
                                      customPurpose
                                        ? "border-brand-teal bg-brand-teal/5 text-brand-teal font-medium"
                                        : "border-brand-gold/20 text-brand-ink"
                                    }`}
                                >
                                  <Sparkles className="w-4 h-4 shrink-0" />
                                  Other
                                </button>
                              </div>
                              {customPurpose && (
                                <Input
                                  placeholder="Tell us what it's for"
                                  value={field.value}
                                  onChange={(e) => field.onChange(e.target.value)}
                                />
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {step.id === "target" && (
                    <FormField
                      control={form.control}
                      name="target_savings_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-3">
                              <div className="relative">
                                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-secondary text-sm">
                                  ₦
                                </span>
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  placeholder="0"
                                  className="pl-7"
                                  {...field}
                                />
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {AMOUNT_PRESETS.map((amount) => (
                                  <button
                                    key={amount}
                                    type="button"
                                    onClick={() => field.onChange(amount)}
                                    className="px-3 py-1.5 rounded-full border border-brand-gold/20 text-xs text-brand-ink hover:border-brand-teal touch-manipulation"
                                  >
                                    ₦{amount.toLocaleString()}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {step.id === "frequency" && (
                    <FormField
                      control={form.control}
                      name="saving_frequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <div className="space-y-2">
                              {FREQUENCY_OPTIONS.map((opt) => {
                                const selected = field.value === opt.value
                                return (
                                  <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => field.onChange(opt.value)}
                                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-colors touch-manipulation
                                      ${
                                        selected
                                          ? "border-brand-teal bg-brand-teal/5"
                                          : "border-brand-gold/20"
                                      }`}
                                  >
                                    <div>
                                      <p
                                        className={`text-sm font-medium ${
                                          selected ? "text-brand-teal" : "text-brand-ink"
                                        }`}
                                      >
                                        {opt.label}
                                      </p>
                                      <p className="text-xs text-brand-secondary">{opt.blurb}</p>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}

                  {step.id === "review" && (
                    <div className="space-y-3">
                      {[
                        { label: "Handle", value: values.username, stepIdx: 0 },
                        { label: "Saving for", value: values.savings_purpose, stepIdx: 1 },
                        {
                          label: "Target",
                          value: values.target_savings_amount
                            ? `₦${Number(values.target_savings_amount).toLocaleString()}`
                            : "",
                          stepIdx: 2,
                        },
                        {
                          label: "Rhythm",
                          value: values.saving_frequency
                            ? values.saving_frequency[0].toUpperCase() + values.saving_frequency.slice(1)
                            : "",
                          stepIdx: 3,
                        },
                      ].map((row, i) => (
                        <div key={row.label}>
                          <div className="flex items-center justify-between py-1.5">
                            <div>
                              <p className="text-xs text-brand-secondary">{row.label}</p>
                              <p className="text-sm text-brand-ink font-medium">{row.value || "—"}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => goTo(row.stepIdx, -1)}
                              className="text-xs text-brand-teal underline underline-offset-2"
                            >
                              Edit
                            </button>
                          </div>
                          {i < 3 && <div className="h-px tally-divider text-brand-gold" />}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {rootError && <p className="text-sm text-red-500">{rootError}</p>}

            <div className="flex items-center gap-3 pt-1">
              {stepIndex > 0 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm text-brand-secondary py-2.5 px-2 touch-manipulation"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back
                </button>
              )}
              {step.id !== "review" ? (
                <Button
                  type="button"
                  onClick={handleNext}
                  className="flex-1 h-11 rounded-xl bg-brand-ink hover:bg-brand-ink/90 flex items-center justify-center gap-1.5"
                >
                  Continue
                  <ArrowRight className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={form.formState.isSubmitting || justCompleted}
                  className="flex-1 h-11 rounded-xl bg-brand-ink hover:bg-brand-ink/90"
                >
                  {form.formState.isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : justCompleted ? (
                    "Ledger opened"
                  ) : (
                    "Open my ledger"
                  )}
                </Button>
              )}
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default OnboardingWizard