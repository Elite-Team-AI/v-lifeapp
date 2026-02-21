"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { ArrowLeft, Check, Plus, Trash2, ShoppingCart, RefreshCw, Utensils, Calendar, User } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { BottomNav } from "@/components/bottom-nav"
import { useToast } from "@/hooks/use-toast"

interface GroceryItem {
  id: string
  item_name: string
  category: string | null
  quantity: string | null
  checked: boolean
  source?: "manual" | "meal" | "forecast"
}

interface GroceryListClientProps {
  items: GroceryItem[]
}

const categories = [
  "Proteins",
  "Carbohydrates",
  "Vegetables",
  "Fruits",
  "Dairy",
  "Healthy Fats",
  "Pantry Items",
  "Spices & Seasonings",
]

export function GroceryListClient({ items }: GroceryListClientProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [groceryItems, setGroceryItems] = useState(items)
  const [newItem, setNewItem] = useState("")
  const [selectedCategory, setSelectedCategory] = useState(categories[0])
  const [isSaving, setIsSaving] = useState(false)
  const [isSyncing, startSyncTransition] = useTransition()
  const [syncRange, setSyncRange] = useState<"today" | "week">("week")

  const completedItems = groceryItems.filter((item) => item.checked).length
  const totalItems = groceryItems.length
  const progress = totalItems > 0 ? (completedItems / totalItems) * 100 : 0

  // Count items by source
  const mealItems = groceryItems.filter((i) => i.source === "meal").length
  const forecastItems = groceryItems.filter((i) => i.source === "forecast").length
  const manualItems = groceryItems.filter((i) => i.source === "manual" || !i.source).length

  const getItemsByCategory = (category: string) => {
    return groceryItems.filter((item) => item.category === category)
  }

  const handleToggle = async (item: GroceryItem) => {
    setGroceryItems((prev) =>
      prev.map((entry) => (entry.id === item.id ? { ...entry, checked: !entry.checked } : entry)),
    )
    const { toggleGroceryItem } = await import("@/lib/actions/grocery")
    const result = await toggleGroceryItem(item.id, !item.checked)
    if (!result.success) {
      toast({
        title: "Unable to update item",
        description: result.error || "Please try again.",
        variant: "destructive",
      })
      setGroceryItems((prev) =>
        prev.map((entry) => (entry.id === item.id ? { ...entry, checked: item.checked } : entry)),
      )
    } else {
      router.refresh()
    }
  }

  const handleAddItem = async () => {
    if (!newItem.trim()) return
    setIsSaving(true)
    const { addGroceryItem } = await import("@/lib/actions/grocery")
    const result = await addGroceryItem(newItem.trim(), selectedCategory)
    setIsSaving(false)
    if (!result.success) {
      toast({
        title: "Unable to add item",
        description: result.error || "Please try again.",
        variant: "destructive",
      })
      return
    }
    setNewItem("")
    router.refresh()
  }

  const handleRemoveItem = async (itemId: string) => {
    const { removeGroceryItem } = await import("@/lib/actions/grocery")
    const result = await removeGroceryItem(itemId)
    if (!result.success) {
      toast({
        title: "Unable to remove item",
        description: result.error || "Please try again.",
        variant: "destructive",
      })
      return
    }
    router.refresh()
  }

  const handleClearCompleted = async () => {
    const { clearCompletedItems } = await import("@/lib/actions/grocery")
    const result = await clearCompletedItems()
    if (!result.success) {
      toast({
        title: "Unable to clear items",
        description: result.error || "Please try again.",
        variant: "destructive",
      })
      return
    }
    router.refresh()
  }

  const handleSyncWithMeals = async () => {
    startSyncTransition(async () => {
      const { syncGroceryListWithMeals } = await import("@/lib/actions/grocery")
      const result = await syncGroceryListWithMeals(syncRange)
      if (result.success) {
        toast({
          title: "Grocery list synced!",
          description: `Added ${result.itemCount || 0} items from your ${syncRange === "today" ? "meals today" : "meal plan and 7-day forecast"}.`,
        })
        router.refresh()
      } else {
        toast({
          title: "Sync failed",
          description: result.error || "Please try again.",
          variant: "destructive",
        })
      }
    })
  }

  const getSourceIcon = (source?: string) => {
    switch (source) {
      case "meal":
        return <Utensils className="h-3 w-3" />
      case "forecast":
        return <Calendar className="h-3 w-3" />
      default:
        return <User className="h-3 w-3" />
    }
  }

  const getSourceLabel = (source?: string) => {
    switch (source) {
      case "meal":
        return "From meals"
      case "forecast":
        return "7-day forecast"
      default:
        return "Custom"
    }
  }

  return (
    <div className="min-h-screen bg-black pb-nav-safe overflow-hidden">
      {/* Animated gradient background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent/30 rounded-full blur-[128px] animate-blob" />
        <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-[128px] animate-blob animation-delay-2000" />
        <div className="absolute bottom-1/4 left-1/2 w-96 h-96 bg-blue-500/20 rounded-full blur-[128px] animate-blob animation-delay-4000" />
      </div>

      {/* Grid pattern overlay */}
      <div className="fixed inset-0 bg-[url('/grid.svg')] opacity-[0.02]" />

      <div className="relative z-10 container max-w-md px-4 py-6">
        <motion.div
          className="mb-6 flex items-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <ButtonGlow
            variant="outline-glow"
            size="icon"
            onClick={() => router.back()}
            className="mr-3 h-10 w-10 backdrop-blur-xl"
          >
            <ArrowLeft className="h-5 w-5" />
          </ButtonGlow>
          <div className="flex-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-accent via-yellow-300 to-accent bg-clip-text text-transparent animate-gradient-shift bg-[length:200%_auto]">
              Grocery List
            </h1>
            <p className="text-white/70">Based on your meal plan</p>
          </div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
          >
            <ShoppingCart className="h-6 w-6 text-accent drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]" />
          </motion.div>
        </motion.div>

        {/* Sync Button */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          {/* Sync Range Selector */}
          <div className="mb-3 flex gap-2 rounded-lg backdrop-blur-xl bg-white/5 border border-white/10 p-1">
            <motion.button
              onClick={() => setSyncRange("today")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                syncRange === "today"
                  ? "bg-accent text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Today Only
            </motion.button>
            <motion.button
              onClick={() => setSyncRange("week")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                syncRange === "week"
                  ? "bg-accent text-black shadow-[0_0_15px_rgba(255,215,0,0.3)]"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              7-Day Forecast
            </motion.button>
          </div>

          <motion.div
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-accent to-yellow-300 rounded-xl blur-lg opacity-50 group-hover:opacity-75 transition-opacity duration-300" />
              <ButtonGlow
                variant="accent-glow"
                className="w-full relative"
                onClick={handleSyncWithMeals}
                disabled={isSyncing}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
                {isSyncing ? "Syncing with meals..." : "Sync with Meal Plan"}
              </ButtonGlow>
            </div>
          </motion.div>
          <motion.p
            className="mt-2 text-center text-xs text-white/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {syncRange === "today"
              ? "Pulls ingredients from today's meals only"
              : "Pulls ingredients from today & tomorrow's meals + AI 7-day forecast"}
          </motion.p>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_20px_rgba(255,215,0,0.1)]">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Shopping Progress</h2>
                <motion.span
                  className="text-accent font-bold text-lg drop-shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                >
                  {Math.round(progress)}%
                </motion.span>
              </div>
              <div className="mb-2 h-2 w-full rounded-full backdrop-blur-xl bg-white/10 border border-white/10 overflow-hidden">
                <motion.div
                  className="h-2 rounded-full bg-gradient-to-r from-accent to-yellow-300 shadow-[0_0_10px_rgba(255,215,0,0.5)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
                />
              </div>
              <p className="text-sm text-white/70">
                {completedItems} of {totalItems} items completed
              </p>
              {/* Source breakdown */}
              {totalItems > 0 && (
                <motion.div
                  className="mt-3 flex flex-wrap gap-2 text-xs"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  {mealItems > 0 && (
                    <motion.span
                      className="flex items-center gap-1 rounded-full backdrop-blur-xl bg-green-500/20 border border-green-500/30 px-2 py-1 text-green-400"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.7 }}
                    >
                      <Utensils className="h-3 w-3" />
                      {mealItems} from meals
                    </motion.span>
                  )}
                  {forecastItems > 0 && (
                    <motion.span
                      className="flex items-center gap-1 rounded-full backdrop-blur-xl bg-blue-500/20 border border-blue-500/30 px-2 py-1 text-blue-400"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.75 }}
                    >
                      <Calendar className="h-3 w-3" />
                      {forecastItems} forecast
                    </motion.span>
                  )}
                  {manualItems > 0 && (
                    <motion.span
                      className="flex items-center gap-1 rounded-full backdrop-blur-xl bg-white/10 border border-white/20 px-2 py-1 text-white/60"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.8 }}
                    >
                      <User className="h-3 w-3" />
                      {manualItems} custom
                    </motion.span>
                  )}
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          whileHover={{ scale: 1.02, y: -2 }}
        >
          <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_20px_rgba(255,215,0,0.1)]">
            <CardContent className="p-4">
              <h3 className="mb-3 font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">Add Custom Item</h3>
              <div className="mb-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mb-2 w-full rounded-md border border-white/10 backdrop-blur-xl bg-white/5 px-3 py-2 text-sm text-white focus:border-accent/50 focus:bg-white/10 transition-all duration-300"
                >
                  {categories.map((category) => (
                    <option key={category} value={category} className="bg-black text-white">
                      {category}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Input
                  value={newItem}
                  onChange={(e) => setNewItem(e.target.value)}
                  placeholder="Enter item name..."
                  className="flex-1 backdrop-blur-xl bg-white/5 border-white/10 focus:border-accent/50 focus:bg-white/10 transition-all duration-300"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddItem()
                    }
                  }}
                />
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <ButtonGlow
                    variant="accent-glow"
                    size="icon"
                    onClick={handleAddItem}
                    disabled={!newItem.trim() || isSaving}
                  >
                    <Plus className="h-4 w-4" />
                  </ButtonGlow>
                </motion.div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {categories.map((category, categoryIndex) => {
            const categoryItems = getItemsByCategory(category)
            if (categoryItems.length === 0) return null

            return (
              <motion.div
                key={category}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + categoryIndex * 0.05 }}
                whileHover={{ scale: 1.02, y: -2 }}
              >
                <Card className="border-white/10 backdrop-blur-xl bg-white/5 shadow-[0_0_20px_rgba(255,215,0,0.1)]">
                  <CardContent className="p-4">
                    <h3 className="mb-3 text-lg font-bold bg-gradient-to-r from-accent to-yellow-300 bg-clip-text text-transparent">
                      {category}
                    </h3>
                    <div className="space-y-2">
                      {categoryItems.map((item, itemIndex) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.55 + categoryIndex * 0.05 + itemIndex * 0.03 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          whileTap={{ scale: 0.98 }}
                          className={`flex items-center justify-between rounded-lg backdrop-blur-xl border p-3 transition-all ${
                            item.checked
                              ? "border-accent/30 bg-accent/10 shadow-[0_0_10px_rgba(255,215,0,0.15)]"
                              : "border-white/10 bg-black/30 hover:bg-white/5 hover:border-accent/20"
                          }`}
                        >
                          <div className="flex items-center">
                            <motion.button
                              onClick={() => handleToggle(item)}
                              className={`mr-3 flex h-6 w-6 items-center justify-center rounded-full border transition-all ${
                                item.checked
                                  ? "border-accent bg-accent text-black shadow-[0_0_10px_rgba(255,215,0,0.3)]"
                                  : "border-white/30 text-white/60 hover:border-accent/50"
                              }`}
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                            >
                              {item.checked && <Check className="h-4 w-4" />}
                            </motion.button>
                            <div>
                              <p className={`font-medium ${item.checked ? "text-accent line-through" : "text-white"}`}>
                                {item.item_name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-white/60">
                                <span>{item.quantity || "As needed"}</span>
                                <span className="flex items-center gap-1 opacity-60">
                                  {getSourceIcon(item.source)}
                                  {getSourceLabel(item.source)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <motion.button
                            onClick={() => handleRemoveItem(item.id)}
                            className="text-white/50 hover:text-white transition-colors"
                            whileHover={{ scale: 1.2, rotate: 15 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </motion.button>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </motion.div>

        {totalItems === 0 && (
          <motion.div
            className="mt-8 text-center backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-8"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
            >
              <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-white/20 drop-shadow-[0_0_10px_rgba(255,215,0,0.2)]" />
            </motion.div>
            <motion.p
              className="text-lg font-medium text-white/60"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              Your grocery list is empty
            </motion.p>
            <motion.p
              className="mt-2 text-sm text-white/40"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
            >
              Click "Sync with Meal Plan" to auto-generate your shopping list based on your meals
            </motion.p>
          </motion.div>
        )}

        {completedItems > 0 && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-xl blur-lg opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
              <ButtonGlow
                variant="outline-glow"
                className="w-full relative backdrop-blur-xl"
                onClick={handleClearCompleted}
              >
                Clear Purchased Items ({completedItems})
              </ButtonGlow>
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
