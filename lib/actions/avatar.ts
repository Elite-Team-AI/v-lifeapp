"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function uploadAvatar(formData: FormData): Promise<{
  success: boolean
  avatarUrl?: string
  error?: string
}> {
  try {
    const file = formData.get("file") as File | null
    
    if (!file) {
      return { success: false, error: "No file provided" }
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return { success: false, error: "Please upload an image file" }
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: "Please upload an image smaller than 5MB" }
    }

    const supabase = await createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError) {
      console.error("[uploadAvatar] Auth error:", authError)
      return { success: false, error: `Authentication failed: ${authError.message}` }
    }
    
    if (!user) {
      return { success: false, error: "Not authenticated" }
    }

    console.log("[uploadAvatar] User authenticated:", user.id)

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const fileBuffer = Buffer.from(arrayBuffer)

    // Upload to Supabase storage
    const fileExt = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const fileName = `${user.id}/avatar.${fileExt}`
    
    console.log("[uploadAvatar] Uploading file:", fileName, "Size:", file.size)

    const { error: uploadError, data: uploadData } = await supabase.storage
      .from("avatars")
      .upload(fileName, fileBuffer, { 
        upsert: true,
        contentType: file.type
      })

    if (uploadError) {
      console.error("[uploadAvatar] Upload error:", uploadError)
      
      // Check for specific error types
      if (uploadError.message?.includes("Bucket not found")) {
        return { success: false, error: "Storage bucket 'avatars' not found. Please contact support." }
      }
      if (uploadError.message?.includes("row-level security") || uploadError.message?.includes("policy")) {
        return { success: false, error: "Permission denied. Storage policy may not be configured correctly." }
      }
      
      return { success: false, error: uploadError.message || "Upload failed" }
    }

    console.log("[uploadAvatar] Upload successful:", uploadData)

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName)

    // Add cache buster
    const avatarUrl = `${publicUrl}?t=${Date.now()}`

    console.log("[uploadAvatar] Public URL:", avatarUrl)

    // Update the profile with the new avatar URL
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_url: avatarUrl })
      .eq("id", user.id)

    if (profileError) {
      console.error("[uploadAvatar] Profile update error:", profileError)
      // Avatar was uploaded successfully, but profile update failed
      // Still return success with the URL
    }

    // Revalidate pages that show the avatar
    revalidatePath("/settings")
    revalidatePath("/dashboard")
    revalidatePath("/community")

    return { success: true, avatarUrl }
  } catch (error) {
    console.error("[uploadAvatar] Unexpected error:", error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Failed to upload avatar. Please try again." 
    }
  }
}

