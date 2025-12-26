"use client"

import { useState } from "react"

interface PostImageProps {
  src: string
  alt?: string
  className?: string
}

// Check if URL is a valid (not a blob URL)
function isValidImageUrl(url: string | undefined | null): boolean {
  if (!url) return false
  // Filter out blob URLs which are temporary and session-specific
  if (url.startsWith("blob:")) return false
  // Filter out obviously invalid URLs
  if (!url.startsWith("http") && !url.startsWith("/")) return false
  return true
}

export function PostImage({ src, alt = "Post image", className = "" }: PostImageProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Don't render if URL is invalid
  if (!isValidImageUrl(src) || hasError) {
    return null
  }
  
  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white/5 animate-pulse" />
      )}
      <img
        src={src}
        alt={alt}
        className={className + (isLoading ? " opacity-0" : " opacity-100") + " transition-opacity"}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setHasError(true)
          setIsLoading(false)
        }}
      />
    </div>
  )
}
