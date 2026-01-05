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
    <div className="min-h-screen bg-gradient-to-b from-black to-charcoal pb-nav-safe">
      <div className="container max-w-md px-4 py-6">
        <div className="mb-6 flex items-center">
          <button onClick={() => router.back()} className="mr-4 rounded-full p-2 hover:bg-white/10">
            <ArrowLeft className="h-6 w-6 text-white" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">Grocery List</h1>
            <p className="text-white/70">Based on your meal plan</p>
          </div>
          <ShoppingCart className="h-6 w-6 text-accent" />
        </div>

        {/* Sync Button */}
        <motion.div
          className="mb-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Sync Range Selector */}
          <div className="mb-3 flex gap-2 rounded-lg bg-white/5 p-1">
            <button
              onClick={() => setSyncRange("today")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                syncRange === "today"
                  ? "bg-accent text-black"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Today Only
            </button>
            <button
              onClick={() => setSyncRange("week")}
              className={`flex-1 rounded-md py-2 text-sm font-medium transition-all ${
                syncRange === "week"
                  ? "bg-accent text-black"
                  : "text-white/70 hover:text-white"
              }`}
            >
              7-Day Forecast
            </button>
          </div>

          <ButtonGlow
            variant="accent-glow"
            className="w-full"
            onClick={handleSyncWithMeals}
            disabled={isSyncing}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Syncing with meals..." : "Sync with Meal Plan"}
          </ButtonGlow>
          <p className="mt-2 text-center text-xs text-white/50">
            {syncRange === "today" 
              ? "Pulls ingredients from today's meals only" 
              : "Pulls ingredients from today & tomorrow's meals + AI 7-day forecast"}
          </p>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <Card className="border-white/10 bg-black/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white">Shopping Progress</h2>
                <span className="text-accent font-bold">{Math.round(progress)}%</span>
              </div>
              <div className="mb-2 h-2 w-full rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-accent transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-sm text-white/70">
                {completedItems} of {totalItems} items completed
              </p>
              {/* Source breakdown */}
              {totalItems > 0 && (
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  {mealItems > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-green-500/20 px-2 py-1 text-green-400">
                      <Utensils className="h-3 w-3" />
                      {mealItems} from meals
                    </span>
                  )}
                  {forecastItems > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-blue-500/20 px-2 py-1 text-blue-400">
                      <Calendar className="h-3 w-3" />
                      {forecastItems} forecast
                    </span>
                  )}
                  {manualItems > 0 && (
                    <span className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-white/60">
                      <User className="h-3 w-3" />
                      {manualItems} custom
                    </span>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <Card className="border-white/10 bg-black/50 backdrop-blur-sm">
            <CardContent className="p-4">
              <h3 className="mb-3 font-bold text-white">Add Custom Item</h3>
              <div className="mb-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mb-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
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
                  className="flex-1"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddItem()
                    }
                  }}
                />
                <ButtonGlow
                  variant="accent-glow"
                  size="icon"
                  onClick={handleAddItem}
                  disabled={!newItem.trim() || isSaving}
                >
                  <Plus className="h-4 w-4" />
                </ButtonGlow>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          {categories.map((category) => {
            const categoryItems = getItemsByCategory(category)
            if (categoryItems.length === 0) return null

            return (
              <Card key={category} className="border-white/10 bg-black/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  <h3 className="mb-3 text-lg font-bold text-accent">{category}</h3>
                  <div className="space-y-2">
                    {categoryItems.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center justify-between rounded-lg p-3 transition-all ${
                          item.checked ? "bg-accent/10" : "bg-black/30"
                        }`}
                      >
                        <div className="flex items-center">
                          <button
                            onClick={() => handleToggle(item)}
                            className={`mr-3 flex h-6 w-6 items-center justify-center rounded-full border ${
                              item.checked
                                ? "border-accent bg-accent text-black"
                                : "border-white/30 text-white/60"
                            }`}
                          >
                            {item.checked && <Check className="h-4 w-4" />}
                          </button>
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
                        <button onClick={() => handleRemoveItem(item.id)} className="text-white/50 hover:text-white">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </motion.div>

        {totalItems === 0 && (
          <motion.div
            className="mt-8 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <ShoppingCart className="mx-auto mb-4 h-16 w-16 text-white/20" />
            <p className="text-lg font-medium text-white/60">Your grocery list is empty</p>
            <p className="mt-2 text-sm text-white/40">
              Click "Sync with Meal Plan" to auto-generate your shopping list based on your meals
            </p>
          </motion.div>
        )}

        {completedItems > 0 && (
          <ButtonGlow
            variant="outline-glow"
            className="mt-6 w-full"
            onClick={handleClearCompleted}
          >
            Clear Purchased Items ({completedItems})
          </ButtonGlow>
        )}
      </div>

      <BottomNav />
    </div>
  )
}
