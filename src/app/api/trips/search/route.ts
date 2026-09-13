import {
  searchPublicTripsD1,
} from "@/lib/d1-public-trip-search"

import {
  validateCustomerTravelDate,
} from "@/lib/bali-date"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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

  const parsedValue =
    Number(value)

  return Number.isInteger(
    parsedValue
  )
    ? parsedValue
    : null
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
    const requestUrl =
      new URL(
        request.url
      )

    const fromPort =
      String(
        requestUrl.searchParams.get(
          "fromPort"
        ) ?? ""
      )
        .trim()
        .replace(/\s+/g, " ")

    const toPort =
      String(
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
        : toInteger(
            passengersValue
          )

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
      normalizeSearchText(
        fromPort
      ) ===
      normalizeSearchText(
        toPort
      )
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

    if (
      !travelDateValidation.valid
    ) {
      return noStoreJson(
        {
          success: false,

          minimumDate:
            travelDateValidation
              .minimumDate,

          error:
            travelDateValidation
              .error,
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

    const trips =
      await searchPublicTripsD1({
        fromPort,
        toPort,

        travelDate:
          travelDateValidation
            .travelDate,

        passengers,
      })

    return noStoreJson({
      success: true,

      minimumDate:
        travelDateValidation
          .minimumDate,

      search: {
        fromPort,
        toPort,

        travelDate:
          travelDateValidation
            .travelDate,

        passengers,
      },

      total:
        trips.length,

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
