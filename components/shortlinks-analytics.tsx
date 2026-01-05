"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link2, MousePointer, TrendingUp, Globe, Monitor, ArrowLeft, ExternalLink, Copy, Check } from "lucide-react"
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Progress } from "@/components/ui/progress"

interface ShortlinksAnalyticsProps {
  dateRange: { from: Date | undefined; to: Date | undefined }
}

const COLORS = ["#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6"]

export function ShortlinksAnalytics({ dateRange }: ShortlinksAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [selectedLink, setSelectedLink] = useState<string | null>(null)
  const [detailedAnalytics, setDetailedAnalytics] = useState<any>(null)
  const [detailsLoading, setDetailsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [username, setUsername] = useState<string>("")
  const [customDomain, setCustomDomain] = useState<string | null>(null)
  const [useDomainForShortlinks, setUseDomainForShortlinks] = useState(true)
  const [copiedUrl, setCopiedUrl] = useState(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUsername(data.user.username)
          const hasVerifiedDomain = data.user.custom_domain && data.user.domain_verified
          setCustomDomain(hasVerifiedDomain ? data.user.custom_domain : null)
          setUseDomainForShortlinks(data.user.use_domain_for_shortlinks ?? true)
        }
      })
      .catch(console.error)
  }, [])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append("startDate", dateRange.from.toISOString())
      if (dateRange.to) params.append("endDate", dateRange.to.toISOString())

      const response = await fetch(`/api/insights/shortlinks?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        if (data && data.overview && data.topLinks) {
          setAnalytics(data)
        } else {
          console.error("Invalid analytics data structure:", data)
          setError("Invalid data format received")
        }
      } else {
        setError(data.error || "Failed to load analytics")
        console.error("API error:", data)
      }
    } catch (error) {
      console.error("Failed to fetch shortlinks analytics:", error)
      setError("Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  const fetchDetailedAnalytics = async (linkId: string) => {
    setDetailsLoading(true)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append("startDate", dateRange.from.toISOString())
      if (dateRange.to) params.append("endDate", dateRange.to.toISOString())

      const response = await fetch(`/api/insights/shortlinks/${linkId}?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        if (data && data.link) {
          setDetailedAnalytics(data)
        } else {
          console.error("Invalid detailed analytics structure:", data)
        }
      }
    } catch (error) {
      console.error("Failed to fetch detailed analytics:", error)
    } finally {
      setDetailsLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  useEffect(() => {
    if (selectedLink) {
      fetchDetailedAnalytics(selectedLink)
    }
  }, [selectedLink, dateRange])

  const getDisplayUrl = (shortCode: string) => {
    const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"
    if (customDomain && useDomainForShortlinks) {
      return `${customDomain}/${shortCode}`
    }
    return `${username}.${appDomain}/${shortCode}`
  }

  const getFullUrl = (shortCode: string) => {
    const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"
    if (customDomain && useDomainForShortlinks) {
      return `https://${customDomain}/${shortCode}`
    }
    return `https://${username}.${appDomain}/${shortCode}`
  }

  const copyShortUrl = (shortCode: string) => {
    navigator.clipboard.writeText(getFullUrl(shortCode))
    setCopiedUrl(true)
    setTimeout(() => setCopiedUrl(false), 2000)
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading shortlinks analytics...</p>
        </CardContent>
      </Card>
    )
  }

  if (error || !analytics) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <p className="text-muted-foreground">{error || "Failed to load analytics"}</p>
            <Button onClick={fetchAnalytics} variant="outline" size="sm">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (selectedLink && detailedAnalytics) {
    const { link, clicksByDay, topCountries, deviceTypes, topReferrers } = detailedAnalytics

    const countryChartData = topCountries.slice(0, 8).map((country: any) => ({
      name: country.country || "Unknown",
      value: country.clicks,
    }))

    const deviceChartData = deviceTypes.map((device: any) => ({
      name: device.deviceType || "Desktop",
      value: device.clicks,
    }))

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <Button variant="ghost" size="sm" onClick={() => setSelectedLink(null)} className="mb-2 -ml-2">
              <ArrowLeft className="size-4 mr-2" />
              Back to Overview
            </Button>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-3 flex-1 min-w-0">
                <div>
                  <CardTitle className="text-2xl mb-2">{link.title || "Untitled"}</CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="gap-1.5 px-2.5 py-1">
                        <Link2 className="size-3" />
                        <a
                          href={getFullUrl(link.short_code)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-mono text-sm"
                        >
                          {getDisplayUrl(link.short_code)}
                        </a>
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => copyShortUrl(link.short_code)}
                        className="h-7 px-2"
                      >
                        {copiedUrl ? (
                          <>
                            <Check className="size-3 mr-1" />
                            <span className="text-xs">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-3 mr-1" />
                            <span className="text-xs">Copy</span>
                          </>
                        )}
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ExternalLink className="size-3 flex-shrink-0" />
                      <a
                        href={link.destination_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline truncate"
                      >
                        {link.destination_url}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-xl px-5 py-2.5 flex-shrink-0">
                {link.total_clicks.toLocaleString()} clicks
              </Badge>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Clicks Over Time</CardTitle>
            <CardDescription>Daily click performance</CardDescription>
          </CardHeader>
          <CardContent>
            {clicksByDay.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={clicksByDay}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(date) =>
                      new Date(date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
                    }
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ fill: "#ec4899", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No click data available</p>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-5" />
                Geographic Distribution
              </CardTitle>
              <CardDescription>Clicks by country</CardDescription>
            </CardHeader>
            <CardContent>
              {topCountries.length > 0 ? (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={countryChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={85}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {countryChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {topCountries.slice(0, 5).map((country: any, index: number) => {
                      const percentage = link.total_clicks > 0 ? (country.clicks / link.total_clicks) * 100 : 0
                      return (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="size-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium">{country.country || "Unknown"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{country.clicks} clicks</span>
                            <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No geographic data yet</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="size-5" />
                Device Breakdown
              </CardTitle>
              <CardDescription>Clicks by device type</CardDescription>
            </CardHeader>
            <CardContent>
              {deviceTypes.length > 0 ? (
                <div className="space-y-6">
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={deviceChartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        fill="#8884d8"
                        paddingAngle={5}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {deviceChartData.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2">
                    {deviceTypes.map((device: any, index: number) => {
                      const percentage = link.total_clicks > 0 ? (device.clicks / link.total_clicks) * 100 : 0
                      return (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div
                              className="size-3 rounded-full"
                              style={{ backgroundColor: COLORS[index % COLORS.length] }}
                            />
                            <span className="font-medium capitalize">{device.deviceType || "Desktop"}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{device.clicks} clicks</span>
                            <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No device data yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Top Referrers</CardTitle>
            <CardDescription>Where your clicks come from</CardDescription>
          </CardHeader>
          <CardContent>
            {topReferrers.length > 0 ? (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={topReferrers}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="referrer" stroke="hsl(var(--muted-foreground))" />
                    <YAxis stroke="hsl(var(--muted-foreground))" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--popover))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Bar dataKey="clicks" fill="#ec4899" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {topReferrers.map((referrer: any, index: number) => {
                    const percentage = link.total_clicks > 0 ? (referrer.clicks / link.total_clicks) * 100 : 0
                    return (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium truncate">{referrer.referrer || "Direct"}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">{referrer.clicks} clicks</span>
                            <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                          </div>
                        </div>
                        <Progress value={percentage} className="h-2" />
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No referrer data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const { overview = {}, topLinks = [] } = analytics || {}
  const { totalLinks = 0, totalClicks = 0, avgCtr = 0 } = overview

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <Link2 className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalLinks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Active short links</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointer className="size-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time clicks</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. CTR</CardTitle>
            <TrendingUp className="size-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgCtr}%</div>
            <p className="text-xs text-muted-foreground mt-1">Click-through rate</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Performing Shortlinks</CardTitle>
          <CardDescription>Click on a link card to see detailed analytics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topLinks.length > 0 ? (
              topLinks.map((link: any, index: number) => {
                const percentage = totalClicks > 0 ? (link.total_clicks / totalClicks) * 100 : 0
                return (
                  <div
                    key={link.id}
                    className="p-4 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => setSelectedLink(link.id)}
                  >
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono text-sm">
                            /{link.short_code}
                          </Badge>
                          {link.title && <h3 className="font-semibold truncate">{link.title}</h3>}
                        </div>
                        <p className="text-sm text-muted-foreground truncate flex items-center gap-1.5">
                          <ExternalLink className="size-3 flex-shrink-0" />
                          {link.destination_url}
                        </p>
                        <p className="text-xs text-muted-foreground font-mono">{getDisplayUrl(link.short_code)}</p>
                      </div>
                      <div className="flex-shrink-0 text-right">
                        <div className="text-2xl font-bold">{link.total_clicks.toLocaleString()}</div>
                        <div className="text-xs text-muted-foreground">clicks</div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Share of total clicks</span>
                        <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">No shortlinks created yet</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
