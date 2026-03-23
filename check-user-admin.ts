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

async function checkUserAdmin() {
  try {
    const supabase = createClient(
      envVars.NEXT_PUBLIC_SUPABASE_URL,
      envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    console.log("Checking for user with email hwikoff4@gmail.com...\n")

    // Get all profiles to find the one with matching email
    const { data: profiles, error } = await supabase
      .from("profiles")
      .select("id, name, email, is_admin")
      .eq("email", "hwikoff4@gmail.com")

    if (error) {
      console.error("❌ Error:", error.message)
      return
    }

    if (!profiles || profiles.length === 0) {
      console.log("❌ No profile found for hwikoff4@gmail.com")
      console.log("\nLet's check all profiles with is_admin = true:")

      const { data: adminProfiles, error: adminError } = await supabase
        .from("profiles")
        .select("id, name, email, is_admin")
        .eq("is_admin", true)

      if (adminError) {
        console.error("Error fetching admin profiles:", adminError.message)
      } else if (!adminProfiles || adminProfiles.length === 0) {
        console.log("❌ No admin users found in the database!")
        console.log("\n⚠️  THIS IS THE ISSUE: You need to set is_admin = true for your user")
      } else {
        console.log(`Found ${adminProfiles.length} admin user(s):`)
        adminProfiles.forEach((profile: any) => {
          console.log(`  - ${profile.name || 'No name'} (${profile.email || 'No email'})`)
        })
      }
    } else {
      const profile = profiles[0]
      console.log("✅ Profile found:")
      console.log(`   Name: ${profile.name || 'Not set'}`)
      console.log(`   Email: ${profile.email || 'Not set'}`)
      console.log(`   Is Admin: ${profile.is_admin === true ? '✅ YES' : '❌ NO'}`)

      if (profile.is_admin !== true) {
        console.log("\n⚠️  THIS IS THE ISSUE!")
        console.log("Your user account does not have admin privileges.")
        console.log("You need to set is_admin = true in the profiles table.")
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err)
  }
}

checkUserAdmin()
