"use client"

import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useRouter } from 'next/navigation'

import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

const createGroupSchema = z.object({
  name: z.string().min(1, "Group name is required"),
  description: z.string().optional(),
  contributionAmount: z.string().min(1, "Contribution amount is required"),
  contributionFrequency: z.string().min(1, "Contribution frequency is required"),
  maxMembers: z.string().min(1, "Maximum number of members is required"),
  targetAmount: z.string().optional(),
})

type FormValues = z.infer<typeof createGroupSchema>

interface CreateGroupFormProps {
  onSubmitSuccess?: (formData: any) => void;
}

export default function CreateGroupForm({ onSubmitSuccess }: CreateGroupFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const form = useForm<FormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      contributionAmount: "",
      contributionFrequency: "",
      maxMembers: "10",
      targetAmount: "",
    },
  })
  
  async function onSubmit(values: FormValues) {
    try {
      setIsSubmitting(true)
    console.log(values)
    // In a real app, you would submit this data to your API
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      if (onSubmitSuccess) {
        onSubmitSuccess(values)
      } else {
    router.push('/dashboard')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-800">Create Group</h1>
          <p className="text-sm text-gray-500 mt-1">Set up a new savings group and invite members</p>
        </div>
        
        <h2 className="text-lg font-medium text-gray-900 mb-2">Group Details</h2>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Group Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Group Name <span className="text-gray-500 font-normal ml-1">(Choose a name that identifies your group clearly)</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="E.g., Market Women Association" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Description (Optional)
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Brief describe the purpose of this group"
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Contribution Amount and Frequency - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="contributionAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Contribution Amount (₦)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="E.g., ₦100,000"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contributionFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Contribution Frequency
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Maximum Members and Target Amount - Side by side */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="maxMembers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Maximum Number of Members
                    </FormLabel>
                    <FormControl>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="10" />
                        </SelectTrigger>
                        <SelectContent>
                          {[...Array(20)].map((_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {i + 1}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">You can adjust this later if needed</p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700">
                      Target Amount (Optional)
                    </FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="E.g., ₦100,000"
                        {...field} 
                      />
                    </FormControl>
                    <p className="text-xs text-gray-500 mt-1">Total group savings goal, if applicable</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary/90 text-white"
              >
                {isSubmitting ? 'Setting up...' : 'Set Group Rules'}
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
} 