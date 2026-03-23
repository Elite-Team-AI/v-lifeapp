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

async function checkAffiliateTable() {
  try {
    const supabase = createClient(
      envVars.NEXT_PUBLIC_SUPABASE_URL,
      envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY
    )

    console.log("Checking if affiliate_applications table exists...")

    // Try to query the table
    const { data, error } = await supabase
      .from("affiliate_applications")
      .select("*")
      .limit(1)

    if (error) {
      console.error("❌ Error querying affiliate_applications table:")
      console.error("Code:", error.code)
      console.error("Message:", error.message)

      if (error.code === "42P01") {
        console.log("\n⚠️  Table does not exist! The migration needs to be applied.")
        console.log("Run: supabase db push")
      }
    } else {
      console.log("✅ Table exists!")
      console.log("Number of applications in database:", data?.length || 0)
      if (data && data.length > 0) {
        console.log("\nApplications found:")
        data.forEach((app: any, i: number) => {
          console.log(`${i + 1}. ${app.name} (${app.email}) - Status: ${app.status}`)
        })
      }
    }
  } catch (err) {
    console.error("Unexpected error:", err)
  }
}

checkAffiliateTable()
