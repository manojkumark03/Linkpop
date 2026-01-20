"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Link2, Users, ExternalLink } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ShortlinksAnalytics } from "@/components/shortlinks-analytics"
import { PagesAnalytics } from "@/components/pages-analytics"
import { RedirectAnalytics } from "@/components/redirect-analytics"

export function SplitAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(console.error)
  }, [])

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined })
  }

  const hasRedirectMode =
    user?.root_domain_mode === "redirect" &&
    user?.root_domain_redirect_url &&
    user?.custom_domain &&
    user?.domain_verified

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="size-5" />
                Date Range Filter
              </CardTitle>
              <CardDescription>Filter analytics by custom date range</CardDescription>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal w-full sm:w-auto",
                      !dateRange.from && !dateRange.to && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          <span className="hidden sm:inline">
                            {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
                          </span>
                          <span className="sm:hidden">
                            {format(dateRange.from, "MMM dd")} - {format(dateRange.to, "MMM dd")}
                          </span>
                        </>
                      ) : (
                        format(dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={2}
                    className="hidden sm:block"
                  />
                  <Calendar
                    initialFocus
                    mode="range"
                    defaultMonth={dateRange.from}
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => setDateRange({ from: range?.from, to: range?.to })}
                    numberOfMonths={1}
                    className="sm:hidden"
                  />
                </PopoverContent>
              </Popover>
              {(dateRange.from || dateRange.to) && (
                <Button variant="ghost" size="sm" onClick={clearDateRange}>
                  Clear
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="shortlinks" className="space-y-6">
        <TabsList
          className={cn(
            "grid w-full",
            hasRedirectMode ? "grid-cols-1 sm:grid-cols-3 sm:max-w-2xl" : "grid-cols-1 sm:grid-cols-2 sm:max-w-xl",
          )}
        >
          <TabsTrigger value="shortlinks" className="flex items-center gap-2">
            <Link2 className="size-4" />
            <span className="truncate">Shortlinks</span>
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <Users className="size-4" />
            <span className="truncate">Bio Pages</span>
          </TabsTrigger>
          {hasRedirectMode && (
            <TabsTrigger value="redirects" className="flex items-center gap-2">
              <ExternalLink className="size-4" />
              <span className="truncate">Redirects</span>
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="shortlinks" className="space-y-6">
          <ShortlinksAnalytics
            dateRange={{
              startDate: dateRange.from?.toISOString() || "",
              endDate: dateRange.to?.toISOString() || "",
            }}
          />
        </TabsContent>

        <TabsContent value="pages" className="space-y-6">
          <PagesAnalytics
            dateRange={{
              startDate: dateRange.from?.toISOString() || "",
              endDate: dateRange.to?.toISOString() || "",
            }}
          />
        </TabsContent>

        {hasRedirectMode && (
          <TabsContent value="redirects" className="space-y-6">
            <RedirectAnalytics
              redirectUrl={user.root_domain_redirect_url}
              customDomain={user.custom_domain}
              dateRange={{
                startDate: dateRange.from?.toISOString() || "",
                endDate: dateRange.to?.toISOString() || "",
              }}
            />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
