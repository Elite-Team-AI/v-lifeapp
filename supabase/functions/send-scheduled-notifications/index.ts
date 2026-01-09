import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "jsr:@supabase/supabase-js@2"

/**
 * Send Scheduled Notifications Edge Function
 *
 * Called by pg_cron every minute to check and send scheduled push notifications
 * for workout reminders, meal reminders, habit reminders, and streak warnings.
 *
 * This function uses the service role key and should NOT have JWT verification
 * since it's called by a cron job, not by authenticated users.
 */

interface PushSubscription {
  endpoint: string
  expirationTime?: number | null
  keys: {
    p256dh: string
    auth: string
  }
}

interface UserNotificationProfile {
  id: string
  name: string | null
  push_subscription: PushSubscription | null
  timezone: string | null
  notifications_enabled: boolean
  workout_reminders: boolean
  workout_reminder_time: string | null
  meal_reminders: boolean
  breakfast_reminder_time: string | null
  lunch_reminder_time: string | null
  dinner_reminder_time: string | null
  habit_reminders: boolean
  streak_warnings: boolean
}

interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  data?: Record<string, unknown>
}

// Get current time in HH:MM format for a given timezone
function getCurrentTimeInTimezone(timezone: string): string {
  try {
    const now = new Date()
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    })

    const parts = formatter.formatToParts(now)
    const hour = parts.find(p => p.type === "hour")?.value || "00"
    const minute = parts.find(p => p.type === "minute")?.value || "00"

    return `${hour}:${minute}`
  } catch {
    // Default to UTC if timezone is invalid
    const now = new Date()
    return `${now.getUTCHours().toString().padStart(2, "0")}:${now.getUTCMinutes().toString().padStart(2, "0")}`
  }
}

// Send Web Push notification using the Web Push protocol
async function sendWebPushNotification(
  subscription: PushSubscription,
  payload: NotificationPayload,
  vapidPublicKey: string,
  vapidPrivateKey: string
): Promise<boolean> {
  try {
    // For Web Push, we need to use the web-push protocol
    // This is a simplified implementation - in production you'd use the web-push library
    // or implement the full VAPID/ECDH signing

    const response = await fetch(subscription.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "TTL": "86400", // 24 hours
        // Note: Full VAPID implementation requires signing headers
        // For now, this serves as a placeholder structure
      },
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      console.error(`Push failed: ${response.status} ${response.statusText}`)
      return false
    }

    return true
  } catch (error) {
    console.error("Failed to send push notification:", error)
    return false
  }
}

// Log notification to database
async function logNotification(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  notificationType: string,
  title: string,
  body: string
): Promise<void> {
  try {
    await supabase.from("notification_logs").insert({
      user_id: userId,
      notification_type: notificationType,
      title,
      body,
      sent_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Failed to log notification:", error)
  }
}

Deno.serve(async (req) => {
  // Only allow POST requests (from cron) or OPTIONS for CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204 })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") || ""
    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") || ""

    if (!vapidPublicKey || !vapidPrivateKey) {
      console.warn("VAPID keys not configured - notifications will not be sent")
      return new Response(
        JSON.stringify({ success: false, error: "VAPID keys not configured" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    // Create admin client (bypasses RLS)
    const supabase = createClient(supabaseUrl, serviceRoleKey)

    // Query all users with notifications enabled and a push subscription
    const { data: users, error: queryError } = await supabase
      .from("profiles")
      .select(`
        id,
        name,
        push_subscription,
        timezone,
        notifications_enabled,
        workout_reminders,
        workout_reminder_time,
        meal_reminders,
        breakfast_reminder_time,
        lunch_reminder_time,
        dinner_reminder_time,
        habit_reminders,
        streak_warnings
      `)
      .eq("notifications_enabled", true)
      .not("push_subscription", "is", null)

    if (queryError) {
      console.error("Failed to query users:", queryError)
      return new Response(
        JSON.stringify({ success: false, error: "Database query failed" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      )
    }

    if (!users || users.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users with notifications enabled", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      )
    }

    let notificationsSent = 0
    const errors: string[] = []

    // Process each user
    for (const user of users as UserNotificationProfile[]) {
      if (!user.push_subscription) continue

      const userTimezone = user.timezone || "America/New_York"
      const currentTime = getCurrentTimeInTimezone(userTimezone)
      const userName = user.name?.split(" ")[0] || "there"

      // Check workout reminder
      if (user.workout_reminders && user.workout_reminder_time === currentTime) {
        const payload: NotificationPayload = {
          title: "Time to workout!",
          body: `Hey ${userName}, your workout is waiting! Let's crush it today.`,
          icon: "/icon-192x192.png",
          badge: "/icon-192x192.png",
          data: { type: "workout_reminder", url: "/fitness" },
        }

        const sent = await sendWebPushNotification(
          user.push_subscription,
          payload,
          vapidPublicKey,
          vapidPrivateKey
        )

        if (sent) {
          await logNotification(supabase, user.id, "workout_reminder", payload.title, payload.body)
          notificationsSent++
        }
      }

      // Check meal reminders
      if (user.meal_reminders) {
        // Breakfast
        if (user.breakfast_reminder_time === currentTime) {
          const payload: NotificationPayload = {
            title: "Breakfast time!",
            body: `Good morning ${userName}! Check your meal plan for a healthy breakfast.`,
            icon: "/icon-192x192.png",
            data: { type: "meal_reminder", meal: "breakfast", url: "/nutrition" },
          }

          const sent = await sendWebPushNotification(
            user.push_subscription,
            payload,
            vapidPublicKey,
            vapidPrivateKey
          )

          if (sent) {
            await logNotification(supabase, user.id, "breakfast_reminder", payload.title, payload.body)
            notificationsSent++
          }
        }

        // Lunch
        if (user.lunch_reminder_time === currentTime) {
          const payload: NotificationPayload = {
            title: "Lunch time!",
            body: `Hey ${userName}, time for a nutritious lunch. Check your meal plan!`,
            icon: "/icon-192x192.png",
            data: { type: "meal_reminder", meal: "lunch", url: "/nutrition" },
          }

          const sent = await sendWebPushNotification(
            user.push_subscription,
            payload,
            vapidPublicKey,
            vapidPrivateKey
          )

          if (sent) {
            await logNotification(supabase, user.id, "lunch_reminder", payload.title, payload.body)
            notificationsSent++
          }
        }

        // Dinner
        if (user.dinner_reminder_time === currentTime) {
          const payload: NotificationPayload = {
            title: "Dinner time!",
            body: `Evening ${userName}! Your dinner plan is ready. Eat well!`,
            icon: "/icon-192x192.png",
            data: { type: "meal_reminder", meal: "dinner", url: "/nutrition" },
          }

          const sent = await sendWebPushNotification(
            user.push_subscription,
            payload,
            vapidPublicKey,
            vapidPrivateKey
          )

          if (sent) {
            await logNotification(supabase, user.id, "dinner_reminder", payload.title, payload.body)
            notificationsSent++
          }
        }
      }

      // Check habit reminder (default: 20:00 / 8 PM as evening reminder)
      if (user.habit_reminders && currentTime === "20:00") {
        // Check if user has incomplete habits today
        const today = new Date().toISOString().split("T")[0]

        const { data: habits } = await supabase
          .from("habits")
          .select("id")
          .eq("user_id", user.id)

        const { data: completedLogs } = await supabase
          .from("habit_logs")
          .select("habit_id")
          .eq("user_id", user.id)
          .eq("logged_at", today)
          .eq("completed", true)

        const totalHabits = habits?.length || 0
        const completedCount = completedLogs?.length || 0
        const incompleteCount = totalHabits - completedCount

        if (incompleteCount > 0) {
          const payload: NotificationPayload = {
            title: "Don't forget your habits!",
            body: `Hey ${userName}, you have ${incompleteCount} habit${incompleteCount > 1 ? "s" : ""} left for today.`,
            icon: "/icon-192x192.png",
            data: { type: "habit_reminder", url: "/dashboard" },
          }

          const sent = await sendWebPushNotification(
            user.push_subscription,
            payload,
            vapidPublicKey,
            vapidPrivateKey
          )

          if (sent) {
            await logNotification(supabase, user.id, "habit_reminder", payload.title, payload.body)
            notificationsSent++
          }
        }
      }

      // Check streak warning (default: 21:00 / 9 PM as late evening warning)
      if (user.streak_warnings && currentTime === "21:00") {
        // Check if user has active streaks that could be broken
        const { data: habits } = await supabase
          .from("habits")
          .select("id, name, current_streak")
          .eq("user_id", user.id)
          .gt("current_streak", 0)

        const today = new Date().toISOString().split("T")[0]

        const { data: completedLogs } = await supabase
          .from("habit_logs")
          .select("habit_id")
          .eq("user_id", user.id)
          .eq("logged_at", today)
          .eq("completed", true)

        const completedIds = new Set(completedLogs?.map(l => l.habit_id) || [])
        const atRiskHabits = habits?.filter(h => !completedIds.has(h.id) && h.current_streak > 0) || []

        if (atRiskHabits.length > 0) {
          const longestStreak = Math.max(...atRiskHabits.map(h => h.current_streak))
          const payload: NotificationPayload = {
            title: "Streak alert!",
            body: `${userName}, your ${longestStreak}-day streak is at risk! Complete your habits before midnight.`,
            icon: "/icon-192x192.png",
            data: { type: "streak_warning", url: "/dashboard" },
          }

          const sent = await sendWebPushNotification(
            user.push_subscription,
            payload,
            vapidPublicKey,
            vapidPrivateKey
          )

          if (sent) {
            await logNotification(supabase, user.id, "streak_warning", payload.title, payload.body)
            notificationsSent++
          }
        }
      }
    }

    console.log(`Processed ${users.length} users, sent ${notificationsSent} notifications`)

    return new Response(
      JSON.stringify({
        success: true,
        processed: users.length,
        sent: notificationsSent,
        errors: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    )
  } catch (error) {
    console.error("Error in send-scheduled-notifications:", error)

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    )
  }
})
