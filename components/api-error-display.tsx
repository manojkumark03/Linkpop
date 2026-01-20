"use client"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle, WifiOff, Clock, ShieldAlert, RefreshCcw } from "lucide-react"

interface ApiErrorDisplayProps {
  error: {
    error: string
    code?: string
    timestamp?: string
  }
  onRetry?: () => void
  className?: string
}

export function ApiErrorDisplay({ error, onRetry, className }: ApiErrorDisplayProps) {
  const getErrorIcon = () => {
    switch (error.code) {
      case "TIMEOUT":
        return <Clock className="h-4 w-4" />
      case "NETWORK_ERROR":
        return <WifiOff className="h-4 w-4" />
      case "RATE_LIMIT_EXCEEDED":
        return <ShieldAlert className="h-4 w-4" />
      default:
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getErrorTitle = () => {
    switch (error.code) {
      case "TIMEOUT":
        return "Request Timeout"
      case "DATABASE_ERROR":
        return "Connection Issue"
      case "RATE_LIMIT_EXCEEDED":
        return "Too Many Requests"
      case "AUTH_ERROR":
        return "Authentication Required"
      case "AUTHORIZATION_ERROR":
        return "Permission Denied"
      case "NOT_FOUND":
        return "Not Found"
      default:
        return "Error"
    }
  }

  return (
    <Alert variant="destructive" className={className}>
      <div className="flex items-start gap-2">
        {getErrorIcon()}
        <div className="flex-1 space-y-1">
          <AlertTitle>{getErrorTitle()}</AlertTitle>
          <AlertDescription className="text-sm">{error.error}</AlertDescription>
          {error.timestamp && (
            <p className="text-xs text-muted-foreground mt-1">Time: {new Date(error.timestamp).toLocaleTimeString()}</p>
          )}
        </div>
        {onRetry && (
          <Button size="sm" variant="outline" onClick={onRetry} className="ml-auto bg-transparent">
            <RefreshCcw className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )}
      </div>
    </Alert>
  )
}
