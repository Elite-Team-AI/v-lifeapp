"use client"

import type React from "react"

import { useState, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Camera, Trophy, Dumbbell, Utensils, Heart, Send, Loader2 } from "lucide-react"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/hooks/use-toast"

interface CreatePostModalProps {
  isOpen: boolean
  onClose: () => void
  onCreatePost: (post: {
    title: string
    content: string
    image?: string
    category: string
  }) => void
  userName: string
  userAvatar?: string
}

const postCategories = [
  { id: "achievement", name: "Achievement", icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-400/10" },
  { id: "workout", name: "Workout", icon: Dumbbell, color: "text-red-400", bg: "bg-red-400/10" },
  { id: "nutrition", name: "Nutrition", icon: Utensils, color: "text-green-400", bg: "bg-green-400/10" },
  { id: "motivation", name: "Motivation", icon: Heart, color: "text-pink-400", bg: "bg-pink-400/10" },
]

const achievementTemplates = [
  "Hit a new PR today! 💪",
  "Completed my first 5K run! 🏃‍♂️",
  "Lost 10 pounds this month! 🎉",
  "30-day workout streak achieved! 🔥",
  "Deadlifted my bodyweight! 💪",
]

const workoutTemplates = [
  "Morning workout completed ✅",
  "Leg day was brutal but worth it! 🦵",
  "New workout routine is challenging! 💪",
  "Post-workout endorphins hitting! 😊",
  "Cardio session done! 🏃‍♂️",
]

const nutritionTemplates = [
  "Meal prep Sunday complete! 🥗",
  "Trying a new healthy recipe today! 👨‍🍳",
  "Hit my protein goal for the day! 🥩",
  "Staying hydrated with 8 glasses! 💧",
  "Healthy breakfast to start the day! 🍳",
]

const motivationTemplates = [
  "Remember: Progress, not perfection! ✨",
  "Every workout counts, no matter how small! 💪",
  "Consistency beats perfection every time! 🎯",
  "Your only competition is yesterday's you! 🚀",
  "Small steps lead to big changes! 👣",
]

export function CreatePostModal({ isOpen, onClose, onCreatePost, userName, userAvatar }: CreatePostModalProps) {
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("achievement")
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const templates: Record<string, string[]> = {
    achievement: achievementTemplates,
    workout: workoutTemplates,
    nutrition: nutritionTemplates,
    motivation: motivationTemplates,
  }

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0]
      if (file) {
        const imageUrl = URL.createObjectURL(file)
        setSelectedImage(imageUrl)
      }
    } catch (error) {
      console.error("[CreatePost] Image select error:", error)
      toast({
        title: "Unable to select image",
        description: "Please try again or choose a different image.",
        variant: "destructive",
      })
    }
  }

  const selectedCategoryData = postCategories.find((cat) => cat.id === selectedCategory)

  const useTemplate = (template: string) => {
    setTitle(template)
  }

  const handlePost = async () => {
    if (!title.trim()) return

    setIsPosting(true)

    try {
      // Simulate posting delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      onCreatePost({
        title: title.trim(),
        content: content.trim(),
        image: selectedImage || undefined,
        category: selectedCategory,
      })

      // Reset form
      setTitle("")
      setContent("")
      setSelectedImage(null)
      setSelectedCategory("achievement")
      onClose()
    } catch (error) {
      console.error("Failed to create post:", error)
    } finally {
      setIsPosting(false)
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
            className="w-full max-w-md h-[90vh] flex flex-col"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-accent/30 bg-black/90 backdrop-blur-lg h-full flex flex-col">
              {/* Fixed Header */}
              <div className="flex items-center justify-between border-b border-accent/20 p-4 flex-shrink-0">
                <div className="flex items-center">
                  <Avatar className="h-10 w-10 border border-white/10 mr-3">
                    <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
                    <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-white">Create Post</h3>
                    <p className="text-xs text-accent">Share your journey with the community</p>
                  </div>
                </div>
                <button onClick={onClose} className="rounded-full p-1 hover:bg-white/10" disabled={isPosting}>
                  <X className="h-5 w-5 text-white/60" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="p-4 space-y-4">
                  {/* Category Selection */}
                  <div className="space-y-2">
                    <Label className="text-white">Category</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {postCategories.map((category) => (
                        <Card
                          key={category.id}
                          className={`cursor-pointer transition-all hover:border-accent/50 ${
                            selectedCategory === category.id
                              ? "border-accent border-glow bg-accent/10"
                              : "border-white/10 bg-black/30"
                          }`}
                          onClick={() => setSelectedCategory(category.id)}
                        >
                          <CardContent className="p-3 text-center">
                            <div
                              className={`mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full ${
                                selectedCategory === category.id ? "bg-accent/20" : category.bg
                              }`}
                            >
                              <category.icon
                                className={`h-4 w-4 ${selectedCategory === category.id ? "text-accent" : category.color}`}
                              />
                            </div>
                            <span
                              className={`text-xs font-medium ${
                                selectedCategory === category.id ? "text-accent" : "text-white/70"
                              }`}
                            >
                              {category.name}
                            </span>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  {/* Quick Templates */}
                  <div className="space-y-2">
                    <Label className="text-white">Quick Templates</Label>
                    <div className="space-y-2 max-h-24 overflow-y-auto">
                      {templates[selectedCategory].map((template, index) => (
                        <button
                          key={index}
                          onClick={() => setTitle(template)}
                          className="w-full text-left rounded-lg border border-white/10 bg-black/30 p-2 text-sm text-white/80 transition-all hover:border-accent/50 hover:bg-accent/5"
                        >
                          {template}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title Input */}
                  <div className="space-y-2">
                    <Label htmlFor="post-title" className="text-white">
                      Title *
                    </Label>
                    <Input
                      id="post-title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={`Share your ${selectedCategoryData?.name.toLowerCase()}...`}
                      className="w-full"
                      maxLength={100}
                    />
                    <div className="flex justify-between text-xs text-white/60">
                      <span>Required field</span>
                      <span>{title.length}/100</span>
                    </div>
                  </div>

                  {/* Content Input */}
                  <div className="space-y-2">
                    <Label htmlFor="post-content" className="text-white">
                      Details (Optional)
                    </Label>
                    <textarea
                      id="post-content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder="Tell us more about your experience..."
                      className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                      maxLength={500}
                      rows={3}
                    />
                    <div className="text-right text-xs text-white/60">{content.length}/500</div>
                  </div>

                  {/* Image Upload */}
                  <div className="space-y-2">
                    <Label className="text-white">Add Photo (Optional)</Label>
                    {!selectedImage ? (
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-[4/3] flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-black/30 transition-all hover:border-accent/50 hover:bg-accent/5"
                      >
                        <Camera className="mb-2 h-6 w-6 text-white/50" />
                        <p className="text-sm text-white/70">Tap to add a photo</p>
                        <p className="text-xs text-white/50 mt-1">JPG, PNG up to 10MB</p>
                      </button>
                    ) : (
                      <div className="relative">
                        <div className="aspect-[4/3] w-full rounded-lg overflow-hidden">
                          <img
                            src={selectedImage || "/placeholder.svg"}
                            alt="Selected post image"
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <button
                          onClick={() => setSelectedImage(null)}
                          className="absolute top-2 right-2 rounded-full bg-black/70 p-2 hover:bg-black/90"
                        >
                          <X className="h-4 w-4 text-white" />
                        </button>
                      </div>
                    )}

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                  </div>

                  {/* Preview */}
                  {title && (
                    <div className="space-y-2">
                      <Label className="text-white">Preview</Label>
                      <Card className="border-white/10 bg-black/30">
                        <CardContent className="p-3">
                          <div className="flex items-center mb-2">
                            <Avatar className="h-8 w-8 border border-white/10 mr-2">
                              <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
                              <AvatarFallback className="text-xs">{userName.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <h4 className="text-sm font-medium text-white">{userName}</h4>
                              <p className="text-xs text-white/60">Just now</p>
                            </div>
                          </div>
                          <h3 className="font-bold text-white text-sm mb-1">{title}</h3>
                          {content && <p className="text-sm text-white/80 mb-2">{content}</p>}
                          {selectedImage && (
                            <div className="aspect-[4/3] w-full rounded overflow-hidden mb-2">
                              <img
                                src={selectedImage || "/placeholder.svg"}
                                alt="Post preview"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex items-center text-white/40 text-xs">
                            <Heart className="h-3 w-3 mr-1" />
                            <span className="mr-4">0</span>
                            <span>0 comments</span>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Bottom padding for safe scrolling */}
                  <div className="h-4"></div>
                </div>
              </div>

              {/* Fixed Footer */}
              <div className="border-t border-accent/20 p-4 flex gap-3 flex-shrink-0 bg-black/90">
                <ButtonGlow variant="outline-glow" onClick={onClose} className="flex-1" disabled={isPosting}>
                  Cancel
                </ButtonGlow>
                <ButtonGlow
                  variant="accent-glow"
                  onClick={handlePost}
                  disabled={!title.trim() || isPosting}
                  className="flex-1"
                >
                  {isPosting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Post
                    </>
                  )}
                </ButtonGlow>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
