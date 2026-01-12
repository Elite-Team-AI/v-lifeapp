import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

// RevenueCat webhook event types
type RevenueCatEventType =
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "CANCELLATION"
  | "UNCANCELLATION"
  | "NON_RENEWING_PURCHASE"
  | "SUBSCRIPTION_PAUSED"
  | "EXPIRATION"
  | "BILLING_ISSUE"
  | "PRODUCT_CHANGE"
  | "TRANSFER";

interface RevenueCatWebhookEvent {
  api_version: string;
  event: {
    type: RevenueCatEventType;
    id: string;
    app_id: string;
    app_user_id: string;
    original_app_user_id: string;
    aliases: string[];
    product_id: string;
    entitlement_ids: string[];
    period_type: "TRIAL" | "INTRO" | "NORMAL" | "PROMOTIONAL";
    purchased_at_ms: number;
    expiration_at_ms: number | null;
    environment: "SANDBOX" | "PRODUCTION";
    store: "APP_STORE" | "PLAY_STORE" | "STRIPE" | "PROMOTIONAL";
    is_family_share: boolean;
    country_code: string;
    currency: string;
    price: number;
    price_in_purchased_currency: number;
    subscriber_attributes: Record<string, { value: string; updated_at_ms: number }>;
    transaction_id: string;
    original_transaction_id: string;
    presented_offering_id: string | null;
    takehome_percentage: number;
    offer_code: string | null;
  };
}

// Webhook authorization key - set this in your environment variables
// Get from RevenueCat: Project Settings -> Webhooks -> Authorization header
const REVENUECAT_WEBHOOK_AUTH = process.env.REVENUECAT_WEBHOOK_AUTH;

/**
 * Map RevenueCat product ID to plan type
 */
function getPlanFromProductId(productId: string): "free" | "pro" | "elite" {
  if (productId.includes("elite")) return "elite";
  if (productId.includes("pro")) return "pro";
  return "free";
}

/**
 * Map RevenueCat event type to subscription status
 */
function getStatusFromEventType(
  eventType: RevenueCatEventType
): "active" | "cancelled" | "past_due" | "trialing" {
  switch (eventType) {
    case "INITIAL_PURCHASE":
    case "RENEWAL":
    case "UNCANCELLATION":
    case "PRODUCT_CHANGE":
      return "active";
    case "CANCELLATION":
    case "EXPIRATION":
      return "cancelled";
    case "BILLING_ISSUE":
      return "past_due";
    default:
      return "active";
  }
}

/**
 * Handle RevenueCat webhook events
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authorization header
    const authHeader = request.headers.get("authorization");
    if (REVENUECAT_WEBHOOK_AUTH && authHeader !== REVENUECAT_WEBHOOK_AUTH) {
      console.error("[RevenueCat Webhook] Invalid authorization");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the webhook payload
    const payload: RevenueCatWebhookEvent = await request.json();
    const { event } = payload;

    console.log(`[RevenueCat Webhook] Received event: ${event.type}`, {
      app_user_id: event.app_user_id,
      product_id: event.product_id,
      environment: event.environment,
    });

    // Skip sandbox events in production (optional - remove if you want sandbox webhooks)
    // if (process.env.NODE_ENV === "production" && event.environment === "SANDBOX") {
    //   console.log("[RevenueCat Webhook] Skipping sandbox event in production");
    //   return NextResponse.json({ received: true, skipped: true });
    // }

    // Get the user ID (RevenueCat app_user_id should match Supabase user ID)
    const userId = event.app_user_id;
    if (!userId || userId.startsWith("$RCAnonymousID")) {
      console.log("[RevenueCat Webhook] Skipping anonymous user event");
      return NextResponse.json({ received: true, skipped: true });
    }

    // Determine subscription details
    const plan = getPlanFromProductId(event.product_id);
    const status = getStatusFromEventType(event.type);
    const price = event.price_in_purchased_currency || event.price || 0;
    const nextBillingDate = event.expiration_at_ms
      ? new Date(event.expiration_at_ms).toISOString()
      : null;

    // Update subscription in Supabase
    const supabase = createServiceClient();

    const subscriptionData = {
      user_id: userId,
      plan,
      status,
      billing_cycle: "monthly" as const, // All our products are monthly
      price,
      next_billing_date: nextBillingDate,
      updated_at: new Date().toISOString(),
    };

    const { error: upsertError } = await supabase
      .from("subscriptions")
      .upsert(subscriptionData, {
        onConflict: "user_id",
      });

    if (upsertError) {
      console.error("[RevenueCat Webhook] Failed to update subscription:", upsertError);
      return NextResponse.json(
        { error: "Failed to update subscription" },
        { status: 500 }
      );
    }

    console.log(`[RevenueCat Webhook] Updated subscription for user ${userId}:`, {
      plan,
      status,
      price,
      next_billing_date: nextBillingDate,
    });

    // Handle specific event types with additional logic
    switch (event.type) {
      case "INITIAL_PURCHASE":
        // Could trigger welcome email, analytics event, etc.
        console.log(`[RevenueCat Webhook] New subscriber: ${userId} -> ${plan}`);
        break;

      case "CANCELLATION":
        // Could trigger win-back email, survey, etc.
        console.log(`[RevenueCat Webhook] Subscription cancelled: ${userId}`);
        break;

      case "EXPIRATION":
        // Subscription has fully expired
        console.log(`[RevenueCat Webhook] Subscription expired: ${userId}`);
        // Optionally downgrade to free plan explicitly
        await supabase.from("subscriptions").update({ plan: "free" }).eq("user_id", userId);
        break;

      case "BILLING_ISSUE":
        // Payment failed - could notify user
        console.log(`[RevenueCat Webhook] Billing issue for user: ${userId}`);
        break;

      case "PRODUCT_CHANGE":
        // User upgraded/downgraded
        console.log(`[RevenueCat Webhook] Plan changed for user ${userId} -> ${plan}`);
        break;
    }

    return NextResponse.json({ received: true, processed: true });
  } catch (error) {
    console.error("[RevenueCat Webhook] Error processing webhook:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Allow GET for webhook verification (some services send a GET first)
export async function GET() {
  return NextResponse.json({ status: "ok", service: "revenuecat-webhook" });
}
