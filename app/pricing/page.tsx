import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Check } from "lucide-react";
import Link from "next/link";
import { getTierBenefits } from "@/config/tier-benefits";
import { getCurrentUser } from "@/lib/auth";
import { GlobalNavbar } from "@/components/global-navbar";

export const metadata = {
  title: "Pricing - Linkpop",
  description: "Choose the plan that's right for you",
};

export default async function PricingPage() {
  const user = await getCurrentUser();
  const freeTier = getTierBenefits("free");
  const proTier = getTierBenefits("pro");

  const isWhopConfigured = !!(
    process.env.WHOP_API_KEY &&
    process.env.WHOP_WEBHOOK_SECRET &&
    process.env.WHOP_COMPANY_ID &&
    process.env.WHOP_PRODUCT_ID
  );

  return (
    <div className="min-h-screen bg-background">
      <GlobalNavbar user={user} />

      <main className="container mx-auto px-4 py-16 md:py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12 md:mb-16 space-y-4">
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-balance">
              Welcome OfficeX Members
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground text-balance">
              All features are free for OfficeX members. Save $40/month
            </p>
          </div>

          <div className="flex justify-center">
            <Card className="relative border-2 border-primary shadow-xl hover:shadow-2xl transition-shadow max-w-md w-full">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                <span className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-lg">
                  Everything Included
                </span>
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">
                  {freeTier.displayName}
                </CardTitle>
                <CardDescription>
                  All premium features at no cost
                </CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">{freeTier.price}</span>
                  <span className="text-muted-foreground ml-2">
                    {freeTier.priceDetail}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  {freeTier.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="size-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" asChild>
                  <Link href="/signup">Get Started Free</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 md:mt-24 text-center">
            <h3 className="text-2xl md:text-3xl font-bold mb-8 md:mb-12">
              Frequently Asked Questions
            </h3>
            <div className="grid sm:grid-cols-2 gap-6 md:gap-8 text-left max-w-4xl mx-auto">
              <div className="space-y-2">
                <h4 className="font-semibold">Is it really free?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! All features are completely free with no hidden costs or
                  time limits.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">Will it always be free?</h4>
                <p className="text-sm text-muted-foreground">
                  Currently all features are free. We may introduce premium
                  tiers in the future, but existing users will keep their
                  access.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">How does custom domain work?</h4>
                <p className="text-sm text-muted-foreground">
                  Point your domain's DNS to Linkpop, and we'll verify it
                  automatically. Takes 5-10 minutes to set up.
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="font-semibold">What about support?</h4>
                <p className="text-sm text-muted-foreground">
                  All users get access to our support system. We're here to help
                  you succeed!
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
