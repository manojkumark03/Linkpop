import { getCurrentUser } from "@/lib/auth"
import { BitlyDashboard } from "@/components/bitly-dashboard"

export const metadata = {
  title: "Shortlinks | Linkpop",
  description: "Shorten URLs and track clicks",
}

export default async function BitlyPage() {
  const user = await getCurrentUser()

  return (
    <main className="container mx-auto px-4 py-8">
      <BitlyDashboard user={user!} />
    </main>
  )
}
