import { OnboardingFormValues } from "@/helpers/validators/onboarding-schemas"
import ApiService from "@/services/api-service"
import { SessionUser } from "./auth-service"

const BASE = "/users"

export const uploadAvatar = (userId: string, file: File) => {
  const formData = new FormData()
  formData.append("file", file)

  return ApiService.patch<{ profile_picture_url: string }>(
    `${BASE}/${userId}/avatar`,
    formData
  )
}

export const completeOnboarding = (userId: string, values: OnboardingFormValues) => {
   console.log("\n")
    console.log(JSON.stringify(values, null, 2))
    console.log("\n");
    console.log("SERVICE RECEIVED userId:", userId)
    console.log("\n")

    if (!userId) {
        throw new Error("completeOnboarding called without a userId");
    }

    const url = `${BASE}/${userId}`

    console.log("PATCH URL:", url)
    console.log("PATCH BODY:", values)
  return ApiService.patch<{ user: SessionUser }>(url, values)
}