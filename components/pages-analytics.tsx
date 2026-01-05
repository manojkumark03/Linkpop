"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Users, MousePointer, TrendingUp, Link2, Globe, Monitor, Share2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
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

interface PagesAnalyticsProps {
  dateRange: { from: Date | undefined; to: Date | undefined }
}

const COLORS = ["#8b5cf6", "#ec4899", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", "#6366f1", "#14b8a6"]

export function PagesAnalytics({ dateRange }: PagesAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAnalytics = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (dateRange.from) params.append("startDate", dateRange.from.toISOString())
      if (dateRange.to) params.append("endDate", dateRange.to.toISOString())

      const response = await fetch(`/api/insights/pages?${params.toString()}`)
      const data = await response.json()

      if (response.ok) {
        if (data && data.overview) {
          setAnalytics(data)
        } else {
          console.error("[v0] Invalid pages analytics data structure:", data)
          setError("Invalid data format received")
        }
      } else {
        setError(data.error || "Failed to load analytics")
        console.error("[v0] API error:", data)
      }
    } catch (error) {
      console.error("[v0] Failed to fetch pages analytics:", error)
      setError("Failed to load analytics data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnalytics()
  }, [dateRange])

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <p className="text-center text-muted-foreground">Loading bio page analytics...</p>
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

  const {
    overview = {},
    viewsByDay = [],
    topLinks = [],
    topCountries = [],
    deviceTypes = [],
    trafficSources = [],
  } = analytics || {}

  const { profileViews = 0, linkClicks = 0, ctr = 0 } = overview

  const deviceChartData = deviceTypes.map((device: any) => ({
    name: device.deviceType || "Desktop",
    value: device.views,
  }))

  const countryChartData = topCountries.slice(0, 8).map((country: any) => ({
    name: country.country || "Unknown",
    value: country.views,
  }))

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Users className="size-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{profileViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total page visits</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-pink-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Link Clicks</CardTitle>
            <MousePointer className="size-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{linkClicks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">Total link engagements</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-cyan-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Click-Through Rate</CardTitle>
            <TrendingUp className="size-4 text-cyan-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{ctr}%</div>
            <p className="text-xs text-muted-foreground mt-1">Views to clicks ratio</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profile Views Over Time</CardTitle>
          <CardDescription>Track your bio page visibility</CardDescription>
        </CardHeader>
        <CardContent>
          {viewsByDay.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={viewsByDay}>
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
                  dataKey="views"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: "#8b5cf6", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Link2 className="size-5" />
            Top Performing Links
          </CardTitle>
          <CardDescription>Your most clicked bio links</CardDescription>
        </CardHeader>
        <CardContent>
          {topLinks.length > 0 ? (
            <div className="space-y-4">
              {topLinks.map((link: any, index: number) => {
                const percentage = linkClicks > 0 ? (link.clicks / linkClicks) * 100 : 0
                return (
                  <div key={link.id} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-medium truncate">{link.title}</span>
                        {link.url && (
                          <a
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline flex-shrink-0"
                          >
                            <ExternalLink className="size-3" />
                          </a>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-muted-foreground font-semibold">{link.clicks} clicks</span>
                        <Badge variant="secondary">{percentage.toFixed(1)}%</Badge>
                      </div>
                    </div>
                    <Progress
                      value={percentage}
                      className="h-2"
                      style={{
                        // @ts-ignore
                        "--progress-background": COLORS[index % COLORS.length],
                      }}
                    />
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No link clicks yet</p>
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
            <CardDescription>Where your visitors are from</CardDescription>
          </CardHeader>
          <CardContent>
            {topCountries.length > 0 ? (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={countryChartData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
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
                  {topCountries.map((country: any, index: number) => {
                    const percentage = profileViews > 0 ? (country.views / profileViews) * 100 : 0
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
                          <span className="text-muted-foreground">{country.views} views</span>
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
            <CardDescription>How visitors access your page</CardDescription>
          </CardHeader>
          <CardContent>
            {deviceTypes.length > 0 ? (
              <div className="space-y-6">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={deviceChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
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
                    const percentage = profileViews > 0 ? (device.views / profileViews) * 100 : 0
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
                          <span className="text-muted-foreground">{device.views} views</span>
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
          <CardTitle className="flex items-center gap-2">
            <Share2 className="size-5" />
            Traffic Sources
          </CardTitle>
          <CardDescription>Where your profile views come from</CardDescription>
        </CardHeader>
        <CardContent>
          {trafficSources.length > 0 ? (
            <div className="space-y-6">
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={trafficSources}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="platform" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="views" fill="#8b5cf6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {trafficSources.map((source: any, index: number) => {
                  const percentage = profileViews > 0 ? (source.views / profileViews) * 100 : 0
                  return (
                    <div key={index} className="p-4 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize text-sm">{source.platform || "Direct"}</span>
                        <Badge>{percentage.toFixed(1)}%</Badge>
                      </div>
                      <div className="text-2xl font-bold">{source.views.toLocaleString()}</div>
                      <Progress value={percentage} className="h-1" />
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">No traffic source data yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
