"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import LiquidGlass from "liquid-glass-react"
import { Menu } from "lucide-react"
import styles from "./landing-navbar.module.css"

type NavItem = {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: "Connectors", href: "#connectors" },
  { label: "Customization", href: "#customization" },
  { label: "Security", href: "#security" },
  { label: "EHR", href: "#ehr-integration" },
]

export function LandingNavbar() {
  const navMountRef = useRef<HTMLDivElement | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  // Main navbar styling effect
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

  // Dropdown menu styling effect
  useEffect(() => {
    if (!isMobileMenuOpen) return
    const mount = navMountRef.current
    if (!mount) return

    const timeoutId = setTimeout(() => {
      const glassRoots = mount.querySelectorAll<HTMLElement>('.rxly-mobile-menu-glass')
      glassRoots.forEach(glassRoot => {
        const glassLayer = Array.from(glassRoot.children).find(
          (child) => child instanceof HTMLDivElement
        ) as HTMLDivElement | undefined

        if (glassLayer) {
          glassLayer.style.display = "flex"
          glassLayer.style.width = "100%"
          const contentLayer = Array.from(glassLayer.children).find(
            (child) => child instanceof HTMLDivElement
          ) as HTMLDivElement | undefined
          if (contentLayer) contentLayer.style.width = "100%"
        }
      })
    }, 50)

    return () => clearTimeout(timeoutId)
  }, [isMobileMenuOpen])

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
          transform: "translateX(-50%)",
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
                className="h-7 w-auto translate-y-[1px] invert md:h-8"
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
              <Link
                href="/consultation"
                className="inline-flex h-9 items-center justify-center rounded-full bg-white px-4 text-sm font-semibold text-black transition hover:bg-white/90"
              >
                <span>Start Consultation</span>
              </Link>

              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex size-9 items-center justify-center rounded-full border border-white/40 bg-white/12 text-white transition hover:bg-white/20 md:hidden"
                aria-label="Toggle navigation menu"
              >
                <Menu className="size-4" />
              </button>
            </div>
          </nav>
        </header>
      </LiquidGlass>

      {/* Mobile Dropdown Menu */}
      {isMobileMenuOpen && (
        <LiquidGlass
          blurAmount={0.1}
          aberrationIntensity={2}
          elasticity={0.08}
          saturation={140}
          mode="standard"
          cornerRadius={24}
          padding="0"
          className={`${styles.landingNavGlass} rxly-mobile-menu-glass pointer-events-auto md:hidden shadow-lg w-full`}
          style={{
            position: "fixed",
            top: "16rem",
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 30
          }}
        >
          <div className="flex w-full flex-col p-4 rounded-[24px]">
            <nav className="flex flex-col gap-2 relative z-10">
              {NAV_ITEMS.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-white/20 hover:text-white"
                >
                  {item.label}
                </a>
              ))}
              <div className="mt-2 border-t border-white/10 pt-4">
                <Link
                  href="/consultation"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block w-full rounded-full bg-white px-4 py-3 text-center text-sm font-semibold text-black transition hover:bg-white/90"
                >
                  Start Consultation
                </Link>
              </div>
            </nav>
          </div>
        </LiquidGlass>
      )}
    </div>
  )
}
