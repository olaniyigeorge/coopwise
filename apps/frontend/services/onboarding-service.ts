import { OnboardingFormValues } from "@/helpers/validators/onboarding-schemas"
import ApiService from "@/services/api-service"
import { SessionUser } from "./auth-service"

const BASE = "/users"

export const uploadAvatar = (userId: string, file: File) => {
  const formData = new FormData()
  formData.append("file", file)

  return ApiService.post<{ profile_picture_url: string }>(
    `${BASE}/${userId}/avatar`,
    formData
  )
}

export const completeOnboarding = (userId: string, values: OnboardingFormValues) => {

  return ApiService.patch<{ user: SessionUser }>(`${BASE}/${userId}`, values)
}