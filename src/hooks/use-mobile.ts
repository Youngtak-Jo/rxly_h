import * as React from "react"

const MOBILE_BREAKPOINT = 768

type MobileViewportState = {
  isMobile: boolean
  isReady: boolean
}

function getIsMobileViewport() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

export function useMobileViewport(): MobileViewportState {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(getIsMobileViewport())
    }

    onChange()

    if (typeof mql.addEventListener === "function") {
      mql.addEventListener("change", onChange)
      return () => mql.removeEventListener("change", onChange)
    }

    mql.addListener(onChange)
    return () => mql.removeListener(onChange)
  }, [])

  return {
    isMobile: !!isMobile,
    isReady: isMobile !== undefined,
  }
}

export function useIsMobile() {
  const { isMobile } = useMobileViewport()
  return isMobile
}
