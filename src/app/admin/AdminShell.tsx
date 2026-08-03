"use client"

import {
  useEffect,
  useState,
  type ReactNode,
} from "react"

import AdminSidebar from "./AdminSidebar"
import AdminTopbar from "./AdminTopbar"

type AdminShellProps = {
  children: ReactNode
  adminEmail?: string
}

export default function AdminShell({
  children,
  adminEmail,
}: AdminShellProps) {
  const [
    mobileNavigationOpen,
    setMobileNavigationOpen,
  ] = useState(false)

  const [
    sidebarCollapsed,
    setSidebarCollapsed,
  ] = useState(false)

  useEffect(() => {
    if (!mobileNavigationOpen) {
      return
    }

    const originalOverflow =
      document.body.style.overflow

    document.body.style.overflow =
      "hidden"

    function handleEscape(
      event: KeyboardEvent
    ) {
      if (event.key === "Escape") {
        setMobileNavigationOpen(false)
      }
    }

    window.addEventListener(
      "keydown",
      handleEscape
    )

    return () => {
      document.body.style.overflow =
        originalOverflow

      window.removeEventListener(
        "keydown",
        handleEscape
      )
    }
  }, [mobileNavigationOpen])

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <aside
        className={`fixed inset-y-0 left-0 z-40 hidden border-r border-slate-800 transition-[width] duration-200 lg:block ${
          sidebarCollapsed
            ? "w-[88px]"
            : "w-72"
        }`}
      >
        <AdminSidebar
          collapsed={
            sidebarCollapsed
          }
        />
      </aside>

      {mobileNavigationOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close admin navigation"
            onClick={() =>
              setMobileNavigationOpen(
                false
              )
            }
            className="absolute inset-0 bg-slate-950/65 backdrop-blur-sm"
          />

          <aside className="relative h-[100dvh] w-[86vw] max-w-80 overflow-hidden shadow-2xl">
            <button
              type="button"
              onClick={() =>
                setMobileNavigationOpen(
                  false
                )
              }
              aria-label="Close navigation"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-lg font-black text-white transition hover:bg-white/20"
            >
              ×
            </button>

            <AdminSidebar
              mobile
              onNavigate={() =>
                setMobileNavigationOpen(
                  false
                )
              }
            />
          </aside>
        </div>
      )}

      <div
        className={`min-h-screen transition-[padding] duration-200 ${
          sidebarCollapsed
            ? "lg:pl-[88px]"
            : "lg:pl-72"
        }`}
      >
        <AdminTopbar
          adminEmail={adminEmail}
          sidebarCollapsed={
            sidebarCollapsed
          }
          onOpenNavigation={() =>
            setMobileNavigationOpen(
              true
            )
          }
          onToggleSidebar={() =>
            setSidebarCollapsed(
              (current) => !current
            )
          }
        />

        <div className="min-h-[calc(100vh-4rem)]">
          {children}
        </div>
      </div>
    </div>
  )
}
