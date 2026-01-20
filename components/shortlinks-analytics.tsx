"use client"

import { Progress } from "@/components/ui/progress"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowLeft,
  TrendingUp,
  MousePointerClick,
  Globe,
  Monitor,
  Copy,
  ExternalLink,
  Check,
  Link2,
} from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"

interface ShortlinksAnalyticsProps {
  dateRange: {
    startDate: string
    endDate: string
  }
}

const COLORS = ["#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6"]

export function ShortlinksAnalytics({ dateRange }: ShortlinksAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedLink, setSelectedLink] = useState<string | null>(null)
  const [detailedAnalytics, setDetailedAnalytics] = useState<any>(null)
  const [detailedLoading, setDetailedLoading] = useState(false)
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [customDomain, setCustomDomain] = useState<string | null>(null)
  const [username, setUsername] = useState<string>("")
  const [useDomainForShortlinks, setUseDomainForShortlinks] = useState<boolean>(false)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUsername(data.user.username)
          const hasVerifiedDomain = data.user.custom_domain && data.user.domain_verified
          setCustomDomain(hasVerifiedDomain ? data.user.custom_domain : null)
          setUseDomainForShortlinks(hasVerifiedDomain)
        }
      })
      .catch(console.error)
  }, [])

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  useEffect(() => {
    if (selectedLink) {
      fetchDetailedAnalytics(selectedLink)
    }
  }, [selectedLink, dateRange])

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append("startDate", dateRange.startDate)
      if (dateRange.endDate) params.append("endDate", dateRange.endDate)

      const response = await fetch(`/api/insights/shortlinks?${params}`)
      const data = await response.json()

      if (response.ok) {
        setAnalytics(data)
      } else {
        console.error("[v0] Invalid analytics data structure:", data)
        setError(data.error || "Failed to load analytics")
      }
    } catch (error) {
      console.error("[v0] Failed to fetch shortlinks analytics:", error)
      setError("Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  const fetchDetailedAnalytics = async (linkId: string) => {
    if (!linkId || linkId === "undefined") {
      console.error("[v0] Invalid linkId:", linkId)
      setError("Invalid link selected")
      setDetailedLoading(false)
      return
    }

    setDetailedLoading(true)

    try {
      const params = new URLSearchParams()
      if (dateRange.startDate) params.append("startDate", dateRange.startDate)
      if (dateRange.endDate) params.append("endDate", dateRange.endDate)

      console.log("[v0] Fetching detailed analytics for:", linkId)
      const response = await fetch(`/api/insights/shortlinks/${linkId}?${params}`)
      const data = await response.json()

      if (response.ok) {
        setDetailedAnalytics(data)
      } else {
        console.error("[v0] Invalid detailed analytics structure:", data)
        setError(data.error || "Failed to load detailed analytics")
      }
    } catch (error) {
      console.error("[v0] Failed to fetch detailed analytics:", error)
      setError("Failed to load detailed analytics")
    } finally {
      setDetailedLoading(false)
    }
  }

  const getDisplayUrl = (shortCode: string) => {
    const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"
    if (customDomain) {
      return `${customDomain}/${shortCode}`
    }
    return `${username}.${appDomain}/${shortCode}`
  }

  const getFullUrl = (shortCode: string) => {
    const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"
    if (customDomain) {
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
            <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
              <div className="space-y-3 flex-1 min-w-0 w-full">
                <div>
                  <CardTitle className="text-xl sm:text-2xl mb-2 break-words">{link.title || "Untitled"}</CardTitle>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline" className="gap-1.5 px-2 sm:px-2.5 py-1 max-w-full">
                        <Link2 className="size-3 flex-shrink-0" />
                        <a
                          href={getFullUrl(link.short_code)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline font-mono text-xs sm:text-sm truncate"
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
                        className="hover:underline truncate break-all"
                      >
                        {link.destination_url}
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="text-lg sm:text-xl px-4 sm:px-5 py-2 sm:py-2.5 flex-shrink-0">
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
                <BarChart data={clicksByDay}>
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
                  <Bar
                    type="monotone"
                    dataKey="clicks"
                    stroke="#ec4899"
                    strokeWidth={2}
                    dot={{ fill: "#ec4899", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </BarChart>
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
                        <div className="flex items-center justify-between text-sm gap-2">
                          <span className="font-medium truncate">{referrer.referrer || "Direct"}</span>
                          <div className="flex items-center gap-2 flex-shrink-0">
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
  const { totalLinks = 0, totalClicks = 0 } = overview
  const avgClicksPerLink = totalLinks > 0 ? (totalClicks / totalLinks).toFixed(1) : 0

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
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
            <MousePointerClick className="size-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">All-time clicks</p>
          </CardContent>
        </Card>

        {/* <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg. Clicks</CardTitle>
            <TrendingUp className="size-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{avgClicksPerLink}</div>
            <p className="text-xs text-muted-foreground mt-1">Per shortlink</p>
          </CardContent>
        </Card> */}
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
                const linkId = link.id || link.short_code
                const clicksInRange = link.clicks_in_range || 0
                const totalClicks = link.total_clicks || 0

                return (
                  <Card
                    key={linkId}
                    className="cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setSelectedLink(linkId)}
                  >
                    <CardContent className="p-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="font-semibold truncate">{link.title || "Untitled"}</h3>
                            <Badge variant="outline" className="font-mono text-xs">
                              {link.short_code}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{link.destination_url}</p>
                        </div>
                        <div className="flex items-center gap-3 flex-shrink-0 self-start sm:self-auto">
                          <div className="text-right">
                            <div className="text-xl sm:text-2xl font-bold">{clicksInRange.toLocaleString()}</div>
                            <div className="text-xs text-muted-foreground">in range</div>
                          </div>
                          <div className="text-right">
                            <div className="text-base sm:text-lg font-semibold text-muted-foreground">
                              {totalClicks.toLocaleString()}
                            </div>
                            <div className="text-xs text-muted-foreground">total</div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
