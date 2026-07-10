"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form"
import { auth, getFirebaseErrorMessage } from "@/app/helpers/firebase"
import { getDevSession } from "@/app/helpers/api/auth.api"
import { devAuthFormValues, devAuthSchema } from "@/app/helpers/validators/auth.schemas"
import { useAppStore } from "@/lib/hooks/use-app-store"
import { User } from "@/stores/auth-store"


const AuthPage = () => {
  const router = useRouter()
  const searchParams = useSearchParams()
  const from = searchParams.get("from") ?? "/dashboard"

  const { auth } = useAppStore();

  const authStore = auth

  const form = useForm<devAuthFormValues>({
    resolver: zodResolver(devAuthSchema),
    defaultValues: { email: "", full_name: "" },
  })

  const onSubmit = async (values: devAuthFormValues) => {
    try {
      const {is_new_user, user } = await getDevSession(values.email, values.full_name)
      localStorage.setItem("emailForSignIn", values.email)
      console.log("Auth User: ", user)
      console.log("\nNew Auth User : ", is_new_user)
      authStore.setIsAuthenticated(true)
      const authUser: User = {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        username: user.username,
        phone_number: user.phone_number,
        role: user.role,
        flow_address: user.flow_address || ""
      }
      authStore.setUser(authUser)
      console.log(authStore.isAuthenticated)
    } catch (error: any) {
      form.setError("root", { message: getFirebaseErrorMessage(error.code) })
    }
  }


  return (
    <div className="relative min-h-screen bg-background flex items-center justify-center p-6 overflow-hidden">
      <div className="w-full max-w-sm space-y-6">
        {/* Email link sign-in */}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="you@example.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="full_name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input type="full_name" placeholder="Olaniyi George" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root && (
              <p className="text-sm text-red-500">{form.formState.errors.root.message}</p>
            )}
            <Button type="submit" className="w-full h-11 rounded-xl" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Continue as Dev"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  )
}

export default AuthPage