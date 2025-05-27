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

export default function CreateGroupForm() {
  const router = useRouter()
  
  const form = useForm<FormValues>({
    resolver: zodResolver(createGroupSchema),
    defaultValues: {
      name: "",
      description: "",
      contributionAmount: "",
      contributionFrequency: "",
      maxMembers: "",
      targetAmount: "",
    },
  })
  
  function onSubmit(values: FormValues) {
    console.log(values)
    // In a real app, you would submit this data to your API
    router.push('/dashboard')
  }

  return (
    <div className="bg-white rounded-lg shadow-sm">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-lg font-medium text-gray-900">Group Details</h2>
      </div>
      
      <div className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Group Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-700">
                    Group Name*
                    <span className="text-gray-500 font-normal ml-1">(Choose a name that identifies your group clearly)</span>
                  </FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Market Women Association" 
                      className="mt-1"
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
                      placeholder="Market Women Association is ..................."
                      className="mt-1 resize-none"
                      rows={4}
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
                        placeholder="₦100,000"
                        className="mt-1"
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
                        <SelectTrigger className="mt-1">
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
                      <Input 
                        type="number"
                        placeholder="10"
                        className="mt-1"
                        {...field} 
                      />
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
                        placeholder="E.g. ₦10,000,000"
                        className="mt-1"
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
            <div className="flex justify-end pt-6">
              <Button 
                type="submit"
                className="bg-primary hover:bg-primary/90 text-white px-8"
              >
                Set Group Rules
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  )
} 