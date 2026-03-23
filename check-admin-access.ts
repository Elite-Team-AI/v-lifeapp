import { createClient } from "@supabase/supabase-js"
import * as fs from "fs"

// Load env vars from .env.local
const envContent = fs.readFileSync(".env.local", "utf-8")
const envVars = Object.fromEntries(
  envContent.split("\n")
    .filter(line => line.includes("="))
    .map(line => {
      const [key, ...valueParts] = line.split("=")
      const value = valueParts.join("=").replace(/^"|"$/g, "")
      return [key, value]
    })
)

async function checkAdminAccess() {
  try {
    const supabase = createClient(
      envVars.NEXT_PUBLIC_SUPABASE_URL,
      envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    console.log("Checking admin access...")

    // Get current user (this won't work with anon key, but let's try)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      console.log("❌ No authenticated user found")
      console.log("Note: This script uses the anon key, which doesn't have access to user sessions")
      console.log("\nLet's check if RLS is enabled on affiliate_applications table...")

      console.log("\nTrying direct query with anon key...")
      const { data: applications, error: queryError } = await supabase
        .from("affiliate_applications")
        .select("*")

      if (queryError) {
        console.error("❌ Query error:", queryError.message)
        console.error("Code:", queryError.code)

        if (queryError.code === "42501") {
          console.log("\n⚠️  RLS is blocking the query!")
          console.log("This is the issue - RLS is enabled but there are no policies allowing reads")
        }
      } else {
        console.log("✅ Query succeeded with anon key")
        console.log("Applications found:", applications?.length || 0)
        if (applications && applications.length > 0) {
          applications.forEach((app: any, i: number) => {
            console.log(`${i + 1}. ${app.name} (${app.email}) - Status: ${app.status}`)
          })
        }
      }
    } else {
      console.log("✅ User authenticated:", user.email)

      // Check admin status
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin, name")
        .eq("id", user.id)
        .single()

      if (profileError) {
        console.error("❌ Error fetching profile:", profileError.message)
      } else {
        console.log("Profile:", profile)
        console.log("Is Admin:", profile?.is_admin === true ? "YES" : "NO")

        if (profile?.is_admin) {
          // Try the query
          const { data: applications, error: queryError } = await supabase
            .from("affiliate_applications")
            .select("*")

          if (queryError) {
            console.error("❌ Query error:", queryError.message)
          } else {
            console.log("✅ Applications found:", applications?.length || 0)
          }
        }
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err)
  }
}

checkAdminAccess()
