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

export default function PublicInfoPage({
  eyebrow,
  title,
  description,
  children,
  lastUpdated,
}: PublicInfoPageProps) {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <Link
            href="/"
            className="text-lg font-bold tracking-tight text-slate-950"
          >
            Nusa Gili Boat
          </Link>

          <nav
            aria-label="Public navigation"
            className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-medium text-slate-600"
          >
            <Link
              href="/about"
              className="transition hover:text-slate-950"
            >
              About
            </Link>

            <Link
              href="/contact"
              className="transition hover:text-slate-950"
            >
              Contact
            </Link>

            <Link
              href="/terms-and-conditions"
              className="transition hover:text-slate-950"
            >
              Terms
            </Link>

            <Link
              href="/privacy-policy"
              className="transition hover:text-slate-950"
            >
              Privacy
            </Link>

            <Link
              href="/refund-and-cancellation-policy"
              className="transition hover:text-slate-950"
            >
              Refund Policy
            </Link>
          </nav>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-6 py-14 sm:py-20">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">
            {eyebrow}
          </p>

          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            {title}
          </h1>

          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 sm:text-lg">
            {description}
          </p>

          {lastUpdated ? (
            <p className="mt-5 text-sm text-slate-500">
              Last updated: {lastUpdated}
            </p>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-10 sm:py-14">
        <article className="space-y-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          {children}
        </article>
      </section>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-5 px-6 py-8 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Nusa Gili Boat.
            All rights reserved.
          </p>

          <div className="flex flex-wrap gap-x-5 gap-y-2">
            <Link
              href="/terms-and-conditions"
              className="hover:text-slate-950"
            >
              Terms
            </Link>

            <Link
              href="/privacy-policy"
              className="hover:text-slate-950"
            >
              Privacy
            </Link>

            <Link
              href="/refund-and-cancellation-policy"
              className="hover:text-slate-950"
            >
              Refund Policy
            </Link>

            <Link
              href="/contact"
              className="hover:text-slate-950"
            >
              Contact
            </Link>
          </div>
        </div>
      </footer>
    </main>
  )
}