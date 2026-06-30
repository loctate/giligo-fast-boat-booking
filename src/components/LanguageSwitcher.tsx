"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

type LanguageSwitcherProps = {
  locale: "en" | "id"
}

function removeIndonesianPrefix(pathname: string) {
  const englishPath = pathname.replace(/^\/id(?=\/|$)/, "")

  return englishPath || "/"
}

function addIndonesianPrefix(pathname: string) {
  if (pathname === "/") {
    return "/id"
  }

  if (pathname === "/id" || pathname.startsWith("/id/")) {
    return pathname
  }

  return `/id${pathname}`
}

export default function LanguageSwitcher({
  locale,
}: LanguageSwitcherProps) {
  const pathname = usePathname()

  const englishHref = removeIndonesianPrefix(pathname)
  const indonesianHref = addIndonesianPrefix(
    removeIndonesianPrefix(pathname),
  )

  const baseClass =
    "inline-flex min-w-10 items-center justify-center rounded-lg px-3 py-2 text-xs font-black uppercase tracking-[0.12em] transition"

  const activeClass =
    "bg-cyan-400 text-slate-950 shadow-sm"

  const inactiveClass =
    "text-slate-300 hover:bg-white/10 hover:text-white"

  return (
    <div
      aria-label="Language selection"
      className="inline-flex items-center rounded-xl border border-white/15 bg-white/5 p-1"
    >
      <Link
        href={englishHref}
        hrefLang="en"
        lang="en"
        aria-label="View this page in English"
        aria-current={locale === "en" ? "page" : undefined}
        className={`${baseClass} ${
          locale === "en" ? activeClass : inactiveClass
        }`}
      >
        EN
      </Link>

      <Link
        href={indonesianHref}
        hrefLang="id"
        lang="id"
        aria-label="Lihat halaman ini dalam Bahasa Indonesia"
        aria-current={locale === "id" ? "page" : undefined}
        className={`${baseClass} ${
          locale === "id" ? activeClass : inactiveClass
        }`}
      >
        ID
      </Link>
    </div>
  )
}
