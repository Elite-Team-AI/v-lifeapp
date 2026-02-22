"use client"

import { motion, AnimatePresence } from "framer-motion"
import { X, Pill } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card } from "@/components/ui/card"

interface VitalFlowSupplementModalProps {
  isOpen: boolean
  onClose: () => void
  purchaseUrl?: string
}

export function VitalFlowSupplementModal({ isOpen, onClose, purchaseUrl }: VitalFlowSupplementModalProps) {
  const handlePurchase = () => {
    if (purchaseUrl) {
      window.open(purchaseUrl, "_blank", "noopener,noreferrer")
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 pb-modal-safe"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-accent/30 bg-black/90 backdrop-blur-lg flex flex-col max-h-[75vh]">
              <div className="flex items-center justify-between border-b border-accent/20 p-4 flex-shrink-0">
                <div className="flex items-center">
                  <Pill className="mr-3 h-6 w-6 text-accent" />
                  <div>
                    <h3 className="font-bold text-white">VitalFlow</h3>
                    <p className="text-xs text-accent">Natural Testosterone Support</p>
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  className="rounded-full p-2 hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  whileTap={{ scale: 0.9 }}
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 400, damping: 17 }}
                >
                  <X className="h-5 w-5 text-white/60" />
                </motion.button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Description */}
                <div className="space-y-2">
                  <p className="text-sm text-white/90 leading-relaxed">
                    <span className="text-accent font-semibold">World&apos;s First TRT Dissolvable</span> - VitalFlow is a natural testosterone support drink mix. 
                    Just mix one lemonade-flavored packet with water daily to unleash your power.
                  </p>
                  <p className="text-xs text-white/60">
                    30 servings per container • $89.99 one-time or $69.99/month subscription
                  </p>
                </div>

                {/* Key Benefits */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white">6 Key Benefits</h4>
                  <ul className="space-y-2 text-sm text-white/80">
                    <li className="flex items-start">
                      <span className="text-accent mr-2">✓</span>
                      <span><strong>Improve Sex Life</strong> - Better libido and performance</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-accent mr-2">✓</span>
                      <span><strong>Boost Your Mood</strong> - Feel confident and positive</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-accent mr-2">✓</span>
                      <span><strong>Increase Energy</strong> - Wake up refreshed, stay energized</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-accent mr-2">✓</span>
                      <span><strong>Boost Focus</strong> - Enhanced clarity and decision-making</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-accent mr-2">✓</span>
                      <span><strong>Recover Faster</strong> - Support muscle growth and recovery</span>
                    </li>
                    <li className="flex items-start">
                      <span className="text-accent mr-2">✓</span>
                      <span><strong>Vitality Benefits</strong> - Feel in your prime again</span>
                    </li>
                  </ul>
                </div>

                {/* Supplement Facts */}
                <div className="space-y-2">
                  <h4 className="text-sm font-semibold text-white">Supplement Facts (per packet)</h4>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-white/70 bg-white/5 rounded-lg p-3">
                    <span>Vitamin A (Palmitate)</span><span className="text-right">25mcg (1500 IU)</span>
                    <span>Vitamin C (Ascorbic Acid)</span><span className="text-right">100mg</span>
                    <span>Vitamin D3 (Cholecalciferol)</span><span className="text-right">125mcg (5000 IU)</span>
                    <span>Vitamin E (D-Alpha Tocopherol)</span><span className="text-right">5mcg (200 IU)</span>
                    <span>Magnesium (Mg Oxide)</span><span className="text-right">150mg</span>
                    <span>Zinc (Zinc Citrate)</span><span className="text-right">6mg</span>
                    <span className="font-medium text-white/90">L-Arginine HCl</span><span className="text-right font-medium text-white/90">1500mg</span>
                    <span className="font-medium text-white/90">D-Aspartic Acid</span><span className="text-right font-medium text-white/90">750mg</span>
                    <span className="font-medium text-white/90">Ashwagandha Extract</span><span className="text-right font-medium text-white/90">150mg</span>
                    <span>Grape Seed Extract</span><span className="text-right">100mg</span>
                    <span>Boron Citrate (3mg Boron)</span><span className="text-right">40mg</span>
                    <span>DHQ</span><span className="text-right">25mg</span>
                  </div>
                  <p className="text-[10px] text-white/50">
                    Other ingredients: Citric Acid, Natural Flavoring, Silicone Dioxide, Malic Acid, Stevia
                  </p>
                </div>

                {/* Suggested Use */}
                <div className="space-y-1">
                  <h4 className="text-sm font-semibold text-white">Suggested Use</h4>
                  <p className="text-xs text-white/70">
                    Take one serving daily. Mix with water for a refreshing lemon drink!
                  </p>
                </div>
              </div>

              <div className="border-t border-accent/20 p-4 flex-shrink-0">
                <ButtonGlow 
                  variant="accent-glow" 
                  className="w-full" 
                  onClick={handlePurchase}
                  disabled={!purchaseUrl}
                >
                  {purchaseUrl ? "Shop Now" : "Purchases coming soon!"}
                </ButtonGlow>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

