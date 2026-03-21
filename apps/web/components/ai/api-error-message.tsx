import React from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ApiErrorMessageProps {
  message: string
  onRetry?: () => void
}

export default function ApiErrorMessage({ message, onRetry }: ApiErrorMessageProps) {
  return (
    <Card className="border-red-200 bg-red-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-500" />
          <CardTitle className="text-lg text-red-700">API Connection Error</CardTitle>
        </div>
        <CardDescription className="text-red-600">
          There was an issue connecting to the AI service
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-red-700">{message}</p>
        <div className="mt-4 text-sm text-gray-600">
          <p>This could be due to:</p>
          <ul className="list-disc pl-5 mt-2 space-y-1">
            <li>Missing or invalid API key</li>
            <li>Network connectivity issues</li>
            <li>Rate limiting from the API provider</li>
            <li>Temporary service outage</li>
          </ul>
        </div>
      </CardContent>
      {onRetry && (
        <CardFooter>
          <Button onClick={onRetry} variant="outline" className="border-red-200 text-red-700 hover:bg-red-100 hover:text-red-800">
            Retry Connection
          </Button>
        </CardFooter>
      )}
    </Card>
  )
} 