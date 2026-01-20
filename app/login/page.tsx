import { AuthForm } from "@/components/auth-form"
import { getCurrentUser } from "@/lib/auth"
import { redirect } from "next/navigation"
import { GlobalNavbar } from "@/components/global-navbar"

export const metadata = {
  title: "Log In - Linkpop",
  description: "Log in to your Linkpop account",
}

export default async function LoginPage() {
  const user = await getCurrentUser()

  if (user) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <GlobalNavbar user={null} />
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-background to-muted/20 p-4">
        <AuthForm mode="login" />
      </div>
    </div>
  )
}
