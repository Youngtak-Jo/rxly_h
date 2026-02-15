import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { Analytics } from "@vercel/analytics/next"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppearanceProvider } from "@/components/appearance-provider"
import { SessionTimeoutDialog } from "@/components/session-timeout-dialog"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: "Rxly - AI Medical Consultation Assistant",
  description:
    "Real-time AI-powered medical consultation assistant with live transcription and insights",
  other: {
    "apple-mobile-web-app-title": "MyWebSite",
  },
  openGraph: {
    title: "Rxly - AI Medical Consultation Assistant",
    description:
      "Real-time AI-powered medical consultation assistant with live transcription and insights",
    url: "https://rxly.ai",
    siteName: "Rxly",
    images: [
      {
        url: "https://rxly.ai/og-image.jpeg",
        width: 1200,
        height: 630,
        alt: "Rxly.ai",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rxly - AI Medical Consultation Assistant",
    description:
      "Real-time AI-powered medical consultation assistant with live transcription and insights",
    images: ["https://rxly.ai/og-image.jpeg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AppearanceProvider />
          <TooltipProvider>
            {children}
            <SessionTimeoutDialog />
            <Toaster position="bottom-right" richColors />
            <Analytics />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
