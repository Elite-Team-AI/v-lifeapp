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

async function testAdminAction() {
  try {
    const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SERVICE_KEY

    if (!serviceRoleKey) {
      console.error("❌ Service role key not found")
      return
    }

    const supabase = createClient(
      envVars.NEXT_PUBLIC_SUPABASE_URL,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const userId = "80c7444d-95ff-49f9-86a6-ad937bb92328"

    console.log("Testing admin check...")
    console.log("User ID:", userId)

    // Check admin status
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin, name")
      .eq("id", userId)
      .single()

    if (profileError) {
      console.error("❌ Error fetching profile:", profileError.message)
      return
    }

    console.log("\n✅ Profile found:")
    console.log("   Name:", profile?.name)
    console.log("   Is Admin:", profile?.is_admin)

    if (profile?.is_admin !== true) {
      console.log("\n❌ User is not an admin!")
      return
    }

    // Now test the affiliate applications query
    console.log("\n\nTesting affiliate applications query...")

    const { data: applications, error: appsError } = await supabase
      .from("affiliate_applications")
      .select("id, name, email, phone, status, created_at, reviewed_at")
      .order("created_at", { ascending: false })

    if (appsError) {
      console.error("❌ Error fetching applications:", appsError.message)
      return
    }

    console.log(`\n✅ Applications query succeeded!`)
    console.log(`   Found ${applications?.length || 0} application(s)`)

    if (applications && applications.length > 0) {
      console.log("\n📋 Applications:")
      applications.forEach((app: any, i: number) => {
        console.log(`\n${i + 1}. ${app.name}`)
        console.log(`   Email: ${app.email}`)
        console.log(`   Phone: ${app.phone}`)
        console.log(`   Status: ${app.status}`)
        console.log(`   Created: ${app.created_at}`)
      })
    } else {
      console.log("\n⚠️  No applications found in database")
    }

    // Also check with the regular client (anon key) to simulate what the app does
    console.log("\n\n--- Testing with ANON key (what the app uses) ---")

    const anonSupabase = createClient(
      envVars.NEXT_PUBLIC_SUPABASE_URL,
      envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    const { data: anonApps, error: anonError } = await anonSupabase
      .from("affiliate_applications")
      .select("id, name, email, phone, status, created_at, reviewed_at")
      .order("created_at", { ascending: false })

    if (anonError) {
      console.error("❌ Error with anon key:", anonError.message)
      console.log("\nThis might be the issue - the anon key can't query the table")
    } else {
      console.log(`✅ Anon key query succeeded!`)
      console.log(`   Found ${anonApps?.length || 0} application(s)`)
    }

  } catch (err) {
    console.error("Unexpected error:", err)
  }
}

testAdminAction()
