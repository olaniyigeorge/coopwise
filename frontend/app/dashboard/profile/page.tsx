"use client"

import React, { useState, useEffect } from 'react'
import DashboardLayout from '@/components/dashboard/layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { useAuth } from '@/lib/auth-context'

interface ProfileData {
  fullName: string
  phoneNumber: string
  email: string
  monthlySavingsTarget: string
  savingAmountGoal: string
  savingGoal: string
  savingFrequency: string
}

// Mapping for income range values to match backend enum
const incomeRangeMapping: Record<string, string> = {
  "Below 100000": "BELOW_50K",
  "100000-500000": "RANGE_100K_200K",
  "500000-1000000": "RANGE_350K_500K",
  "1000000-5000000": "ABOVE_500K",
  "Above 5000000": "ABOVE_500K",
  "Above 6000000": "ABOVE_500K"
};

// Mapping for saving frequency values to match backend enum
const savingFrequencyMapping: Record<string, string> = {
  "Daily": "daily",
  "Weekly": "weekly",
  "Monthly": "monthly",
  "Quarterly": "monthly" // Backend doesn't have quarterly, default to monthly
};

export default function ProfilePage() {
  const { user, updateUserProfile, refreshUserData } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: '',
    phoneNumber: '',
    email: '',
    monthlySavingsTarget: '',
    savingAmountGoal: '',
    savingGoal: '',
    savingFrequency: ''
  })

  const [isLoading, setIsLoading] = useState(false)

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setProfileData({
        fullName: user.full_name || '',
        phoneNumber: user.phone_number || '',
        email: user.email || '',
        monthlySavingsTarget: user.income_range || '',
        savingAmountGoal: user.target_savings_amount?.toString() || '',
        savingGoal: user.savings_purpose || '',
        savingFrequency: user.saving_frequency || ''
      });
    } else {
      // If no user data, try to refresh it
      refreshUserData();
    }
  }, [user, refreshUserData]);

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSaveChanges = async () => {
    if (!user) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    setIsLoading(true);
    
    try {
      // Format the data exactly as the API expects it based on the API schema
      const updateData = {
        id: user.id,
        resource_owner_id: user.id,
        username: user.username,
        email: profileData.email,
        full_name: profileData.fullName,
        phone_number: profileData.phoneNumber,
        role: user.role || "user",
        target_savings_amount: profileData.savingAmountGoal ? parseFloat(profileData.savingAmountGoal) : 0,
        savings_purpose: profileData.savingGoal || "",
        income_range: profileData.monthlySavingsTarget || "Below 50K",
        saving_frequency: profileData.savingFrequency || "daily",
        is_email_verified: user.is_email_verified !== undefined ? user.is_email_verified : false,
        is_phone_verified: user.is_phone_verified !== undefined ? user.is_phone_verified : false,
        created_at: user.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      console.log('Sending profile update data:', updateData);
      
      // Use the proxy endpoint through the auth context
      await updateUserProfile(updateData);
      
      toast.success('Profile updated successfully!', {
        description: 'Your changes have been saved.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      
      let errorMessage = 'Failed to update your profile';
      
      // Extract error details from the response
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => 
            `${err.loc.join('.')}: ${err.msg}`
          ).join(', ');
        } else {
          errorMessage = error.response.data.detail;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error('Update failed', {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* Profile Form */}
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-semibold">Profile Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                    <SelectItem value="Below 50K">Below ₦50,000</SelectItem>
                    <SelectItem value="RANGE_50K_100K">₦50,000 - ₦100,000</SelectItem>
                    <SelectItem value="RANGE_100K_200K">₦100,000 - ₦200,000</SelectItem>
                    <SelectItem value="RANGE_200K_350K">₦200,000 - ₦350,000</SelectItem>
                    <SelectItem value="RANGE_350K_500K">₦350,000 - ₦500,000</SelectItem>
                    <SelectItem value="ABOVE_500K">Above ₦500,000</SelectItem>
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
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
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
      </div>
    </DashboardLayout>
  )
} 