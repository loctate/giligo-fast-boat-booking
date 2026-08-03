
import { Query } from "node-appwrite"

import { requireAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import AdminShell from "../AdminShell"
import TripInventoryManager, {
  type ScheduleOption,
  type TripInventoryRow,
} from "./TripInventoryManager"

export const dynamic = "force-dynamic"

type AppwriteRow = Record<string, unknown>

function optionalString(
  value: unknown
): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const normalizedValue = String(value).trim()

  return normalizedValue || null
}

function toBoolean(value: unknown): boolean {
  return value === true
}

function toScheduleOption(
  row: AppwriteRow,
  operator?: AppwriteRow,
  vessel?: AppwriteRow,
  route?: AppwriteRow
): ScheduleOption {
  return {
    $id: String(row.$id ?? ""),

    scheduleCode: String(
      row.scheduleCode ?? ""
    ),

    operatorId: String(
      row.operatorId ?? ""
    ),

    vesselId: String(
      row.vesselId ?? ""
    ),

    routeId: String(
      row.routeId ?? ""
    ),

    departureTime: String(
      row.departureTime ?? ""
    ),

    arrivalTime: String(
      row.arrivalTime ?? ""
    ),

    arrivalDayOffset: Number(
      row.arrivalDayOffset ?? 0
    ),

    operatingDays: String(
      row.operatingDays ?? ""
    ),

    isActive: toBoolean(row.isActive),

    operatorName: operator
      ? String(operator.operatorName ?? "")
      : "",

    vesselName: vessel
      ? String(vessel.vesselName ?? "")
      : "",

    vesselActiveCapacity: vessel
      ? Number(vessel.activeCapacity ?? 0)
      : 0,

    routeCode: route
      ? String(route.routeCode ?? "")
      : "",

    fromPort: route
      ? String(route.fromPort ?? "")
      : "",

    toPort: route
      ? String(route.toPort ?? "")
      : "",
  }
}

function toInventoryRow(
  row: AppwriteRow,
  schedule?: AppwriteRow,
  operator?: AppwriteRow,
  vessel?: AppwriteRow,
  route?: AppwriteRow
): TripInventoryRow {
  const seatCapacity = Number(
    row.seatCapacity ?? 0
  )

  const bookedSeats = Number(
    row.bookedSeats ?? 0
  )

  const heldSeats = Number(
    row.heldSeats ?? 0
  )

  return {
    $id: String(row.$id ?? ""),

    $createdAt: String(
      row.$createdAt ?? ""
    ),

    $updatedAt: row.$updatedAt
      ? String(row.$updatedAt)
      : undefined,

    inventoryCode: String(
      row.inventoryCode ?? ""
    ),

    scheduleId: String(
      row.scheduleId ?? ""
    ),

    operatorId: String(
      row.operatorId ?? ""
    ),

    vesselId: String(
      row.vesselId ?? ""
    ),

    routeId: String(
      row.routeId ?? ""
    ),

    travelDate: String(
      row.travelDate ?? ""
    ),

    departureTime: String(
      row.departureTime ?? ""
    ),

    arrivalTime: String(
      row.arrivalTime ?? ""
    ),

    arrivalDayOffset: Number(
      row.arrivalDayOffset ?? 0
    ),

    seatCapacity,
    bookedSeats,
    heldSeats,

    availableSeats: Math.max(
      0,
      seatCapacity -
        bookedSeats -
        heldSeats
    ),

    adultPrice: Number(
      row.adultPrice ?? 0
    ),

    childPrice: Number(
      row.childPrice ?? 0
    ),

    infantPrice: Number(
      row.infantPrice ?? 0
    ),

    currency: String(
      row.currency ?? "IDR"
    ),

    salesStatus: String(
      row.salesStatus ?? "CLOSED"
    ),

    isActive: toBoolean(row.isActive),

    notes: optionalString(row.notes),

    createdBy: optionalString(
      row.createdBy
    ),

    updatedBy: optionalString(
      row.updatedBy
    ),

    scheduleCode: schedule
      ? optionalString(
          schedule.scheduleCode
        )
      : null,

    operatorName: operator
      ? optionalString(
          operator.operatorName
        )
      : null,

    vesselName: vessel
      ? optionalString(
          vessel.vesselName
        )
      : null,

    routeCode: route
      ? optionalString(route.routeCode)
      : null,

    fromPort: route
      ? optionalString(route.fromPort)
      : null,

    toPort: route
      ? optionalString(route.toPort)
      : null,
  }
}

function sortInventory(
  inventory: TripInventoryRow[]
): TripInventoryRow[] {
  return [...inventory].sort(
    (firstItem, secondItem) => {
      const dateComparison =
        firstItem.travelDate.localeCompare(
          secondItem.travelDate
        )

      if (dateComparison !== 0) {
        return dateComparison
      }

      return firstItem.departureTime.localeCompare(
        secondItem.departureTime
      )
    }
  )
}

async function getPageData() {
  const [
    inventoryResponse,
    schedulesResponse,
    operatorsResponse,
    vesselsResponse,
    routesResponse,
  ] = await Promise.all([
    tablesDB.listRows({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig
          .tripInventoryTableId,

      queries: [Query.limit(200)],
    }),

    tablesDB.listRows({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig
          .tripSchedulesTableId,

      queries: [Query.limit(200)],
    }),

    tablesDB.listRows({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig.operatorsTableId,

      queries: [Query.limit(200)],
    }),

    tablesDB.listRows({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig.vesselsTableId,

      queries: [Query.limit(200)],
    }),

    tablesDB.listRows({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig.routesTableId,

      queries: [Query.limit(200)],
    }),
  ])

  const operatorsById = new Map<
    string,
    AppwriteRow
  >()

  for (
    const operator of
    operatorsResponse.rows
  ) {
    const plainOperator =
      operator as unknown as AppwriteRow

    operatorsById.set(
      String(plainOperator.$id ?? ""),
      plainOperator
    )
  }

  const vesselsById = new Map<
    string,
    AppwriteRow
  >()

  for (
    const vessel of
    vesselsResponse.rows
  ) {
    const plainVessel =
      vessel as unknown as AppwriteRow

    vesselsById.set(
      String(plainVessel.$id ?? ""),
      plainVessel
    )
  }

  const routesById = new Map<
    string,
    AppwriteRow
  >()

  for (const route of routesResponse.rows) {
    const plainRoute =
      route as unknown as AppwriteRow

    routesById.set(
      String(plainRoute.$id ?? ""),
      plainRoute
    )
  }

  const schedulesById = new Map<
    string,
    AppwriteRow
  >()

  const schedules =
    schedulesResponse.rows
      .map((row) => {
        const plainSchedule =
          row as unknown as AppwriteRow

        schedulesById.set(
          String(plainSchedule.$id ?? ""),
          plainSchedule
        )

        return toScheduleOption(
          plainSchedule,

          operatorsById.get(
            String(
              plainSchedule.operatorId ??
                ""
            )
          ),

          vesselsById.get(
            String(
              plainSchedule.vesselId ?? ""
            )
          ),

          routesById.get(
            String(
              plainSchedule.routeId ?? ""
            )
          )
        )
      })
      .sort((first, second) => {
        const routeComparison =
          first.routeCode.localeCompare(
            second.routeCode,
            "en",
            {
              sensitivity: "base",
            }
          )

        if (routeComparison !== 0) {
          return routeComparison
        }

        return first.departureTime.localeCompare(
          second.departureTime
        )
      })

  const inventory = sortInventory(
    inventoryResponse.rows.map((row) => {
      const plainInventory =
        row as unknown as AppwriteRow

      return toInventoryRow(
        plainInventory,

        schedulesById.get(
          String(
            plainInventory.scheduleId ?? ""
          )
        ),

        operatorsById.get(
          String(
            plainInventory.operatorId ?? ""
          )
        ),

        vesselsById.get(
          String(
            plainInventory.vesselId ?? ""
          )
        ),

        routesById.get(
          String(
            plainInventory.routeId ?? ""
          )
        )
      )
    })
  )

  return {
    inventory,
    schedules,
  }
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