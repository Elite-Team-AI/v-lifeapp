"use server"

import { createClient, getAuthUser } from "@/lib/supabase/server"

export async function getReferralStats() {
  try {
    const { user, error: userError } = await getAuthUser()

    if (userError || !user) {
      return { error: "Not authenticated", stats: null }
    }

    const supabase = await createClient()

    // Get user's profile with referral code and credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("referral_code, credits, name")
      .eq("id", user.id)
      .single()

    if (profileError) {
      console.error("[v0] Get profile error:", profileError)
      return { error: "Failed to fetch profile", stats: null }
    }

    let referralCode = profile.referral_code
    const needsNewCode = !referralCode || !referralCode.startsWith("VLIFE-")

    if (needsNewCode) {
      const userName = profile.name || "USER"
      // Extract first name and clean it (remove spaces, special chars)
      const firstName = userName
        .split(" ")[0]
        .toUpperCase()
        .replace(/[^A-Z]/g, "")
      const year = new Date().getFullYear()
      referralCode = `VLIFE-${firstName}${year}`

      const { data: existingCode } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .maybeSingle()

      if (existingCode) {
        // Add random number if code exists
        referralCode = `VLIFE-${firstName}${Math.floor(Math.random() * 1000)}`
      }

      console.log("[v0] Generated new referral code:", referralCode)

      // Update profile with new referral code
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ referral_code: referralCode })
        .eq("id", user.id)

      if (updateError) {
        console.error("[v0] Update referral code error:", updateError)
      }
    }

    // Get count of successful referrals
    const { data: referrals, error: referralsError } = await supabase
      .from("referrals")
      .select("id, credits_earned")
      .eq("referrer_id", user.id)
      .eq("status", "completed")

    if (referralsError) {
      console.error("[v0] Get referrals error:", referralsError)
    }

    const referralsCount = referrals?.length || 0
    const creditsEarned = referrals?.reduce((sum, ref) => sum + (ref.credits_earned || 0), 0) || 0

    // Get current credits balance from profile
    const creditsBalance = profile.credits || 0

    return {
      error: null,
      stats: {
        referralCode,
        creditsBalance,
        referralsCount,
        creditsEarned,
      },
    }
  } catch (error) {
    console.error("[v0] Get referral stats exception:", error)
    return { error: "An unexpected error occurred", stats: null }
  }
}

export async function applyReferralCode(code: string) {
  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Not authenticated", success: false }
    }

    const { data: existingReferral, error: checkError } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_user_id", user.id)
      .maybeSingle()

    if (existingReferral) {
      return { error: "You have already used a referral code", success: false }
    }

    // Find the referrer by code
    const { data: referrerProfile, error: referrerError } = await supabase
      .from("profiles")
      .select("id, is_affiliate")
      .eq("referral_code", code)
      .single()

    if (referrerError || !referrerProfile) {
      return { error: "Invalid referral code", success: false }
    }

    // Can't refer yourself
    if (referrerProfile.id === user.id) {
      return { error: "You cannot use your own referral code", success: false }
    }

    // Award credits based on affiliate status
    // Affiliates get 2 credits per referral, regular users get 1 credit
    const creditsToAward = referrerProfile.is_affiliate ? 2 : 1
    const { error: createError } = await supabase.from("referrals").insert({
      referrer_id: referrerProfile.id,
      referred_user_id: user.id,
      referral_code: code,
      status: "completed",
      credits_earned: creditsToAward,
      completed_at: new Date().toISOString(),
    })

    if (createError) {
      console.error("[v0] Create referral error:", createError)
      return { error: "Failed to apply referral code", success: false }
    }

    // Award credits to referrer
    const { error: updateError } = await supabase.rpc("increment_credits", {
      user_id: referrerProfile.id,
      amount: creditsToAward,
    })

    if (updateError) {
      console.error("[v0] Update credits error:", updateError)
      // Try manual update as fallback
      const { data: currentProfile } = await supabase
        .from("profiles")
        .select("credits")
        .eq("id", referrerProfile.id)
        .single()

      await supabase
        .from("profiles")
        .update({ credits: (currentProfile?.credits || 0) + creditsToAward })
        .eq("id", referrerProfile.id)
    }

    // Create credit transaction record
    const transactionDescription = referrerProfile.is_affiliate
      ? `Affiliate referral bonus for inviting a new user (2x)`
      : `Referral bonus for inviting a new user`

    await supabase.from("credit_transactions").insert({
      user_id: referrerProfile.id,
      amount: creditsToAward,
      transaction_type: "referral",
      description: transactionDescription,
    })

    return { error: null, success: true }
  } catch (error) {
    console.error("[v0] Apply referral code exception:", error)
    return { error: "An unexpected error occurred", success: false }
  }
}

export async function getCreditTransactions() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return { error: "Not authenticated", transactions: null }
    }

    const { data: transactions, error: transactionsError } = await supabase
      .from("credit_transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(10)

    if (transactionsError) {
      console.error("[v0] Get transactions error:", transactionsError)
      return { error: "Failed to fetch transactions", transactions: null }
    }

    return { error: null, transactions }
  } catch (error) {
    console.error("[v0] Get credit transactions exception:", error)
    return { error: "An unexpected error occurred", transactions: null }
  }
}
