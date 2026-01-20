import { getCurrentUser } from "@/lib/auth"
import { CustomDomainManagement } from "@/components/custom-domain-management"

export const metadata = {
  title: "Custom Domain | Linkpop",
  description: "Manage your custom domain settings",
}

export default async function DomainsPage() {
  const user = await getCurrentUser()

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold tracking-tight">Custom Domain</h2>
          <p className="text-muted-foreground mt-2">Connect your own domain to your Linkpop profile and shortlinks</p>
        </div>
        <CustomDomainManagement user={user!} />
      </div>
    </main>
  )
}
