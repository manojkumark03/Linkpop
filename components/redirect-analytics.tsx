"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ExternalLink, TrendingUp, Globe, Users } from "lucide-react"
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface RedirectAnalyticsProps {
  redirectUrl: string
  customDomain: string
  dateRange?: {
    startDate: string
    endDate: string
  }
}

export function RedirectAnalytics({ redirectUrl, customDomain, dateRange }: RedirectAnalyticsProps) {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchRedirectAnalytics()
  }, [dateRange])

  const fetchRedirectAnalytics = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (dateRange?.startDate) {
        params.append("startDate", dateRange.startDate)
      }
      if (dateRange?.endDate) {
        params.append("endDate", dateRange.endDate)
      }

      const response = await fetch(`/api/insights/redirect?${params}`)
      if (!response.ok) {
        throw new Error("Failed to fetch redirect analytics")
      }
      const result = await response.json()
      setData(result)
    } catch (err) {
      setError("Failed to load redirect analytics")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Root Domain Redirect Analytics</CardTitle>
          <CardDescription>Loading analytics...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Root Domain Redirect Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertDescription>{error || "No data available"}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ExternalLink className="size-5" />
          Root Domain Redirect Analytics
        </CardTitle>
        <CardDescription>
          Tracking redirects from {customDomain} → {redirectUrl}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="size-4" />
              Total Redirects
            </div>
            <div className="text-2xl font-bold">{data.summary.totalRedirects.toLocaleString()}</div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Globe className="size-4" />
              Countries
            </div>
            <div className="text-2xl font-bold">{data.topCountries.length}</div>
          </div>

          <div className="p-4 border rounded-lg">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="size-4" />
              Top Device
            </div>
            <div className="text-2xl font-bold capitalize">{data.deviceTypes[0]?.deviceType || "N/A"}</div>
          </div>
        </div>

        {data.redirectsByDay.length > 0 && (
          <div>
            <h3 className="font-semibold mb-3">Redirects Over Time</h3>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={data.redirectsByDay}>
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="redirects" stroke="hsl(var(--primary))" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-semibold mb-3">Top Countries</h3>
            <div className="space-y-2">
              {data.topCountries.slice(0, 5).map((country: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span>{country.country}</span>
                  <span className="font-medium">{country.redirects}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-3">Top Referrers</h3>
            <div className="space-y-2">
              {data.topReferrers.slice(0, 5).map((referrer: any, index: number) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{referrer.platform}</span>
                  <span className="font-medium">{referrer.redirects}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            Note: These analytics track visitors who access your root domain ({customDomain}) and are redirected to{" "}
            {redirectUrl}. Your bio page analytics at {customDomain}/bio and shortlink analytics are tracked separately.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}
