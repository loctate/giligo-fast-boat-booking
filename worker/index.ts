import handler from "vinext/server/fetch-handler"

interface Env {
  ASSETS: Fetcher
  DB: D1Database
  VINEXT_KV_CACHE: KVNamespace
  CRON_SECRET?: string
}

const EXPIRY_URL =
  "https://giligo.bonarsulaiman.workers.dev/api/internal/expire-held-bookings"

function requireCronSecret(
  env: Env
): string {
  const value =
    String(
      env.CRON_SECRET ?? ""
    ).trim()

  if (value.length < 32) {
    throw new Error(
      "CRON_SECRET is missing or invalid."
    )
  }

  return value
}

async function runExpiryCleanup(
  env: Env,
  ctx: ExecutionContext
): Promise<void> {
  const secret =
    requireCronSecret(env)

  const response =
    await handler.fetch(
      new Request(
        EXPIRY_URL,
        {
          method: "POST",

          headers: {
            Authorization:
              `Bearer ${secret}`,

            "Content-Type":
              "application/json",
          },

          body: "{}",
        }
      ),
      env,
      ctx
    )

  if (!response.ok) {
    console.error(
      "Scheduled held-booking expiry failed.",
      {
        status:
          response.status,
      }
    )

    throw new Error(
      `Scheduled expiry returned HTTP ${response.status}.`
    )
  }

  console.log(
    "Scheduled held-booking expiry completed.",
    {
      status:
        response.status,
    }
  )
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    return handler.fetch(
      request,
      env,
      ctx
    )
  },

  async scheduled(
    controller: ScheduledController,
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    console.log(
      "NusaGiliBoat expiry cron invoked.",
      {
        cron:
          controller.cron,

        scheduledTime:
          controller.scheduledTime,
      }
    )

    await runExpiryCleanup(
      env,
      ctx
    )
  },
}
