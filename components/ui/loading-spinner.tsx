"use client"

import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl"
  className?: string
  variant?: "default" | "accent" | "white"
}

const sizeClasses = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-12 w-12",
}

const variantClasses = {
  default: "text-white/60",
  accent: "text-accent",
  white: "text-white",
}

export function LoadingSpinner({ size = "md", className, variant = "default" }: LoadingSpinnerProps) {
  return (
    <motion.div
      className={cn("inline-flex items-center justify-center", className)}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Loader2 className={cn(sizeClasses[size], variantClasses[variant], "animate-spin")} />
    </motion.div>
  )
}

interface LoadingDotsProps {
  className?: string
  variant?: "default" | "accent"
}

export function LoadingDots({ className, variant = "default" }: LoadingDotsProps) {
  const dotColor = variant === "accent" ? "bg-accent" : "bg-white/60"

  return (
    <div className={cn("flex items-center justify-center gap-1", className)}>
      {[0, 1, 2].map((index) => (
        <motion.div
          key={index}
          className={cn("h-2 w-2 rounded-full", dotColor)}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 1,
            repeat: Infinity,
            delay: index * 0.2,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  )
}

interface LoadingPulseProps {
  className?: string
  variant?: "default" | "accent"
}

export function LoadingPulse({ className, variant = "default" }: LoadingPulseProps) {
  const ringColor = variant === "accent" ? "border-accent" : "border-white/40"

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <motion.div
        className={cn("absolute h-12 w-12 rounded-full border-2", ringColor)}
        animate={{
          scale: [1, 1.5, 1],
          opacity: [1, 0, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <motion.div
        className={cn("h-8 w-8 rounded-full border-2", ringColor)}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.7, 1, 0.7],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
      />
    </div>
  )
}
