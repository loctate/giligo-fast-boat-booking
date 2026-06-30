import Image from "next/image"
import Link from "next/link"

import type {
  ReactNode,
} from "react"

import LanguageSwitcher from "@/components/LanguageSwitcher"

type Locale = "en" | "id"

type PublicInfoPageProps = {
  locale: Locale
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  lastUpdated?: string
}

const navigationItems = [
  {
    href: "/about",
    en: "About",
    id: "Tentang Kami",
  },
  {
    href: "/contact",
    en: "Contact",
    id: "Hubungi Kami",
  },
  {
    href: "/terms-and-conditions",
    en: "Terms",
    id: "Syarat & Ketentuan",
  },
  {
    href: "/privacy-policy",
    en: "Privacy",
    id: "Privasi",
  },
  {
    href: "/refund-and-cancellation-policy",
    en: "Refund Policy",
    id: "Refund",
  },
]

const translations = {
  en: {
    publicNavigation: "Public navigation",
    homepageLabel: "Nusa Gili Boat homepage",
    lastUpdated: "Last updated",
    quickLinks: "Quick Links",
    footerDescription:
      "Nusa Gili Boat helps travelers search for and book fast boat journeys between Bali, Lombok, the Gili Islands, and Nusa Penida more easily.",
    footerOperations:
      "Business operations and customer support are managed from Jakarta, Indonesia.",
    copyright: "© 2026 Nusa Gili Boat. All rights reserved.",
    footerTagline:
      "Fast boat booking for Bali and the Gili Islands.",
  },
  id: {
    publicNavigation: "Navigasi publik",
    homepageLabel: "Beranda Nusa Gili Boat",
    lastUpdated: "Terakhir diperbarui",
    quickLinks: "Tautan Cepat",
    footerDescription:
      "Nusa Gili Boat membantu pelanggan mencari dan memesan perjalanan fast boat antara Bali, Lombok, Kepulauan Gili, dan Nusa Penida dengan lebih mudah dan terstruktur.",
    footerOperations:
      "Operasional bisnis dan layanan pelanggan dikelola dari Jakarta, Indonesia.",
    copyright: "© 2026 Nusa Gili Boat. Seluruh hak dilindungi.",
    footerTagline:
      "Pemesanan fast boat untuk Bali dan Kepulauan Gili.",
  },
} satisfies Record<
  Locale,
  {
    publicNavigation: string
    homepageLabel: string
    lastUpdated: string
    quickLinks: string
    footerDescription: string
    footerOperations: string
    copyright: string
    footerTagline: string
  }
>

function getLocalizedHref(
  href: string,
  locale: Locale,
) {
  return locale === "id" ? `/id${href}` : href
}

export default function PublicInfoPage({
  locale,
  eyebrow,
  title,
  description,
  children,
  lastUpdated,
}: PublicInfoPageProps) {
  const text = translations[locale]

  const legalLinks = navigationItems.map((item) => ({
    href: getLocalizedHref(item.href, locale),
    label: item[locale],
  }))

  return (
    <main
      lang={locale}
      dir="ltr"
      className="min-h-screen bg-slate-50 text-slate-900"
    >
      <header className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto max-w-7xl px-4 py-3 sm:px-5 sm:py-4 lg:px-8">
          <div className="flex items-center justify-between gap-3">
            <Link
              href="/"
              aria-label={text.homepageLabel}
              className="inline-flex min-w-0 items-center gap-3 sm:gap-4"
            >
              <Image
                src="/icon.png"
                alt="Nusa Gili Boat"
                width={64}
                height={64}
                className="h-11 w-11 flex-none rounded-xl object-cover shadow-lg ring-1 ring-white/15 sm:h-14 sm:w-14 sm:rounded-2xl lg:h-16 lg:w-16"
              />

              <div className="min-w-0">
                <div className="truncate text-xl font-black tracking-tight text-white sm:text-2xl lg:text-3xl">
                  Nusa Gili
                </div>

                <div className="whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-300 sm:text-[11px] sm:tracking-[0.28em]">
                  Fast Boat Booking
                </div>
              </div>
            </Link>

            <div className="shrink-0 lg:hidden">
              <LanguageSwitcher locale={locale} />
            </div>

            <div className="hidden items-center gap-5 lg:flex">
              <nav
                aria-label={text.publicNavigation}
                className="flex items-center gap-5 text-sm font-semibold text-slate-300"
              >
                {legalLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="whitespace-nowrap transition hover:text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <LanguageSwitcher locale={locale} />
            </div>
          </div>

          <nav
            aria-label={text.publicNavigation}
            className="mt-4 flex items-center gap-5 overflow-x-auto pb-1 text-xs font-semibold text-slate-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
          >
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="shrink-0 whitespace-nowrap transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <section className="bg-gradient-to-r from-cyan-700 to-blue-800 text-white">
        <div className="mx-auto max-w-6xl px-5 py-14 sm:py-16 lg:px-8">
          <div className="max-w-4xl">
            <p className="mb-4 inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/10 px-4 py-2 text-sm font-semibold uppercase tracking-[0.18em] text-cyan-100">
              {eyebrow}
            </p>

            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
              {title}
            </h1>

            <p className="mt-5 max-w-3xl text-base leading-8 text-cyan-50 sm:text-lg">
              {description}
            </p>

            {lastUpdated ? (
              <p className="mt-5 text-sm text-cyan-100/90">
                {text.lastUpdated}: {lastUpdated}
              </p>
            ) : null}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:py-14 lg:px-8">
        <article className="space-y-8 rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {children}
        </article>
      </section>

      <footer className="bg-slate-950 text-slate-300">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1.5fr_1fr] lg:px-8">
          <div>
            <Link
              href="/"
              aria-label={text.homepageLabel}
              className="inline-flex items-center gap-4"
            >
              <Image
                src="/icon.png"
                alt="Nusa Gili Boat"
                width={56}
                height={56}
                className="h-12 w-12 rounded-2xl object-cover shadow-lg ring-1 ring-white/15"
              />

              <div>
                <div className="text-xl font-black tracking-tight text-white">
                  Nusa Gili
                </div>

                <div className="text-[11px] font-bold uppercase tracking-[0.24em] text-cyan-300">
                  Fast Boat Booking
                </div>
              </div>
            </Link>

            <p className="mt-5 max-w-xl text-sm leading-7 text-slate-400">
              {text.footerDescription}
            </p>

            <p className="mt-3 max-w-xl text-sm leading-7 text-slate-500">
              {text.footerOperations}
            </p>
          </div>

          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">
              {text.quickLinks}
            </h2>

            <div className="mt-5 flex flex-col gap-3 text-sm">
              {legalLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="transition hover:text-cyan-300"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800">
          <div className="mx-auto flex max-w-7xl flex-col gap-3 px-5 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between lg:px-8">
            <p>{text.copyright}</p>

            <p>{text.footerTagline}</p>
          </div>
        </div>
      </footer>
    </main>
  )
}
