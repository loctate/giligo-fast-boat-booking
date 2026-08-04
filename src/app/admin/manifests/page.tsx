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

type ManifestDeparture = {
  $id: string
  inventoryCode: string
  travelDate: string
  departureTime: string
  arrivalTime: string

  seatCapacity: number
  bookedSeats: number
  heldSeats: number
  availableSeats: number

  salesStatus: string
  isActive: boolean

  operatorName: string
  vesselName: string
  routeCode: string
  fromPort: string
  toPort: string
}

type ManifestIndexProps = {
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

function cleanText(
  value: unknown
): string {
  return String(value ?? "").trim()
}

function normalizeSearch(
  value: unknown
): string {
  return cleanText(value)
    .replace(/\s+/g, " ")
    .toLowerCase()
}

function toInteger(
  value: unknown
): number {
  const parsed = Number(value)

  return Number.isInteger(parsed)
    ? parsed
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

  const rows =
    new Map<string, AppwriteRow>()

  for (const row of response.rows) {
    const item =
      row as unknown as AppwriteRow

    rows.set(
      cleanText(item.$id),
      item
    )
  }

  return rows
}

async function getManifestDepartures(
  travelDate: string
): Promise<ManifestDeparture[]> {
  const [
    inventoryResponse,
    operators,
    vessels,
    routes,
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

      const operator =
        operators.get(
          cleanText(
            inventory.operatorId
          )
        )

      const vessel =
        vessels.get(
          cleanText(
            inventory.vesselId
          )
        )

      const route =
        routes.get(
          cleanText(
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
          cleanText(
            inventory.$id
          ),

        inventoryCode:
          cleanText(
            inventory.inventoryCode
          ),

        travelDate:
          cleanText(
            inventory.travelDate
          ),

        departureTime:
          cleanText(
            inventory.departureTime
          ),

        arrivalTime:
          cleanText(
            inventory.arrivalTime
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
          cleanText(
            inventory.salesStatus
          ) || "CLOSED",

        isActive:
          inventory.isActive === true,

        operatorName:
          cleanText(
            operator?.operatorName
          ) || "Operator unavailable",

        vesselName:
          cleanText(
            vessel?.vesselName
          ) || "Vessel unavailable",

        routeCode:
          cleanText(
            route?.routeCode
          ),

        fromPort:
          cleanText(
            route?.fromPort
          ) || "Departure unavailable",

        toPort:
          cleanText(
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

export default async function ManifestIndexPage({
  searchParams,
}: ManifestIndexProps) {
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

  const normalizedQuery =
    normalizeSearch(searchQuery)

  let departures:
    ManifestDeparture[] = []

  let loadError = ""

  try {
    departures =
      await getManifestDepartures(
        selectedDate
      )
  } catch (error) {
    console.error(
      "Manifest index load error:",
      error
    )

    loadError =
      error instanceof Error
        ? error.message
        : "Manifest departures could not be loaded."
  }

  const filteredDepartures =
    departures.filter((departure) => {
      if (!normalizedQuery) {
        return true
      }

      return [
        departure.inventoryCode,
        departure.operatorName,
        departure.vesselName,
        departure.routeCode,
        departure.fromPort,
        departure.toPort,
        departure.departureTime,
      ].some((value) =>
        normalizeSearch(value).includes(
          normalizedQuery
        )
      )
    })

  return (
    <AdminShell
      adminEmail={admin.email}
    >
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-10 text-white">
          <div className="mx-auto max-w-[1500px] px-5 lg:px-8">
            <p className="text-sm font-black uppercase tracking-[0.18em] text-cyan-200">
              Agent booking coordination
            </p>

            <h1 className="mt-2 text-3xl font-black sm:text-4xl">
              Passenger Manifests
            </h1>

            <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
              Select a departure to review
              booking and passenger details.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1500px] px-5 py-10 lg:px-8">
          {loadError && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
              <p className="font-black">
                Manifest data could not be loaded
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
                  Selected departure date
                </p>

                <h2 className="mt-2 text-2xl font-black">
                  {formatTravelDate(
                    selectedDate
                  )}
                </h2>

                <p className="mt-2 text-sm text-slate-500">
                  Operational dates follow
                  Asia/Makassar (WITA).
                </p>
              </div>

              <form
                method="GET"
                action="/admin/manifests"
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
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <label>
                  <span className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
                    Search manifest
                  </span>

                  <input
                    type="search"
                    name="q"
                    defaultValue={
                      searchQuery
                    }
                    placeholder="Operator, vessel, route, inventory..."
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-cyan-500 focus:ring-4 focus:ring-cyan-100"
                  />
                </label>

                <button
                  type="submit"
                  className="self-end rounded-xl bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
                >
                  Apply
                </button>

                <Link
                  href="/admin/manifests"
                  className="self-end rounded-xl border border-slate-300 px-5 py-3 text-center text-sm font-black text-slate-700 transition hover:bg-slate-100"
                >
                  Today
                </Link>
              </form>
            </div>
          </section>

          <div className="mt-6 flex items-center justify-between gap-4">
            <p className="text-sm font-bold text-slate-500">
              {filteredDepartures.length} departure
              {filteredDepartures.length === 1
                ? ""
                : "s"}
            </p>

            <Link
              href={`/admin/departures?date=${encodeURIComponent(
                selectedDate
              )}`}
              className="text-sm font-black text-cyan-700 hover:text-cyan-900"
            >
              Open Departure Operations →
            </Link>
          </div>

          {filteredDepartures.length === 0 ? (
            <section className="mt-6 rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
              <div className="text-5xl">
                ☷
              </div>

              <h2 className="mt-5 text-2xl font-black">
                No manifest departures found
              </h2>

              <p className="mt-2 text-slate-500">
                Select another date or review
                Trip Inventory.
              </p>
            </section>
          ) : (
            <section className="mt-6 grid gap-5 lg:grid-cols-2">
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
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-700">
                            {departure.salesStatus}
                          </span>

                          {!departure.isActive && (
                            <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">
                              INACTIVE
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <div className="rounded-xl bg-slate-50 p-3">
                          <p className="text-xs text-slate-500">
                            Departure
                          </p>

                          <p className="mt-1 font-black">
                            {departure.departureTime}
                          </p>
                        </div>

                        <div className="rounded-xl bg-emerald-50 p-3">
                          <p className="text-xs text-emerald-700">
                            Booked
                          </p>

                          <p className="mt-1 font-black text-emerald-800">
                            {departure.bookedSeats}
                          </p>
                        </div>

                        <div className="rounded-xl bg-amber-50 p-3">
                          <p className="text-xs text-amber-700">
                            Held
                          </p>

                          <p className="mt-1 font-black text-amber-800">
                            {departure.heldSeats}
                          </p>
                        </div>

                        <div className="rounded-xl bg-cyan-50 p-3">
                          <p className="text-xs text-cyan-700">
                            Available
                          </p>

                          <p className="mt-1 font-black text-cyan-800">
                            {departure.availableSeats}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="p-6">
                      <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                        Inventory code
                      </p>

                      <p className="mt-2 break-all font-black">
                        {departure.inventoryCode}
                      </p>

                      <Link
                        href={`/admin/departures/${departure.$id}/manifest`}
                        className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-cyan-700 px-5 py-3 text-sm font-black text-white transition hover:bg-cyan-800"
                      >
                        Open Manifest
                      </Link>
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
