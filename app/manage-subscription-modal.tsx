"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { CreditCard, Check, Zap, Crown, Star, RefreshCw, AlertCircle } from "lucide-react"
import type { PurchasesPackage, CustomerInfo } from "@revenuecat/purchases-capacitor"

interface ManageSubscriptionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ManageSubscriptionModal({ isOpen, onClose }: ManageSubscriptionModalProps) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isNative, setIsNative] = useState(false)
  const [revenueCatPackages, setRevenueCatPackages] = useState<PurchasesPackage[]>([])
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [subscription, setSubscription] = useState<{
    plan: string
    status: string
    billing_cycle: string
    price: number
    next_billing_date: string | null
    payment_method_last4?: string | null
  } | null>(null)

  useEffect(() => {
    if (!isOpen) return

    const loadSubscriptionData = async () => {
      setLoading(true)
      setLoadError(null)

      try {
        // Check if we're on a native platform
        const { isNativePlatform, ensureInitialized, getCurrentOffering, getCustomerInfo, getUserPlan, getExpirationDate, willRenew } = await import("@/lib/services/revenuecat")
        const native = isNativePlatform()
        setIsNative(native)

        if (native) {
          // Ensure RevenueCat is initialized before loading data
          await ensureInitialized()

          // Load RevenueCat data on native platforms
          let packages: PurchasesPackage[] | null = null
          let info: CustomerInfo | null = null

          try {
            [packages, info] = await Promise.all([
              getCurrentOffering(),
              getCustomerInfo()
            ])
          } catch (revenueCatError) {
            console.error("[ManageSubscription] RevenueCat error:", revenueCatError)
            setLoadError("Unable to load subscription options. Please check your internet connection and try again.")
            // Still try to get customer info for current status
            try {
              info = await getCustomerInfo()
            } catch {
              // If we can't get customer info, show error
            }
          }

          if (packages && packages.length > 0) {
            setRevenueCatPackages(packages)
          } else if (native && !loadError) {
            // No packages available - might be a configuration issue
            console.warn("[ManageSubscription] No packages available from RevenueCat")
            setLoadError("Subscription options are currently unavailable. Please try again later.")
          }

          if (info) {
            setCustomerInfo(info)
            const plan = getUserPlan(info)
            const expirationDate = getExpirationDate(info)
            const renews = willRenew(info)

            // Map RevenueCat data to our subscription format
            setSubscription({
              plan,
              status: renews ? "active" : "cancelled",
              billing_cycle: "monthly",
              price: plan === "elite" ? 49.99 : plan === "pro" ? 29.99 : 0,
              next_billing_date: expirationDate?.toISOString().split("T")[0] || null,
              payment_method_last4: null,
            })
          } else {
            // No subscription info, set free
            setSubscription({
              plan: "free",
              status: "active",
              billing_cycle: "monthly",
              price: 0,
              next_billing_date: null,
              payment_method_last4: null,
            })
          }
        } else {
          // Fallback to local subscription for web
          const { getSubscription } = await import("@/lib/actions/subscription")
          const record = await getSubscription()
          setSubscription(record)
        }
      } catch (error) {
        console.error("[ManageSubscription] Error loading data:", error)
        setLoadError("Failed to load subscription data. Please try again.")
        // Fallback to local subscription
        try {
          const { getSubscription } = await import("@/lib/actions/subscription")
          const record = await getSubscription()
          setSubscription(record)
        } catch {
          // Set default free subscription if all else fails
          setSubscription({
            plan: "free",
            status: "active",
            billing_cycle: "monthly",
            price: 0,
            next_billing_date: null,
            payment_method_last4: null,
          })
        }
      } finally {
        setLoading(false)
      }
    }

    loadSubscriptionData()
  }, [isOpen])

  const plans = [
    {
      id: "free",
      name: "Free",
      price: 0,
      icon: Star,
      features: ["Basic workout plans", "Limited AI recommendations", "Track up to 3 habits", "Community access"],
      popular: false,
    },
    {
      id: "pro",
      name: "Pro",
      price: 29.99,
      icon: Zap,
      features: [
        "Unlimited AI-powered plans",
        "Personalized nutrition guidance",
        "Unlimited habit tracking",
        "Priority support",
        "Advanced analytics",
      ],
      popular: true,
    },
    {
      id: "elite",
      name: "Elite",
      price: 49.99,
      icon: Crown,
      features: [
        "Everything in Pro",
        "1-on-1 coaching sessions",
        "Custom meal plans",
        "Exclusive community",
        "Early access to features",
      ],
      popular: false,
    },
  ]

  const handleChangePlan = async (planId: string) => {
    setLoading(true)

    try {
      if (isNative) {
        // Use RevenueCat for native purchases
        const { purchaseProduct, getCustomerInfo, getUserPlan, getExpirationDate, willRenew, PRODUCTS, getCurrentOffering } = await import("@/lib/services/revenuecat")

        // Map plan ID to RevenueCat product ID
        const productId = planId === "elite" ? PRODUCTS.ELITE_MONTHLY :
                         planId === "pro" ? PRODUCTS.PRO_MONTHLY : null

        if (!productId) {
          // Downgrading to free - user needs to cancel in App Store
          toast({
            title: "Manage in Settings",
            description: "To downgrade, please cancel your subscription in your device's Settings > Subscriptions.",
          })
          setLoading(false)
          return
        }

        // Check if offerings are available before attempting purchase
        if (revenueCatPackages.length === 0) {
          // Try to reload offerings
          const packages = await getCurrentOffering()
          if (!packages || packages.length === 0) {
            toast({
              title: "Subscription unavailable",
              description: "Unable to load subscription options. Please check your internet connection and try again.",
              variant: "destructive",
            })
            setLoading(false)
            return
          }
          setRevenueCatPackages(packages)
        }

        let info
        try {
          info = await purchaseProduct(productId)
        } catch (purchaseError: unknown) {
          console.error("[ManageSubscription] Purchase error:", purchaseError)

          // Check for specific error types
          const errorMessage = purchaseError instanceof Error ? purchaseError.message : String(purchaseError)

          if (errorMessage.includes("cancelled") || errorMessage.includes("userCancelled")) {
            // User cancelled - don't show error
            setLoading(false)
            return
          } else if (errorMessage.includes("not found") || errorMessage.includes("No offerings")) {
            toast({
              title: "Product not available",
              description: "This subscription is currently unavailable. Please try again later.",
              variant: "destructive",
            })
          } else if (errorMessage.includes("network") || errorMessage.includes("internet")) {
            toast({
              title: "Connection error",
              description: "Please check your internet connection and try again.",
              variant: "destructive",
            })
          } else {
            toast({
              title: "Purchase failed",
              description: "There was an error processing your purchase. Please try again.",
              variant: "destructive",
            })
          }
          setLoading(false)
          return
        }

        if (info) {
          setCustomerInfo(info)
          const plan = getUserPlan(info)
          const expirationDate = getExpirationDate(info)
          const renews = willRenew(info)

          setSubscription({
            plan,
            status: renews ? "active" : "cancelled",
            billing_cycle: "monthly",
            price: plan === "elite" ? 49.99 : plan === "pro" ? 29.99 : 0,
            next_billing_date: expirationDate?.toISOString().split("T")[0] || null,
            payment_method_last4: null,
          })

          toast({
            title: "Purchase successful!",
            description: `You're now on the ${plan} plan.`,
          })
        }
      } else {
        // Fallback to local subscription for web (development/testing only)
        const { changeSubscriptionPlan } = await import("@/lib/actions/subscription")
        const result = await changeSubscriptionPlan(planId as "free" | "pro" | "elite")

        if (!result.success) {
          toast({
            title: "Unable to change plan",
            description: result.error || "Please try again.",
            variant: "destructive",
          })
          return
        }

        toast({
          title: "Plan updated",
          description: `You're now on the ${planId} plan.`,
        })

        const { getSubscription } = await import("@/lib/actions/subscription")
        const record = await getSubscription()
        setSubscription(record)
      }
    } catch (error) {
      console.error("[ManageSubscription] Purchase error:", error)
      toast({
        title: "Purchase failed",
        description: "There was an error processing your purchase. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (isNative) {
      // On native platforms, users must cancel through their device settings
      toast({
        title: "Manage in Settings",
        description: "To cancel your subscription, go to your device's Settings > Subscriptions > V-Life Fitness.",
      })
      return
    }
    
    if (!confirm("Are you sure you want to cancel your subscription? You'll lose access to Pro features.")) {
      return
    }

    setLoading(true)
    const { cancelSubscription } = await import("@/lib/actions/subscription")
    const result = await cancelSubscription()
    setLoading(false)
    if (!result.success) {
      toast({
        title: "Unable to cancel",
        description: result.error || "Please try again.",
        variant: "destructive",
      })
      return
    }
    toast({
      title: "Subscription cancelled",
      description: "You'll have access until the end of your billing period.",
    })
    const { getSubscription } = await import("@/lib/actions/subscription")
    const record = await getSubscription()
    setSubscription(record)
  }
  
  const handleRestorePurchases = async () => {
    if (!isNative) return
    
    setLoading(true)
    try {
      const { restorePurchases, getUserPlan, getExpirationDate, willRenew } = await import("@/lib/services/revenuecat")
      const info = await restorePurchases()
      
      if (info) {
        setCustomerInfo(info)
        const plan = getUserPlan(info)
        const expirationDate = getExpirationDate(info)
        const renews = willRenew(info)
        
        setSubscription({
          plan,
          status: renews ? "active" : "cancelled",
          billing_cycle: "monthly",
          price: plan === "elite" ? 49.99 : plan === "pro" ? 29.99 : 0,
          next_billing_date: expirationDate?.toISOString().split("T")[0] || null,
          payment_method_last4: null,
        })
        
        toast({
          title: "Purchases restored",
          description: plan !== "free" ? `Your ${plan} subscription has been restored.` : "No active subscriptions found.",
        })
      }
    } catch (error) {
      console.error("[ManageSubscription] Restore error:", error)
      toast({
        title: "Restore failed",
        description: "Unable to restore purchases. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const currentPlan = subscription || {
    plan: "free",
    status: "active",
    billing_cycle: "monthly",
    price: 0,
    next_billing_date: null,
    payment_method_last4: null,
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-gradient-to-b from-black to-charcoal">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <CreditCard className="h-5 w-5 text-accent" />
            Manage Subscription
          </DialogTitle>
          <DialogDescription className="text-white/70">
            View your current plan and make changes to your subscription.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Current Subscription */}
          <Card className="border-accent/30 bg-gradient-to-br from-accent/10 to-black/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">Current Plan</h3>
                <Badge className="bg-accent text-black capitalize">{currentPlan.status}</Badge>
              </div>

              <div className="mb-4">
                <div className="text-3xl font-bold text-accent capitalize">{currentPlan.plan}</div>
                <div className="text-white/70">
                  ${currentPlan.price}/{currentPlan.billing_cycle}
                </div>
              </div>

              <div className="space-y-2 text-sm text-white/70">
                <div className="flex justify-between">
                  <span>Billing Cycle:</span>
                  <span className="font-medium text-white">Monthly</span>
                </div>
                <div className="flex justify-between">
                  <span>Next Billing Date:</span>
                  <span className="font-medium text-white">
                    {currentPlan.next_billing_date ? currentPlan.next_billing_date : "Not scheduled"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium text-white">
                    {currentPlan.payment_method_last4 ? `•••• ${currentPlan.payment_method_last4}` : "Not on file"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Load Error Alert */}
          {isNative && (loadError || (!loading && revenueCatPackages.length === 0)) && (
            <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-medium text-yellow-400">Subscription options unavailable</h4>
                  <p className="text-sm text-white/70 mt-1">
                    {loadError || "In-app purchases are not available right now. Please check your connection and try again."}
                  </p>
                  <ButtonGlow
                    variant="outline-glow"
                    size="sm"
                    className="mt-3"
                    onClick={() => {
                      setLoading(true)
                      setLoadError(null)
                      const loadData = async () => {
                        try {
                          const { getCurrentOffering, getCustomerInfo, getUserPlan, getExpirationDate, willRenew } = await import("@/lib/services/revenuecat")
                          const [packages, info] = await Promise.all([
                            getCurrentOffering(),
                            getCustomerInfo()
                          ])
                          if (packages && packages.length > 0) {
                            setRevenueCatPackages(packages)
                            setLoadError(null)
                          } else {
                            setLoadError("Subscription options are still unavailable. Please try again later.")
                          }
                          if (info) {
                            setCustomerInfo(info)
                            const plan = getUserPlan(info)
                            const expirationDate = getExpirationDate(info)
                            const renews = willRenew(info)
                            setSubscription({
                              plan,
                              status: renews ? "active" : "cancelled",
                              billing_cycle: "monthly",
                              price: plan === "elite" ? 49.99 : plan === "pro" ? 29.99 : 0,
                              next_billing_date: expirationDate?.toISOString().split("T")[0] || null,
                              payment_method_last4: null,
                            })
                          }
                        } catch {
                          setLoadError("Still unable to load. Please try again later.")
                        } finally {
                          setLoading(false)
                        }
                      }
                      loadData()
                    }}
                    disabled={loading}
                  >
                    <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Retry
                  </ButtonGlow>
                </div>
              </div>
            </div>
          )}

          {/* Available Plans */}
          <div>
            <h3 className="mb-4 text-lg font-bold text-white">Available Plans</h3>
            <div className="space-y-3">
              {plans.map((plan) => {
                const Icon = plan.icon
                const isCurrentPlan = plan.id === currentPlan.plan

                return (
                  <Card
                    key={plan.id}
                    className={`border-white/10 ${plan.popular ? "border-accent/30 bg-accent/5" : "bg-black/50"} backdrop-blur-sm`}
                  >
                    <CardContent className="p-4">
                      <div className="mb-3 flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-accent" />
                          <div>
                            <h4 className="font-bold text-white">{plan.name}</h4>
                            <p className="text-sm text-white/70">
                              ${plan.price}
                              {plan.price > 0 && "/month"}
                            </p>
                          </div>
                        </div>
                        {plan.popular && <Badge className="bg-accent text-black text-xs">Popular</Badge>}
                        {isCurrentPlan && <Badge className="bg-white/10 text-white text-xs">Current</Badge>}
                      </div>

                      <ul className="mb-4 space-y-2 text-sm text-white/70">
                        {plan.features.map((feature, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>

                      {!isCurrentPlan && (
                        <ButtonGlow
                          variant={plan.popular ? "glow" : "outline-glow"}
                          className="w-full"
                          onClick={() => handleChangePlan(plan.id)}
                          disabled={loading || (isNative && plan.price > 0 && revenueCatPackages.length === 0)}
                        >
                          {isNative && plan.price > 0 && revenueCatPackages.length === 0
                            ? "Unavailable — Try Again Later"
                            : `${plan.price > currentPlan.price ? "Upgrade" : plan.price === 0 ? "Downgrade" : "Switch"} to ${plan.name}`
                          }
                        </ButtonGlow>
                      )}
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>

          {/* Billing History */}
          <Card className="border-white/10 bg-black/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <h3 className="mb-3 font-bold text-white">Recent Billing History</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-white/70">
                  <span>Oct 30, 2025</span>
                  <span className="font-medium text-white">$29.99</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Sep 30, 2025</span>
                  <span className="font-medium text-white">$29.99</span>
                </div>
                <div className="flex justify-between text-white/70">
                  <span>Aug 30, 2025</span>
                  <span className="font-medium text-white">$29.99</span>
                </div>
              </div>
              <ButtonGlow variant="outline-glow" className="mt-4 w-full" size="sm">
                View All Invoices
              </ButtonGlow>
            </CardContent>
          </Card>

          {/* Restore Purchases - Native only */}
          {isNative && (
            <ButtonGlow
              variant="outline-glow"
              className="w-full"
              onClick={handleRestorePurchases}
              disabled={loading}
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Restore Purchases
            </ButtonGlow>
          )}

          {/* Cancel Subscription */}
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4">
            <h3 className="mb-2 font-bold text-red-400">
              {isNative ? "Manage Subscription" : "Cancel Subscription"}
            </h3>
            <p className="mb-3 text-sm text-white/70">
              {isNative 
                ? "To cancel or modify your subscription, go to your device's Settings > Subscriptions."
                : "You'll continue to have access until the end of your current billing period."
              }
            </p>
            <ButtonGlow
              variant="outline-glow"
              className="w-full text-red-400 hover:text-red-300"
              onClick={handleCancelSubscription}
              disabled={loading}
            >
              {isNative ? "How to Cancel" : "Cancel Subscription"}
            </ButtonGlow>
          </div>
        </div>

        <div className="flex gap-3">
          <ButtonGlow variant="outline-glow" className="flex-1" onClick={onClose} disabled={loading}>
            Close
          </ButtonGlow>
        </div>
      </DialogContent>
    </Dialog>
  )
}
