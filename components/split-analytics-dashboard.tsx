"use client"

import { useState } from "react"
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { CalendarIcon, Link2, Users } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { ShortlinksAnalytics } from "@/components/shortlinks-analytics"
import { PagesAnalytics } from "@/components/pages-analytics"

export function SplitAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({
    from: undefined,
    to: undefined,
  })

  const clearDateRange = () => {
    setDateRange({ from: undefined, to: undefined })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="size-5" />
                Date Range Filter
              </CardTitle>
              <CardDescription>Filter analytics by custom date range</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal",
                      !dateRange.from && !dateRange.to && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 size-4" />
                    {dateRange.from ? (
                      dateRange.to ? (
                        <>
                          {format(dateRange.from, "LLL dd, y")} - {format(dateRange.to, "LLL dd, y")}
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
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="shortlinks" className="flex items-center gap-2">
            <Link2 className="size-4" />
            Shortlinks
          </TabsTrigger>
          <TabsTrigger value="pages" className="flex items-center gap-2">
            <Users className="size-4" />
            Bio Pages
          </TabsTrigger>
        </TabsList>

        <TabsContent value="shortlinks" className="space-y-6">
          <ShortlinksAnalytics dateRange={dateRange} />
        </TabsContent>

        <TabsContent value="pages" className="space-y-6">
          <PagesAnalytics dateRange={dateRange} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
