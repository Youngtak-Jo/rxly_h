"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import Link from "next/link"
import LiquidGlass from "liquid-glass-react"
import styles from "./landing-navbar.module.css"

type NavItem = {
  label: string
  href: string
}

const NAV_ITEMS: NavItem[] = [
  { label: "Features", href: "#features" },
]

export function LandingNavbar() {
  const navMountRef = useRef<HTMLDivElement | null>(null)

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
          zIndex: 100,
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

            <Link
              href="/consultation"
              className="rounded-full bg-neutral-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-neutral-700 sm:text-sm"
            >
              <span className="sm:hidden">Start</span>
              <span className="hidden sm:inline">Start Consultation</span>
            </Link>
          </nav>
        </header>
      </LiquidGlass>
    </div>
  )
}
