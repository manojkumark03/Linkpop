import { getCurrentUser } from "@/lib/auth"
import { SplitAnalyticsDashboard } from "@/components/split-analytics-dashboard"

export const metadata = {
  title: "Analytics | Linkpop",
  description: "View your link analytics and performance data",
}

export default async function InsightsPage() {
  const user = await getCurrentUser()

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
          <p className="text-muted-foreground mt-2">Track your shortlinks and bio page performance</p>
        </div>
        <SplitAnalyticsDashboard />
      </div>
    </main>
  )
}
