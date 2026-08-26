"use client"

import Link from "next/link"

import {
  useEffect,
  useState,
} from "react"

import {
  usePathname,
} from "next/navigation"

import {
  readConsentPreferences,
  writeConsentPreferences,
  type ConsentPreferences,
} from "@/lib/consent"

const translations = {
  en: {
    title: "Your privacy choices",
    description:
      "We use necessary browser storage for booking and security features. With your permission, analytics may also be used to understand website performance. Advertising tracking is not active.",
    privacy: "Privacy Policy",
    necessary: "Necessary only",
    analytics: "Accept analytics",
    settings: "Cookie settings",
  },
  id: {
    title: "Pilihan privasi Anda",
    description:
      "Kami menggunakan penyimpanan browser yang diperlukan untuk fungsi booking dan keamanan. Dengan persetujuan Anda, analytics juga dapat digunakan untuk memahami kinerja situs. Tracking iklan belum aktif.",
    privacy: "Kebijakan Privasi",
    necessary: "Hanya yang diperlukan",
    analytics: "Terima analytics",
    settings: "Pengaturan cookie",
  },
} as const

export default function ConsentBanner() {
  const pathname = usePathname()

  const locale =
    pathname === "/id" ||
    pathname.startsWith("/id/")
      ? "id"
      : "en"

  const text = translations[locale]

  const isAdmin =
    pathname === "/admin" ||
    pathname.startsWith("/admin/")

  const [preferences, setPreferences] =
    useState<ConsentPreferences | null>(null)

  const [isLoaded, setIsLoaded] =
    useState(false)

  const [isOpen, setIsOpen] =
    useState(false)

  useEffect(() => {
    if (isAdmin) {
      return
    }

    const restoreTimer =
      window.setTimeout(() => {
        const savedPreferences =
          readConsentPreferences()

        setPreferences(savedPreferences)
        setIsOpen(!savedPreferences)
        setIsLoaded(true)
      }, 0)

    return () => {
      window.clearTimeout(restoreTimer)
    }
  }, [isAdmin])

  if (
    isAdmin ||
    !isLoaded
  ) {
    return null
  }

  const savePreference = (
    analytics: boolean
  ) => {
    const nextPreferences =
      writeConsentPreferences({
        analytics,
        advertising: false,
      })

    setPreferences(nextPreferences)
    setIsOpen(false)
  }

  const privacyHref =
    locale === "id"
      ? "/id/privacy-policy"
      : "/privacy-policy"

  if (!isOpen && preferences) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-3 left-3 z-50 rounded-full border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 shadow-lg transition hover:bg-slate-50"
      >
        {text.settings}
      </button>
    )
  }

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 p-3 sm:p-5">
      <section
        role="dialog"
        aria-labelledby="consent-title"
        className="mx-auto max-w-4xl rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl sm:p-6"
      >
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <h2
              id="consent-title"
              className="text-base font-black text-slate-950 sm:text-lg"
            >
              {text.title}
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-600">
              {text.description}
            </p>

            <Link
              href={privacyHref}
              className="mt-2 inline-flex text-sm font-bold text-cyan-700 transition hover:text-cyan-900"
            >
              {text.privacy}
            </Link>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row lg:flex-none">
            <button
              type="button"
              onClick={() => savePreference(false)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              {text.necessary}
            </button>

            <button
              type="button"
              onClick={() => savePreference(true)}
              className="rounded-xl bg-cyan-700 px-4 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
            >
              {text.analytics}
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
