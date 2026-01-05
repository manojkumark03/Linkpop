"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Crown, Zap } from "lucide-react"
import { WHOP_CONFIG } from "@/lib/subscription"

export function SubscriptionUpgrade() {
  const handleUpgrade = () => {
    window.location.href = WHOP_CONFIG.checkoutUrl
  }

  return (
    <Card className="border-primary/50 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Crown className="size-5 text-primary" />
            <CardTitle>Upgrade to Pro</CardTitle>
          </div>
          <Badge variant="default" className="gap-1">
            <Zap className="size-3" />
            $9/month
          </Badge>
        </div>
        <CardDescription>Unlock all features and grow your audience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" />
            <span>Unlimited links and short URLs</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" />
            <span>Custom domain support</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" />
            <span>1 year analytics retention</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" />
            <span>Advanced blocks (page, accordion, copy-text)</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" />
            <span>Custom JavaScript injection</span>
          </li>
          <li className="flex items-center gap-2">
            <Check className="size-4 text-primary" />
            <span>Remove Linkpop watermark</span>
          </li>
        </ul>
        <Button onClick={handleUpgrade} className="w-full" size="lg">
          Upgrade Now
        </Button>
      </CardContent>
    </Card>
  )
}
