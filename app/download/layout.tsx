import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "V-Life | AI-Powered Fitness & Wellness App",
  description: "Transform your body and master your life with V-Life. AI-powered fitness companion with personalized workouts, nutrition plans, and 24/7 coaching. Download now for iPhone & Android.",
  keywords: [
    "fitness app",
    "AI personal trainer",
    "workout app",
    "nutrition tracking",
    "meal planning",
    "fitness coach",
    "health app",
    "wellness app",
    "mobile fitness",
    "AI coaching"
  ],
  authors: [{ name: "V-Life" }],
  creator: "V-Life",
  publisher: "V-Life",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://vlife.app/download",
    title: "V-Life | AI-Powered Fitness & Wellness App",
    description: "Transform your body with AI-powered workouts, nutrition plans, and 24/7 coaching. Join 10,000+ members. 7-day free trial.",
    siteName: "V-Life",
    images: [
      {
        url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png",
        width: 1200,
        height: 630,
        alt: "V-Life - AI Fitness & Wellness App",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "V-Life | AI-Powered Fitness & Wellness App",
    description: "Transform your body with AI-powered workouts, nutrition plans, and 24/7 coaching. 7-day free trial.",
    images: ["https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png"],
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
}

export default function DownloadLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
