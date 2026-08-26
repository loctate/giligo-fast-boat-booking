"use client"

import {
  useEffect,
  useRef,
} from "react"

import {
  usePathname,
} from "next/navigation"

import {
  CONSENT_CHANGE_EVENT,
  readConsentPreferences,
  type ConsentPreferences,
} from "@/lib/consent"

const GTM_ID =
  process.env.NEXT_PUBLIC_GTM_ID?.trim()

const GTM_SCRIPT_ID =
  "nusagiliboat-gtm-script"

function loadGoogleTagManager() {
  if (
    !GTM_ID ||
    document.getElementById(GTM_SCRIPT_ID)
  ) {
    return
  }

  window.dataLayer =
    window.dataLayer || []

  window.dataLayer.push({
    "gtm.start": Date.now(),
    event: "gtm.js",
  })

  const script =
    document.createElement("script")

  script.id = GTM_SCRIPT_ID
  script.async = true
  script.src =
    `https://www.googletagmanager.com/gtm.js?id=${encodeURIComponent(GTM_ID)}`

  document.head.appendChild(script)
}

declare global {
  interface Window {
    dataLayer: Array<Record<string, unknown>>
  }
}

export default function GoogleTagManagerLoader() {
  const pathname = usePathname()

  const loadedRef = useRef(false)

  const isAdmin =
    pathname === "/admin" ||
    pathname.startsWith("/admin/")

  useEffect(() => {
    if (
      isAdmin ||
      !GTM_ID
    ) {
      return
    }

    const loadIfAllowed = () => {
      const preferences =
        readConsentPreferences()

      if (
        preferences?.analytics === true &&
        !loadedRef.current
      ) {
        loadGoogleTagManager()
        loadedRef.current = true
      }
    }

    loadIfAllowed()

    const handleConsentChange = (
      event: Event
    ) => {
      const customEvent =
        event as CustomEvent<ConsentPreferences>

      if (
        customEvent.detail.analytics === true
      ) {
        loadIfAllowed()
        return
      }

      if (loadedRef.current) {
        window.location.reload()
      }
    }

    window.addEventListener(
      CONSENT_CHANGE_EVENT,
      handleConsentChange
    )

    return () => {
      window.removeEventListener(
        CONSENT_CHANGE_EVENT,
        handleConsentChange
      )
    }
  }, [isAdmin])

  return null
}
