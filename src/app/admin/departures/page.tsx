import Link from "next/link"
import { Query } from "node-appwrite"

import { requireAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"
import {
  getCurrentBaliDate,
  isValidDateOnly,
} from "@/lib/bali-date"

import AdminShell from "../AdminShell"

export const dynamic = "force-dynamic"

type AppwriteRow =
  Record<string, unknown>

type DepartureInventory = {
  $id: string

  inventoryCode: string
  travelDate: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  seatCapacity: number
  bookedSeats: number
  heldSeats: number
  availableSeats: number

  salesStatus: string
  isActive: boolean

  scheduleCode: string
  operatorName: string
  vesselName: string
  routeCode: string
  fromPort: string
  toPort: string
}

type DeparturePageProps = {
  searchParams: Promise<{
    date?: string | string[]
    q?: string | string[]
  }>
}

function getSearchParam(
  value: string | string[] | undefined
): string {
  return Array.isArray(value)
    ? String(value[0] ?? "").trim()
    : String(value ?? "").trim()
}

function normalizeSearchValue(
  value: unknown
): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
}

function optionalString(
  value: unknown
): string {
  return String(value ?? "").trim()
}

function toInteger(
  value: unknown
): number {
  const parsedValue = Number(value)

  return Number.isInteger(parsedValue)
    ? parsedValue
    : 0
}

function formatTravelDate(
  value: string
): string {
  const match =
    /^(\d{4})-(\d{2})-(\d{2})$/.exec(
      value
    )

  if (!match) {
    return value
  }

  const date = new Date(
    Date.UTC(
      Number(match[1]),
      Number(match[2]) - 1,
      Number(match[3])
    )
  )

  return new Intl.DateTimeFormat(
    "en-GB",
    {
      weekday: "long",
      day: "2-digit",
      month: "long",
      year: "numeric",
      timeZone: "UTC",
    }
  ).format(date)
}

function salesStatusClass(
  status: string
): string {
  const normalizedStatus =
    status.trim().toUpperCase()

  if (normalizedStatus === "OPEN") {
    return "bg-emerald-100 text-emerald-800"
  }

  if (
    normalizedStatus === "SOLD_OUT"
  ) {
    return "bg-red-100 text-red-800"
  }

  if (
    normalizedStatus === "CANCELLED"
  ) {
    return "bg-rose-100 text-rose-800"
  }

  return "bg-slate-200 text-slate-700"
}

async function getRowMap(
  tableId: string
): Promise<Map<string, AppwriteRow>> {
  const response =
    await tablesDB.listRows({
      databaseId:
        appwriteConfig.databaseId,

      tableId,

      queries: [
        Query.limit(200),
      ],
    })

  const rowsById =
    new Map<string, AppwriteRow>()

  for (const row of response.rows) {
    const item =
      row as unknown as AppwriteRow

    rowsById.set(
      optionalString(item.$id),
      item
    )
  }

  return rowsById
}

async function getDepartures(
  travelDate: string
): Promise<DepartureInventory[]> {
  const [
    inventoryResponse,
    schedulesById,
    operatorsById,
    vesselsById,
    routesById,
  ] = await Promise.all([
    tablesDB.listRows({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig
          .tripInventoryTableId,

      queries: [
        Query.equal(
          "travelDate",
          travelDate
        ),
        Query.limit(200),
      ],
    }),

    getRowMap(
      appwriteConfig
        .tripSchedulesTableId
    ),

    getRowMap(
      appwriteConfig.operatorsTableId
    ),

    getRowMap(
      appwriteConfig.vesselsTableId
    ),

    getRowMap(
      appwriteConfig.routesTableId
    ),
  ])

  return inventoryResponse.rows
    .map((row) => {
      const inventory =
        row as unknown as AppwriteRow

      const schedule =
        schedulesById.get(
          optionalString(
            inventory.scheduleId
          )
        )

      const operator =
        operatorsById.get(
          optionalString(
            inventory.operatorId
          )
        )

      const vessel =
        vesselsById.get(
          optionalString(
            inventory.vesselId
          )
        )

      const route =
        routesById.get(
          optionalString(
            inventory.routeId
          )
        )

      const seatCapacity =
        toInteger(
          inventory.seatCapacity
        )

      const bookedSeats =
        toInteger(
          inventory.bookedSeats
        )

      const heldSeats =
        toInteger(
          inventory.heldSeats
        )

      return {
        $id:
          optionalString(
            inventory.$id
          ),

        inventoryCode:
          optionalString(
            inventory.inventoryCode
          ),

        travelDate:
          optionalString(
            inventory.travelDate
          ),

        departureTime:
          optionalString(
            inventory.departureTime
          ),

        arrivalTime:
          optionalString(
            inventory.arrivalTime
          ),

        arrivalDayOffset:
          toInteger(
            inventory.arrivalDayOffset
          ),

        seatCapacity,
        bookedSeats,
        heldSeats,

        availableSeats:
          Math.max(
            0,
            seatCapacity -
              bookedSeats -
              heldSeats
          ),

        salesStatus:
          optionalString(
            inventory.salesStatus
          ) || "CLOSED",

        isActive:
          inventory.isActive === true,

        scheduleCode:
          optionalString(
            schedule?.scheduleCode
          ),

        operatorName:
          optionalString(
            operator?.operatorName
          ) || "Operator unavailable",

        vesselName:
          optionalString(
            vessel?.vesselName
          ) || "Vessel unavailable",

        routeCode:
          optionalString(
            route?.routeCode
          ),

        fromPort:
          optionalString(
            route?.fromPort
          ) || "Departure unavailable",

        toPort:
          optionalString(
            route?.toPort
          ) || "Destination unavailable",
      }
    })
    .sort((first, second) =>
      first.departureTime.localeCompare(
        second.departureTime
      )
    )
}

export default async function DepartureOperationsPage({
  searchParams,
}: DeparturePageProps) {
  const admin = await requireAdmin()
  const params = await searchParams

  const requestedDate =
    getSearchParam(params.date)

  const selectedDate =
    isValidDateOnly(requestedDate)
      ? requestedDate
      : getCurrentBaliDate()

  const searchQuery =
    getSearchParam(params.q)

  const normalizedSearchQuery =
    normalizeSearchValue(
      searchQuery
    )

  let departures:
    DepartureInventory[] = []

  let loadError = ""

  try {
    departures =
      await getDepartures(
        selectedDate
      )
  } catch (error) {
    console.error(
      "Departure operations error:",
      error
    )

    loadError =
      error instanceof Error
        ? error.message
        : "Departure data could not be loaded."
  }

  const filteredDepartures =
    departures.filter((departure) => {
      if (!normalizedSearchQuery) {
        return true
      }

      const searchableValues = [
        departure.inventoryCode,
        departure.scheduleCode,
        departure.operatorName,
        departure.vesselName,
        departure.routeCode,
        departure.fromPort,
        departure.toPort,
        departure.departureTime,
        departure.salesStatus,
      ]

      return searchableValues.some(
        (value) =>
          normalizeSearchValue(
            value
          ).includes(
            normalizedSearchQuery
          )
      )
    })

  const totalCapacity =
    filteredDepartures.reduce(
      (total, departure) =>
        total +
        departure.seatCapacity,
      0
    )

  const totalBooked =
    filteredDepartures.reduce(
      (total, departure) =>
        total +
        departure.bookedSeats,
      0
    )

  const totalHeld =
    filteredDepartures.reduce(
      (total, departure) =>
        total +
        departure.heldSeats,
      0
    )

  const totalAvailable =
    filteredDepartures.reduce(
      (total, departure) =>
        total +
        departure.availableSeats,
      0
    )

  return (
    <AdminShell adminEmail={admin.email}>
      <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-11 text-white">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
            Daily departure control
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Departure Operations
          </h1>

          <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
            Review each scheduled departure,
            seat allocation and manifest readiness
            using Bali/WITA operational dates.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-10 lg:px-8">
        {loadError && (
          <div className="mb-7 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-black">
              Departure data could not be loaded
            </p>

            <p className="mt-2 text-sm">
              {loadError}
            </p>
          </div>
        )}

        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                Selected operational date
              </p>

              <h2 className="mt-2 text-2xl font-black">
                {formatTravelDate(
                  selectedDate
                )}
              </h2>

              <p className="mt-2 text-sm text-slate-500">
                Date calculations follow
                Asia/Makassar (WITA).
              </p>
            </div>

            <form
              method="GET"
              action="/admin/departures"
              className="grid w-full gap-3 sm:grid-cols-[180px_minmax(220px,1fr)_auto_auto] lg:max-w-3xl"
            >
              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Travel date
                </span>

                <input
                  type="date"
                  name="date"
                  defaultValue={
                    selectedDate
                  }
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <label>
                <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                  Search departure
                </span>

                <input
                  type="search"
                  name="q"
                  defaultValue={
                    searchQuery
                  }
                  placeholder="Operator, vessel, route, inventory..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                />
              </label>

              <button
                type="submit"
                className="self-end rounded-xl bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
              >
                Apply
              </button>

              <Link
                href="/admin/departures"
                className="self-end rounded-xl border border-slate-300 bg-white px-5 py-3 text-center text-sm font-black text-slate-700 transition hover:bg-slate-100"
              >
                Today
              </Link>
            </form>
          </div>
        </section>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Departures
            </p>

            <p className="mt-2 text-3xl font-black">
              {filteredDepartures.length}
            </p>
          </article>

          <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Capacity
            </p>

            <p className="mt-2 text-3xl font-black">
              {totalCapacity}
            </p>
          </article>

          <article className="rounded-2xl border border-emerald-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-emerald-600">
              Booked
            </p>

            <p className="mt-2 text-3xl font-black text-emerald-700">
              {totalBooked}
            </p>
          </article>

          <article className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-amber-600">
              Held
            </p>

            <p className="mt-2 text-3xl font-black text-amber-700">
              {totalHeld}
            </p>
          </article>

          <article className="rounded-2xl border border-cyan-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-cyan-600">
              Available
            </p>

            <p className="mt-2 text-3xl font-black text-cyan-700">
              {totalAvailable}
            </p>
          </article>
        </div>

        {filteredDepartures.length === 0 ? (
          <section className="mt-7 rounded-3xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <div className="text-5xl">
              🚤
            </div>

            <h2 className="mt-5 text-2xl font-black">
              No departures found
            </h2>

            <p className="mx-auto mt-2 max-w-xl leading-7 text-slate-500">
              No Trip Inventory matches this
              operational date and search.
              Check Trip Inventory or select another date.
            </p>

            <Link
              href="/admin/trip-inventory"
              className="mt-6 inline-flex rounded-xl bg-slate-950 px-6 py-3 font-black text-white transition hover:bg-cyan-700"
            >
              Open Trip Inventory
            </Link>
          </section>
        ) : (
          <section className="mt-7 grid gap-5 lg:grid-cols-2">
            {filteredDepartures.map(
              (departure) => (
                <article
                  key={departure.$id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm"
                >
                  <div className="border-b border-slate-100 p-6">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-700">
                          {departure.operatorName}
                        </p>

                        <h2 className="mt-2 text-2xl font-black">
                          {departure.fromPort}

                          <span className="mx-2 text-cyan-600">
                            →
                          </span>

                          {departure.toPort}
                        </h2>

                        <p className="mt-2 text-sm font-bold text-slate-500">
                          {departure.vesselName}
                        </p>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${salesStatusClass(
                            departure.salesStatus
                          )}`}
                        >
                          {departure.salesStatus}
                        </span>

                        {!departure.isActive && (
                          <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                            INACTIVE
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-6 grid gap-4 rounded-2xl bg-slate-50 p-4 sm:grid-cols-3">
                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Departure
                        </p>

                        <p className="mt-1 text-xl font-black">
                          {departure.departureTime}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Arrival
                        </p>

                        <p className="mt-1 text-xl font-black">
                          {departure.arrivalTime}

                          {departure.arrivalDayOffset > 0 && (
                            <span className="ml-1 text-xs text-cyan-700">
                              +{departure.arrivalDayOffset}d
                            </span>
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                          Schedule
                        </p>

                        <p className="mt-1 break-all text-sm font-black">
                          {departure.scheduleCode || "-"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                      Inventory code
                    </p>

                    <p className="mt-2 break-all font-black text-slate-950">
                      {departure.inventoryCode}
                    </p>

                    <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
                      <div className="rounded-2xl bg-slate-100 p-4">
                        <p className="text-xs font-bold text-slate-500">
                          Capacity
                        </p>

                        <p className="mt-1 text-2xl font-black">
                          {departure.seatCapacity}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-emerald-50 p-4">
                        <p className="text-xs font-bold text-emerald-700">
                          Booked
                        </p>

                        <p className="mt-1 text-2xl font-black text-emerald-800">
                          {departure.bookedSeats}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-amber-50 p-4">
                        <p className="text-xs font-bold text-amber-700">
                          Held
                        </p>

                        <p className="mt-1 text-2xl font-black text-amber-800">
                          {departure.heldSeats}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-cyan-50 p-4">
                        <p className="text-xs font-bold text-cyan-700">
                          Available
                        </p>

                        <p className="mt-1 text-2xl font-black text-cyan-800">
                          {departure.availableSeats}
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                      <Link
                        href={`/admin/departures/${departure.$id}/manifest`}
                        className="inline-flex flex-1 items-center justify-center rounded-xl bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
                      >
                        View Manifest
                      </Link>

                      <Link
                        href="/admin/trip-inventory"
                        className="inline-flex justify-center rounded-xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-100"
                      >
                        Review Inventory
                      </Link>
                    </div>
                  </div>
                </article>
              )
            )}
          </section>
        )}
      </section>
      </main>
    </AdminShell>
  )
}
