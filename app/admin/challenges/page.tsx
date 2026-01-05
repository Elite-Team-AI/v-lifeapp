"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ButtonGlow } from "@/components/ui/button-glow"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog"
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Users, 
  Calendar,
  Target,
  AlertTriangle
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Challenge {
  id: string
  title: string
  description: string | null
  challenge_type: string | null
  target_value: number | null
  duration_days: number | null
  start_date: string | null
  end_date: string | null
  participants_count: number
  created_at: string
}

interface ChallengeFormData {
  title: string
  description: string
  challenge_type: string
  target_value: number
  duration_days: number
  start_date: string
  end_date: string
}

const CHALLENGE_TYPES = [
  { value: "workout", label: "Workout" },
  { value: "nutrition", label: "Nutrition" },
  { value: "habit", label: "Habit" },
  { value: "steps", label: "Steps" },
]

const initialFormData: ChallengeFormData = {
  title: "",
  description: "",
  challenge_type: "workout",
  target_value: 10,
  duration_days: 30,
  start_date: new Date().toISOString().split("T")[0],
  end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
}

export default function AdminChallenges() {
  const { toast } = useToast()
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [isDeleteOpen, setIsDeleteOpen] = useState(false)
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null)
  const [formData, setFormData] = useState<ChallengeFormData>(initialFormData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    loadChallenges()
  }, [])

  const loadChallenges = async () => {
    setIsLoading(true)
    try {
      const { getAdminChallenges } = await import("@/lib/actions/admin")
      const result = await getAdminChallenges()
      if (result.challenges) {
        setChallenges(result.challenges)
      }
    } catch (error) {
      console.error("Error loading challenges:", error)
      toast({
        title: "Error",
        description: "Failed to load challenges",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = async () => {
    setIsSubmitting(true)
    try {
      const { createChallenge } = await import("@/lib/actions/admin")
      const result = await createChallenge(formData)
      
      if (result.success) {
        toast({
          title: "Challenge Created",
          description: `"${formData.title}" has been created successfully.`,
        })
        setIsCreateOpen(false)
        setFormData(initialFormData)
        await loadChallenges()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to create challenge",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error creating challenge:", error)
      toast({
        title: "Error",
        description: "Failed to create challenge",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEdit = async () => {
    if (!selectedChallenge) return
    
    setIsSubmitting(true)
    try {
      const { updateChallenge } = await import("@/lib/actions/admin")
      const result = await updateChallenge(selectedChallenge.id, formData)
      
      if (result.success) {
        toast({
          title: "Challenge Updated",
          description: `"${formData.title}" has been updated.`,
        })
        setIsEditOpen(false)
        setSelectedChallenge(null)
        await loadChallenges()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to update challenge",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error updating challenge:", error)
      toast({
        title: "Error",
        description: "Failed to update challenge",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!selectedChallenge) return
    
    setIsSubmitting(true)
    try {
      const { deleteChallenge } = await import("@/lib/actions/admin")
      const result = await deleteChallenge(selectedChallenge.id)
      
      if (result.success) {
        toast({
          title: "Challenge Deleted",
          description: `"${selectedChallenge.title}" has been deleted.`,
        })
        setIsDeleteOpen(false)
        setSelectedChallenge(null)
        await loadChallenges()
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to delete challenge",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error deleting challenge:", error)
      toast({
        title: "Error",
        description: "Failed to delete challenge",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const openEdit = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setFormData({
      title: challenge.title,
      description: challenge.description || "",
      challenge_type: challenge.challenge_type || "workout",
      target_value: challenge.target_value || 10,
      duration_days: challenge.duration_days || 30,
      start_date: challenge.start_date || new Date().toISOString().split("T")[0],
      end_date: challenge.end_date || new Date().toISOString().split("T")[0],
    })
    setIsEditOpen(true)
  }

  const openDelete = (challenge: Challenge) => {
    setSelectedChallenge(challenge)
    setIsDeleteOpen(true)
  }

  const isActive = (challenge: Challenge) => {
    if (!challenge.end_date) return false
    return new Date(challenge.end_date) >= new Date()
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Manage Challenges</h1>
          <p className="text-white/70">Create and manage community challenges</p>
        </div>
        <ButtonGlow 
          variant="accent-glow" 
          onClick={() => {
            setFormData(initialFormData)
            setIsCreateOpen(true)
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Challenge
        </ButtonGlow>
      </div>

      {/* Challenges List */}
      <div className="space-y-4">
        {challenges.length === 0 ? (
          <Card className="border-white/10 bg-black/50">
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 text-white/20 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Challenges Yet</h3>
              <p className="text-white/60 mb-4">Create your first community challenge to get started.</p>
              <ButtonGlow 
                variant="accent-glow" 
                onClick={() => {
                  setFormData(initialFormData)
                  setIsCreateOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Challenge
              </ButtonGlow>
            </CardContent>
          </Card>
        ) : (
          challenges.map((challenge) => (
            <Card key={challenge.id} className="border-white/10 bg-black/50">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <CardTitle className="text-white">{challenge.title}</CardTitle>
                      <Badge 
                        variant={isActive(challenge) ? "default" : "secondary"}
                        className={isActive(challenge) ? "bg-green-500/20 text-green-400" : ""}
                      >
                        {isActive(challenge) ? "Active" : "Ended"}
                      </Badge>
                      <Badge variant="outline" className="text-white/60">
                        {challenge.challenge_type}
                      </Badge>
                    </div>
                    <p className="text-sm text-white/70">{challenge.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <ButtonGlow 
                      variant="outline-glow" 
                      size="sm"
                      onClick={() => openEdit(challenge)}
                    >
                      <Pencil className="h-4 w-4" />
                    </ButtonGlow>
                    <ButtonGlow 
                      variant="outline-glow" 
                      size="sm"
                      onClick={() => openDelete(challenge)}
                      className="hover:border-red-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </ButtonGlow>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6 text-sm text-white/60">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span>{challenge.participants_count} participants</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Target className="h-4 w-4" />
                    <span>Target: {challenge.target_value}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      {challenge.start_date} to {challenge.end_date}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isCreateOpen || isEditOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateOpen(false)
          setIsEditOpen(false)
          setSelectedChallenge(null)
        }
      }}>
        <DialogContent className="max-w-md bg-black/95 border-accent/30">
          <DialogHeader>
            <DialogTitle className="text-white">
              {isEditOpen ? "Edit Challenge" : "Create New Challenge"}
            </DialogTitle>
            <DialogDescription className="text-white/70">
              {isEditOpen ? "Update the challenge details below." : "Fill in the details for your new challenge."}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="30-Day Workout Challenge"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Complete 30 workouts in 30 days"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <select
                  id="type"
                  value={formData.challenge_type}
                  onChange={(e) => setFormData({ ...formData, challenge_type: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {CHALLENGE_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="target">Target Value</Label>
                <Input
                  id="target"
                  type="number"
                  value={formData.target_value}
                  onChange={(e) => setFormData({ ...formData, target_value: parseInt(e.target.value) || 0 })}
                  min={1}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start">Start Date</Label>
                <Input
                  id="start"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end">End Date</Label>
                <Input
                  id="end"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <ButtonGlow 
                variant="outline-glow" 
                className="flex-1"
                onClick={() => {
                  setIsCreateOpen(false)
                  setIsEditOpen(false)
                }}
                disabled={isSubmitting}
              >
                Cancel
              </ButtonGlow>
              <ButtonGlow 
                variant="accent-glow" 
                className="flex-1"
                onClick={isEditOpen ? handleEdit : handleCreate}
                disabled={isSubmitting || !formData.title}
              >
                {isSubmitting ? "Saving..." : isEditOpen ? "Update" : "Create"}
              </ButtonGlow>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent className="max-w-sm bg-black/95 border-red-500/30">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Delete Challenge
            </DialogTitle>
            <DialogDescription className="text-white/70">
              Are you sure you want to delete "{selectedChallenge?.title}"? 
              This action cannot be undone and will remove all participant data.
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-3 pt-4">
            <ButtonGlow 
              variant="outline-glow" 
              className="flex-1"
              onClick={() => setIsDeleteOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </ButtonGlow>
            <ButtonGlow 
              variant="accent-glow" 
              className="flex-1 bg-red-500 hover:bg-red-600"
              onClick={handleDelete}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Deleting..." : "Delete"}
            </ButtonGlow>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

