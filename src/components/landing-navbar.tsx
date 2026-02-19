"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import LiquidGlass from "liquid-glass-react"
import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import styles from "./landing-navbar.module.css"

type NavItem = {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: "Connectors", href: "#connectors" },
  { label: "Customization", href: "#customization" },
  { label: "Security", href: "#security" },
  { label: "EHR Integration", href: "#ehr-integration" },
]

export function LandingNavbar() {
  const navMountRef = useRef<HTMLDivElement | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    const mount = navMountRef.current
    if (!mount) return

    const glassRoot = mount.querySelector<HTMLElement>(`.${styles.landingNavGlass}`)
    if (!glassRoot) return

    const glassLayer = Array.from(glassRoot.children).find(
      (child) => child instanceof HTMLDivElement
    ) as HTMLDivElement | undefined

    if (!glassLayer) return

    glassLayer.style.display = "flex"
    glassLayer.style.width = "100%"

    const contentLayer = Array.from(glassLayer.children).find(
      (child) => child instanceof HTMLDivElement
    ) as HTMLDivElement | undefined

    if (!contentLayer) return

    contentLayer.style.width = "100%"

    return () => {
      glassLayer.style.display = ""
      glassLayer.style.width = ""
      contentLayer.style.width = ""
    }
  }, [])

  return (
    <div ref={navMountRef}>
      <LiquidGlass
        blurAmount={0}
        aberrationIntensity={2}
        elasticity={0.08}
        saturation={140}
        mode="standard"
        cornerRadius={999}
        padding="0"
        className={`${styles.landingNavGlass} pointer-events-auto w-full`}
        style={{
          position: "fixed",
          top: "calc(1.5rem + 28px)",
          left: "50%",
          zIndex: 40,
        }}
      >
        <header className="w-full">
          <nav className="flex w-full items-center justify-between gap-3 px-3 py-2 md:px-4 md:py-2.5">
            <Link
              href="/"
              className="flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-white/20"
            >
              <Image
                src="/icon0.svg"
                alt="Rxly icon"
                width={32}
                height={32}
                className="size-8 rounded-full object-cover"
                priority
              />
              <Image
                src="/logo.svg"
                alt="Rxly wordmark"
                width={933}
                height={451}
                className="hidden h-7 w-auto translate-y-[1px] invert sm:block md:h-8"
                priority
              />
            </Link>

            <ul className="hidden items-center gap-1 md:flex">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <a
                    href={item.href}
                    className="rounded-full px-3 py-1.5 text-sm font-medium text-white/90 transition hover:bg-white/20 hover:text-white"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>

            <div className="flex items-center gap-2">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <button
                    type="button"
                    className="inline-flex size-9 items-center justify-center rounded-full border border-white/40 bg-white/12 text-white transition hover:bg-white/20 md:hidden"
                    aria-label="Open section navigation"
                  >
                    <Menu className="size-4" />
                  </button>
                </SheetTrigger>

                <SheetContent
                  side="right"
                  className="w-[82vw] max-w-xs border-l border-zinc-200/70 bg-background p-0"
                >
                  <div className="flex h-full flex-col">
                    <div className="border-b border-zinc-200/70 p-4 pr-10">
                      <SheetTitle className="text-sm font-semibold text-zinc-900">Navigate</SheetTitle>
                      <p className="mt-1 text-xs text-zinc-600">Jump to any section of the landing page.</p>
                    </div>

                    <nav className="grid gap-1 p-3">
                      {NAV_ITEMS.map((item) => (
                        <a
                          key={item.href}
                          href={item.href}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="rounded-lg border border-zinc-200/70 bg-white/80 px-3 py-2 text-sm font-medium text-zinc-800 transition hover:border-zinc-300 hover:bg-zinc-50"
                        >
                          {item.label}
                        </a>
                      ))}
                    </nav>

                    <div className="mt-auto p-3 pt-0">
                      <Link
                        href="/consultation"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="block rounded-full bg-zinc-900 px-4 py-2 text-center text-sm font-semibold text-white transition hover:bg-zinc-700"
                      >
                        Start Consultation
                      </Link>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>

              <Link
                href="/consultation"
                className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-black transition hover:bg-white/90 sm:text-sm"
              >
                <span className="sm:hidden">Start</span>
                <span className="hidden sm:inline">Start Consultation</span>
              </Link>
            </div>
          </nav>
        </header>
      </LiquidGlass>
    </div>
  )
}
