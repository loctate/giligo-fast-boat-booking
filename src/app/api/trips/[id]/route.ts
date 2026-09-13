import { getPublicTripDetailD1 } from "@/lib/d1-public-trip-detail"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type RouteContext = {
  params: Promise<{
    id: string
  }>
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
  request: Request,
  context: RouteContext
) {
  try {
    const { id } = await context.params

    const tripInventoryId = String(
      id ?? ""
    ).trim()

    if (!tripInventoryId) {
      return noStoreJson(
        {
          success: false,
          error:
            "Trip inventory ID is required.",
        },
        400
      )
    }

    const requestUrl = new URL(
      request.url
    )

    const passengersValue =
      requestUrl.searchParams.get(
        "passengers"
      )

    const passengers =
      passengersValue === null
        ? 1
        : toInteger(passengersValue)

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

    const result = await getPublicTripDetailD1({
      tripInventoryId,
      passengers,
    })

    return noStoreJson(
      result.body,
      result.status
    )
  } catch (error) {
    console.error(
      "Public trip detail error:",
      error
    )

    return noStoreJson(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "The selected trip could not be loaded.",
      },
      500
    )
  }
}
