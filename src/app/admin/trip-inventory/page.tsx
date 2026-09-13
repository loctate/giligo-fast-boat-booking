import { requireAdmin } from "@/lib/admin-auth"
import { getTripInventoryPageDataD1 } from "@/lib/d1-trip-inventory"

import AdminShell from "../AdminShell"
import TripInventoryManager, {
  type ScheduleOption,
  type TripInventoryRow,
} from "./TripInventoryManager"

export const dynamic = "force-dynamic"

async function getPageData() {
  return getTripInventoryPageDataD1()
}

export default async function TripInventoryPage() {
  const admin = await requireAdmin()

  let inventory: TripInventoryRow[] = []
  let schedules: ScheduleOption[] = []
  let loadError = ""

  try {
    const pageData = await getPageData()

    inventory = pageData.inventory
    schedules = pageData.schedules
  } catch (error) {
    console.error(
      "Trip inventory page error:",
      error
    )

    loadError =
      error instanceof Error
        ? error.message
        : "Trip inventory data could not be loaded."
  }

  return (
    <AdminShell adminEmail={admin.email}>
      <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-10 text-white">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
            Daily operational inventory
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Trip Inventory
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
            Manage daily seat allocations,
            prices and sales status for each
            scheduled fast boat departure.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-10 lg:px-8">
        {loadError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-black">
              Trip inventory data could not
              be loaded
            </p>

            <p className="mt-1 text-sm">
              {loadError}
            </p>
          </div>
        )}

        <div className="mb-8 rounded-3xl border border-emerald-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">
                Panduan operasional inventory
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950">
                Update kursi, harga, dan status per tanggal keberangkatan
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600">
                Halaman ini dipakai untuk mengatur inventory harian yang tampil
                di pencarian customer. Pastikan data mengikuti konfirmasi terbaru
                dari vendor fast boat.
              </p>
            </div>

            <div className="rounded-2xl bg-amber-50 p-4 text-sm leading-6 text-amber-900 lg:max-w-md">
              <p className="font-black">Catatan penting</p>
              <p className="mt-1">
                Jangan menebak sisa kursi. Jika vendor belum memberi konfirmasi,
                gunakan status CLOSED agar jadwal tidak dijual dulu.
              </p>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-4">
            <div className="rounded-2xl bg-emerald-50 p-4">
              <p className="font-black text-emerald-900">1. Pilih schedule</p>
              <p className="mt-1 text-xs leading-5 text-emerald-800">
                Cek operator, kapal, rute, jam, dan tanggal keberangkatan.
              </p>
            </div>

            <div className="rounded-2xl bg-cyan-50 p-4">
              <p className="font-black text-cyan-900">2. Isi kursi</p>
              <p className="mt-1 text-xs leading-5 text-cyan-800">
                Seat capacity mengikuti alokasi kursi dari vendor.
              </p>
            </div>

            <div className="rounded-2xl bg-blue-50 p-4">
              <p className="font-black text-blue-900">3. Isi harga</p>
              <p className="mt-1 text-xs leading-5 text-blue-800">
                Masukkan harga dewasa, anak, dan bayi sesuai price list.
              </p>
            </div>

            <div className="rounded-2xl bg-rose-50 p-4">
              <p className="font-black text-rose-900">4. Set status</p>
              <p className="mt-1 text-xs leading-5 text-rose-800">
                OPEN bisa dijual, CLOSED ditutup, SOLD_OUT jika kursi habis.
              </p>
            </div>
          </div>
        </div>

        <TripInventoryManager
          initialInventory={inventory}
          schedules={schedules}
        />
      </section>
      </main>
    </AdminShell>
  )
}