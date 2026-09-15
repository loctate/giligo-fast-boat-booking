import {
  env,
} from "cloudflare:workers"

import {
  applyD1CallbackLifecycleImpl,
  D1CallbackLifecycleAdapterError,
  findD1CallbackBookingByCodeImpl,
} from "@/lib/d1-callback-lifecycle-adapter"

import {
  D1BookingDalError,
} from "@/lib/d1-bookings"

export const dynamic =
  "force-dynamic"

const MAX_BODY_BYTES =
  64 * 1024

type InternalRequest =
  | {
      operation: "lookup"
      bookingCode: unknown
    }
  | {
      operation: "apply"
      mutation: unknown
    }

function json(
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

function getInternalToken():
  string {
  const runtimeEnv =
    env as unknown as
      Record<string, unknown>

  return String(
    runtimeEnv
      .IPAYMU_CALLBACK_LIFECYCLE_TOKEN ??
      ""
  ).trim()
}

function bearerToken(
  request: Request
): string {
  const authorization =
    request.headers
      .get("authorization") ??
    ""

  const match =
    /^Bearer\s+(.+)$/i.exec(
      authorization.trim()
    )

  return match?.[1]?.trim() ?? ""
}

async function digest(
  value: string
): Promise<Uint8Array> {
  const bytes =
    new TextEncoder().encode(value)

  const result =
    await crypto.subtle.digest(
      "SHA-256",
      bytes
    )

  return new Uint8Array(result)
}

async function secureEqual(
  left: string,
  right: string
): Promise<boolean> {
  const [
    leftDigest,
    rightDigest,
  ] =
    await Promise.all([
      digest(left),
      digest(right),
    ])

  let difference = 0

  for (
    let index = 0;
    index < leftDigest.length;
    index += 1
  ) {
    difference |=
      leftDigest[index] ^
      rightDigest[index]
  }

  return difference === 0
}

async function authorized(
  request: Request
): Promise<boolean> {
  const expected =
    getInternalToken()

  if (!expected) {
    return false
  }

  const supplied =
    bearerToken(request)

  if (!supplied) {
    return false
  }

  return secureEqual(
    supplied,
    expected
  )
}

function requestTooLarge(
  request: Request
): boolean {
  const raw =
    request.headers
      .get("content-length")

  if (!raw) {
    return false
  }

  const parsed =
    Number(raw)

  return (
    Number.isFinite(parsed) &&
    parsed > MAX_BODY_BYTES
  )
}

function errorResponse(
  error: unknown
) {
  if (
    error instanceof
      D1CallbackLifecycleAdapterError
  ) {
    const status =
      error.code ===
        "INVALID_MUTATION"
        ? 400
        : error.code ===
            "BOOKING_NOT_FOUND"
          ? 404
          : 409

    return json(
      {
        success: false,
        code: error.code,
        error:
          "Callback lifecycle request was rejected.",
      },
      status
    )
  }

  if (
    error instanceof
      D1BookingDalError
  ) {
    const status =
      error.kind ===
        "DATABASE"
        ? 500
        : 409

    return json(
      {
        success: false,
        code:
          `D1_${error.kind}`,
        error:
          "Callback lifecycle request could not be applied.",
      },
      status
    )
  }

  console.error(
    "Internal iPaymu callback lifecycle error:",
    error
  )

  return json(
    {
      success: false,
      code:
        "INTERNAL_CALLBACK_ERROR",
      error:
        "Callback lifecycle request failed.",
    },
    500
  )
}

export async function POST(
  request: Request
) {
  const configuredToken =
    getInternalToken()

  if (!configuredToken) {
    return json(
      {
        success: false,
        code:
          "CALLBACK_LIFECYCLE_NOT_CONFIGURED",
        error:
          "Callback lifecycle service is unavailable.",
      },
      503
    )
  }

  if (
    !(await authorized(request))
  ) {
    return json(
      {
        success: false,
        code: "UNAUTHORIZED",
        error: "Unauthorized.",
      },
      401
    )
  }

  if (requestTooLarge(request)) {
    return json(
      {
        success: false,
        code:
          "REQUEST_TOO_LARGE",
        error:
          "Request body is too large.",
      },
      413
    )
  }

  let body:
    InternalRequest

  try {
    body =
      await request.json()
  } catch {
    return json(
      {
        success: false,
        code:
          "INVALID_JSON",
        error:
          "Request body must be valid JSON.",
      },
      400
    )
  }

  if (
    typeof body !== "object" ||
    body === null
  ) {
    return json(
      {
        success: false,
        code:
          "INVALID_REQUEST",
        error:
          "Invalid callback lifecycle request.",
      },
      400
    )
  }

  try {
    if (
      body.operation ===
        "lookup"
    ) {
      const bookingCode =
        typeof body.bookingCode ===
          "string"
          ? body.bookingCode
          : ""

      const result =
        await findD1CallbackBookingByCodeImpl(
          bookingCode
        )

      return json({
        success: true,
        result,
      })
    }

    if (
      body.operation ===
        "apply"
    ) {
      const result =
        await applyD1CallbackLifecycleImpl(
          body.mutation
        )

      return json({
        success: true,
        result,
      })
    }

    return json(
      {
        success: false,
        code:
          "INVALID_OPERATION",
        error:
          "Invalid callback lifecycle operation.",
      },
      400
    )
  } catch (error) {
    return errorResponse(error)
  }
}
