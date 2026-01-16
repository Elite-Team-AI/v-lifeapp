import {
  Purchases,
  LOG_LEVEL,
  type CustomerInfo,
  type PurchasesOfferings,
  type PurchasesPackage,
} from "@revenuecat/purchases-capacitor";
import { Capacitor } from "@capacitor/core";

// RevenueCat API Keys
const REVENUECAT_IOS_KEY = "appl_PpVZxhnVRIzIdWsYaVRUnRBigDm";
const REVENUECAT_ANDROID_KEY = "goog_kkJoPPlOScqqaDCbeKwVhmrPluS";

// Entitlement identifiers - must match RevenueCat dashboard
export const ENTITLEMENTS = {
  PRO: "pro",
  ELITE: "elite",
} as const;

// Product identifiers - must match App Store Connect / Google Play Console
export const PRODUCTS = {
  PRO_MONTHLY: "vlife_pro_monthly",
  ELITE_MONTHLY: "vlife_elite_monthly",
} as const;

/**
 * Check if running on a native platform (iOS/Android)
 */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/**
 * Get the current platform
 */
export function getPlatform(): "ios" | "android" | "web" {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") return "ios";
  if (platform === "android") return "android";
  return "web";
}

/**
 * Initialize RevenueCat with the user's ID
 * Call this after user authentication
 */
export async function initRevenueCat(userId: string): Promise<void> {
  if (!isNativePlatform()) {
    console.log("[RevenueCat] Skipping initialization - not on native platform");
    return;
  }

  const platform = getPlatform();
  const apiKey =
    platform === "ios" ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

  try {
    await Purchases.configure({
      apiKey,
      appUserID: userId,
    });

    // Set debug log level in development
    if (process.env.NODE_ENV === "development") {
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
    }

    console.log("[RevenueCat] Initialized successfully for user:", userId);
  } catch (error) {
    console.error("[RevenueCat] Failed to initialize:", error);
    throw error;
  }
}

/**
 * Get available subscription offerings
 */
export async function getOfferings(): Promise<PurchasesOfferings | null> {
  if (!isNativePlatform()) {
    console.log("[RevenueCat] Offerings not available on web");
    return null;
  }

  try {
    const { offerings } = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error("[RevenueCat] Failed to get offerings:", error);
    return null;
  }
}

/**
 * Get the current offering (default subscription options)
 */
export async function getCurrentOffering(): Promise<PurchasesPackage[] | null> {
  const offerings = await getOfferings();
  return offerings?.current?.availablePackages ?? null;
}

/**
 * Purchase a subscription package
 */
export async function purchasePackage(
  pkg: PurchasesPackage
): Promise<CustomerInfo | null> {
  if (!isNativePlatform()) {
    console.log("[RevenueCat] Purchases not available on web");
    return null;
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage({
      aPackage: pkg,
    });
    console.log("[RevenueCat] Purchase successful");
    return customerInfo;
  } catch (error: unknown) {
    // Check if user cancelled
    if (
      error &&
      typeof error === "object" &&
      "userCancelled" in error &&
      (error as { userCancelled: boolean }).userCancelled
    ) {
      console.log("[RevenueCat] User cancelled purchase");
      return null;
    }
    console.error("[RevenueCat] Purchase failed:", error);
    throw error;
  }
}

/**
 * Purchase by product identifier
 */
export async function purchaseProduct(
  productId: string
): Promise<CustomerInfo | null> {
  const packages = await getCurrentOffering();
  if (!packages) {
    throw new Error("No offerings available");
  }

  const pkg = packages.find(
    (p) => p.product.identifier === productId
  );
  if (!pkg) {
    throw new Error(`Product not found: ${productId}`);
  }

  return purchasePackage(pkg);
}

/**
 * Get current customer info (subscription status)
 */
export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!isNativePlatform()) {
    console.log("[RevenueCat] Customer info not available on web");
    return null;
  }

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error("[RevenueCat] Failed to get customer info:", error);
    return null;
  }
}

/**
 * Restore previous purchases (useful for reinstalls)
 */
export async function restorePurchases(): Promise<CustomerInfo | null> {
  if (!isNativePlatform()) {
    console.log("[RevenueCat] Restore not available on web");
    return null;
  }

  try {
    const { customerInfo } = await Purchases.restorePurchases();
    console.log("[RevenueCat] Purchases restored");
    return customerInfo;
  } catch (error) {
    console.error("[RevenueCat] Failed to restore purchases:", error);
    throw error;
  }
}

/**
 * Get the user's current plan based on active entitlements
 */
export function getUserPlan(
  customerInfo: CustomerInfo
): "free" | "pro" | "elite" {
  const activeEntitlements = customerInfo.entitlements.active;

  // Check elite first (higher tier)
  if (activeEntitlements[ENTITLEMENTS.ELITE]) {
    return "elite";
  }

  // Check pro
  if (activeEntitlements[ENTITLEMENTS.PRO]) {
    return "pro";
  }

  return "free";
}

/**
 * Check if user has a specific entitlement
 */
export function hasEntitlement(
  customerInfo: CustomerInfo,
  entitlement: string
): boolean {
  return !!customerInfo.entitlements.active[entitlement];
}

/**
 * Check if user has pro access (pro or elite)
 */
export function hasProAccess(customerInfo: CustomerInfo): boolean {
  return (
    hasEntitlement(customerInfo, ENTITLEMENTS.PRO) ||
    hasEntitlement(customerInfo, ENTITLEMENTS.ELITE)
  );
}

/**
 * Check if user has elite access
 */
export function hasEliteAccess(customerInfo: CustomerInfo): boolean {
  return hasEntitlement(customerInfo, ENTITLEMENTS.ELITE);
}

/**
 * Get subscription expiration date
 */
export function getExpirationDate(customerInfo: CustomerInfo): Date | null {
  const plan = getUserPlan(customerInfo);
  if (plan === "free") return null;

  const entitlement =
    plan === "elite"
      ? customerInfo.entitlements.active[ENTITLEMENTS.ELITE]
      : customerInfo.entitlements.active[ENTITLEMENTS.PRO];

  if (!entitlement?.expirationDate) return null;

  return new Date(entitlement.expirationDate);
}

/**
 * Check if subscription will renew
 */
export function willRenew(customerInfo: CustomerInfo): boolean {
  const plan = getUserPlan(customerInfo);
  if (plan === "free") return false;

  const entitlement =
    plan === "elite"
      ? customerInfo.entitlements.active[ENTITLEMENTS.ELITE]
      : customerInfo.entitlements.active[ENTITLEMENTS.PRO];

  return entitlement?.willRenew ?? false;
}

/**
 * Log out the current user from RevenueCat
 * Call this on user logout
 */
export async function logOutRevenueCat(): Promise<void> {
  if (!isNativePlatform()) return;

  try {
    await Purchases.logOut();
    console.log("[RevenueCat] User logged out");
  } catch (error) {
    console.error("[RevenueCat] Failed to log out:", error);
  }
}
