"use client"

import { motion, AnimatePresence } from "framer-motion"
import { LoadingPulse } from "./loading-spinner"
import { cn } from "@/lib/utils"

interface LoadingOverlayProps {
  isLoading: boolean
  message?: string
  fullScreen?: boolean
  className?: string
}

export function LoadingOverlay({ isLoading, message, fullScreen = true, className }: LoadingOverlayProps) {
  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          className={cn(
            "z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-md",
            fullScreen ? "fixed inset-0" : "absolute inset-0",
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="flex flex-col items-center gap-6"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ delay: 0.1, duration: 0.3 }}
          >
            {/* Animated Logo or Loading Indicator */}
            <div className="relative">
              <LoadingPulse variant="accent" />
              <motion.div
                className="absolute inset-0 -z-10 h-full w-full rounded-full bg-accent/20 blur-2xl"
                animate={{
                  scale: [1, 1.2, 1],
                  opacity: [0.5, 0.8, 0.5],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
            </div>

            {/* Loading Message */}
            {message && (
              <motion.p
                className="text-center text-sm text-white/80 font-medium tracking-wide"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                {message}
              </motion.p>
            )}

            {/* Loading Dots */}
            <motion.div
              className="flex gap-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {[0, 1, 2].map((index) => (
                <motion.div
                  key={index}
                  className="h-2 w-2 rounded-full bg-accent"
                  animate={{
                    scale: [1, 1.5, 1],
                    opacity: [0.5, 1, 0.5],
                  }}
                  transition={{
                    duration: 1.5,
                    repeat: Infinity,
                    delay: index * 0.2,
                    ease: "easeInOut",
                  }}
                />
              ))}
            </motion.div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

interface SkeletonOverlayProps {
  isVisible: boolean
  className?: string
}

export function SkeletonOverlay({ isVisible, className }: SkeletonOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={cn(
            "absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm",
            className
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-accent/30 border-t-accent animate-spin" />
            <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-accent/20 animate-ping" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
