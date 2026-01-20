"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Globe, CheckCircle2, XCircle, Loader2, Copy, Crown, AlertCircle, ExternalLink } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"

interface CustomDomainSettingsProps {
  user: {
    custom_domain: string | null
    domain_verified: boolean
    subscription_tier: string
  }
}

type SetupStep = 1 | 2 | 3 | 4

export function CustomDomainSettings({ user: initialUser }: CustomDomainSettingsProps) {
  const [domain, setDomain] = useState(initialUser.custom_domain || "")
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [currentStep, setCurrentStep] = useState<SetupStep>(1)
  const [autoVerifyInterval, setAutoVerifyInterval] = useState<NodeJS.Timeout | null>(null)

  const isPro = initialUser.subscription_tier?.toLowerCase() === "pro"
  const expectedCNAME = process.env.NEXT_PUBLIC_APP_URL?.replace(/^https?:\/\//, "") || "linkpop.space"
  const hasCustomDomain = !!initialUser.custom_domain
  const isVerified = initialUser.domain_verified

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
      console.log("[v0] Starting domain verification...")

      const response = await fetch("/api/domains/verify", {
        method: "POST",
      })

      const data = await response.json()

      console.log("[v0] Verification response:", data)

      if (!response.ok) {
        setError(data.error || "Failed to verify domain")
        setVerificationResult(data.verification || null)
        setVerifying(false)
        return
      }

      setVerificationResult(data.verification)

      if (data.verification.verified) {
        setSuccess(true)
        setCurrentStep(4)
        stopAutoVerify()
      } else {
        const message =
          data.verification.message ||
          "DNS records not found yet. This can take up to 48 hours. We'll keep checking automatically, or you can click 'Check Again' later."

        setError(message)
      }
    } catch (err) {
      console.error("[v0] Verification error:", err)
      setError("Failed to connect to server")
    } finally {
      setVerifying(false)
    }
  }

  const startAutoVerify = () => {
    if (autoVerifyInterval) return

    const interval = setInterval(async () => {
      if (currentStep === 3 && !verifying) {
        await handleVerifyDomain()
      }
    }, 30000) // Check every 30 seconds

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
          <CardDescription>Use your own domain for your profile</CardDescription>
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
        <CardDescription>Use your own domain for your profile (e.g., links.yourdomain.com)</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
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
                <p className="text-sm text-muted-foreground">Domain: {initialUser.custom_domain}</p>
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
                <div className="bg-muted/50 border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted">
                      <tr>
                        <th className="text-left p-3 font-medium">Type</th>
                        <th className="text-left p-3 font-medium">Name</th>
                        <th className="text-left p-3 font-medium">Value</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td className="p-3 font-mono">CNAME</td>
                        <td className="p-3 font-mono">@</td>
                        <td className="p-3 font-mono truncate max-w-xs">{expectedCNAME}</td>
                        <td className="p-3">
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
                    <p className="font-medium">How to add DNS records:</p>
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
                  <p>⏱️ Estimated propagation time: 5-10 minutes (up to 48 hours)</p>
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
              <div className="flex items-center gap-3">
                <div className="size-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <CheckCircle2 className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold">Domain Verified Successfully! ✨</h3>
                  <p className="text-sm text-muted-foreground">Your custom domain is now active</p>
                </div>
              </div>

              <div className="ml-11 mt-4 space-y-2">
                <Alert>
                  <CheckCircle2 className="size-4" />
                  <AlertDescription>
                    <p className="font-medium mb-1">Your profile is now accessible at:</p>
                    <a
                      href={`https://${initialUser.custom_domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:underline font-mono text-sm inline-flex items-center gap-1"
                    >
                      https://{initialUser.custom_domain}
                      <ExternalLink className="size-3" />
                    </a>
                  </AlertDescription>
                </Alert>
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
  )
}
