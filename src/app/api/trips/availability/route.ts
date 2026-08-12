import { Query } from "node-appwrite"

import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import {
  getMinimumBookableDate,
} from "@/lib/bali-date"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type AppwriteRow =
  Record<string, unknown>

type AvailabilityRoute = {
  fromPort: string
  toPort: string
  dates: string[]
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

  const parsedValue =
    Number(value)

  return Number.isInteger(
    parsedValue
  )
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
      (
        error as {
          code?: unknown
        }
      ).code
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
    const row =
      await tablesDB.getRow({
        databaseId:
          appwriteConfig.databaseId,
        tableId,
        rowId,
      })

    return row as unknown as AppwriteRow
  } catch (error) {
    if (
      getErrorCode(error) === 404
    ) {
      return null
    }

    throw error
  }
}

async function getRowsByIds(
  tableId: string,
  rowIds: string[]
): Promise<
  Map<string, AppwriteRow>
> {
  const uniqueIds = [
    ...new Set(
      rowIds
        .map((rowId) =>
          rowId.trim()
        )
        .filter(Boolean)
    ),
  ]

  const rows =
    await Promise.all(
      uniqueIds.map(
        (rowId) =>
          getRowOrNull(
            tableId,
            rowId
          )
      )
    )

  const rowsById =
    new Map<
      string,
      AppwriteRow
    >()

  rows.forEach(
    (row, index) => {
      if (row) {
        rowsById.set(
          uniqueIds[index],
          row
        )
      }
    }
  )

  return rowsById
}

function noStoreJson(
  body: unknown,
  status = 200
) {
  return Response.json(
    body,
    {
      status,
      headers: {
        "Cache-Control":
          "no-store, max-age=0",
      },
    }
  )
}

export async function GET(
  request: Request
) {
  try {
    const requestUrl =
      new URL(request.url)

    const passengersValue =
      requestUrl.searchParams.get(
        "passengers"
      )

    const passengers =
      passengersValue === null
        ? 1
        : toInteger(
            passengersValue
          )

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

    const minimumDate =
      getMinimumBookableDate()

    const inventoryResponse =
      await tablesDB.listRows({
        databaseId:
          appwriteConfig.databaseId,

        tableId:
          appwriteConfig
            .tripInventoryTableId,

        queries: [
          Query.equal(
            "salesStatus",
            ["OPEN"]
          ),

          Query.equal(
            "isActive",
            [true]
          ),

          Query.limit(500),
        ],
      })

    if (
      inventoryResponse.total >
      inventoryResponse.rows.length
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            "Availability inventory exceeds the public lookup limit.",
        },
        503
      )
    }

    const inventoryRows =
      inventoryResponse.rows
        .map(
          (row) =>
            row as unknown as AppwriteRow
        )
        .filter(
          (inventory) => {
            const travelDate =
              String(
                inventory.travelDate ??
                  ""
              ).trim()

            if (
              !travelDate ||
              travelDate <
                minimumDate
            ) {
              return false
            }

            const seatCapacity =
              toInteger(
                inventory
                  .seatCapacity
              )

            const bookedSeats =
              toInteger(
                inventory
                  .bookedSeats
              )

            const heldSeats =
              toInteger(
                inventory
                  .heldSeats
              )

            if (
              seatCapacity ===
                null ||
              bookedSeats ===
                null ||
              heldSeats === null ||
              seatCapacity < 0 ||
              bookedSeats < 0 ||
              heldSeats < 0
            ) {
              return false
            }

            const availableSeats =
              seatCapacity -
              bookedSeats -
              heldSeats

            return (
              availableSeats >=
              passengers
            )
          }
        )

    const scheduleIds =
      inventoryRows.map(
        (inventory) =>
          String(
            inventory.scheduleId ??
              ""
          )
      )

    const operatorIds =
      inventoryRows.map(
        (inventory) =>
          String(
            inventory.operatorId ??
              ""
          )
      )

    const vesselIds =
      inventoryRows.map(
        (inventory) =>
          String(
            inventory.vesselId ??
              ""
          )
      )

    const routeIds =
      inventoryRows.map(
        (inventory) =>
          String(
            inventory.routeId ??
              ""
          )
      )

    const [
      schedulesById,
      operatorsById,
      vesselsById,
      routesById,
    ] = await Promise.all([
      getRowsByIds(
        appwriteConfig
          .tripSchedulesTableId,
        scheduleIds
      ),

      getRowsByIds(
        appwriteConfig
          .operatorsTableId,
        operatorIds
      ),

      getRowsByIds(
        appwriteConfig
          .vesselsTableId,
        vesselIds
      ),

      getRowsByIds(
        appwriteConfig
          .routesTableId,
        routeIds
      ),
    ])

    const routeDates =
      new Map<
        string,
        {
          fromPort: string
          toPort: string
          dates: Set<string>
        }
      >()

    for (
      const inventory
      of inventoryRows
    ) {
      const scheduleId =
        String(
          inventory.scheduleId ??
            ""
        )

      const operatorId =
        String(
          inventory.operatorId ??
            ""
        )

      const vesselId =
        String(
          inventory.vesselId ??
            ""
        )

      const routeId =
        String(
          inventory.routeId ??
            ""
        )

      const schedule =
        schedulesById.get(
          scheduleId
        )

      const operator =
        operatorsById.get(
          operatorId
        )

      const vessel =
        vesselsById.get(
          vesselId
        )

      const route =
        routesById.get(
          routeId
        )

      if (
        !schedule ||
        !operator ||
        !vessel ||
        !route
      ) {
        continue
      }

      if (
        schedule.isActive !==
          true ||
        operator.isActive !==
          true ||
        vessel.isActive !==
          true ||
        route.isActive !== true
      ) {
        continue
      }

      if (
        String(
          schedule.operatorId ??
            ""
        ) !== operatorId ||
        String(
          schedule.vesselId ??
            ""
        ) !== vesselId ||
        String(
          schedule.routeId ??
            ""
        ) !== routeId ||
        String(
          vessel.operatorId ??
            ""
        ) !== operatorId
      ) {
        continue
      }

      const fromPort =
        String(
          route.fromPort ?? ""
        ).trim()

      const toPort =
        String(
          route.toPort ?? ""
        ).trim()

      const travelDate =
        String(
          inventory.travelDate ??
            ""
        ).trim()

      if (
        !fromPort ||
        !toPort ||
        !travelDate
      ) {
        continue
      }

      const key =
        `${fromPort}\u0000${toPort}`

      const existing =
        routeDates.get(key)

      if (existing) {
        existing.dates.add(
          travelDate
        )
      } else {
        routeDates.set(
          key,
          {
            fromPort,
            toPort,
            dates:
              new Set([
                travelDate,
              ]),
          }
        )
      }
    }

    const routes:
      AvailabilityRoute[] =
      Array.from(
        routeDates.values()
      )
        .map((route) => ({
          fromPort:
            route.fromPort,
          toPort:
            route.toPort,
          dates:
            Array.from(
              route.dates
            ).sort(),
        }))
        .sort(
          (
            firstRoute,
            secondRoute
          ) => {
            const originComparison =
              firstRoute.fromPort
                .localeCompare(
                  secondRoute
                    .fromPort,
                  "en",
                  {
                    sensitivity:
                      "base",
                  }
                )

            if (
              originComparison !==
              0
            ) {
              return originComparison
            }

            return firstRoute
              .toPort.localeCompare(
                secondRoute
                  .toPort,
                "en",
                {
                  sensitivity:
                    "base",
                }
              )
          }
        )

    const origins =
      [
        ...new Set(
          routes.map(
            (route) =>
              route.fromPort
          )
        ),
      ].sort(
        (first, second) =>
          first.localeCompare(
            second,
            "en",
            {
              sensitivity:
                "base",
            }
          )
      )

    return noStoreJson({
      success: true,
      minimumDate,
      passengers,
      origins,
      routes,
    })
  } catch (error) {
    console.error(
      "Public trip availability error:",
      error
    )

    return noStoreJson(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Trip availability could not be loaded.",
      },
      500
    )
  }
}