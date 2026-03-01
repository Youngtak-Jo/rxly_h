import type { Metadata, Viewport } from "next"
import { cookies, headers } from "next/headers"
import { Geist, Geist_Mono } from "next/font/google"
import { ThemeProvider } from "next-themes"
import { Toaster } from "sonner"
import { Analytics } from "@vercel/analytics/next"
import { TooltipProvider } from "@/components/ui/tooltip"
import { AppearanceProvider } from "@/components/appearance-provider"
import { IntlProvider } from "@/components/intl-provider"
import {
  UI_LOCALE_COOKIE,
  detectRequestUiLocale,
  normalizeUiLocale,
} from "@/i18n/config"
import { loadMessages } from "@/i18n/load-messages"

import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
}

export const metadata: Metadata = {
  title: "Rxly - AI Medical Consultation Assistant",
  description:
    "Real-time AI-powered medical consultation assistant with live transcription and insights",
  other: {
    "apple-mobile-web-app-title": "Rxly",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "mobile-web-app-capable": "yes",
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const cookieStore = await cookies()
  const headerStore = await headers()
  const defaultLocale = detectRequestUiLocale(
    headerStore.get("accept-language")
  )
  const locale =
    normalizeUiLocale(cookieStore.get(UI_LOCALE_COOKIE)?.value) ?? defaultLocale
  const messages = await loadMessages(locale)

  return (
    <html lang={locale} suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <IntlProvider
            defaultLocale={defaultLocale}
            locale={locale}
            messages={messages}
          >
            <AppearanceProvider />
            <TooltipProvider>
              {children}
              <Toaster position="bottom-right" richColors />
              <Analytics />
            </TooltipProvider>
          </IntlProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
