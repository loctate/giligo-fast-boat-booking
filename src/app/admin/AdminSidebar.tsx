"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import LogoutButton from "./LogoutButton"

type NavigationItem = {
  label: string
  href?: string
  icon: string
  comingSoon?: boolean
}

type NavigationGroup = {
  label?: string
  items: NavigationItem[]
}

type AdminSidebarProps = {
  mobile?: boolean
  collapsed?: boolean
  onNavigate?: () => void
}

const navigationGroups: NavigationGroup[] = [
  {
    items: [
      {
        label: "Dashboard",
        href: "/admin",
        icon: "⌂",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        label: "Departures",
        href: "/admin/departures",
        icon: "➜",
      },
      {
        label: "Bookings",
        href: "/admin#bookings",
        icon: "▤",
      },
      {
        label: "Manifest",
        icon: "☷",
        comingSoon: true,
      },
    ],
  },
  {
    label: "Master data",
    items: [
      {
        label: "Trip Inventory",
        href: "/admin/trip-inventory",
        icon: "▦",
      },
      {
        label: "Trip Schedules",
        href: "/admin/trip-schedules",
        icon: "◷",
      },
      {
        label: "Operators",
        href: "/admin/operators",
        icon: "◎",
      },
      {
        label: "Vessels",
        href: "/admin/vessels",
        icon: "◈",
      },
      {
        label: "Routes",
        href: "/admin/routes",
        icon: "⌖",
      },
    ],
  },
  {
    label: "System",
    items: [
      {
        label: "View Website",
        href: "/",
        icon: "↗",
      },
    ],
  },
]

function isNavigationActive(
  pathname: string,
  href?: string
): boolean {
  if (!href || href === "/") {
    return false
  }

  if (href === "/admin#bookings") {
    return pathname.startsWith(
      "/admin/bookings/"
    )
  }

  const pathOnly =
    href.split("#")[0]

  if (pathOnly === "/admin") {
    return pathname === "/admin"
  }

  return (
    pathname === pathOnly ||
    pathname.startsWith(
      `${pathOnly}/`
    )
  )
}

export default function AdminSidebar({
  mobile = false,
  collapsed = false,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname()

  const compact =
    collapsed && !mobile

  return (
    <div className="flex h-full flex-col bg-slate-950 text-white">
      <div
        className={`border-b border-white/10 ${
          compact
            ? "px-3 py-5"
            : "px-6 py-6"
        }`}
      >
        <Link
          href="/admin"
          onClick={onNavigate}
          title={
            compact
              ? "GiliGo Booking Operations"
              : undefined
          }
          className={`flex items-center ${
            compact
              ? "justify-center"
              : "gap-3"
          }`}
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cyan-400 text-xl text-slate-950 shadow-lg shadow-cyan-950/30">
            🚤
          </span>

          {!compact && (
            <span>
              <span className="block text-xl font-black tracking-tight">
                Gili
                <span className="text-cyan-300">
                  Go
                </span>
              </span>

              <span className="mt-0.5 block text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400">
                Booking Operations
              </span>
            </span>
          )}
        </Link>
      </div>

      <nav
        className={`flex-1 space-y-7 overflow-y-auto py-6 ${
          compact
            ? "px-2"
            : "px-4"
        }`}
      >
        {navigationGroups.map(
          (group, groupIndex) => (
            <section
              key={
                group.label ||
                `primary-${groupIndex}`
              }
            >
              {group.label && !compact && (
                <p className="mb-2 px-3 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                  {group.label}
                </p>
              )}

              {group.label && compact && (
                <div className="mx-auto mb-2 h-px w-8 bg-white/10" />
              )}

              <div className="space-y-1">
                {group.items.map(
                  (item) => {
                    const active =
                      isNavigationActive(
                        pathname,
                        item.href
                      )

                    if (
                      item.comingSoon ||
                      !item.href
                    ) {
                      return (
                        <div
                          key={item.label}
                          aria-disabled="true"
                          title={
                            compact
                              ? `${item.label} — Coming soon`
                              : undefined
                          }
                          className={`flex cursor-not-allowed items-center rounded-xl py-2.5 text-sm font-bold text-slate-500 ${
                            compact
                              ? "justify-center px-2"
                              : "justify-between px-3"
                          }`}
                        >
                          <span className="flex items-center gap-3">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-sm">
                              {item.icon}
                            </span>

                            {!compact &&
                              item.label}
                          </span>

                          {!compact && (
                            <span className="rounded-full bg-white/5 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-slate-500">
                              Soon
                            </span>
                          )}
                        </div>
                      )
                    }

                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={onNavigate}
                        title={
                          compact
                            ? item.label
                            : undefined
                        }
                        className={`group flex items-center rounded-xl py-2.5 text-sm font-bold transition ${
                          compact
                            ? "justify-center px-2"
                            : "gap-3 px-3"
                        } ${
                          active
                            ? "bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-950/30"
                            : "text-slate-300 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        <span
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-sm transition ${
                            active
                              ? "bg-slate-950/10"
                              : "bg-white/5 group-hover:bg-white/10"
                          }`}
                        >
                          {item.icon}
                        </span>

                        {!compact &&
                          item.label}
                      </Link>
                    )
                  }
                )}
              </div>
            </section>
          )
        )}
      </nav>

      <div
        className={`border-t border-white/10 ${
          compact
            ? "p-2"
            : mobile
              ? "px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4"
              : "p-4"
        }`}
      >
        {!compact && (
          <div className="mb-3 rounded-xl bg-white/5 px-4 py-3">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
              Admin workspace
            </p>

            <p className="mt-1 text-xs font-bold text-slate-300">
              Nusa Gili Boat
            </p>
          </div>
        )}

        <div
          className={
            compact
              ? "[&_button]:relative [&_button]:flex [&_button]:h-11 [&_button]:min-h-11 [&_button]:w-full [&_button]:min-w-11 [&_button]:items-center [&_button]:justify-center [&_button]:overflow-hidden [&_button]:px-0 [&_button]:text-[0px] [&_button]:before:text-lg [&_button]:before:font-black [&_button]:before:leading-none [&_button]:before:content-['↪']"
              : "[&_button]:min-h-11 [&_button]:w-full [&_button]:justify-center"
          }
          title={
            compact
              ? "Logout"
              : undefined
          }
        >
          <LogoutButton />
        </div>
      </div>
    </div>
  )
}
