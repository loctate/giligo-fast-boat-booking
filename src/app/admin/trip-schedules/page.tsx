import Link from "next/link"
import { Query } from "node-appwrite"

import { requireAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import LogoutButton from "../LogoutButton"
import TripSchedulesManager, {
  type OperatorOption,
  type RouteOption,
  type TripScheduleRow,
  type VesselOption,
} from "./TripSchedulesManager"

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

function toBoolean(
  value: unknown
): boolean {
  return value === true
}

function toOperatorOption(
  row: AppwriteRow
): OperatorOption {
  return {
    $id: String(row.$id ?? ""),
    operatorCode: String(
      row.operatorCode ?? ""
    ),
    operatorName: String(
      row.operatorName ?? ""
    ),
    isActive: toBoolean(row.isActive),
  }
}

function toVesselOption(
  row: AppwriteRow
): VesselOption {
  return {
    $id: String(row.$id ?? ""),
    operatorId: String(
      row.operatorId ?? ""
    ),
    vesselCode: String(
      row.vesselCode ?? ""
    ),
    vesselName: String(
      row.vesselName ?? ""
    ),
    isActive: toBoolean(row.isActive),
  }
}

function toRouteOption(
  row: AppwriteRow
): RouteOption {
  return {
    $id: String(row.$id ?? ""),
    routeCode: String(
      row.routeCode ?? ""
    ),
    fromPort: String(
      row.fromPort ?? ""
    ),
    toPort: String(
      row.toPort ?? ""
    ),
    isActive: toBoolean(row.isActive),
  }
}

function toTripScheduleRow(
  row: AppwriteRow,
  operator?: OperatorOption,
  vessel?: VesselOption,
  route?: RouteOption
): TripScheduleRow {
  return {
    $id: String(row.$id ?? ""),
    $createdAt: String(
      row.$createdAt ?? ""
    ),

    $updatedAt: row.$updatedAt
      ? String(row.$updatedAt)
      : undefined,

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

    bookingCutoffMinutes: Number(
      row.bookingCutoffMinutes ?? 0
    ),

    isActive: toBoolean(row.isActive),
    notes: optionalString(row.notes),
    createdBy: optionalString(row.createdBy),
    updatedBy: optionalString(row.updatedBy),

    operatorCode:
      operator?.operatorCode ?? null,

    operatorName:
      operator?.operatorName ?? null,

    vesselCode:
      vessel?.vesselCode ?? null,

    vesselName:
      vessel?.vesselName ?? null,

    routeCode:
      route?.routeCode ?? null,

    fromPort:
      route?.fromPort ?? null,

    toPort:
      route?.toPort ?? null,
  }
}

function sortSchedules(
  schedules: TripScheduleRow[]
): TripScheduleRow[] {
  return [...schedules].sort(
    (firstSchedule, secondSchedule) => {
      const routeComparison = String(
        firstSchedule.routeCode ?? ""
      ).localeCompare(
        String(
          secondSchedule.routeCode ?? ""
        ),
        "en",
        {
          sensitivity: "base",
        }
      )

      if (routeComparison !== 0) {
        return routeComparison
      }

      return firstSchedule.departureTime.localeCompare(
        secondSchedule.departureTime
      )
    }
  )
}

async function getPageData() {
  const [
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

  const operators =
    operatorsResponse.rows
      .map((row) =>
        toOperatorOption(
          row as unknown as AppwriteRow
        )
      )
      .sort((first, second) =>
        first.operatorName.localeCompare(
          second.operatorName,
          "en",
          {
            sensitivity: "base",
          }
        )
      )

  const vessels =
    vesselsResponse.rows
      .map((row) =>
        toVesselOption(
          row as unknown as AppwriteRow
        )
      )
      .sort((first, second) =>
        first.vesselName.localeCompare(
          second.vesselName,
          "en",
          {
            sensitivity: "base",
          }
        )
      )

  const routes =
    routesResponse.rows
      .map((row) =>
        toRouteOption(
          row as unknown as AppwriteRow
        )
      )
      .sort((first, second) => {
        const fromComparison =
          first.fromPort.localeCompare(
            second.fromPort,
            "en",
            {
              sensitivity: "base",
            }
          )

        if (fromComparison !== 0) {
          return fromComparison
        }

        return first.toPort.localeCompare(
          second.toPort,
          "en",
          {
            sensitivity: "base",
          }
        )
      })

  const operatorsById = new Map(
    operators.map((operator) => [
      operator.$id,
      operator,
    ])
  )

  const vesselsById = new Map(
    vessels.map((vessel) => [
      vessel.$id,
      vessel,
    ])
  )

  const routesById = new Map(
    routes.map((route) => [
      route.$id,
      route,
    ])
  )

  const schedules = sortSchedules(
    schedulesResponse.rows.map((row) => {
      const plainRow =
        row as unknown as AppwriteRow

      return toTripScheduleRow(
        plainRow,
        operatorsById.get(
          String(plainRow.operatorId ?? "")
        ),
        vesselsById.get(
          String(plainRow.vesselId ?? "")
        ),
        routesById.get(
          String(plainRow.routeId ?? "")
        )
      )
    })
  )

  return {
    schedules,
    operators,
    vessels,
    routes,
  }
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
                Trip Schedule Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 2xl:block">
              {admin.email}
            </span>

            <Link
              href="/admin/operators"
              className="hidden rounded-full border border-cyan-400 px-4 py-2 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950 xl:inline-flex"
            >
              Operators
            </Link>

            <Link
              href="/admin/vessels"
              className="hidden rounded-full border border-blue-400 px-4 py-2 text-sm font-bold text-blue-200 transition hover:bg-blue-400 hover:text-slate-950 xl:inline-flex"
            >
              Vessels
            </Link>

<Link
  href="/admin/trip-inventory"
  className="hidden rounded-full border border-emerald-400 px-4 py-2 text-sm font-bold text-emerald-200 transition hover:bg-emerald-400 hover:text-slate-950 xl:inline-flex"
>
  Trip Inventory
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

        <TripSchedulesManager
          initialSchedules={schedules}
          operators={operators}
          vessels={vessels}
          routes={routes}
        />
      </section>
    </main>
  )
}