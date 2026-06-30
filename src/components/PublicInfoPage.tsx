import Image from "next/image"
import Link from "next/link"

import type {
  ReactNode,
} from "react"

type PublicInfoPageProps = {
  eyebrow: string
  title: string
  description: string
  children: ReactNode
  lastUpdated?: string
}

const legalLinks = [
  {
    href: "/about",
    label: "About",
  },
  {
    href: "/contact",
    label: "Contact",
  },
  {
    href: "/terms-and-conditions",
    label: "Terms",
  },
  {
    href: "/privacy-policy",
    label: "Privacy",
  },
  {
    href: "/refund-and-cancellation-policy",
    label: "Refund Policy",
  },
]

export default function PublicInfoPage({
  eyebrow,
  title,
  description,
  children,
  lastUpdated,
}: PublicInfoPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-white/10 bg-slate-950">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link
            href="/"
            aria-label="Nusa Gili Boat homepage"
            className="inline-flex items-center gap-4"
          >
            <Image
              src="/icon.png"
              alt="Nusa Gili Boat"
              width={64}
              height={64}
              className="h-14 w-14 rounded-2xl object-cover shadow-lg ring-1 ring-white/15 sm:h-16 sm:w-16"
            />

            <div>
              <div className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                Nusa Gili
              </div>

              <div className="text-[11px] font-bold uppercase tracking-[0.28em] text-cyan-300 sm:text-xs">
                Fast Boat Booking
              </div>
            </div>
          </Link>

          <nav
            aria-label="Public navigation"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-slate-300"
          >
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-white"
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
                Last updated: {lastUpdated}
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
              aria-label="Nusa Gili Boat homepage"
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
              Nusa Gili Boat membantu pelanggan mencari
              dan memesan perjalanan fast boat antara
              Bali, Lombok, Kepulauan Gili, dan Nusa
              Penida dengan lebih mudah dan terstruktur.
            </p>
          </div>

          <div>
            <h2 className="text-sm font-black uppercase tracking-[0.16em] text-white">
              Quick Links
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
            <p>
              © 2026 Nusa Gili Boat. All rights reserved.
            </p>

            <p>
              Fast boat booking for Bali and the Gili Islands.
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}