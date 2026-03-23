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

async function setUserAsAdmin() {
  try {
    // We need to use the service role key to bypass RLS
    const serviceRoleKey = envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SERVICE_KEY

    if (!serviceRoleKey) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY not found in .env.local")
      console.log("\nYou need to add your Supabase service role key to .env.local:")
      console.log("SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here")
      console.log("\nYou can find this key in your Supabase dashboard:")
      console.log("Settings → API → Project API keys → service_role (secret)")
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

    console.log("Looking for user with email hwikoff4@gmail.com...")

    // Get the user ID from auth.users
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers()

    if (usersError) {
      console.error("❌ Error fetching users:", usersError.message)
      return
    }

    const targetUser = users?.find(u => u.email === "hwikoff4@gmail.com")

    if (!targetUser) {
      console.log("❌ User not found with email hwikoff4@gmail.com")
      console.log("\nAvailable users:")
      users?.forEach(u => console.log(`  - ${u.email} (ID: ${u.id})`))
      return
    }

    console.log(`✅ Found user: ${targetUser.email}`)
    console.log(`   User ID: ${targetUser.id}`)

    // Update the profile to set is_admin = true
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_admin: true })
      .eq("id", targetUser.id)

    if (updateError) {
      console.error("❌ Error updating profile:", updateError.message)
      return
    }

    console.log("\n✅ SUCCESS! User has been granted admin privileges.")
    console.log("\nYou can now:")
    console.log("1. Refresh the admin page in your browser")
    console.log("2. The affiliate application should now be visible")
  } catch (err) {
    console.error("Unexpected error:", err)
  }
}

setUserAsAdmin()
