/**
 * Stock images for avatars, backgrounds, and other UI elements
 * All images are from Unsplash - free to use with attribution
 */

// Random avatar images - diverse set of profile pictures
export const AVATAR_IMAGES = [
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&auto=format&crop=face",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&h=150&fit=crop&auto=format&crop=face",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&auto=format&crop=face",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&auto=format&crop=face",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&auto=format&crop=face",
  "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&auto=format&crop=face",
  "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&h=150&fit=crop&auto=format&crop=face",
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&h=150&fit=crop&auto=format&crop=face",
  "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&h=150&fit=crop&auto=format&crop=face",
  "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&h=150&fit=crop&auto=format&crop=face",
]

// Fitness-themed background images
export const FITNESS_BACKGROUNDS = {
  gym: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&h=800&fit=crop&auto=format",
  running:
    "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=1200&h=800&fit=crop&auto=format",
  yoga: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=1200&h=800&fit=crop&auto=format",
  weights:
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1200&h=800&fit=crop&auto=format",
  cycling:
    "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&h=800&fit=crop&auto=format",
  swimming:
    "https://images.unsplash.com/photo-1530549387789-4c1017266635?w=1200&h=800&fit=crop&auto=format",
}

// Community post placeholder images
export const POST_IMAGES = {
  achievement:
    "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=600&h=400&fit=crop&auto=format",
  workout:
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=600&h=400&fit=crop&auto=format",
  nutrition:
    "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=600&h=400&fit=crop&auto=format",
  progress:
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=600&h=400&fit=crop&auto=format",
  motivation:
    "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=600&h=400&fit=crop&auto=format",
}

// Supplement/product images
export const SUPPLEMENT_IMAGES = {
  protein:
    "https://images.unsplash.com/photo-1593095948071-474c5cc2989d?w=300&h=300&fit=crop&auto=format",
  vitamins:
    "https://images.unsplash.com/photo-1584017911766-d451b3d0e843?w=300&h=300&fit=crop&auto=format",
  preworkout:
    "https://images.unsplash.com/photo-1622597467836-f3285f2131b8?w=300&h=300&fit=crop&auto=format",
}

// Default placeholder
export const DEFAULT_PLACEHOLDER =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=400&h=300&fit=crop&auto=format"

// Default user avatar - use vLife logo as fallback
export const DEFAULT_AVATAR = "/logo.png"

/**
 * Get a random avatar from the collection
 * Uses the provided seed for consistency (e.g., user ID)
 */
export function getRandomAvatar(seed?: string | number): string {
  if (seed) {
    // Use simple hash for consistent avatar per seed
    const hash =
      typeof seed === "string"
        ? seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
        : seed
    return AVATAR_IMAGES[hash % AVATAR_IMAGES.length]
  }
  return AVATAR_IMAGES[Math.floor(Math.random() * AVATAR_IMAGES.length)]
}

/**
 * Get a post image based on category
 */
export function getPostImage(category?: string): string {
  if (category && category in POST_IMAGES) {
    return POST_IMAGES[category as keyof typeof POST_IMAGES]
  }
  return POST_IMAGES.workout
}

/**
 * Get a fitness background image
 */
export function getFitnessBackground(type?: string): string {
  if (type && type in FITNESS_BACKGROUNDS) {
    return FITNESS_BACKGROUNDS[type as keyof typeof FITNESS_BACKGROUNDS]
  }
  return FITNESS_BACKGROUNDS.gym
}

