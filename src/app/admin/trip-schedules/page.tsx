import { requireAdmin } from "@/lib/admin-auth"
import { getTripSchedulesPageDataD1 } from "@/lib/d1-trip-schedules"

import AdminShell from "../AdminShell"
import TripSchedulesManager, {
  type OperatorOption,
  type RouteOption,
  type TripScheduleRow,
  type VesselOption,
} from "./TripSchedulesManager"

export const dynamic = "force-dynamic"

async function getPageData() {
  return getTripSchedulesPageDataD1()
}

export default async function TripSchedulesPage() {
  const admin = await requireAdmin()

  let schedules: TripScheduleRow[] = []
  let operators: OperatorOption[] = []
  let vessels: VesselOption[] = []
  let routes: RouteOption[] = []
  let loadError = ""

  try {
    const pageData = await getPageData()

    schedules = pageData.schedules
    operators = pageData.operators
    vessels = pageData.vessels
    routes = pageData.routes
  } catch (error) {
    console.error(
      "Trip schedules page error:",
      error
    )

    loadError =
      error instanceof Error
        ? error.message
        : "Trip schedule data could not be loaded."
  }

  return (
    <AdminShell adminEmail={admin.email}>
      <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-10 text-white">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
            Inventory master data
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Trip Schedules
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
            Connect operators, vessels and
            routes with recurring departure
            times, arrival times and operating
            days.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-10 lg:px-8">
        {loadError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-black">
              Trip schedule data could not be
              loaded
            </p>

            <p className="mt-1 text-sm">
              {loadError}
            </p>
          </div>
        )}

        <div className="mb-8 rounded-3xl border border-cyan-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">
                Panduan master jadwal
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Buat jadwal dasar sebelum membuat inventory
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
                Trip Schedule adalah jadwal berulang dari vendor. Setelah schedule
                dibuat, admin baru membuat inventory harian di halaman Trip Inventory.
              </p>
            </div>

            <div className="rounded-2xl bg-sky-50 p-4 text-sm leading-6 text-sky-900 lg:max-w-md">
              <p className="font-black">Alur yang benar</p>
              <p className="mt-1">
                Operators → Vessels → Routes → Trip Schedules → Trip Inventory.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-cyan-50 p-4">
              <p className="font-black text-cyan-900">1. Operator</p>
              <p className="mt-1 text-xs leading-5 text-cyan-800">
                Pilih vendor fast boat yang menjalankan jadwal.
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="font-black text-blue-900">2. Vessel</p>
              <p className="mt-1 text-xs leading-5 text-blue-800">
                Pilih kapal yang terhubung dengan operator.
              </p>
            </div>

            <div className="rounded-2xl bg-violet-50 p-4">
              <p className="font-black text-violet-900">3. Route</p>
              <p className="mt-1 text-xs leading-5 text-violet-800">
                Pilih rute asal dan tujuan yang benar.
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4">
              <p className="font-black text-amber-900">4. Time</p>
              <p className="mt-1 text-xs leading-5 text-amber-800">
                Isi jam berangkat, jam tiba, dan hari operasi.
              </p>
            </div>
          </div>
        </div>

        <TripSchedulesManager
          initialSchedules={schedules}
          operators={operators}
          vessels={vessels}
          routes={routes}
        />
      </section>
      </main>
    </AdminShell>
  )
}