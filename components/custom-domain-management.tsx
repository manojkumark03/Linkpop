"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Globe,
  CheckCircle2,
  XCircle,
  Loader2,
  Copy,
  Crown,
  AlertCircle,
  ExternalLink,
  Trash2,
  Home,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

interface CustomDomainManagementProps {
  user: {
    custom_domain: string | null
    domain_verified: boolean
    domain_deployment_status?: string
    subscription_tier: string
    username: string
    use_domain_for_shortlinks: boolean
    root_domain_mode: "bio" | "redirect"
    root_domain_redirect_url: string | null
  }
}

type SetupStep = 1 | 2 | 3 | 4

export function CustomDomainManagement({ user: initialUser }: CustomDomainManagementProps) {
  const [domain, setDomain] = useState(initialUser.custom_domain || "")
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<SetupStep>(1)
  const [autoVerifyInterval, setAutoVerifyInterval] = useState<NodeJS.Timeout | null>(null)
  const [user, setUser] = useState(initialUser)
  const [deploymentStatus, setDeploymentStatus] = useState(initialUser.domain_deployment_status || "pending")

  const [useDomainForShortlinks, setUseDomainForShortlinks] = useState(initialUser.use_domain_for_shortlinks ?? true)
  const [rootDomainMode, setRootDomainMode] = useState<"bio" | "redirect">(initialUser.root_domain_mode || "bio")
  const [rootDomainRedirectUrl, setRootDomainRedirectUrl] = useState(initialUser.root_domain_redirect_url || "")
  const [savingConfig, setSavingConfig] = useState(false)

  const isPro = user.subscription_tier?.toLowerCase() === "pro"
  const expectedCNAME = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") || "linkpop.space"
  const hasCustomDomain = !!user.custom_domain
  const isVerified = user.domain_verified

  useEffect(() => {
    if (!hasCustomDomain) {
      setCurrentStep(1)
    } else if (!isVerified) {
      setCurrentStep(3)
    } else {
      setCurrentStep(4)
    }
  }, [hasCustomDomain, isVerified])

  useEffect(() => {
    return () => {
      if (autoVerifyInterval) {
        clearInterval(autoVerifyInterval)
      }
    }
  }, [autoVerifyInterval])

  useEffect(() => {
    setUseDomainForShortlinks(user.use_domain_for_shortlinks ?? true)
    setRootDomainMode(user.root_domain_mode || "bio")
    setRootDomainRedirectUrl(user.root_domain_redirect_url || "")
  }, [user])

  const refreshUserData = async () => {
    try {
      const response = await fetch("/api/auth/me")
      const data = await response.json()
      if (data.user) {
        setUser(data.user)
        setRootDomainMode(data.user.root_domain_mode || "bio")
        setRootDomainRedirectUrl(data.user.root_domain_redirect_url || "")
        setUseDomainForShortlinks(data.user.use_domain_for_shortlinks ?? true)
        setDeploymentStatus(data.user.domain_deployment_status || "pending")
        console.log("[v0] Refreshed user data:", {
          mode: data.user.root_domain_mode,
          redirectUrl: data.user.root_domain_redirect_url,
          useDomain: data.user.use_domain_for_shortlinks,
          deploymentStatus: data.user.domain_deployment_status,
        })
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error)
    }
  }

  const handleSaveConfig = async () => {
    setSavingConfig(true)
    setError("")

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          use_domain_for_shortlinks: useDomainForShortlinks,
          root_domain_mode: rootDomainMode,
          root_domain_redirect_url: rootDomainMode === "redirect" ? rootDomainRedirectUrl : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to save configuration")
        setSavingConfig(false)
        return
      }

      await refreshUserData()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError("Failed to connect to server")
    } finally {
      setSavingConfig(false)
    }
  }

  const handleSaveDomain = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)
    setLoading(true)

    try {
      const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,}$/
      if (!domainRegex.test(domain)) {
        setError("Invalid domain format. Please enter a valid domain like 'example.com' or 'links.example.com'")
        setLoading(false)
        return
      }

      const checkResponse = await fetch("/api/domains/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ domain }),
      })

      const checkData = await checkResponse.json()

      if (!checkResponse.ok) {
        setError(checkData.error || "Failed to check domain")
        setLoading(false)
        return
      }

      if (!checkData.available) {
        setError("This domain is already in use by another user")
        setLoading(false)
        return
      }

      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_domain: domain }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to save domain")
        return
      }

      setSuccess(true)
      setCurrentStep(2)
      await refreshUserData()
      setTimeout(() => setCurrentStep(3), 2000)
    } catch (err) {
      setError("Failed to connect to server")
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyDomain = async () => {
    setError("")
    setVerifying(true)

    try {
      const response = await fetch("/api/domains/verify", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || "Failed to verify domain")
        setVerificationResult(data.verification || null)
        setVerifying(false)
        return
      }

      setVerificationResult(data.verification)

      if (data.verification.verified) {
        setSuccess(true)
        setDeploymentStatus(data.deploymentStatus || "deploying")
        await refreshUserData()
        setCurrentStep(4)
        stopAutoVerify()
      } else {
        const message =
          data.verification.message ||
          "DNS records not found yet. This can take up to 48 hours. We'll keep checking automatically, or you can click 'Check Again' later."

        setError(message)
      }
    } catch (err) {
      console.error("Verification error:", err)
      setError("Failed to connect to server")
    } finally {
      setVerifying(false)
    }
  }

  const handleDeleteDomain = async () => {
    setDeleting(true)
    setError("")

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ custom_domain: "" }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to delete domain")
        setDeleting(false)
        return
      }

      setDomain("")
      setCurrentStep(1)
      setVerificationResult(null)
      setShowDeleteDialog(false)
      await refreshUserData()
    } catch (err) {
      setError("Failed to connect to server")
    } finally {
      setDeleting(false)
    }
  }

  const startAutoVerify = () => {
    if (autoVerifyInterval) return

    const interval = setInterval(async () => {
      if (currentStep === 3 && !verifying) {
        await handleVerifyDomain()
      }
    }, 30000)

    setAutoVerifyInterval(interval)
  }

  const stopAutoVerify = () => {
    if (autoVerifyInterval) {
      clearInterval(autoVerifyInterval)
      setAutoVerifyInterval(null)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const getStepStatus = (step: SetupStep) => {
    if (step < currentStep) return "complete"
    if (step === currentStep) return "current"
    return "pending"
  }

  const progressPercentage = ((currentStep - 1) / 3) * 100

  const handleToggleShortlinks = async () => {
    const newValue = !useDomainForShortlinks
    setUseDomainForShortlinks(newValue)
    setSavingConfig(true)
    setError("")

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          use_domain_for_shortlinks: newValue,
          root_domain_mode: rootDomainMode,
          root_domain_redirect_url: rootDomainMode === "redirect" ? rootDomainRedirectUrl : null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to save configuration")
        setUseDomainForShortlinks(!newValue)
        setSavingConfig(false)
        return
      }

      await refreshUserData()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      console.error("[v0] Toggle shortlinks error:", err)
      setError("Failed to connect to server")
      setUseDomainForShortlinks(!newValue)
    } finally {
      setSavingConfig(false)
    }
  }

  const handleRootDomainModeChange = async (newMode: "bio" | "redirect") => {
    const prevMode = rootDomainMode
    setRootDomainMode(newMode)

    if (newMode === "redirect") {
      return
    }

    setSavingConfig(true)
    setError("")

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          use_domain_for_shortlinks: useDomainForShortlinks,
          root_domain_mode: newMode,
          root_domain_redirect_url: null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to save configuration")
        setRootDomainMode(prevMode)
        setSavingConfig(false)
        return
      }

      await refreshUserData()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (err) {
      console.error("[v0] Root domain mode change error:", err)
      setError("Failed to connect to server")
      setRootDomainMode(prevMode)
    } finally {
      setSavingConfig(false)
    }
  }

  const handleRedirectUrlChange = (value: string) => {
    setRootDomainRedirectUrl(value)
  }

  const handleSaveRedirectUrl = async () => {
    if (!rootDomainRedirectUrl.trim()) {
      setError("Redirect URL is required when redirect mode is enabled")
      return
    }

    try {
      new URL(rootDomainRedirectUrl)
    } catch {
      setError("Please enter a valid URL (e.g., https://example.com)")
      return
    }

    setSavingConfig(true)
    setError("")

    try {
      const response = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          use_domain_for_shortlinks: useDomainForShortlinks,
          root_domain_mode: "redirect",
          root_domain_redirect_url: rootDomainRedirectUrl,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || "Failed to save redirect URL")
        setSavingConfig(false)
        return
      }

      await refreshUserData()
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error("[v0] Save redirect URL error:", err)
      setError("Failed to connect to server")
    } finally {
      setSavingConfig(false)
    }
  }

  if (!isPro) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="size-5" />
            <CardTitle>Custom Domain</CardTitle>
            <Badge variant="secondary" className="ml-auto gap-1">
              <Crown className="size-3" />
              Pro Only
            </Badge>
          </div>
          <CardDescription>Use your own domain for your profile and shortlinks</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <Crown className="size-4" />
            <AlertDescription>
              Custom domain support requires a Pro subscription.{" "}
              <a href="/pricing" className="underline">
                Upgrade to Pro
              </a>{" "}
              to unlock this feature.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Globe className="size-5" />
            <CardTitle>Custom Domain</CardTitle>
            {isVerified && (
              <Badge variant="default" className="ml-auto gap-1">
                <CheckCircle2 className="size-3" />
                Verified
              </Badge>
            )}
            {hasCustomDomain && !isVerified && (
              <Badge variant="secondary" className="ml-auto gap-1">
                <Loader2 className="size-3 animate-spin" />
                Pending Verification
              </Badge>
            )}
          </div>
          <CardDescription>Connect your custom domain to use it for both your bio page and shortlinks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {hasCustomDomain && (
            <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
              <div className="space-y-1">
                <p className="text-sm font-medium">Current Domain</p>
                <p className="text-lg font-mono">{user.custom_domain}</p>
              </div>
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteDialog(true)}>
                <Trash2 className="size-4 mr-2" />
                Delete
              </Button>
            </div>
          )}

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Setup Progress</span>
              <span className="font-medium">{currentStep}/4</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          <div className="space-y-4">
            {/* Step 1: Enter Domain */}
            <div
              className={`border rounded-lg p-4 ${
                getStepStatus(1) === "current" ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`size-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    getStepStatus(1) === "complete"
                      ? "bg-primary text-primary-foreground"
                      : getStepStatus(1) === "current"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                  }`}
                >
                  {getStepStatus(1) === "complete" ? <CheckCircle2 className="size-4" /> : "1"}
                </div>
                <h3 className="font-semibold">Enter Your Domain</h3>
              </div>

              {getStepStatus(1) !== "complete" && (
                <form onSubmit={handleSaveDomain} className="space-y-3 ml-11">
                  <div className="space-y-2">
                    <Input
                      type="text"
                      value={domain}
                      onChange={(e) => setDomain(e.target.value)}
                      placeholder="links.example.com or example.com"
                      disabled={loading}
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter your domain without http:// or https:// (e.g., "links.example.com")
                    </p>
                  </div>

                  {error && currentStep === 1 && (
                    <Alert variant="destructive">
                      <AlertCircle className="size-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <Button type="submit" disabled={loading || !domain}>
                    {loading ? (
                      <>
                        <Loader2 className="size-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Domain"
                    )}
                  </Button>
                </form>
              )}

              {getStepStatus(1) === "complete" && (
                <div className="ml-11">
                  <p className="text-sm text-muted-foreground">Domain: {user.custom_domain}</p>
                </div>
              )}
            </div>

            {/* Step 2: Domain Saved */}
            {currentStep >= 2 && (
              <div className={`border rounded-lg p-4 ${currentStep === 2 ? "border-primary bg-primary/5" : ""}`}>
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Domain Saved</h3>
                    <p className="text-sm text-muted-foreground">Ready to configure DNS</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Configure DNS */}
            {currentStep >= 3 && !isVerified && (
              <div className={`border rounded-lg p-4 ${currentStep === 3 ? "border-primary bg-primary/5" : ""}`}>
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`size-8 rounded-full flex items-center justify-center text-sm font-medium ${
                      currentStep === 3 ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    3
                  </div>
                  <div>
                    <h3 className="font-semibold">Configure DNS Records</h3>
                    <p className="text-sm text-muted-foreground">Add this CNAME record to your DNS provider</p>
                  </div>
                </div>

                <div className="ml-11 space-y-4">
                  <div className="bg-muted/50 border rounded-lg overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Type</th>
                          <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Name</th>
                          <th className="text-left p-2 sm:p-3 font-medium text-xs sm:text-sm">Value</th>
                          <th className="w-10"></th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm">CNAME</td>
                          <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm">@</td>
                          <td className="p-2 sm:p-3 font-mono text-xs sm:text-sm break-all max-w-[120px] sm:max-w-xs">
                            {expectedCNAME}
                          </td>
                          <td className="p-2 sm:p-3">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(expectedCNAME)}
                              title="Copy value"
                            >
                              <Copy className="size-4" />
                            </Button>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <Alert>
                    <AlertCircle className="size-4" />
                    <AlertDescription className="space-y-2">
                      <p className="font-medium mb-1">How to add DNS records:</p>
                      <ol className="list-decimal list-inside space-y-1 text-sm">
                        <li>Go to your domain registrar's DNS settings (GoDaddy, Namecheap, Cloudflare, etc.)</li>
                        <li>Add a new CNAME record with the values shown above</li>
                        <li>Save your changes</li>
                        <li>Wait 5-10 minutes for DNS propagation (can take up to 48 hours)</li>
                        <li>Click "Verify Domain" below</li>
                      </ol>
                      <p className="text-xs mt-2">
                        <a
                          href="https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site#configuring-a-subdomain"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Need help? View DNS setup guide
                          <ExternalLink className="size-3" />
                        </a>
                      </p>
                    </AlertDescription>
                  </Alert>

                  {error && currentStep === 3 && (
                    <Alert variant="destructive">
                      <XCircle className="size-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  {verificationResult && !verificationResult.verified && (
                    <Alert variant="destructive">
                      <XCircle className="size-4" />
                      <AlertDescription>
                        <p className="font-medium mb-1">DNS Verification Failed</p>
                        <p className="text-sm">
                          {verificationResult.message ||
                            `No CNAME record found pointing to ${expectedCNAME}. Please double-check your DNS settings.`}
                        </p>
                        {verificationResult.records?.[0]?.currentValue && (
                          <p className="text-xs mt-1 font-mono">
                            Current DNS value: {verificationResult.records[0].currentValue}
                          </p>
                        )}
                        <p className="text-xs mt-2">
                          DNS changes typically take 5-10 minutes but can take up to 48 hours to fully propagate.
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex gap-2">
                    <Button type="button" onClick={handleVerifyDomain} disabled={verifying}>
                      {verifying ? (
                        <>
                          <Loader2 className="size-4 mr-2 animate-spin" />
                          Verifying...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="size-4 mr-2" />
                          Verify Domain
                        </>
                      )}
                    </Button>

                    {!autoVerifyInterval && (
                      <Button type="button" variant="outline" onClick={startAutoVerify}>
                        Auto-check every 30s
                      </Button>
                    )}

                    {autoVerifyInterval && (
                      <Button type="button" variant="outline" onClick={stopAutoVerify}>
                        Stop auto-checking
                      </Button>
                    )}
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p>Estimated propagation time: 5-10 minutes (up to 48 hours)</p>
                    <p className="mt-1">
                      We'll automatically check your DNS records. You can also check manually anytime.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Verification Complete */}
            {isVerified && (
              <div className="border border-primary rounded-lg p-4 bg-primary/5">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    {deploymentStatus === "active" ? (
                      <CheckCircle2 className="size-4" />
                    ) : (
                      <Loader2 className="size-4 animate-spin" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {deploymentStatus === "active" ? "Domain Active" : "DNS Verified! Deploying..."}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {deploymentStatus === "active"
                        ? "Your custom domain is fully operational"
                        : "Deployment in progress (10-40 minutes, occasionally up to 48 hours)"}
                    </p>
                  </div>
                </div>

                <div className="ml-11 mt-4 space-y-3">
                  {deploymentStatus === "deploying" && (
                    <Alert>
                      <Loader2 className="size-4 animate-spin" />
                      <AlertDescription>
                        <p className="font-medium mb-2">Deployment Progress:</p>
                        <div className="space-y-1.5 text-sm">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="size-4 text-green-500" />
                            <span>DNS Verified (5-10 min)</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Loader2 className="size-4 animate-spin" />
                            <span>Deployment (5-10 min)</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <div className="size-4" />
                            <span>Active ✓</span>
                          </div>
                        </div>
                        <p className="text-xs mt-3 text-muted-foreground">
                          Total: 10-40 minutes (occasionally up to 48 hours)
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Alert>
                    <CheckCircle2 className="size-4" />
                    <AlertDescription>
                      <p className="font-medium mb-1">Your domain will be accessible at:</p>
                      <a
                        href={`https://${user.custom_domain}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline font-mono text-sm inline-flex items-center gap-1"
                      >
                        https://{user.custom_domain}
                        <ExternalLink className="size-3" />
                      </a>
                      <p className="text-xs mt-2">
                        The root domain ({user.custom_domain}) displays your bio page. The /bio path will always work as
                        a fallback.
                      </p>
                    </AlertDescription>
                  </Alert>

                  {deploymentStatus === "deploying" && (
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(`https://${user.custom_domain}`, "_blank")}
                      >
                        Test Domain
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={refreshUserData}>
                        Check Status
                      </Button>
                    </div>
                  )}

                  {deploymentStatus === "deploying" && (
                    <Alert variant="default">
                      <AlertCircle className="size-4" />
                      <AlertDescription>
                        <p className="font-medium">Taking longer than expected?</p>
                        <ul className="list-disc list-inside text-sm mt-1 space-y-0.5">
                          <li>Verify DNS records are still pointing correctly</li>
                          <li>Check your domain registrar's DNS settings</li>
                          <li>Try clearing your browser cache</li>
                          <li>Contact support if issue persists after 48 hours</li>
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
            )}
          </div>

          {success && currentStep === 2 && (
            <Alert>
              <CheckCircle2 className="size-4" />
              <AlertDescription>Domain saved! Proceed to DNS configuration.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {isVerified && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="size-5" />
              Domain Configuration
            </CardTitle>
            <CardDescription>Configure how your custom domain works with shortlinks and your bio page</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 4: Domain Configured - Root Domain Settings */}
            {isVerified && (
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-4">
                  <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                    <CheckCircle2 className="size-4" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Domain Configuration</h3>
                    <p className="text-sm text-muted-foreground">Choose how your root domain behaves</p>
                  </div>
                </div>

                <div className="ml-11 space-y-6">
                  <Alert>
                    <AlertCircle className="size-4" />
                    <AlertDescription className="text-sm">
                      <p className="font-medium mb-2">
                        Your custom domain works for both bio pages and shortlinks. Choose what happens when visitors go
                        to your root domain (e.g., manojkumark.com).
                      </p>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-1">
                    <Label className="text-base font-semibold">Root Domain Behavior</Label>
                    <p className="text-sm text-muted-foreground mb-3">
                      Choose what happens when visitors go to your root domain
                    </p>
                  </div>

                  <RadioGroup
                    value={rootDomainMode}
                    onValueChange={(value: "bio" | "redirect") => handleRootDomainModeChange(value)}
                    className="space-y-3"
                  >
                    <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="bio" id="mode-bio" className="mt-1" />
                      <div className="flex-1 space-y-1">
                        <Label htmlFor="mode-bio" className="flex items-center gap-2 font-semibold cursor-pointer">
                          <Home className="size-4" />
                          Show Bio Page
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Your root domain ({user.custom_domain}) shows your bio page. This is the standard
                          configuration.
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Example: https://{user.custom_domain} → Your bio page
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3 border rounded-lg p-4 hover:bg-accent/50 transition-colors">
                      <RadioGroupItem value="redirect" id="mode-redirect" className="mt-1" />
                      <div className="flex-1 space-y-2">
                        <Label htmlFor="mode-redirect" className="flex items-center gap-2 font-semibold cursor-pointer">
                          <ExternalLink className="size-4" />
                          Redirect to Custom URL
                        </Label>
                        <p className="text-sm text-muted-foreground">
                          Your root domain redirects to another URL (e.g., your main website). Your bio page will be at{" "}
                          {user.custom_domain}/bio
                        </p>

                        {rootDomainMode === "redirect" && (
                          <div className="space-y-3 pt-2">
                            <div className="space-y-2">
                              <Label htmlFor="redirect-url" className="text-sm">
                                Redirect URL
                              </Label>
                              <Input
                                id="redirect-url"
                                type="url"
                                value={rootDomainRedirectUrl}
                                onChange={(e) => handleRedirectUrlChange(e.target.value)}
                                placeholder="https://yourwebsite.com"
                                className="font-mono text-sm"
                              />
                              <p className="text-xs text-muted-foreground">
                                Example: https://{user.custom_domain} →{" "}
                                {rootDomainRedirectUrl || "https://yourwebsite.com"}
                                <br />
                                Bio page: https://{user.custom_domain}/bio
                              </p>
                            </div>
                            <Button
                              onClick={handleSaveRedirectUrl}
                              disabled={savingConfig || !rootDomainRedirectUrl.trim()}
                              size="sm"
                            >
                              {savingConfig ? (
                                <>
                                  <Loader2 className="size-4 mr-2 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save Redirect URL"
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </RadioGroup>

                  {rootDomainMode === "redirect" && user.root_domain_redirect_url && (
                    <Alert>
                      <CheckCircle2 className="size-4" />
                      <AlertDescription className="text-sm space-y-1">
                        <p className="font-semibold">Current Configuration:</p>
                        <p>
                          Root domain redirects to: <span className="font-mono">{user.root_domain_redirect_url}</span>
                        </p>
                        <p>
                          Bio page available at: <span className="font-mono">https://{user.custom_domain}/bio</span>
                        </p>
                      </AlertDescription>
                    </Alert>
                  )}

                  <Alert>
                    <AlertCircle className="size-4" />
                    <AlertDescription className="text-sm">
                      Note: Analytics continue to work normally in both modes. When using redirect mode, your bio page
                      analytics are tracked at the /bio path.
                    </AlertDescription>
                  </Alert>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Custom Domain</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete your custom domain? Your profile and shortlinks will revert to using{" "}
              {user.username}.linkpop.space. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteDomain}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="size-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Domain"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
