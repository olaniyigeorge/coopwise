"use client"

import React, { useState } from 'react'
import Image from 'next/image'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Camera, Upload, X, User } from 'lucide-react'
import { toast } from 'sonner'

interface ProfileData {
  fullName: string
  phoneNumber: string
  email: string
  monthlySavingsTarget: string
  savingAmountGoal: string
  savingGoal: string
  savingFrequency: string
  avatar?: string
}

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: 'Mercy Oyelenmu',
    phoneNumber: '+234768046342',
    email: 'mercy274@gmail.com',
    monthlySavingsTarget: 'Above 6000000',
    savingAmountGoal: '4000000',
    savingGoal: 'Education',
    savingFrequency: 'Monthly'
  })

  const [isLoading, setIsLoading] = useState(false)
  const [imagePreview, setImagePreview] = useState<string>('')

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImagePreview(result)
        setProfileData(prev => ({
          ...prev,
          avatar: result
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setImagePreview('')
    setProfileData(prev => ({
      ...prev,
      avatar: undefined
    }))
  }

  const handleSaveChanges = async () => {
    setIsLoading(true)
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    setIsLoading(false)
    toast.success('Profile updated successfully!', {
      description: 'Your changes have been saved.',
    })
  }

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">My Profile</h1>
          <p className="text-sm sm:text-base text-gray-600 mt-1">
            Manage your details and account settings.
          </p>
        </div>

        {/* Profile Form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Photo Section */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex justify-center sm:justify-start">
                <div className="relative">
                  <Avatar className="w-20 h-20 sm:w-24 sm:h-24">
                    <AvatarImage 
                      src={imagePreview || profileData.avatar} 
                      alt={profileData.fullName}
                    />
                    <AvatarFallback className="text-lg font-semibold bg-primary/10 text-primary">
                      {getInitials(profileData.fullName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Camera className="w-3 h-3 text-white" />
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <div className="flex-1">
                                                      <input                    type="file"                    accept="image/*"                    onChange={handleImageUpload}                    className="hidden"                    id="avatar-upload"                    aria-label="Upload profile photo"                  />
                  <Label htmlFor="avatar-upload" asChild>
                    <Button variant="outline" className="w-full sm:w-auto cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      Upload a Photo
                    </Button>
                  </Label>
                </div>
                
                {(imagePreview || profileData.avatar) && (
                  <Button 
                    variant="outline" 
                    onClick={handleRemovePhoto}
                    className="w-full sm:w-auto text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Remove Photo
                  </Button>
                )}
              </div>
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
              {/* Full Name */}
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-sm font-medium">
                  Full Name
                </Label>
                <Input
                  id="fullName"
                  value={profileData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  placeholder="Enter your full name"
                  className="w-full"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <Label htmlFor="phoneNumber" className="text-sm font-medium">
                  Phone Number
                </Label>
                <Input
                  id="phoneNumber"
                  value={profileData.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="Enter your phone number"
                  className="w-full"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full"
                />
              </div>

              {/* Monthly Savings Target */}
              <div className="space-y-2">
                <Label htmlFor="monthlySavingsTarget" className="text-sm font-medium">
                  Monthly Savings Target
                </Label>
                <Select
                  value={profileData.monthlySavingsTarget}
                  onValueChange={(value) => handleInputChange('monthlySavingsTarget', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select target range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Below 100000">Below ₦100,000</SelectItem>
                    <SelectItem value="100000-500000">₦100,000 - ₦500,000</SelectItem>
                    <SelectItem value="500000-1000000">₦500,000 - ₦1,000,000</SelectItem>
                    <SelectItem value="1000000-5000000">₦1,000,000 - ₦5,000,000</SelectItem>
                    <SelectItem value="Above 5000000">Above ₦5,000,000</SelectItem>
                    <SelectItem value="Above 6000000">Above ₦6,000,000</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Saving Amount Goal */}
              <div className="space-y-2">
                <Label htmlFor="savingAmountGoal" className="text-sm font-medium">
                  Saving Amount Goal
                </Label>
                <Input
                  id="savingAmountGoal"
                  value={profileData.savingAmountGoal}
                  onChange={(e) => handleInputChange('savingAmountGoal', e.target.value)}
                  placeholder="Enter target amount"
                  className="w-full"
                />
              </div>

              {/* Saving Goal */}
              <div className="space-y-2">
                <Label htmlFor="savingGoal" className="text-sm font-medium">
                  Saving Goal
                </Label>
                <Select
                  value={profileData.savingGoal}
                  onValueChange={(value) => handleInputChange('savingGoal', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your saving goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Education">Education</SelectItem>
                    <SelectItem value="House Rent">House Rent</SelectItem>
                    <SelectItem value="Emergency Fund">Emergency Fund</SelectItem>
                    <SelectItem value="Investment">Investment</SelectItem>
                    <SelectItem value="Business">Business</SelectItem>
                    <SelectItem value="Travel">Travel</SelectItem>
                    <SelectItem value="Car Purchase">Car Purchase</SelectItem>
                    <SelectItem value="Wedding">Wedding</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Saving Frequency */}
              <div className="space-y-2">
                <Label htmlFor="savingFrequency" className="text-sm font-medium">
                  Saving Frequency
                </Label>
                <Select
                  value={profileData.savingFrequency}
                  onValueChange={(value) => handleInputChange('savingFrequency', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Daily">Daily</SelectItem>
                    <SelectItem value="Weekly">Weekly</SelectItem>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-4">
              <Button 
                onClick={handleSaveChanges}
                disabled={isLoading}
                className="w-full sm:w-auto min-w-[140px]"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Additional Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Account Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Change Password</h3>
                <p className="text-sm text-gray-500">Update your account password</p>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">
                Change Password
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-gray-200 rounded-lg">
              <div>
                <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-500">Add an extra layer of security</p>
              </div>
              <Button variant="outline" className="w-full sm:w-auto">
                Setup 2FA
              </Button>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-red-200 rounded-lg bg-red-50">
              <div>
                <h3 className="font-medium text-red-900">Delete Account</h3>
                <p className="text-sm text-red-600">Permanently delete your account and data</p>
              </div>
              <Button variant="destructive" className="w-full sm:w-auto">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
} 