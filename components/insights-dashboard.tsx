"use client"

import { Progress } from "@/components/ui/progress"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Eye, MousePointerClick, Users, Globe, Monitor, Chrome } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { CalendarIcon } from "lucide-react"
import { RedirectAnalytics } from "@/components/redirect-analytics"

interface InsightsDashboardProps {
  dateRange: {
    startDate: string
    endDate: string
  }
}

export function InsightsDashboard({ dateRange }: InsightsDashboardProps) {
  const [insights, setInsights] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailedAnalytics, setDetailedAnalytics] = useState<any>(null)
  const [user, setUser] = useState<any>(null)
  const [customDomain, setCustomDomain] = useState<string | null>(null)
  const [useDomainForShortlinks, setUseDomainForShortlinks] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      setError(null)

      try {
        const params = new URLSearchParams({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
        })

        const [insightsRes, analyticsRes, userRes] = await Promise.all([
          fetch(`/api/insights?${params}`),
          fetch(`/api/insights/detailed?${params}`),
          fetch("/api/auth/me"),
        ])

        const insightsData = await insightsRes.json()
        const analyticsData = await analyticsRes.json()
        const userData = await userRes.json()

        if (userRes.ok && userData.user) {
          setUser(userData.user)
          const hasVerifiedDomain = userData.user.custom_domain && userData.user.domain_verified
          setCustomDomain(hasVerifiedDomain ? userData.user.custom_domain : null)
          setUseDomainForShortlinks(userData.user.use_domain_for_shortlinks ?? true)
        }

        if (analyticsRes.ok) {
          setDetailedAnalytics(analyticsData)
        }

        if (insightsRes.ok) {
          setInsights(insightsData)
        } else {
          setError(insightsData.error || "Failed to load insights")
        }
      } catch (error) {
        console.error("Failed to fetch insights:", error)
        setError("Failed to load data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange])

  const getDisplayUrl = (shortCode: string) => {
    const appDomain = process.env.NEXT_PUBLIC_APP_URL || "linkpop.space"
    if (customDomain && useDomainForShortlinks) {
      return `${customDomain}/${shortCode}`
    }
    return `${user?.username}.${appDomain}/${shortCode}`
  }

  const renderChart = (data: Array<{ date: string; clicks: number }>, color: string) => {
    if (data.length === 0) {
      return <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
    }

    const maxClicks = Math.max(...data.map((d) => d.clicks), 1)

    return (
      <div className="h-64 flex items-end gap-[2px] p-4 bg-muted/30 rounded-lg">
        {data.map((day, index) => {
          const heightPercentage = (day.clicks / maxClicks) * 100
          const height = Math.max(heightPercentage, day.clicks > 0 ? 2 : 0)

          return (
            <div key={index} className="flex-1 flex flex-col items-center gap-2 group relative">
              <div
                className="w-full rounded-t transition-all duration-200 cursor-pointer relative hover:opacity-80"
                style={{
                  height: `${height}%`,
                  backgroundColor: color,
                  minHeight: day.clicks > 0 ? "4px" : "0px",
                }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                  <div className="bg-popover text-popover-foreground px-2 py-1 rounded shadow-lg text-xs whitespace-nowrap border">
                    <div className="font-semibold">{new Date(day.date).toLocaleDateString()}</div>
                    <div>{day.clicks} clicks</div>
                  </div>
                </div>
              </div>
              {index % 3 === 0 && (
                <span className="text-[9px] text-muted-foreground mt-1">
                  {new Date(day.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </span>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading analytics...</p>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-8">
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  if (!insights) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Failed to load analytics</p>
        </CardContent>
      </Card>
    )
  }

  const bitlyClicks = insights.clicksByDay.map((day) => ({
    date: day.date,
    clicks: day.urlClicks || 0,
  }))

  const linktreeClicks = insights.clicksByDay.map((day) => ({
    date: day.date,
    clicks: day.bioLinkClicks || 0,
  }))

  return (
    <div className="space-y-6">
      {/* Show redirect analytics when domain is in redirect mode */}
      {user?.root_domain_mode === "redirect" && user?.root_domain_redirect_url && customDomain && (
        <RedirectAnalytics
          redirectUrl={user.root_domain_redirect_url}
          customDomain={customDomain}
          dateRange={dateRange}
        />
      )}

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Clicks</CardTitle>
            <MousePointerClick className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.totalClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {dateRange.startDate || dateRange.endDate ? "In selected range" : "All time"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Today</CardTitle>
            <TrendingUp className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.clicksToday.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <Eye className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.clicksThisWeek.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">This Month</CardTitle>
            <Users className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.clicksThisMonth.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Current month</p>
          </CardContent>
        </Card>
      </div>

      {/* Geographic Analytics */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="size-5" />
                Geographic Distribution
              </CardTitle>
              <CardDescription>Where your visitors are coming from</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {detailedAnalytics.geographic && detailedAnalytics.geographic.length > 0 ? (
              detailedAnalytics.geographic.slice(0, 10).map((geo: any, index: number) => {
                const percentage = (geo.clicks / insights.totalClicks) * 100
                return (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <CalendarIcon className="size-4 text-muted-foreground" />
                        <span className="font-medium">{geo.country || "Unknown"}</span>
                        {geo.city && <span className="text-muted-foreground">• {geo.city}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{geo.clicks} clicks</span>
                        <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                      </div>
                    </div>
                    <Progress value={percentage} className="h-2" />
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No geographic data yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Device & Browser Analytics */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="size-5" />
              Device Types
            </CardTitle>
            <CardDescription>How visitors access your links</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {detailedAnalytics.devices && detailedAnalytics.devices.length > 0 ? (
                detailedAnalytics.devices.map((device: any, index: number) => {
                  const percentage = (device.clicks / insights.totalClicks) * 100
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium capitalize">{device.device_type || "Desktop"}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{device.clicks}</span>
                          <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No device data yet</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Monitor className="size-5" />
              Browsers
            </CardTitle>
            <CardDescription>Popular browsers used by visitors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {detailedAnalytics.browsers && detailedAnalytics.browsers.length > 0 ? (
                detailedAnalytics.browsers.slice(0, 5).map((browser: any, index: number) => {
                  const percentage = (browser.clicks / insights.totalClicks) * 100
                  return (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{browser.browser || "Unknown"}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{browser.clicks}</span>
                          <Badge variant="outline">{percentage.toFixed(1)}%</Badge>
                        </div>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  )
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No browser data yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referrer Platform Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Chrome className="size-5" />
            Traffic Sources
          </CardTitle>
          <CardDescription>Where your clicks are coming from</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {detailedAnalytics.referrers && detailedAnalytics.referrers.length > 0 ? (
              detailedAnalytics.referrers.map((referrer: any, index: number) => {
                const percentage = (referrer.clicks / insights.totalClicks) * 100
                return (
                  <div key={index} className="p-4 rounded-lg border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize text-sm">{referrer.platform || "Direct"}</span>
                      <Badge>{percentage.toFixed(1)}%</Badge>
                    </div>
                    <div className="text-2xl font-bold">{referrer.clicks.toLocaleString()}</div>
                    <Progress value={percentage} className="h-1" />
                  </div>
                )
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4 col-span-full">No referrer data yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Performance Insights</CardTitle>
          <CardDescription>Compare Shortlinks and Pages performance over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={insights.clicksByDay}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="urlClicks" fill="#3b82f6" name="Shortlinks" />
              <Bar dataKey="bioLinkClicks" fill="#8b5cf6" name="Pages" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Charts and Top Links */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Top Short URLs</CardTitle>
            <CardDescription>Your most clicked shortened links</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.topUrls.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No clicks yet</p>
            ) : (
              <div className="space-y-3">
                {insights.topUrls.map((url) => (
                  <div
                    key={url.id}
                    className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate text-sm">{url.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{getDisplayUrl(url.short_code)}</p>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {url.clicks} clicks
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Bio Links</CardTitle>
            <CardDescription>Your most clicked bio links</CardDescription>
          </CardHeader>
          <CardContent>
            {insights.topBioLinks.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No clicks yet</p>
            ) : (
              <div className="space-y-3">
                {insights.topBioLinks.map((link) => (
                  <div
                    key={link.id}
                    className="flex items-center justify-between gap-4 text-sm p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Badge variant="default" className="shrink-0">
                        Bio
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{link.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(link.clicked_at).toLocaleString()}
                          {link.city && link.country && ` • ${link.city}, ${link.country}`}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="shrink-0">
                      {link.clicks} clicks
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Latest clicks on your links</CardDescription>
        </CardHeader>
        <CardContent>
          {insights.recentClicks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {insights.recentClicks.map((click) => (
                <div
                  key={click.id}
                  className="flex items-center justify-between gap-4 text-sm p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <Badge variant={click.type === "url" ? "default" : "secondary"} className="shrink-0">
                      {click.type === "url" ? "URL" : "Bio"}
                    </Badge>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{click.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(click.clicked_at).toLocaleString()}
                        {click.city && click.country && ` • ${click.city}, ${click.country}`}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
