import {
  getMinimumBookableDate,
} from "@/lib/bali-date"

import {
  D1AvailabilityError,
  getD1Availability,
} from "@/lib/d1-availability"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

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
      new URL(
        request.url
      )

    const passengersValue =
      requestUrl
        .searchParams
        .get(
          "passengers"
        )

    const passengers =
      passengersValue === null ||
      passengersValue === ""
        ? 1
        : Number(
            passengersValue
          )

    if (
      !Number.isInteger(
        passengers
      ) ||
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

    const result =
      await getD1Availability({
        minimumDate,
        passengers,
      })

    return noStoreJson({
      success: true,

      minimumDate:
        result.minimumDate,

      passengers:
        result.passengers,

      origins:
        result.origins,

      routes:
        result.routes,
    })
  } catch (error) {
    console.error(
      "Public D1 trip availability error:",
      error
    )

    if (
      error instanceof
        D1AvailabilityError &&
      error.kind ===
        "INPUT"
    ) {
      return noStoreJson(
        {
          success: false,
          error:
            error.message,
        },
        400
      )
    }

    return noStoreJson(
      {
        success: false,
        error:
          "Trip availability could not be loaded.",
      },
      500
    )
  }
}
