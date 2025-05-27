"use client"

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  Filter, 
  X, 
  Calendar as CalendarIcon,
  ChevronDown
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { 
  ContributionStatus, 
  ContributionType, 
  PaymentMethod,
  Group 
} from '@/lib/types'
import { 
  getStatusLabel, 
  getTypeLabel, 
  getPaymentMethodLabel 
} from '@/lib/contribution-utils'

interface ContributionFiltersProps {
  groups?: Group[]
  onFiltersChange: (filters: ContributionFilters) => void
  className?: string
}

interface ContributionFilters {
  status?: ContributionStatus[]
  type?: ContributionType[]
  paymentMethod?: PaymentMethod[]
  groupId?: string
  dateFrom?: Date
  dateTo?: Date
}

export default function ContributionFilters({
  groups = [],
  onFiltersChange,
  className
}: ContributionFiltersProps) {
  const [filters, setFilters] = useState<ContributionFilters>({})
  const [showFilters, setShowFilters] = useState(false)

  const statusOptions = Object.values(ContributionStatus)
  const typeOptions = Object.values(ContributionType)
  const paymentMethodOptions = Object.values(PaymentMethod)

  const handleStatusToggle = (status: ContributionStatus, checked: boolean) => {
    const newStatus = checked
      ? [...(filters.status || []), status]
      : (filters.status || []).filter(s => s !== status)
    
    const newFilters = { ...filters, status: newStatus.length > 0 ? newStatus : undefined }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleTypeToggle = (type: ContributionType, checked: boolean) => {
    const newType = checked
      ? [...(filters.type || []), type]
      : (filters.type || []).filter(t => t !== type)
    
    const newFilters = { ...filters, type: newType.length > 0 ? newType : undefined }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handlePaymentMethodToggle = (method: PaymentMethod, checked: boolean) => {
    const newPaymentMethod = checked
      ? [...(filters.paymentMethod || []), method]
      : (filters.paymentMethod || []).filter(m => m !== method)
    
    const newFilters = { 
      ...filters, 
      paymentMethod: newPaymentMethod.length > 0 ? newPaymentMethod : undefined 
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleGroupChange = (groupId: string) => {
    const newFilters = { 
      ...filters, 
      groupId: groupId === 'all' ? undefined : groupId 
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleDateFromSelect = (date: Date | undefined) => {
    const newFilters = { ...filters, dateFrom: date }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleDateToSelect = (date: Date | undefined) => {
    const newFilters = { ...filters, dateTo: date }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearAllFilters = () => {
    setFilters({})
    onFiltersChange({})
  }

  const getActiveFiltersCount = () => {
    let count = 0
    if (filters.status?.length) count++
    if (filters.type?.length) count++
    if (filters.paymentMethod?.length) count++
    if (filters.groupId) count++
    if (filters.dateFrom || filters.dateTo) count++
    return count
  }

  const activeFiltersCount = getActiveFiltersCount()

  return (
    <div className={cn("space-y-4", className)}>
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="w-4 h-4" />
          Filters
          {activeFiltersCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFiltersCount}
            </Badge>
          )}
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            showFilters && "rotate-180"
          )} />
        </Button>

        {activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center gap-1"
          >
            <X className="w-3 h-3" />
            Clear all
          </Button>
        )}
      </div>

      {showFilters && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Filter Contributions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Group Filter */}
            {groups.length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Group
                </label>
                <Select
                  value={filters.groupId || 'all'}
                  onValueChange={handleGroupChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a group" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Groups</SelectItem>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Status Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">
                Status
              </label>
              <div className="grid grid-cols-2 gap-3">
                {statusOptions.map((status) => (
                  <div key={status} className="flex items-center space-x-2">
                    <Checkbox
                      id={`status-${status}`}
                      checked={filters.status?.includes(status) || false}
                      onCheckedChange={(checked) => 
                        handleStatusToggle(status, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`status-${status}`}
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      {getStatusLabel(status)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">
                Type
              </label>
              <div className="grid grid-cols-1 gap-3">
                {typeOptions.map((type) => (
                  <div key={type} className="flex items-center space-x-2">
                    <Checkbox
                      id={`type-${type}`}
                      checked={filters.type?.includes(type) || false}
                      onCheckedChange={(checked) => 
                        handleTypeToggle(type, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`type-${type}`}
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      {getTypeLabel(type)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment Method Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">
                Payment Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                {paymentMethodOptions.map((method) => (
                  <div key={method} className="flex items-center space-x-2">
                    <Checkbox
                      id={`method-${method}`}
                      checked={filters.paymentMethod?.includes(method) || false}
                      onCheckedChange={(checked) => 
                        handlePaymentMethodToggle(method, checked as boolean)
                      }
                    />
                    <label
                      htmlFor={`method-${method}`}
                      className="text-sm text-gray-600 cursor-pointer"
                    >
                      {getPaymentMethodLabel(method)}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-3">
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-500 block mb-1">From</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateFrom && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateFrom}
                        onSelect={handleDateFromSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                
                <div>
                  <label className="text-xs text-gray-500 block mb-1">To</label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !filters.dateTo && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={filters.dateTo}
                        onSelect={handleDateToSelect}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 