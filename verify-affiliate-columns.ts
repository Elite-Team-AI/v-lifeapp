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

async function verifyAffiliateColumns() {
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

    console.log("Checking if is_affiliate column exists...")

    // Try to query the column
    const { data, error } = await supabase
      .from("profiles")
      .select("id, name, is_admin, is_affiliate, affiliate_approved_at")
      .limit(1)

    if (error) {
      console.error("❌ Error:", error.message)

      if (error.message.includes("is_affiliate")) {
        console.log("\n⚠️  is_affiliate column does not exist yet")
        console.log("The migration may not have been applied successfully")
      }
    } else {
      console.log("✅ Columns exist!")
      console.log("Sample data:", data)
    }
  } catch (err) {
    console.error("Unexpected error:", err)
  }
}

verifyAffiliateColumns()
