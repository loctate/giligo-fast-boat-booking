"use client"

import { usePathname } from "next/navigation"

type AdminTopbarProps = {
  adminEmail?: string
  sidebarCollapsed: boolean
  onOpenNavigation: () => void
  onToggleSidebar: () => void
}

function getPageTitle(
  pathname: string
): string {
  if (
    pathname.startsWith(
      "/admin/manifests"
    )
  ) {
    return "Passenger Manifests"
  }

  if (
    pathname.includes(
      "/manifest"
    )
  ) {
    return "Passenger Manifest"
  }

  if (
    pathname.startsWith(
      "/admin/departures"
    )
  ) {
    return "Departure Operations"
  }

  if (
    pathname.startsWith(
      "/admin/trip-inventory"
    )
  ) {
    return "Trip Inventory"
  }

  if (
    pathname.startsWith(
      "/admin/trip-schedules"
    )
  ) {
    return "Trip Schedules"
  }

  if (
    pathname.startsWith(
      "/admin/operators"
    )
  ) {
    return "Operators"
  }

  if (
    pathname.startsWith(
      "/admin/vessels"
    )
  ) {
    return "Vessels"
  }

  if (
    pathname.startsWith(
      "/admin/routes"
    )
  ) {
    return "Routes"
  }

  if (
    pathname.startsWith(
      "/admin/bookings/"
    )
  ) {
    return "Booking Details"
  }

  return "Dashboard"
}

function getCurrentWitaLabel(): string {
  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "short",
      day: "2-digit",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Makassar",
    }
  ).format(new Date())
}

export default function AdminTopbar({
  adminEmail,
  sidebarCollapsed,
  onOpenNavigation,
  onToggleSidebar,
}: AdminTopbarProps) {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur print:hidden">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={
              onOpenNavigation
            }
            aria-label="Open admin navigation"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-xl font-black text-slate-700 shadow-sm transition hover:bg-slate-100 lg:hidden"
          >
            ☰
          </button>

          <button
            type="button"
            onClick={
              onToggleSidebar
            }
            aria-label={
              sidebarCollapsed
                ? "Expand admin sidebar"
                : "Collapse admin sidebar"
            }
            title={
              sidebarCollapsed
                ? "Expand sidebar"
                : "Collapse sidebar"
            }
            className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-lg font-black text-slate-700 shadow-sm transition hover:bg-slate-100 lg:flex"
          >
            {sidebarCollapsed
              ? "›"
              : "‹"}
          </button>

          <div className="min-w-0">
            <h1 className="truncate text-lg font-black text-slate-950 sm:text-xl">
              {getPageTitle(pathname)}
            </h1>

            <p className="mt-0.5 hidden text-xs font-semibold text-slate-500 sm:block">
              {getCurrentWitaLabel()} · WITA
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden text-right md:block">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Administrator
            </p>

            <p className="max-w-52 truncate text-sm font-bold text-slate-700">
              {adminEmail ||
                "Admin session"}
            </p>
          </div>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-sm font-black text-cyan-800">
            A
          </div>
        </div>
      </div>
    </header>
  )
}
