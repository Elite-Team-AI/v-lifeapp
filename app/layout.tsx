import type React from "react"
import type { Metadata, Viewport } from "next"
import { DM_Sans, Outfit } from "next/font/google"
import { Providers } from "./ClientRootLayout"
import "./globals.css"

// DM Sans - clean, modern, geometric sans-serif for body text
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
})

// Outfit - bold, distinctive geometric sans for headings
const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  display: "swap",
  variable: "--font-outfit",
})

export const metadata: Metadata = {
  title: "V-Life Fitness",
  description: "Your Lifestyle. Your Plan. Powered by AI.",
  keywords: ["fitness", "AI", "workout", "nutrition", "lifestyle", "health"],
  authors: [{ name: "V-Life Fitness" }],
  creator: "V-Life Fitness",
  publisher: "V-Life Fitness",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://v-life-fitness.vercel.app"),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "V-Life Fitness",
    description: "Your Lifestyle. Your Plan. Powered by AI.",
    url: "https://v-life-fitness.vercel.app",
    siteName: "V-Life Fitness",
    images: [
      {
        url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png",
        width: 1024,
        height: 1024,
        alt: "V-Life Fitness Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "V-Life Fitness",
    description: "Your Lifestyle. Your Plan. Powered by AI.",
    images: ["https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png"],
    creator: "@vlifefitness",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "V-Life Fitness",
    startupImage: [
      {
        url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png",
        media: "(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png",
        media: "(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)",
      },
      {
        url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png",
        media: "(device-width: 414px) and (device-height: 736px) and (-webkit-device-pixel-ratio: 3)",
      },
    ],
  },
  applicationName: "V-Life Fitness",
  referrer: "origin-when-cross-origin",
  category: "fitness",
  classification: "Health & Fitness",
  icons: {
    icon: [
      { url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png", sizes: "32x32", type: "image/png" },
      { url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [
      { url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png", sizes: "180x180", type: "image/png" },
      { url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png", sizes: "152x152", type: "image/png" },
      { url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png", sizes: "144x144", type: "image/png" },
      { url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png", sizes: "120x120", type: "image/png" },
      { url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png", sizes: "114x114", type: "image/png" },
      { url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png", sizes: "76x76", type: "image/png" },
      { url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png", sizes: "72x72", type: "image/png" },
      { url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png", sizes: "60x60", type: "image/png" },
      { url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png", sizes: "57x57", type: "image/png" },
    ],
    other: [
      {
        rel: "apple-touch-icon-precomposed",
        url: "https://xiezvibwxvsulfiooknp.supabase.co/storage/v1/object/public/Public-assets/white-vlife-logo.png",
      },
    ],
  },
  manifest: "/manifest.json",
  generator: 'v0.app'
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${outfit.variable}`}>
      <body className={`${dmSans.className} font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
