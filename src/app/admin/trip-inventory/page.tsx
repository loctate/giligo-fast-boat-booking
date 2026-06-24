
import Link from "next/link"
import { Query } from "node-appwrite"

import { requireAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import LogoutButton from "../LogoutButton"
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
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-5 py-5 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-3xl font-black"
            >
              Gili{" "}
              <span className="text-cyan-300">
                Go
              </span>
            </Link>

            <span className="hidden h-7 w-px bg-slate-700 sm:block" />

            <div className="hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Administration
              </p>

              <p className="text-sm text-slate-400">
                Trip Inventory Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 2xl:block">
              {admin.email}
            </span>

            <Link
              href="/admin/trip-schedules"
              className="hidden rounded-full border border-amber-400 px-4 py-2 text-sm font-bold text-amber-200 transition hover:bg-amber-400 hover:text-slate-950 xl:inline-flex"
            >
              Trip Schedules
            </Link>

            <Link
              href="/admin/routes"
              className="hidden rounded-full border border-violet-400 px-4 py-2 text-sm font-bold text-violet-200 transition hover:bg-violet-400 hover:text-slate-950 xl:inline-flex"
            >
              Routes
            </Link>

            <Link
              href="/admin"
              className="rounded-full border border-white/25 px-5 py-2 text-sm font-bold transition hover:bg-white hover:text-slate-950"
            >
              Dashboard
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

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

        <TripInventoryManager
          initialInventory={inventory}
          schedules={schedules}
        />
      </section>
    </main>
  )
}