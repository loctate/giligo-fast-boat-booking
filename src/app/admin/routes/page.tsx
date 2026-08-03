import { Query } from "node-appwrite"

import { requireAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import AdminShell from "../AdminShell"
import RoutesManager, {
  type RouteRow,
} from "./RoutesManager"

export const dynamic = "force-dynamic"

function optionalString(
  value: unknown
): string | null {
  if (value === null || value === undefined) {
    return null
  }

  const normalizedValue = String(value).trim()

  return normalizedValue || null
}

function toPlainRoute(
  row: Record<string, unknown>
): RouteRow {
  return {
    $id: String(row.$id ?? ""),
    $createdAt: String(row.$createdAt ?? ""),

    $updatedAt: row.$updatedAt
      ? String(row.$updatedAt)
      : undefined,

    routeCode: String(row.routeCode ?? ""),
    fromPort: String(row.fromPort ?? ""),
    toPort: String(row.toPort ?? ""),

    fromIsland: optionalString(
      row.fromIsland
    ),

    toIsland: optionalString(
      row.toIsland
    ),

    estimatedDurationMinutes: Number(
      row.estimatedDurationMinutes ?? 0
    ),

    isActive:
      typeof row.isActive === "boolean"
        ? row.isActive
        : false,

    notes: optionalString(row.notes),
    createdBy: optionalString(row.createdBy),
    updatedBy: optionalString(row.updatedBy),
  }
}

function sortRoutes(
  routes: RouteRow[]
): RouteRow[] {
  return [...routes].sort(
    (firstRoute, secondRoute) => {
      const originComparison =
        firstRoute.fromPort.localeCompare(
          secondRoute.fromPort,
          "en",
          {
            sensitivity: "base",
          }
        )

      if (originComparison !== 0) {
        return originComparison
      }

      return firstRoute.toPort.localeCompare(
        secondRoute.toPort,
        "en",
        {
          sensitivity: "base",
        }
      )
    }
  )
}

async function getRoutes(): Promise<RouteRow[]> {
  const response = await tablesDB.listRows({
    databaseId: appwriteConfig.databaseId,
    tableId: appwriteConfig.routesTableId,
    queries: [Query.limit(200)],
  })

  const routes = response.rows.map((row) =>
    toPlainRoute(
      row as unknown as Record<
        string,
        unknown
      >
    )
  )

  return sortRoutes(routes)
}

export default async function RoutesPage() {
  const admin = await requireAdmin()

  let routes: RouteRow[] = []
  let loadError = ""

  try {
    routes = await getRoutes()
  } catch (error) {
    console.error("Route page error:", error)

    loadError =
      error instanceof Error
        ? error.message
        : "Route data could not be loaded."
  }

  return (
    <AdminShell adminEmail={admin.email}>
      <main className="min-h-screen bg-slate-100 text-slate-900">
      <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-10 text-white">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
            Inventory master data
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Fast Boat Routes
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
            Manage departure ports,
            destination ports, islands,
            estimated journey duration and
            operational status.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-10 lg:px-8">
        {loadError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-black">
              Route data could not be loaded
            </p>

            <p className="mt-1 text-sm">
              {loadError}
            </p>
          </div>
        )}

        <RoutesManager
          initialRoutes={routes}
        />
      </section>
      </main>
    </AdminShell>
  )
}
