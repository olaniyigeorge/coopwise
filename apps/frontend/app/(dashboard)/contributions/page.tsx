"use client"

import React, { useState, useMemo, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardLayout from '@/components/dashboard/layout'
import ContributionCard from '@/components/dashboard/contribution-card'
import ContributionFilters from '@/components/dashboard/contribution-filters'
import ContributionSummaryComponent from '@/components/dashboard/contribution-summary'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  Download, 
  Plus,
  RefreshCw,
  Grid3X3,
  List
} from 'lucide-react'
import { 
  Contribution, 
  ContributionStatus, 
  ContributionType,
  PaymentMethod
} from '@/lib/types'
import { 
  mockGroups, 
  getUserContributions 
} from '@/lib/mock-data'
import { 
  calculateContributionSummary,
  sortContributionsByDate,
  filterContributions
} from '@/lib/contribution-utils'
import { toast } from 'sonner'

interface ContributionFilters {
  status?: ContributionStatus[]
  type?: ContributionType[]
  paymentMethod?: PaymentMethod[]
  groupId?: string
  dateFrom?: Date
  dateTo?: Date
}

// Loading component for suspense fallback
function LoadingFallback() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded mb-4"></div>
          <div className="h-32 bg-gray-200 rounded mb-6"></div>
          <div className="h-12 bg-gray-200 rounded mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
            </div>
    </DashboardLayout>
  )
}

export default function AllContributionsPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <AllContributionsContent />
    </Suspense>
  )
} 

// Component that uses search params
function AllContributionsContent() {
  const searchParams = useSearchParams()
  const [activeTab, setActiveTab] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState('date-desc')
  const [filters, setFilters] = useState<ContributionFilters>({})
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Handle success notification
  useEffect(() => {
    const success = searchParams.get('success')
    const amount = searchParams.get('amount')
    const method = searchParams.get('method')
    
    if (success === 'true' && amount) {
      const formattedAmount = parseInt(amount).toLocaleString()
      const paymentMethod = method === 'transfer' ? 'bank transfer' : 'card payment'
      
      toast.success(
        `Contribution of ₦${formattedAmount} successful!`,
        {
          description: `Your payment via ${paymentMethod} has been processed successfully.`,
          duration: 5000,
        }
      )
      
      // Clean up URL parameters
      const url = new URL(window.location.href)
      url.searchParams.delete('success')
      url.searchParams.delete('amount')
      url.searchParams.delete('method')
      window.history.replaceState({}, '', url.toString())
    }
  }, [searchParams])

  // Get user contributions (in a real app, this would come from an API/context)
  const userContributions = useMemo(() => getUserContributions('1'), [])

  // Apply filters and search
  const filteredContributions = useMemo(() => {
    let filtered = [...userContributions]

    // Apply search
    if (searchQuery) {
      filtered = filtered.filter(contribution => 
        contribution.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contribution.group?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contribution.reference?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply filters
    filtered = filterContributions(filtered, {
      status: filters.status,
      type: filters.type,
      groupId: filters.groupId,
      dateFrom: filters.dateFrom?.toISOString(),
      dateTo: filters.dateTo?.toISOString()
    })

    // Apply tab filter
    if (activeTab !== 'all') {
      switch (activeTab) {
        case 'completed':
          filtered = filtered.filter(c => c.status === ContributionStatus.COMPLETED)
          break
        case 'pending':
          filtered = filtered.filter(c => 
            c.status === ContributionStatus.PENDING || 
            c.status === ContributionStatus.PROCESSING
          )
          break
        case 'overdue':
          filtered = filtered.filter(c => c.status === ContributionStatus.OVERDUE)
          break
        case 'failed':
          filtered = filtered.filter(c => c.status === ContributionStatus.FAILED)
          break
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'date-desc':
        filtered = sortContributionsByDate(filtered, 'desc')
        break
      case 'date-asc':
        filtered = sortContributionsByDate(filtered, 'asc')
        break
      case 'amount-desc':
        filtered = filtered.sort((a, b) => b.amount - a.amount)
        break
      case 'amount-asc':
        filtered = filtered.sort((a, b) => a.amount - b.amount)
        break
    }

    return filtered
  }, [userContributions, searchQuery, filters, activeTab, sortBy])

  // Calculate summary
  const summary = useMemo(() => 
    calculateContributionSummary(filteredContributions), 
    [filteredContributions]
  )

  // Pagination
  const totalPages = Math.ceil(filteredContributions.length / itemsPerPage)
  const paginatedContributions = filteredContributions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  )

  const handleFiltersChange = (newFilters: ContributionFilters) => {
    setFilters(newFilters)
    setCurrentPage(1)
  }

  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setCurrentPage(1)
  }

  const handleRetryPayment = (contribution: Contribution) => {
    // In a real app, this would trigger a payment retry
    console.log('Retrying payment for:', contribution.id)
  }

  const handleViewReceipt = (contribution: Contribution) => {
    // In a real app, this would open the receipt
    console.log('Viewing receipt for:', contribution.id)
  }

  const handleViewDetails = (contribution: Contribution) => {
    // In a real app, this would navigate to detail page
    console.log('Viewing details for:', contribution.id)
  }

  const handleExport = () => {
    // In a real app, this would export the data
    console.log('Exporting contributions...')
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">All Contributions</h1>
            <p className="text-sm text-gray-600 mt-1">
              Track and manage all your contribution history
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
                        <Button               size="sm"               onClick={() => window.location.href = '/dashboard/contributions/make/loading?amount=100000'}            >              <Plus className="w-4 h-4 mr-2" />              New Contribution            </Button>
          </div>
        </div>

        {/* Summary */}
        <ContributionSummaryComponent summary={summary} />

        {/* Filters */}
        <ContributionFilters
          groups={mockGroups}
          onFiltersChange={handleFiltersChange}
        />

        {/* Search and Controls */}
        <div className="flex flex-col gap-3 sm:gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search contributions, groups, or references..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center justify-between gap-3">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date-desc">Latest First</SelectItem>
                <SelectItem value="date-asc">Oldest First</SelectItem>
                <SelectItem value="amount-desc">Amount (High)</SelectItem>
                <SelectItem value="amount-asc">Amount (Low)</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border border-gray-200 rounded-md p-1 flex-shrink-0">
              <Button
                variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="px-2"
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="px-2"
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="all" className="flex items-center gap-2">
              All
              <Badge variant="secondary" className="text-xs">
                {userContributions.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed" className="flex items-center gap-2">
              Completed
              <Badge variant="secondary" className="text-xs">
                {userContributions.filter(c => c.status === ContributionStatus.COMPLETED).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex items-center gap-2">
              Pending
              <Badge variant="secondary" className="text-xs">
                {userContributions.filter((c: { status: any }) => 
                  c.status === ContributionStatus.PENDING || 
                  c.status === ContributionStatus.PROCESSING
                ).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="overdue" className="flex items-center gap-2">
              Overdue
              <Badge variant="destructive" className="text-xs">
                {userContributions.filter(c => c.status === ContributionStatus.OVERDUE).length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="failed" className="flex items-center gap-2">
              Failed
              <Badge variant="destructive" className="text-xs">
                {userContributions.filter(c => c.status === ContributionStatus.FAILED).length}
              </Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {filteredContributions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="text-center">
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No contributions found
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      {searchQuery || Object.keys(filters).length > 0
                        ? 'Try adjusting your search or filters'
                        : 'Get started by making your first contribution'
                      }
                    </p>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      New Contribution
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Contributions Grid/List */}
                <div className={
                  viewMode === 'grid'
                    ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                    : 'space-y-4'
                }>
                  {paginatedContributions.map((contribution) => (
                    <ContributionCard
                      key={contribution.id}
                      contribution={contribution}
                      showGroup={true}
                      onViewDetails={handleViewDetails}
                      onRetryPayment={handleRetryPayment}
                      onViewReceipt={handleViewReceipt}
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <p className="text-sm text-gray-600">
                      Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                      {Math.min(currentPage * itemsPerPage, filteredContributions.length)} of{' '}
                      {filteredContributions.length} contributions
                    </p>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      
                      <div className="flex items-center gap-1">
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => {
                            if (totalPages <= 5) return true
                            if (page === 1 || page === totalPages) return true
                            return Math.abs(page - currentPage) <= 1
                          })
                          .map((page, index, array) => (
                            <React.Fragment key={page}>
                              {index > 0 && array[index - 1] !== page - 1 && (
                                <span className="px-2 text-gray-400">...</span>
                              )}
                              <Button
                                variant={currentPage === page ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setCurrentPage(page)}
                                className="w-10"
                              >
                                {page}
                              </Button>
                            </React.Fragment>
                          ))
                        }
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  )
} 