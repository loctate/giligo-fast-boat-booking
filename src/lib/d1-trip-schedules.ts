import {
  type AppwriteCompatSystemFields,
  type D1SystemFields,
  toAppwriteCompatSystemFields,
} from "@/lib/d1-compat"
import { getD1 } from "@/lib/d1-server"

export type D1TripScheduleJoinedRow =
  D1SystemFields & {
    scheduleCode: string

    operatorId: string
    vesselId: string
    routeId: string

    departureTime: string
    arrivalTime: string

    arrivalDayOffset: number
    operatingDays: string
    bookingCutoffMinutes: number

    isActive: number
    notes: string | null

    createdBy: string | null
    updatedBy: string | null

    operatorCode: string | null
    operatorName: string | null

    vesselCode: string | null
    vesselName: string | null

    routeCode: string | null
    fromPort: string | null
    toPort: string | null
  }

export type TripScheduleCompatRow =
  AppwriteCompatSystemFields & {
    scheduleCode: string

    operatorId: string
    vesselId: string
    routeId: string

    departureTime: string
    arrivalTime: string

    arrivalDayOffset: number
    operatingDays: string
    bookingCutoffMinutes: number

    isActive: boolean
    notes: string | null

    createdBy: string | null
    updatedBy: string | null

    operatorCode: string | null
    operatorName: string | null

    vesselCode: string | null
    vesselName: string | null

    routeCode: string | null
    fromPort: string | null
    toPort: string | null
  }

export type TripScheduleListResult = {
  schedules: TripScheduleCompatRow[]
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

export function toTripScheduleCompatRow(
  row: D1TripScheduleJoinedRow
): TripScheduleCompatRow {
  return {
    ...toAppwriteCompatSystemFields(row),

    scheduleCode: row.scheduleCode,

    operatorId: row.operatorId,
    vesselId: row.vesselId,
    routeId: row.routeId,

    departureTime: row.departureTime,
    arrivalTime: row.arrivalTime,

    arrivalDayOffset:
      row.arrivalDayOffset,

    operatingDays:
      row.operatingDays,

    bookingCutoffMinutes:
      row.bookingCutoffMinutes,

    isActive:
      toBoolean(row.isActive),

    notes: row.notes,

    createdBy: row.createdBy,
    updatedBy: row.updatedBy,

    operatorCode: row.operatorCode,
    operatorName: row.operatorName,

    vesselCode: row.vesselCode,
    vesselName: row.vesselName,

    routeCode: row.routeCode,
    fromPort: row.fromPort,
    toPort: row.toPort,
  }
}

export function sortTripSchedulesD1(
  schedules: TripScheduleCompatRow[]
): TripScheduleCompatRow[] {
  return [...schedules].sort(
    (firstSchedule, secondSchedule) => {
      const routeComparison = String(
        firstSchedule.routeCode ?? ""
      ).localeCompare(
        String(
          secondSchedule.routeCode ?? ""
        ),
        "en",
        {
          sensitivity: "base",
        }
      )

      if (routeComparison !== 0) {
        return routeComparison
      }

      return firstSchedule.departureTime.localeCompare(
        secondSchedule.departureTime
      )
    }
  )
}

export async function listTripSchedulesD1():
  Promise<TripScheduleListResult> {
  const db = getD1()

  const [
    schedulesResult,
    totalRow,
  ] = await Promise.all([
    db.prepare(
      `SELECT
        s.id,
        s.createdAt,
        s.updatedAt,

        s.scheduleCode,

        s.operatorId,
        s.vesselId,
        s.routeId,

        s.departureTime,
        s.arrivalTime,

        s.arrivalDayOffset,
        s.operatingDays,
        s.bookingCutoffMinutes,

        s.isActive,
        s.notes,

        s.createdBy,
        s.updatedBy,

        o.operatorCode
          AS operatorCode,

        o.operatorName
          AS operatorName,

        v.vesselCode
          AS vesselCode,

        v.vesselName
          AS vesselName,

        r.routeCode
          AS routeCode,

        r.fromPort
          AS fromPort,

        r.toPort
          AS toPort

      FROM trip_schedules AS s

      LEFT JOIN operators AS o
        ON o.id = s.operatorId

      LEFT JOIN vessels AS v
        ON v.id = s.vesselId

      LEFT JOIN routes AS r
        ON r.id = s.routeId

      LIMIT 200`
    ).all<D1TripScheduleJoinedRow>(),

    db.prepare(
      `SELECT COUNT(*) AS total
      FROM trip_schedules`
    ).first<{ total: number }>(),
  ])

  const schedules =
    sortTripSchedulesD1(
      schedulesResult.results.map(
        toTripScheduleCompatRow
      )
    )

  return {
    schedules,
    total:
      Number(totalRow?.total ?? 0),
  }
}

export type TripScheduleOperatorOption = {
  $id: string
  operatorCode: string
  operatorName: string
  isActive: boolean
}

export type TripScheduleVesselOption = {
  $id: string
  operatorId: string
  vesselCode: string
  vesselName: string
  isActive: boolean
}

export type TripScheduleRouteOption = {
  $id: string
  routeCode: string
  fromPort: string
  toPort: string
  isActive: boolean
}

type D1TripScheduleOperatorOptionRow = {
  id: string
  operatorCode: string
  operatorName: string
  isActive: number
}

type D1TripScheduleVesselOptionRow = {
  id: string
  operatorId: string
  vesselCode: string
  vesselName: string
  isActive: number
}

type D1TripScheduleRouteOptionRow = {
  id: string
  routeCode: string
  fromPort: string
  toPort: string
  isActive: number
}

export type TripSchedulesPageDataD1 = {
  schedules: TripScheduleCompatRow[]
  operators: TripScheduleOperatorOption[]
  vessels: TripScheduleVesselOption[]
  routes: TripScheduleRouteOption[]
}

function toOperatorOption(
  row: D1TripScheduleOperatorOptionRow
): TripScheduleOperatorOption {
  return {
    $id: row.id,
    operatorCode: row.operatorCode,
    operatorName: row.operatorName,
    isActive: toBoolean(row.isActive),
  }
}

function toVesselOption(
  row: D1TripScheduleVesselOptionRow
): TripScheduleVesselOption {
  return {
    $id: row.id,
    operatorId: row.operatorId,
    vesselCode: row.vesselCode,
    vesselName: row.vesselName,
    isActive: toBoolean(row.isActive),
  }
}

function toRouteOption(
  row: D1TripScheduleRouteOptionRow
): TripScheduleRouteOption {
  return {
    $id: row.id,
    routeCode: row.routeCode,
    fromPort: row.fromPort,
    toPort: row.toPort,
    isActive: toBoolean(row.isActive),
  }
}

function sortOperatorOptions(
  operators: TripScheduleOperatorOption[]
): TripScheduleOperatorOption[] {
  return [...operators].sort(
    (first, second) =>
      first.operatorName.localeCompare(
        second.operatorName,
        "en",
        {
          sensitivity: "base",
        }
      )
  )
}

function sortVesselOptions(
  vessels: TripScheduleVesselOption[]
): TripScheduleVesselOption[] {
  return [...vessels].sort(
    (first, second) =>
      first.vesselName.localeCompare(
        second.vesselName,
        "en",
        {
          sensitivity: "base",
        }
      )
  )
}

function sortRouteOptions(
  routes: TripScheduleRouteOption[]
): TripScheduleRouteOption[] {
  return [...routes].sort(
    (first, second) => {
      const fromComparison =
        first.fromPort.localeCompare(
          second.fromPort,
          "en",
          {
            sensitivity: "base",
          }
        )

      if (fromComparison !== 0) {
        return fromComparison
      }

      return first.toPort.localeCompare(
        second.toPort,
        "en",
        {
          sensitivity: "base",
        }
      )
    }
  )
}

export async function getTripSchedulesPageDataD1():
  Promise<TripSchedulesPageDataD1> {
  const db = getD1()

  const [
    scheduleResult,
    operatorsResult,
    vesselsResult,
    routesResult,
  ] = await Promise.all([
    listTripSchedulesD1(),

    db.prepare(
      `SELECT
        id,
        operatorCode,
        operatorName,
        isActive
      FROM operators
      LIMIT 200`
    ).all<D1TripScheduleOperatorOptionRow>(),

    db.prepare(
      `SELECT
        id,
        operatorId,
        vesselCode,
        vesselName,
        isActive
      FROM vessels
      LIMIT 200`
    ).all<D1TripScheduleVesselOptionRow>(),

    db.prepare(
      `SELECT
        id,
        routeCode,
        fromPort,
        toPort,
        isActive
      FROM routes
      LIMIT 200`
    ).all<D1TripScheduleRouteOptionRow>(),
  ])

  const operators =
    sortOperatorOptions(
      operatorsResult.results.map(
        toOperatorOption
      )
    )

  const vessels =
    sortVesselOptions(
      vesselsResult.results.map(
        toVesselOption
      )
    )

  const routes =
    sortRouteOptions(
      routesResult.results.map(
        toRouteOption
      )
    )

  return {
    schedules: scheduleResult.schedules,
    operators,
    vessels,
    routes,
  }
}

export type CreateTripScheduleD1Input = {
  scheduleCode: string

  operatorId: string
  vesselId: string
  routeId: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  operatingDays: string
  bookingCutoffMinutes: number

  isActive: boolean
  notes: string | null

  createdBy: string | null
  updatedBy: string | null
}

export class TripScheduleOperatorNotFoundError
  extends Error {
  constructor() {
    super(
      "Selected operator could not be found."
    )
    this.name =
      "TripScheduleOperatorNotFoundError"
  }
}

export class TripScheduleVesselNotFoundError
  extends Error {
  constructor() {
    super(
      "Selected vessel could not be found."
    )
    this.name =
      "TripScheduleVesselNotFoundError"
  }
}

export class TripScheduleRouteNotFoundError
  extends Error {
  constructor() {
    super(
      "Selected route could not be found."
    )
    this.name =
      "TripScheduleRouteNotFoundError"
  }
}

export class TripScheduleVesselOperatorMismatchError
  extends Error {
  constructor() {
    super(
      "Selected vessel does not belong to the selected operator."
    )
    this.name =
      "TripScheduleVesselOperatorMismatchError"
  }
}

export class TripScheduleActiveOperatorRequiredError
  extends Error {
  constructor() {
    super(
      "An active schedule requires an active operator."
    )
    this.name =
      "TripScheduleActiveOperatorRequiredError"
  }
}

export class TripScheduleActiveVesselRequiredError
  extends Error {
  constructor() {
    super(
      "An active schedule requires an active vessel."
    )
    this.name =
      "TripScheduleActiveVesselRequiredError"
  }
}

export class TripScheduleActiveRouteRequiredError
  extends Error {
  constructor() {
    super(
      "An active schedule requires an active route."
    )
    this.name =
      "TripScheduleActiveRouteRequiredError"
  }
}

async function getTripScheduleOperatorByIdD1(
  db: D1Database,
  id: string
): Promise<D1TripScheduleOperatorOptionRow | null> {
  return db
    .prepare(
      `SELECT
        id,
        operatorCode,
        operatorName,
        isActive
      FROM operators
      WHERE id = ?
      LIMIT 1`
    )
    .bind(id)
    .first<D1TripScheduleOperatorOptionRow>()
}

async function getTripScheduleVesselByIdD1(
  db: D1Database,
  id: string
): Promise<D1TripScheduleVesselOptionRow | null> {
  return db
    .prepare(
      `SELECT
        id,
        operatorId,
        vesselCode,
        vesselName,
        isActive
      FROM vessels
      WHERE id = ?
      LIMIT 1`
    )
    .bind(id)
    .first<D1TripScheduleVesselOptionRow>()
}

async function getTripScheduleRouteByIdD1(
  db: D1Database,
  id: string
): Promise<D1TripScheduleRouteOptionRow | null> {
  return db
    .prepare(
      `SELECT
        id,
        routeCode,
        fromPort,
        toPort,
        isActive
      FROM routes
      WHERE id = ?
      LIMIT 1`
    )
    .bind(id)
    .first<D1TripScheduleRouteOptionRow>()
}

async function getTripScheduleJoinedByIdD1(
  db: D1Database,
  id: string
): Promise<TripScheduleCompatRow | null> {
  const row = await db
    .prepare(
      `SELECT
        s.id,
        s.createdAt,
        s.updatedAt,

        s.scheduleCode,

        s.operatorId,
        s.vesselId,
        s.routeId,

        s.departureTime,
        s.arrivalTime,

        s.arrivalDayOffset,
        s.operatingDays,
        s.bookingCutoffMinutes,

        s.isActive,
        s.notes,

        s.createdBy,
        s.updatedBy,

        o.operatorCode
          AS operatorCode,

        o.operatorName
          AS operatorName,

        v.vesselCode
          AS vesselCode,

        v.vesselName
          AS vesselName,

        r.routeCode
          AS routeCode,

        r.fromPort
          AS fromPort,

        r.toPort
          AS toPort

      FROM trip_schedules AS s

      LEFT JOIN operators AS o
        ON o.id = s.operatorId

      LEFT JOIN vessels AS v
        ON v.id = s.vesselId

      LEFT JOIN routes AS r
        ON r.id = s.routeId

      WHERE s.id = ?
      LIMIT 1`
    )
    .bind(id)
    .first<D1TripScheduleJoinedRow>()

  return row
    ? toTripScheduleCompatRow(row)
    : null
}

export async function createTripScheduleD1(
  input: CreateTripScheduleD1Input
): Promise<TripScheduleCompatRow> {
  const db = getD1()

  const [
    operator,
    vessel,
    route,
  ] = await Promise.all([
    getTripScheduleOperatorByIdD1(
      db,
      input.operatorId
    ),

    getTripScheduleVesselByIdD1(
      db,
      input.vesselId
    ),

    getTripScheduleRouteByIdD1(
      db,
      input.routeId
    ),
  ])

  if (!operator) {
    throw new TripScheduleOperatorNotFoundError()
  }

  if (!vessel) {
    throw new TripScheduleVesselNotFoundError()
  }

  if (!route) {
    throw new TripScheduleRouteNotFoundError()
  }

  if (
    vessel.operatorId !==
    input.operatorId
  ) {
    throw new TripScheduleVesselOperatorMismatchError()
  }

  if (input.isActive) {
    if (operator.isActive !== 1) {
      throw new TripScheduleActiveOperatorRequiredError()
    }

    if (vessel.isActive !== 1) {
      throw new TripScheduleActiveVesselRequiredError()
    }

    if (route.isActive !== 1) {
      throw new TripScheduleActiveRouteRequiredError()
    }
  }

  const id = crypto.randomUUID()

  await db
    .prepare(
      `INSERT INTO trip_schedules (
        id,
        scheduleCode,

        operatorId,
        vesselId,
        routeId,

        departureTime,
        arrivalTime,
        arrivalDayOffset,

        operatingDays,
        bookingCutoffMinutes,

        isActive,
        notes,

        createdBy,
        updatedBy
      ) VALUES (
        ?, ?,
        ?, ?, ?,
        ?, ?, ?,
        ?, ?,
        ?, ?,
        ?, ?
      )`
    )
    .bind(
      id,
      input.scheduleCode,

      input.operatorId,
      input.vesselId,
      input.routeId,

      input.departureTime,
      input.arrivalTime,
      input.arrivalDayOffset,

      input.operatingDays,
      input.bookingCutoffMinutes,

      input.isActive ? 1 : 0,
      input.notes,

      input.createdBy,
      input.updatedBy
    )
    .run()

  const created =
    await getTripScheduleJoinedByIdD1(
      db,
      id
    )

  if (!created) {
    throw new Error(
      "Trip schedule could not be read after creation."
    )
  }

  return created
}

export class TripScheduleNotFoundError
  extends Error {
  constructor() {
    super(
      "Trip schedule could not be found."
    )
    this.name =
      "TripScheduleNotFoundError"
  }
}

export async function getTripScheduleByIdD1(
  id: string
): Promise<TripScheduleCompatRow | null> {
  const db = getD1()

  return getTripScheduleJoinedByIdD1(
    db,
    id
  )
}

export type UpdateTripScheduleD1Input = {
  id: string

  scheduleCode?: string

  operatorId?: string
  vesselId?: string
  routeId?: string

  departureTime?: string
  arrivalTime?: string
  arrivalDayOffset?: number

  operatingDays?: string
  bookingCutoffMinutes?: number

  isActive?: boolean
  notes?: string | null

  updatedBy: string | null
}

export async function updateTripScheduleD1(
  input: UpdateTripScheduleD1Input
): Promise<TripScheduleCompatRow> {
  const db = getD1()

  const existing =
    await getTripScheduleJoinedByIdD1(
      db,
      input.id
    )

  if (!existing) {
    throw new TripScheduleNotFoundError()
  }

  const effectiveOperatorId =
    input.operatorId ??
    existing.operatorId

  const effectiveVesselId =
    input.vesselId ??
    existing.vesselId

  const effectiveRouteId =
    input.routeId ??
    existing.routeId

  const effectiveIsActive =
    input.isActive ??
    existing.isActive

  const [
    operator,
    vessel,
    route,
  ] = await Promise.all([
    getTripScheduleOperatorByIdD1(
      db,
      effectiveOperatorId
    ),

    getTripScheduleVesselByIdD1(
      db,
      effectiveVesselId
    ),

    getTripScheduleRouteByIdD1(
      db,
      effectiveRouteId
    ),
  ])

  if (!operator) {
    throw new TripScheduleOperatorNotFoundError()
  }

  if (!vessel) {
    throw new TripScheduleVesselNotFoundError()
  }

  if (!route) {
    throw new TripScheduleRouteNotFoundError()
  }

  if (
    vessel.operatorId !==
    effectiveOperatorId
  ) {
    throw new TripScheduleVesselOperatorMismatchError()
  }

  if (effectiveIsActive) {
    if (operator.isActive !== 1) {
      throw new TripScheduleActiveOperatorRequiredError()
    }

    if (vessel.isActive !== 1) {
      throw new TripScheduleActiveVesselRequiredError()
    }

    if (route.isActive !== 1) {
      throw new TripScheduleActiveRouteRequiredError()
    }
  }

  const assignments: string[] = [
    "updatedBy = ?",
  ]

  const values:
    Array<string | number | null> = [
      input.updatedBy,
    ]

  if (input.scheduleCode !== undefined) {
    assignments.push(
      "scheduleCode = ?"
    )
    values.push(
      input.scheduleCode
    )
  }

  if (input.operatorId !== undefined) {
    assignments.push(
      "operatorId = ?"
    )
    values.push(
      input.operatorId
    )
  }

  if (input.vesselId !== undefined) {
    assignments.push(
      "vesselId = ?"
    )
    values.push(
      input.vesselId
    )
  }

  if (input.routeId !== undefined) {
    assignments.push(
      "routeId = ?"
    )
    values.push(
      input.routeId
    )
  }

  if (
    input.departureTime !== undefined
  ) {
    assignments.push(
      "departureTime = ?"
    )
    values.push(
      input.departureTime
    )
  }

  if (
    input.arrivalTime !== undefined
  ) {
    assignments.push(
      "arrivalTime = ?"
    )
    values.push(
      input.arrivalTime
    )
  }

  if (
    input.arrivalDayOffset !==
    undefined
  ) {
    assignments.push(
      "arrivalDayOffset = ?"
    )
    values.push(
      input.arrivalDayOffset
    )
  }

  if (
    input.operatingDays !== undefined
  ) {
    assignments.push(
      "operatingDays = ?"
    )
    values.push(
      input.operatingDays
    )
  }

  if (
    input.bookingCutoffMinutes !==
    undefined
  ) {
    assignments.push(
      "bookingCutoffMinutes = ?"
    )
    values.push(
      input.bookingCutoffMinutes
    )
  }

  if (input.isActive !== undefined) {
    assignments.push(
      "isActive = ?"
    )
    values.push(
      input.isActive ? 1 : 0
    )
  }

  if (input.notes !== undefined) {
    assignments.push(
      "notes = ?"
    )
    values.push(
      input.notes
    )
  }

  await db
    .prepare(
      `UPDATE trip_schedules
      SET ${assignments.join(", ")}
      WHERE id = ?`
    )
    .bind(
      ...values,
      input.id
    )
    .run()

  const updated =
    await getTripScheduleJoinedByIdD1(
      db,
      input.id
    )

  if (!updated) {
    throw new TripScheduleNotFoundError()
  }

  return updated
}
