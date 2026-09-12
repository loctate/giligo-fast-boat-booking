import {
  type AppwriteCompatSystemFields,
  type D1SystemFields,
  toAppwriteCompatSystemFields,
} from "@/lib/d1-compat"
import { getD1 } from "@/lib/d1-server"

export type D1RouteRow =
  D1SystemFields & {
    routeCode: string

    fromPort: string
    toPort: string

    fromIsland: string | null
    toIsland: string | null

    estimatedDurationMinutes: number

    isActive: number
    notes: string | null

    createdBy: string | null
    updatedBy: string | null
  }

export type RouteCompatRow =
  AppwriteCompatSystemFields & {
    routeCode: string

    fromPort: string
    toPort: string

    fromIsland: string | null
    toIsland: string | null

    estimatedDurationMinutes: number

    isActive: boolean
    notes: string | null

    createdBy: string | null
    updatedBy: string | null
  }

export type RouteListResult = {
  routes: RouteCompatRow[]
  total: number
}

function toBoolean(value: number): boolean {
  if (value !== 0 && value !== 1) {
    throw new Error(
      `Invalid SQLite boolean value: ${value}`
    )
  }

  return value === 1
}

export function toRouteCompatRow(
  row: D1RouteRow
): RouteCompatRow {
  return {
    ...toAppwriteCompatSystemFields(row),

    routeCode: row.routeCode,

    fromPort: row.fromPort,
    toPort: row.toPort,

    fromIsland: row.fromIsland,
    toIsland: row.toIsland,

    estimatedDurationMinutes:
      row.estimatedDurationMinutes,

    isActive: toBoolean(row.isActive),
    notes: row.notes,

    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  }
}

export function sortRoutesD1(
  routes: RouteCompatRow[]
): RouteCompatRow[] {
  return [...routes].sort(
    (firstRoute, secondRoute) => {
      const fromComparison =
        firstRoute.fromPort.localeCompare(
          secondRoute.fromPort,
          "en",
          {
            sensitivity: "base",
          }
        )

      if (fromComparison !== 0) {
        return fromComparison
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

export async function listRoutesD1():
  Promise<RouteListResult> {
  const db = getD1()

  const [
    routesResult,
    totalRow,
  ] = await Promise.all([
    db.prepare(
      `SELECT
        id,
        createdAt,
        updatedAt,

        routeCode,

        fromPort,
        toPort,

        fromIsland,
        toIsland,

        estimatedDurationMinutes,

        isActive,
        notes,

        createdBy,
        updatedBy
      FROM routes
      LIMIT 200`
    ).all<D1RouteRow>(),

    db.prepare(
      `SELECT COUNT(*) AS total
      FROM routes`
    ).first<{ total: number }>(),
  ])

  const routes = sortRoutesD1(
    routesResult.results.map(toRouteCompatRow)
  )

  return {
    routes,
    total: Number(totalRow?.total ?? 0),
  }
}

export type CreateRouteD1Input = {
  routeCode: string

  fromPort: string
  toPort: string

  fromIsland: string | null
  toIsland: string | null

  estimatedDurationMinutes: number

  isActive: boolean
  notes: string | null

  createdBy: string | null
  updatedBy: string | null
}

export async function createRouteD1(
  input: CreateRouteD1Input
): Promise<RouteCompatRow> {
  const db = getD1()
  const id = crypto.randomUUID()

  const result = await db
    .prepare(
      `INSERT INTO routes (
        id,
        routeCode,
        fromPort,
        toPort,
        fromIsland,
        toIsland,
        estimatedDurationMinutes,
        isActive,
        notes,
        createdBy,
        updatedBy
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`
    )
    .bind(
      id,
      input.routeCode,
      input.fromPort,
      input.toPort,
      input.fromIsland,
      input.toIsland,
      input.estimatedDurationMinutes,
      input.isActive ? 1 : 0,
      input.notes,
      input.createdBy,
      input.updatedBy
    )
    .run()

  if (!result.success) {
    throw new Error(
      "Route could not be created."
    )
  }

  const row = await db
    .prepare(
      `SELECT
        id,
        createdAt,
        updatedAt,

        routeCode,

        fromPort,
        toPort,

        fromIsland,
        toIsland,

        estimatedDurationMinutes,

        isActive,
        notes,

        createdBy,
        updatedBy
      FROM routes
      WHERE id = ?
      LIMIT 1`
    )
    .bind(id)
    .first<D1RouteRow>()

  if (!row) {
    throw new Error(
      "Created route could not be loaded."
    )
  }

  return toRouteCompatRow(row)
}

export class RouteNotFoundError extends Error {
  constructor() {
    super(
      "Route could not be found."
    )

    this.name = "RouteNotFoundError"
  }
}

export async function getRouteByIdD1(
  id: string
): Promise<RouteCompatRow | null> {
  const db = getD1()

  const row = await db
    .prepare(
      `SELECT
        id,
        createdAt,
        updatedAt,

        routeCode,

        fromPort,
        toPort,

        fromIsland,
        toIsland,

        estimatedDurationMinutes,

        isActive,
        notes,

        createdBy,
        updatedBy
      FROM routes
      WHERE id = ?
      LIMIT 1`
    )
    .bind(id)
    .first<D1RouteRow>()

  return row
    ? toRouteCompatRow(row)
    : null
}

export type UpdateRouteD1Input = {
  id: string

  routeCode?: string

  fromPort?: string
  toPort?: string

  fromIsland?: string | null
  toIsland?: string | null

  estimatedDurationMinutes?: number

  isActive?: boolean
  notes?: string | null

  updatedBy: string | null
}

export async function updateRouteD1(
  input: UpdateRouteD1Input
): Promise<RouteCompatRow> {
  const db = getD1()

  const existingRow = await db
    .prepare(
      `SELECT
        id,
        createdAt,
        updatedAt,

        routeCode,

        fromPort,
        toPort,

        fromIsland,
        toIsland,

        estimatedDurationMinutes,

        isActive,
        notes,

        createdBy,
        updatedBy
      FROM routes
      WHERE id = ?
      LIMIT 1`
    )
    .bind(input.id)
    .first<D1RouteRow>()

  if (!existingRow) {
    throw new RouteNotFoundError()
  }

  const routeCode =
    input.routeCode !== undefined
      ? input.routeCode
      : existingRow.routeCode

  const fromPort =
    input.fromPort !== undefined
      ? input.fromPort
      : existingRow.fromPort

  const toPort =
    input.toPort !== undefined
      ? input.toPort
      : existingRow.toPort

  const fromIsland =
    input.fromIsland !== undefined
      ? input.fromIsland
      : existingRow.fromIsland

  const toIsland =
    input.toIsland !== undefined
      ? input.toIsland
      : existingRow.toIsland

  const estimatedDurationMinutes =
    input.estimatedDurationMinutes !== undefined
      ? input.estimatedDurationMinutes
      : existingRow.estimatedDurationMinutes

  const isActive =
    input.isActive !== undefined
      ? input.isActive
      : toBoolean(existingRow.isActive)

  const notes =
    input.notes !== undefined
      ? input.notes
      : existingRow.notes

  const result = await db
    .prepare(
      `UPDATE routes
      SET
        routeCode = ?,
        fromPort = ?,
        toPort = ?,
        fromIsland = ?,
        toIsland = ?,
        estimatedDurationMinutes = ?,
        isActive = ?,
        notes = ?,
        updatedBy = ?,
        updatedAt = strftime(
          '%Y-%m-%dT%H:%M:%fZ',
          'now'
        )
      WHERE id = ?`
    )
    .bind(
      routeCode,
      fromPort,
      toPort,
      fromIsland,
      toIsland,
      estimatedDurationMinutes,
      isActive ? 1 : 0,
      notes,
      input.updatedBy,
      input.id
    )
    .run()

  if (!result.success) {
    throw new Error(
      "Route could not be updated."
    )
  }

  const updatedRow = await db
    .prepare(
      `SELECT
        id,
        createdAt,
        updatedAt,

        routeCode,

        fromPort,
        toPort,

        fromIsland,
        toIsland,

        estimatedDurationMinutes,

        isActive,
        notes,

        createdBy,
        updatedBy
      FROM routes
      WHERE id = ?
      LIMIT 1`
    )
    .bind(input.id)
    .first<D1RouteRow>()

  if (!updatedRow) {
    throw new RouteNotFoundError()
  }

  return toRouteCompatRow(
    updatedRow
  )
}
