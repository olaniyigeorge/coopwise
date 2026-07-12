import {z} from "zod"

const emailField = z.string().email('Invalid email address')
// const passwordField = z.string().min(8, "Password must be at least 8 characters")
const fullnameField = z.string()

export const authSchema = z.object({
    email: emailField,
    // password: passwordField
})
export const devAuthSchema = z.object({
    email: emailField,
    full_name: fullnameField
})

// export const signUpSchema = z.object({
//     email: emailField,
//     // password: passwordField,
//     // confirmPassword: passwordField
// }).refine((data) => data.password === data.confirmPassword, {
//     message: "Passwords don't match",
//     path: ['confirmPassword']
// })

export type authFormValues = z.infer<typeof authSchema>
// export type signUpFormValues = z.infer<typeof signUpSchema>


export type devAuthFormValues = z.infer<typeof devAuthSchema>



export const passwordSignInSchema = z.object({
  identifier: z
    .string()
    .min(1, "Enter your email or phone number")
    .refine(
      (val) => /\S+@\S+\.\S+/.test(val) || /^\+?[0-9]{7,15}$/.test(val),
      "Enter a valid email or phone number"
    ),
  password: z.string().min(8, "Password must be at least 8 characters"),
})
export type passwordSignInFormValues = z.infer<typeof passwordSignInSchema>





export const signUpDetailsSchema = z.object({
  identifier: z
    .string()
    .min(1, "Enter your email or phone number")
    .refine(
      (val) => /\S+@\S+\.\S+/.test(val) || /^\+?[0-9]{7,15}$/.test(val),
      "Enter a valid email or phone number"
    ),
  full_name: z.string().min(2, "Enter your full name"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})
export type signUpDetailsFormValues = z.infer<typeof signUpDetailsSchema>

export const otpCodeSchema = z.object({
  code: z.string().length(6, "Enter the 6-digit code"),
})
export type otpCodeFormValues = z.infer<typeof otpCodeSchema>