import { Query } from "node-appwrite"

import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import {
  validateCustomerTravelDate,
} from "@/lib/bali-date"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AppwriteRow = Record<string, unknown>

type PublicTrip = {
  tripInventoryId: string
  inventoryCode: string

  scheduleId: string
  scheduleCode: string

  operatorId: string
  operatorCode: string
  operatorName: string

  vesselId: string
  vesselCode: string
  vesselName: string

  routeId: string
  routeCode: string
  fromPort: string
  toPort: string
  fromIsland: string | null
  toIsland: string | null

  travelDate: string
  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  availableSeats: number

  adultPrice: number
  childPrice: number
  infantPrice: number
  currency: string
}

function optionalText(
  value: unknown
): string | null {
  const normalizedValue = String(
    value ?? ""
  ).trim()

  return normalizedValue || null
}

function normalizeSearchText(
  value: unknown
): string {
  return String(value ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
}

function toInteger(
  value: unknown
): number | null {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return null
  }

  const parsedValue = Number(value)

  return Number.isInteger(parsedValue)
    ? parsedValue
    : null
}

function getErrorCode(
  error: unknown
): number | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error
  ) {
    const code = Number(
      (error as { code?: unknown }).code
    )

    return Number.isFinite(code)
      ? code
      : null
  }

  return null
}

async function getRowOrNull(
  tableId: string,
  rowId: string
): Promise<AppwriteRow | null> {
  try {
    const row = await tablesDB.getRow({
      databaseId:
        appwriteConfig.databaseId,

      tableId,
      rowId,
    })

    return row as unknown as AppwriteRow
  } catch (error) {
    if (getErrorCode(error) === 404) {
      return null
    }

    throw error
  }
}

async function getRowsByIds(
  tableId: string,
  rowIds: string[]
): Promise<Map<string, AppwriteRow>> {
  const uniqueIds = [
    ...new Set(
      rowIds
        .map((rowId) => rowId.trim())
        .filter(Boolean)
    ),
  ]

  const rows = await Promise.all(
    uniqueIds.map((rowId) =>
      getRowOrNull(tableId, rowId)
    )
  )

  const rowsById = new Map<
    string,
    AppwriteRow
  >()

  rows.forEach((row, index) => {
    if (row) {
      rowsById.set(
        uniqueIds[index],
        row
      )
    }
  })

  return rowsById
}

function noStoreJson(
  body: unknown,
  status = 200
) {
  return Response.json(body, {
    status,

    headers: {
      "Cache-Control":
        "no-store, max-age=0",
    },
  })
}

export async function GET(
  request: Request
) {
  try {
    const requestUrl = new URL(
      request.url
    )

    const fromPort = String(
      requestUrl.searchParams.get(
        "fromPort"
      ) ?? ""
    )
      .trim()
      .replace(/\s+/g, " ")

    const toPort = String(
      requestUrl.searchParams.get(
        "toPort"
      ) ?? ""
    )
      .trim()
      .replace(/\s+/g, " ")

    const travelDate =
      requestUrl.searchParams.get(
        "travelDate"
      )

    const passengersValue =
      requestUrl.searchParams.get(
        "passengers"
      )

    const passengers =
      passengersValue === null
        ? 1
        : toInteger(passengersValue)

    if (!fromPort) {
      return noStoreJson(
        {
          success: false,
          error:
            "Departure port is required.",
        },
        400
      )
    }

    if (!toPort) {
      return noStoreJson(
        {
          success: false,
          error:
            "Destination port is required.",
        },
        400
      )
    }

    if (
      normalizeSearchText(fromPort) ===
      normalizeSearchText(toPort)
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            "Departure and destination ports cannot be the same.",
        },
        400
      )
    }

    const travelDateValidation =
      validateCustomerTravelDate(
        travelDate
      )

    if (!travelDateValidation.valid) {
      return noStoreJson(
        {
          success: false,
          minimumDate:
            travelDateValidation.minimumDate,
          error:
            travelDateValidation.error,
        },
        400
      )
    }

    if (
      passengers === null ||
      passengers < 1 ||
      passengers > 20
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            "Passengers must be an integer between 1 and 20.",
        },
        400
      )
    }

    const routesResponse =
      await tablesDB.listRows({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig.routesTableId,

        queries: [
          Query.limit(200),
        ],
      })

    const matchedRoutes =
      routesResponse.rows
        .map(
          (row) =>
            row as unknown as AppwriteRow
        )
        .filter((route) => {
          if (route.isActive !== true) {
            return false
          }

          return (
            normalizeSearchText(
              route.fromPort
            ) ===
              normalizeSearchText(
                fromPort
              ) &&
            normalizeSearchText(
              route.toPort
            ) ===
              normalizeSearchText(toPort)
          )
        })

    if (matchedRoutes.length === 0) {
      return noStoreJson({
        success: true,
        minimumDate:
          travelDateValidation.minimumDate,

        search: {
          fromPort,
          toPort,
          travelDate:
            travelDateValidation.travelDate,
          passengers,
        },

        total: 0,
        trips: [],
      })
    }

    const inventoryResponses =
      await Promise.all(
        matchedRoutes.map((route) =>
          tablesDB.listRows({
            databaseId:
              appwriteConfig.databaseId,

            tableId:
              appwriteConfig
                .tripInventoryTableId,

            queries: [
              Query.equal(
                "routeId",
                [String(route.$id ?? "")]
              ),

              Query.equal(
                "travelDate",
                [
                  travelDateValidation
                    .travelDate,
                ]
              ),

              Query.equal(
                "salesStatus",
                ["OPEN"]
              ),

              Query.equal(
                "isActive",
                [true]
              ),

              Query.limit(100),
            ],
          })
        )
      )

    const inventoryRows =
      inventoryResponses.flatMap(
        (response) =>
          response.rows.map(
            (row) =>
              row as unknown as AppwriteRow
          )
      )

    if (inventoryRows.length === 0) {
      return noStoreJson({
        success: true,
        minimumDate:
          travelDateValidation.minimumDate,

        search: {
          fromPort,
          toPort,
          travelDate:
            travelDateValidation.travelDate,
          passengers,
        },

        total: 0,
        trips: [],
      })
    }

    const scheduleIds =
      inventoryRows.map((item) =>
        String(item.scheduleId ?? "")
      )

    const operatorIds =
      inventoryRows.map((item) =>
        String(item.operatorId ?? "")
      )

    const vesselIds =
      inventoryRows.map((item) =>
        String(item.vesselId ?? "")
      )

    const [
      schedulesById,
      operatorsById,
      vesselsById,
    ] = await Promise.all([
      getRowsByIds(
        appwriteConfig
          .tripSchedulesTableId,
        scheduleIds
      ),

      getRowsByIds(
        appwriteConfig.operatorsTableId,
        operatorIds
      ),

      getRowsByIds(
        appwriteConfig.vesselsTableId,
        vesselIds
      ),
    ])

    const routesById = new Map<
      string,
      AppwriteRow
    >()

    for (const route of matchedRoutes) {
      routesById.set(
        String(route.$id ?? ""),
        route
      )
    }

    const trips = inventoryRows
      .map((inventory): PublicTrip | null => {
        const scheduleId = String(
          inventory.scheduleId ?? ""
        )

        const operatorId = String(
          inventory.operatorId ?? ""
        )

        const vesselId = String(
          inventory.vesselId ?? ""
        )

        const routeId = String(
          inventory.routeId ?? ""
        )

        const schedule =
          schedulesById.get(scheduleId)

        const operator =
          operatorsById.get(operatorId)

        const vessel =
          vesselsById.get(vesselId)

        const route =
          routesById.get(routeId)

        if (
          !schedule ||
          !operator ||
          !vessel ||
          !route
        ) {
          return null
        }

        if (
          schedule.isActive !== true ||
          operator.isActive !== true ||
          vessel.isActive !== true ||
          route.isActive !== true
        ) {
          return null
        }

        if (
          String(
            schedule.operatorId ?? ""
          ) !== operatorId ||
          String(
            schedule.vesselId ?? ""
          ) !== vesselId ||
          String(
            schedule.routeId ?? ""
          ) !== routeId
        ) {
          return null
        }

        if (
          String(
            vessel.operatorId ?? ""
          ) !== operatorId
        ) {
          return null
        }

        const seatCapacity = Number(
          inventory.seatCapacity ?? 0
        )

        const bookedSeats = Number(
          inventory.bookedSeats ?? 0
        )

        const heldSeats = Number(
          inventory.heldSeats ?? 0
        )

        if (
          !Number.isInteger(
            seatCapacity
          ) ||
          !Number.isInteger(
            bookedSeats
          ) ||
          !Number.isInteger(heldSeats)
        ) {
          return null
        }

        const availableSeats =
          seatCapacity -
          bookedSeats -
          heldSeats

        if (
          availableSeats < passengers
        ) {
          return null
        }

        return {
          tripInventoryId: String(
            inventory.$id ?? ""
          ),

          inventoryCode: String(
            inventory.inventoryCode ?? ""
          ),

          scheduleId,

          scheduleCode: String(
            schedule.scheduleCode ?? ""
          ),

          operatorId,

          operatorCode: String(
            operator.operatorCode ?? ""
          ),

          operatorName: String(
            operator.operatorName ?? ""
          ),

          vesselId,

          vesselCode: String(
            vessel.vesselCode ?? ""
          ),

          vesselName: String(
            vessel.vesselName ?? ""
          ),

          routeId,

          routeCode: String(
            route.routeCode ?? ""
          ),

          fromPort: String(
            route.fromPort ?? ""
          ),

          toPort: String(
            route.toPort ?? ""
          ),

          fromIsland: optionalText(
            route.fromIsland
          ),

          toIsland: optionalText(
            route.toIsland
          ),

          travelDate:
            travelDateValidation
              .travelDate,

          departureTime: String(
            inventory.departureTime ?? ""
          ),

          arrivalTime: String(
            inventory.arrivalTime ?? ""
          ),

          arrivalDayOffset: Number(
            inventory.arrivalDayOffset ?? 0
          ),

          availableSeats,

          adultPrice: Number(
            inventory.adultPrice ?? 0
          ),

          childPrice: Number(
            inventory.childPrice ?? 0
          ),

          infantPrice: Number(
            inventory.infantPrice ?? 0
          ),

          currency: String(
            inventory.currency ?? "IDR"
          ),
        }
      })
      .filter(
        (trip): trip is PublicTrip =>
          trip !== null
      )
      .sort((firstTrip, secondTrip) => {
        const timeComparison =
          firstTrip.departureTime.localeCompare(
            secondTrip.departureTime
          )

        if (timeComparison !== 0) {
          return timeComparison
        }

        return firstTrip.operatorName.localeCompare(
          secondTrip.operatorName,
          "en",
          {
            sensitivity: "base",
          }
        )
      })

    return noStoreJson({
      success: true,

      minimumDate:
        travelDateValidation.minimumDate,

      search: {
        fromPort,
        toPort,
        travelDate:
          travelDateValidation.travelDate,
        passengers,
      },

      total: trips.length,
      trips,
    })
  } catch (error) {
    console.error(
      "Public trip search error:",
      error
    )

    return noStoreJson(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Available trips could not be loaded.",
      },
      500
    )
  }
}
