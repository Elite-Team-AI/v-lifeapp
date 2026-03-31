"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Camera, Trophy, Dumbbell, Utensils, Heart, Send, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
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
  const [currentStep, setCurrentStep] = useState(1)
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      // Save current scroll position
      const scrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${scrollY}px`
      document.body.style.width = '100%'
      document.body.style.overflowY = 'scroll' // Prevent layout shift

      return () => {
        // Restore scroll position
        document.body.style.position = ''
        document.body.style.top = ''
        document.body.style.width = ''
        document.body.style.overflowY = ''
        window.scrollTo(0, scrollY)
      }
    }
  }, [isOpen])

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1)
      setTitle("")
      setContent("")
      setSelectedCategory("")
      setSelectedImage(null)
    }
  }, [isOpen])

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
      setCurrentStep(1)
      setTitle("")
      setContent("")
      setSelectedImage(null)
      setSelectedCategory("")
      onClose()
    } catch (error) {
      console.error("Failed to create post:", error)
    } finally {
      setIsPosting(false)
    }
  }

  const canProceedToNextStep = () => {
    switch (currentStep) {
      case 1:
        return selectedCategory !== ""
      case 2:
        return title.trim() !== ""
      case 3:
        return true // Details are optional
      case 4:
        return true // Photo is optional
      default:
        return false
    }
  }

  const handleNext = () => {
    if (canProceedToNextStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, 5))
    }
  }

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }

  const getStepTitle = () => {
    switch (currentStep) {
      case 1:
        return "Choose Category"
      case 2:
        return "What's Your Title?"
      case 3:
        return "Add Details"
      case 4:
        return "Add Photo (Optional)"
      case 5:
        return "Review & Post"
      default:
        return "Create Post"
    }
  }

  const getStepSubtitle = () => {
    switch (currentStep) {
      case 1:
        return "What are you posting about?"
      case 2:
        return "Give your post a title"
      case 3:
        return "Tell us more about your experience"
      case 4:
        return "Add a photo to your post"
      case 5:
        return "Review your post before sharing"
      default:
        return "Share your journey with the community"
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4 pb-28"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="w-full max-w-md max-h-[calc(100vh-8rem)] flex flex-col"
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 500 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="border-accent/30 bg-black/90 backdrop-blur-lg h-full flex flex-col overflow-hidden">
              {/* Fixed Header with Progress */}
              <div className="flex-shrink-0 border-b border-accent/20">
                <div className="flex items-center justify-between p-4 pb-3">
                  <div className="flex items-center">
                    <Avatar className="h-10 w-10 border border-white/10 mr-3">
                      <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
                      <AvatarFallback>{userName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-bold text-white">{getStepTitle()}</h3>
                      <p className="text-xs text-accent">{getStepSubtitle()}</p>
                    </div>
                  </div>
                  <motion.button
                    onClick={onClose}
                    className="rounded-full p-2.5 hover:bg-white/10 min-w-[44px] min-h-[44px] flex items-center justify-center"
                    disabled={isPosting}
                    whileTap={{ scale: 0.9 }}
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 17 }}
                  >
                    <X className="h-5 w-5 text-white/60" />
                  </motion.button>
                </div>

                {/* Progress Bar */}
                <div className="px-4 pb-3">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((step) => (
                      <div
                        key={step}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          step <= currentStep ? "bg-accent" : "bg-white/10"
                        }`}
                      />
                    ))}
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-xs text-white/50">Step {currentStep} of 5</p>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div
                className="flex-1 overflow-y-auto overflow-x-hidden min-h-0"
                style={{
                  WebkitOverflowScrolling: 'touch',
                  overscrollBehavior: 'contain'
                }}
                onTouchMove={(e) => e.stopPropagation()}
                onWheel={(e) => e.stopPropagation()}
              >
                <div className="p-4 space-y-4">
                  <AnimatePresence mode="wait">
                    {/* Step 1: Category Selection */}
                    {currentStep === 1 && (
                      <motion.div
                        key="step1"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-3"
                      >
                        <div className="grid grid-cols-2 gap-3">
                          {postCategories.map((category) => (
                            <motion.div
                              key={category.id}
                              whileTap={{ scale: 0.98 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                              <Card
                                className={`cursor-pointer transition-all hover:border-accent/50 min-h-[100px] ${
                                  selectedCategory === category.id
                                    ? "border-accent border-glow bg-accent/10"
                                    : "border-white/10 bg-black/30"
                                }`}
                                onClick={() => setSelectedCategory(category.id)}
                              >
                                <CardContent className="p-4 text-center flex flex-col items-center justify-center h-full">
                                  <div
                                    className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full ${
                                      selectedCategory === category.id ? "bg-accent/20" : category.bg
                                    }`}
                                  >
                                    <category.icon
                                      className={`h-6 w-6 ${selectedCategory === category.id ? "text-accent" : category.color}`}
                                    />
                                  </div>
                                  <span
                                    className={`text-sm font-medium ${
                                      selectedCategory === category.id ? "text-accent" : "text-white/70"
                                    }`}
                                  >
                                    {category.name}
                                  </span>
                                </CardContent>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Step 2: Title with Templates */}
                    {currentStep === 2 && (
                      <motion.div
                        key="step2"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-4"
                      >
                        {/* Quick Templates */}
                        <div className="space-y-2">
                          <Label className="text-white">Quick Templates</Label>
                          <div className="space-y-2 max-h-[200px] overflow-y-auto">
                            {templates[selectedCategory]?.map((template, index) => (
                              <motion.button
                                key={index}
                                onClick={() => setTitle(template)}
                                className="w-full text-left rounded-lg border border-white/10 bg-black/30 p-3 text-sm text-white/80 transition-all hover:border-accent/50 hover:bg-accent/5 active:border-accent min-h-[44px]"
                                whileTap={{ scale: 0.98 }}
                                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                              >
                                {template}
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* Title Input */}
                        <div className="space-y-2">
                          <Label htmlFor="post-title" className="text-white">
                            Or Write Your Own
                          </Label>
                          <Input
                            id="post-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder={`Share your ${selectedCategoryData?.name.toLowerCase()}...`}
                            className="w-full"
                            maxLength={100}
                            autoFocus
                          />
                          <div className="flex justify-between text-xs text-white/60">
                            <span>Required field</span>
                            <span>{title.length}/100</span>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Step 3: Details */}
                    {currentStep === 3 && (
                      <motion.div
                        key="step3"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2"
                      >
                        <Label htmlFor="post-content" className="text-white">
                          Tell Us More (Optional)
                        </Label>
                        <textarea
                          id="post-content"
                          value={content}
                          onChange={(e) => setContent(e.target.value)}
                          placeholder="Share more details about your experience..."
                          className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
                          maxLength={500}
                          rows={6}
                          autoFocus
                        />
                        <div className="text-right text-xs text-white/60">{content.length}/500</div>
                      </motion.div>
                    )}

                    {/* Step 4: Add Photo */}
                    {currentStep === 4 && (
                      <motion.div
                        key="step4"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2"
                      >
                        <Label className="text-white">Add a Photo (Optional)</Label>
                        {!selectedImage ? (
                          <motion.button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full aspect-[4/3] flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/20 bg-black/30 transition-all hover:border-accent/50 hover:bg-accent/5 active:border-accent"
                            whileTap={{ scale: 0.98 }}
                            transition={{ type: "spring", stiffness: 400, damping: 17 }}
                          >
                            <Camera className="mb-2 h-8 w-8 text-white/50" />
                            <p className="text-sm text-white/70">Tap to add a photo</p>
                            <p className="text-xs text-white/50 mt-1">JPG, PNG up to 10MB</p>
                          </motion.button>
                        ) : (
                          <div className="relative">
                            <div className="aspect-[4/3] w-full rounded-lg overflow-hidden">
                              <img
                                src={selectedImage || "/placeholder.svg"}
                                alt="Selected post image"
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <motion.button
                              onClick={() => setSelectedImage(null)}
                              className="absolute top-2 right-2 rounded-full bg-black/70 p-2 hover:bg-black/90 min-w-[40px] min-h-[40px] flex items-center justify-center"
                              whileTap={{ scale: 0.9 }}
                              whileHover={{ scale: 1.05 }}
                              transition={{ type: "spring", stiffness: 400, damping: 17 }}
                            >
                              <X className="h-4 w-4 text-white" />
                            </motion.button>
                          </div>
                        )}

                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </motion.div>
                    )}

                    {/* Step 5: Preview */}
                    {currentStep === 5 && (
                      <motion.div
                        key="step5"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="space-y-2"
                      >
                        <Label className="text-white">Preview Your Post</Label>
                        <Card className="border-white/10 bg-black/30">
                          <CardContent className="p-4">
                            <div className="flex items-center mb-3">
                              <Avatar className="h-10 w-10 border border-white/10 mr-3">
                                <AvatarImage src={userAvatar || "/placeholder.svg"} alt={userName} />
                                <AvatarFallback className="text-sm">{userName.charAt(0)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <h4 className="text-sm font-medium text-white">{userName}</h4>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs text-white/60">Just now</p>
                                  {selectedCategoryData && (
                                    <>
                                      <span className="text-white/40">•</span>
                                      <div className="flex items-center gap-1">
                                        <selectedCategoryData.icon className={`h-3 w-3 ${selectedCategoryData.color}`} />
                                        <span className={`text-xs ${selectedCategoryData.color}`}>
                                          {selectedCategoryData.name}
                                        </span>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            <h3 className="font-bold text-white text-base mb-2">{title}</h3>
                            {content && <p className="text-sm text-white/80 mb-3 whitespace-pre-wrap">{content}</p>}
                            {selectedImage && (
                              <div className="aspect-[4/3] w-full rounded-lg overflow-hidden mb-3">
                                <img
                                  src={selectedImage || "/placeholder.svg"}
                                  alt="Post preview"
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            )}
                            <div className="flex items-center text-white/40 text-xs pt-2 border-t border-white/10">
                              <Heart className="h-3 w-3 mr-1" />
                              <span className="mr-4">0</span>
                              <span>0 comments</span>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Fixed Footer with Navigation */}
              <div className="border-t border-accent/20 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] flex gap-3 flex-shrink-0 bg-black/90 backdrop-blur-lg">
                {currentStep > 1 && currentStep < 5 ? (
                  <ButtonGlow
                    variant="outline-glow"
                    onClick={handleBack}
                    className="flex-1"
                    disabled={isPosting}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Back
                  </ButtonGlow>
                ) : currentStep === 1 ? (
                  <ButtonGlow variant="outline-glow" onClick={onClose} className="flex-1" disabled={isPosting}>
                    Cancel
                  </ButtonGlow>
                ) : null}

                {currentStep < 5 ? (
                  <ButtonGlow
                    variant="accent-glow"
                    onClick={handleNext}
                    disabled={!canProceedToNextStep()}
                    className="flex-1"
                  >
                    {currentStep === 4 ? "Review" : "Next"}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </ButtonGlow>
                ) : (
                  <>
                    <ButtonGlow variant="outline-glow" onClick={handleBack} className="flex-1" disabled={isPosting}>
                      Back
                    </ButtonGlow>
                    <ButtonGlow
                      variant="accent-glow"
                      onClick={handlePost}
                      disabled={!title.trim()}
                      isLoading={isPosting}
                      loadingText="Posting..."
                      className="flex-1"
                    >
                      <Send className="mr-2 h-4 w-4" />
                      Post
                    </ButtonGlow>
                  </>
                )}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
