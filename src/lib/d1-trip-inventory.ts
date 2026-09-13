import { getD1 } from "@/lib/d1-server"

export type D1TripInventoryJoinedRow = {
  id: string
  createdAt: string
  updatedAt: string

  inventoryCode: string

  scheduleId: string
  operatorId: string
  vesselId: string
  routeId: string

  travelDate: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  seatCapacity: number
  bookedSeats: number
  heldSeats: number

  adultPrice: number
  childPrice: number
  infantPrice: number

  currency: string
  salesStatus: string

  isActive: number

  notes: string | null

  createdBy: string | null
  updatedBy: string | null

  scheduleCode: string | null

  operatorCode: string | null
  operatorName: string | null

  vesselCode: string | null
  vesselName: string | null

  routeCode: string | null
  fromPort: string | null
  toPort: string | null
}

export type TripInventoryCompatRow = {
  $id: string
  $createdAt: string
  $updatedAt?: string

  inventoryCode: string

  scheduleId: string
  operatorId: string
  vesselId: string
  routeId: string

  travelDate: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  seatCapacity: number
  bookedSeats: number
  heldSeats: number
  availableSeats: number

  adultPrice: number
  childPrice: number
  infantPrice: number

  currency: string
  salesStatus: string

  isActive: boolean

  notes: string | null

  createdBy: string | null
  updatedBy: string | null

  scheduleCode: string | null

  operatorCode: string | null
  operatorName: string | null

  vesselCode: string | null
  vesselName: string | null

  routeCode: string | null
  fromPort: string | null
  toPort: string | null
}

export type TripInventoryListResult = {
  inventories: TripInventoryCompatRow[]
  total: number
}

function toBoolean(
  value: number
): boolean {
  if (value !== 0 && value !== 1) {
    throw new Error(
      `Invalid SQLite boolean value: ${value}`
    )
  }

  return value === 1
}

export function toTripInventoryCompatRow(
  row: D1TripInventoryJoinedRow
): TripInventoryCompatRow {
  return {
    $id: row.id,

    $createdAt:
      row.createdAt,

    $updatedAt:
      row.updatedAt || undefined,

    inventoryCode:
      row.inventoryCode,

    scheduleId:
      row.scheduleId,

    operatorId:
      row.operatorId,

    vesselId:
      row.vesselId,

    routeId:
      row.routeId,

    travelDate:
      row.travelDate,

    departureTime:
      row.departureTime,

    arrivalTime:
      row.arrivalTime,

    arrivalDayOffset:
      row.arrivalDayOffset,

    seatCapacity:
      row.seatCapacity,

    bookedSeats:
      row.bookedSeats,

    heldSeats:
      row.heldSeats,

    availableSeats:
      Math.max(
        0,
        row.seatCapacity -
          row.bookedSeats -
          row.heldSeats
      ),

    adultPrice:
      row.adultPrice,

    childPrice:
      row.childPrice,

    infantPrice:
      row.infantPrice,

    currency:
      row.currency,

    salesStatus:
      row.salesStatus,

    isActive:
      toBoolean(row.isActive),

    notes:
      row.notes,

    createdBy:
      row.createdBy,

    updatedBy:
      row.updatedBy,

    scheduleCode:
      row.scheduleCode,

    operatorCode:
      row.operatorCode,

    operatorName:
      row.operatorName,

    vesselCode:
      row.vesselCode,

    vesselName:
      row.vesselName,

    routeCode:
      row.routeCode,

    fromPort:
      row.fromPort,

    toPort:
      row.toPort,
  }
}

export function sortTripInventoryD1(
  inventories: TripInventoryCompatRow[]
): TripInventoryCompatRow[] {
  return [...inventories].sort(
    (
      firstItem,
      secondItem
    ) => {
      const travelDateComparison =
        firstItem.travelDate.localeCompare(
          secondItem.travelDate
        )

      if (travelDateComparison !== 0) {
        return travelDateComparison
      }

      return firstItem.departureTime.localeCompare(
        secondItem.departureTime
      )
    }
  )
}

export async function listTripInventoryD1():
  Promise<TripInventoryListResult> {
  const db = getD1()

  const [
    inventoriesResult,
    totalRow,
  ] = await Promise.all([
    db.prepare(
      `SELECT
        i.id,
        i.createdAt,
        i.updatedAt,

        i.inventoryCode,

        i.scheduleId,
        i.operatorId,
        i.vesselId,
        i.routeId,

        i.travelDate,

        i.departureTime,
        i.arrivalTime,
        i.arrivalDayOffset,

        i.seatCapacity,
        i.bookedSeats,
        i.heldSeats,

        i.adultPrice,
        i.childPrice,
        i.infantPrice,

        i.currency,
        i.salesStatus,

        i.isActive,

        i.notes,

        i.createdBy,
        i.updatedBy,

        s.scheduleCode
          AS scheduleCode,

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

      FROM trip_inventory AS i

      LEFT JOIN trip_schedules AS s
        ON s.id = i.scheduleId

      LEFT JOIN operators AS o
        ON o.id = i.operatorId

      LEFT JOIN vessels AS v
        ON v.id = i.vesselId

      LEFT JOIN routes AS r
        ON r.id = i.routeId

      LIMIT 200`
    ).all<D1TripInventoryJoinedRow>(),

    db.prepare(
      `SELECT COUNT(*) AS total
      FROM trip_inventory`
    ).first<{ total: number }>(),
  ])

  const inventories =
    sortTripInventoryD1(
      inventoriesResult.results.map(
        toTripInventoryCompatRow
      )
    )

  return {
    inventories,

    total:
      Number(totalRow?.total ?? 0),
  }
}

export type TripInventoryScheduleOptionD1 = {
  $id: string

  scheduleCode: string

  operatorId: string
  vesselId: string
  routeId: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  operatingDays: string
  isActive: boolean

  operatorName: string
  vesselName: string
  vesselActiveCapacity: number

  routeCode: string
  fromPort: string
  toPort: string
}

type D1TripInventoryScheduleOptionRow = {
  id: string

  scheduleCode: string

  operatorId: string
  vesselId: string
  routeId: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  operatingDays: string
  isActive: number

  operatorName: string | null

  vesselName: string | null
  vesselActiveCapacity: number | null

  routeCode: string | null
  fromPort: string | null
  toPort: string | null
}

export type TripInventoryPageDataD1 = {
  inventory: TripInventoryCompatRow[]
  schedules: TripInventoryScheduleOptionD1[]
}

function toTripInventoryScheduleOptionD1(
  row: D1TripInventoryScheduleOptionRow
): TripInventoryScheduleOptionD1 {
  return {
    $id: row.id,

    scheduleCode:
      row.scheduleCode,

    operatorId:
      row.operatorId,

    vesselId:
      row.vesselId,

    routeId:
      row.routeId,

    departureTime:
      row.departureTime,

    arrivalTime:
      row.arrivalTime,

    arrivalDayOffset:
      row.arrivalDayOffset,

    operatingDays:
      row.operatingDays,

    isActive:
      toBoolean(row.isActive),

    operatorName:
      row.operatorName ?? "",

    vesselName:
      row.vesselName ?? "",

    vesselActiveCapacity:
      Number(
        row.vesselActiveCapacity ?? 0
      ),

    routeCode:
      row.routeCode ?? "",

    fromPort:
      row.fromPort ?? "",

    toPort:
      row.toPort ?? "",
  }
}

export function sortTripInventorySchedulesD1(
  schedules: TripInventoryScheduleOptionD1[]
): TripInventoryScheduleOptionD1[] {
  return [...schedules].sort(
    (
      first,
      second
    ) => {
      const routeComparison =
        first.routeCode.localeCompare(
          second.routeCode,
          "en",
          {
            sensitivity: "base",
          }
        )

      if (routeComparison !== 0) {
        return routeComparison
      }

      return first.departureTime.localeCompare(
        second.departureTime
      )
    }
  )
}

export async function getTripInventoryPageDataD1():
  Promise<TripInventoryPageDataD1> {
  const db = getD1()

  const [
    inventoryResult,
    schedulesResult,
  ] = await Promise.all([
    listTripInventoryD1(),

    db.prepare(
      `SELECT
        s.id,

        s.scheduleCode,

        s.operatorId,
        s.vesselId,
        s.routeId,

        s.departureTime,
        s.arrivalTime,
        s.arrivalDayOffset,

        s.operatingDays,
        s.isActive,

        o.operatorName
          AS operatorName,

        v.vesselName
          AS vesselName,

        v.activeCapacity
          AS vesselActiveCapacity,

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
    ).all<D1TripInventoryScheduleOptionRow>(),
  ])

  const schedules =
    sortTripInventorySchedulesD1(
      schedulesResult.results.map(
        toTripInventoryScheduleOptionD1
      )
    )

  return {
    inventory:
      inventoryResult.inventories,

    schedules,
  }
}

export type CreateTripInventoryD1Input = {
  scheduleId: string
  travelDate: string

  seatCapacity: number

  adultPrice: number
  childPrice: number
  infantPrice: number

  currency: string
  salesStatus: string

  isActive: boolean

  notes: string | null

  createdBy: string | null
  updatedBy: string | null
}

type TripInventoryCreateRelationRow = {
  scheduleId: string
  scheduleCode: string

  operatorId: string
  vesselId: string
  routeId: string

  departureTime: string
  arrivalTime: string
  arrivalDayOffset: number

  operatingDays: string

  scheduleIsActive: number

  operatorRowId: string | null
  operatorIsActive: number | null

  vesselRowId: string | null
  vesselOperatorId: string | null
  vesselActiveCapacity: number | null
  vesselIsActive: number | null

  routeRowId: string | null
  routeIsActive: number | null
}

export class TripInventoryScheduleNotFoundError
  extends Error {
  constructor() {
    super(
      "Selected trip schedule could not be found."
    )

    this.name =
      "TripInventoryScheduleNotFoundError"
  }
}

export class TripInventoryScheduleOperatorNotFoundError
  extends Error {
  constructor() {
    super(
      "The schedule operator could not be found."
    )

    this.name =
      "TripInventoryScheduleOperatorNotFoundError"
  }
}

export class TripInventoryScheduleVesselNotFoundError
  extends Error {
  constructor() {
    super(
      "The schedule vessel could not be found."
    )

    this.name =
      "TripInventoryScheduleVesselNotFoundError"
  }
}

export class TripInventoryScheduleRouteNotFoundError
  extends Error {
  constructor() {
    super(
      "The schedule route could not be found."
    )

    this.name =
      "TripInventoryScheduleRouteNotFoundError"
  }
}

export class TripInventoryScheduleVesselOperatorMismatchError
  extends Error {
  constructor() {
    super(
      "The schedule vessel does not belong to its operator."
    )

    this.name =
      "TripInventoryScheduleVesselOperatorMismatchError"
  }
}

export class TripInventoryInvalidVesselActiveCapacityError
  extends Error {
  constructor() {
    super(
      "The selected vessel has an invalid active capacity."
    )

    this.name =
      "TripInventoryInvalidVesselActiveCapacityError"
  }
}

export class TripInventorySeatCapacityExceedsVesselAllocationError
  extends Error {
  constructor(
    activeCapacity: number
  ) {
    super(
      `Seat capacity cannot exceed the vessel allocation of ${activeCapacity} seats.`
    )

    this.name =
      "TripInventorySeatCapacityExceedsVesselAllocationError"
  }
}

export class TripInventoryScheduleOperatingDayError
  extends Error {
  constructor(
    travelDay: string
  ) {
    super(
      `The selected schedule does not operate on ${travelDay}.`
    )

    this.name =
      "TripInventoryScheduleOperatingDayError"
  }
}

export class TripInventoryOpenActiveScheduleRequiredError
  extends Error {
  constructor() {
    super(
      "Open inventory requires an active trip schedule."
    )

    this.name =
      "TripInventoryOpenActiveScheduleRequiredError"
  }
}

export class TripInventoryOpenActiveOperatorRequiredError
  extends Error {
  constructor() {
    super(
      "Open inventory requires an active operator."
    )

    this.name =
      "TripInventoryOpenActiveOperatorRequiredError"
  }
}

export class TripInventoryOpenActiveVesselRequiredError
  extends Error {
  constructor() {
    super(
      "Open inventory requires an active vessel."
    )

    this.name =
      "TripInventoryOpenActiveVesselRequiredError"
  }
}

export class TripInventoryOpenActiveRouteRequiredError
  extends Error {
  constructor() {
    super(
      "Open inventory requires an active route."
    )

    this.name =
      "TripInventoryOpenActiveRouteRequiredError"
  }
}

export class TripInventoryOpenSeatRequiredError
  extends Error {
  constructor() {
    super(
      "Open inventory must have at least one available seat."
    )

    this.name =
      "TripInventoryOpenSeatRequiredError"
  }
}

export class TripInventoryScheduleDateConflictError
  extends Error {
  constructor() {
    super(
      "Inventory for this schedule and travel date already exists."
    )

    this.name =
      "TripInventoryScheduleDateConflictError"
  }
}

function getTripInventoryWeekdayCodeD1(
  travelDate: string
): string {
  const [
    year,
    month,
    day,
  ] = travelDate
    .split("-")
    .map(Number)

  const parsedDate =
    new Date(
      Date.UTC(
        year,
        month - 1,
        day
      )
    )

  const weekdays = [
    "SUN",
    "MON",
    "TUE",
    "WED",
    "THU",
    "FRI",
    "SAT",
  ]

  return weekdays[
    parsedDate.getUTCDay()
  ]
}

async function getTripInventoryCreateRelationD1(
  db: D1Database,
  scheduleId: string
): Promise<
  TripInventoryCreateRelationRow | null
> {
  return db
    .prepare(
      `SELECT
        s.id
          AS scheduleId,

        s.scheduleCode
          AS scheduleCode,

        s.operatorId
          AS operatorId,

        s.vesselId
          AS vesselId,

        s.routeId
          AS routeId,

        s.departureTime
          AS departureTime,

        s.arrivalTime
          AS arrivalTime,

        s.arrivalDayOffset
          AS arrivalDayOffset,

        s.operatingDays
          AS operatingDays,

        s.isActive
          AS scheduleIsActive,

        o.id
          AS operatorRowId,

        o.isActive
          AS operatorIsActive,

        v.id
          AS vesselRowId,

        v.operatorId
          AS vesselOperatorId,

        v.activeCapacity
          AS vesselActiveCapacity,

        v.isActive
          AS vesselIsActive,

        r.id
          AS routeRowId,

        r.isActive
          AS routeIsActive

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
    .bind(scheduleId)
    .first<TripInventoryCreateRelationRow>()
}

async function getTripInventoryJoinedByIdD1(
  db: D1Database,
  id: string
): Promise<
  TripInventoryCompatRow | null
> {
  const row = await db
    .prepare(
      `SELECT
        i.id,
        i.createdAt,
        i.updatedAt,

        i.inventoryCode,

        i.scheduleId,
        i.operatorId,
        i.vesselId,
        i.routeId,

        i.travelDate,

        i.departureTime,
        i.arrivalTime,
        i.arrivalDayOffset,

        i.seatCapacity,
        i.bookedSeats,
        i.heldSeats,

        i.adultPrice,
        i.childPrice,
        i.infantPrice,

        i.currency,
        i.salesStatus,

        i.isActive,

        i.notes,

        i.createdBy,
        i.updatedBy,

        s.scheduleCode
          AS scheduleCode,

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

      FROM trip_inventory AS i

      LEFT JOIN trip_schedules AS s
        ON s.id = i.scheduleId

      LEFT JOIN operators AS o
        ON o.id = i.operatorId

      LEFT JOIN vessels AS v
        ON v.id = i.vesselId

      LEFT JOIN routes AS r
        ON r.id = i.routeId

      WHERE i.id = ?

      LIMIT 1`
    )
    .bind(id)
    .first<D1TripInventoryJoinedRow>()

  if (!row) {
    return null
  }

  return toTripInventoryCompatRow(row)
}

function isTripInventoryScheduleDateConflictD1(
  error: unknown
): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  const message =
    error.message.toLowerCase()

  return (
    message.includes(
      "unique constraint failed"
    ) &&
    message.includes(
      "trip_inventory.scheduleid"
    ) &&
    message.includes(
      "trip_inventory.traveldate"
    )
  )
}

export async function createTripInventoryD1(
  input: CreateTripInventoryD1Input
): Promise<TripInventoryCompatRow> {
  const db = getD1()

  const relation =
    await getTripInventoryCreateRelationD1(
      db,
      input.scheduleId
    )

  if (!relation) {
    throw new TripInventoryScheduleNotFoundError()
  }

  if (!relation.operatorRowId) {
    throw new TripInventoryScheduleOperatorNotFoundError()
  }

  if (!relation.vesselRowId) {
    throw new TripInventoryScheduleVesselNotFoundError()
  }

  if (!relation.routeRowId) {
    throw new TripInventoryScheduleRouteNotFoundError()
  }

  if (
    relation.vesselOperatorId !==
    relation.operatorId
  ) {
    throw new TripInventoryScheduleVesselOperatorMismatchError()
  }

  const activeCapacity =
    Number(
      relation.vesselActiveCapacity
    )

  if (
    !Number.isInteger(activeCapacity) ||
    activeCapacity < 0
  ) {
    throw new TripInventoryInvalidVesselActiveCapacityError()
  }

  if (
    input.seatCapacity >
    activeCapacity
  ) {
    throw new TripInventorySeatCapacityExceedsVesselAllocationError(
      activeCapacity
    )
  }

  const operatingDays =
    String(
      relation.operatingDays ?? ""
    )
      .split(",")
      .map(
        (value) =>
          value.trim().toUpperCase()
      )
      .filter(Boolean)

  const travelDay =
    getTripInventoryWeekdayCodeD1(
      input.travelDate
    )

  if (
    !operatingDays.includes(
      travelDay
    )
  ) {
    throw new TripInventoryScheduleOperatingDayError(
      travelDay
    )
  }

  const scheduleIsActive =
    toBoolean(
      relation.scheduleIsActive
    )

  const operatorIsActive =
    relation.operatorIsActive === null
      ? false
      : toBoolean(
          relation.operatorIsActive
        )

  const vesselIsActive =
    relation.vesselIsActive === null
      ? false
      : toBoolean(
          relation.vesselIsActive
        )

  const routeIsActive =
    relation.routeIsActive === null
      ? false
      : toBoolean(
          relation.routeIsActive
        )

  if (
    input.isActive &&
    input.salesStatus === "OPEN"
  ) {
    if (!scheduleIsActive) {
      throw new TripInventoryOpenActiveScheduleRequiredError()
    }

    if (!operatorIsActive) {
      throw new TripInventoryOpenActiveOperatorRequiredError()
    }

    if (!vesselIsActive) {
      throw new TripInventoryOpenActiveVesselRequiredError()
    }

    if (!routeIsActive) {
      throw new TripInventoryOpenActiveRouteRequiredError()
    }

    if (input.seatCapacity < 1) {
      throw new TripInventoryOpenSeatRequiredError()
    }
  }

  const scheduleCode =
    relation.scheduleCode
      .trim()
      .toUpperCase()

  const inventoryCode =
    `${scheduleCode}-${input.travelDate.replaceAll("-", "")}`

  const id =
    crypto.randomUUID()

  try {
    await db
      .prepare(
        `INSERT INTO trip_inventory (
          id,

          inventoryCode,

          scheduleId,
          operatorId,
          vesselId,
          routeId,

          travelDate,

          departureTime,
          arrivalTime,
          arrivalDayOffset,

          seatCapacity,
          bookedSeats,
          heldSeats,

          adultPrice,
          childPrice,
          infantPrice,

          currency,
          salesStatus,

          isActive,

          notes,

          createdBy,
          updatedBy
        ) VALUES (
          ?,
          ?,
          ?, ?, ?, ?,
          ?,
          ?, ?, ?,
          ?, 0, 0,
          ?, ?, ?,
          ?, ?,
          ?,
          ?,
          ?, ?
        )`
      )
      .bind(
        id,

        inventoryCode,

        relation.scheduleId,
        relation.operatorId,
        relation.vesselId,
        relation.routeId,

        input.travelDate,

        relation.departureTime,
        relation.arrivalTime,
        relation.arrivalDayOffset,

        input.seatCapacity,

        input.adultPrice,
        input.childPrice,
        input.infantPrice,

        input.currency,
        input.salesStatus,

        input.isActive ? 1 : 0,

        input.notes,

        input.createdBy,
        input.updatedBy
      )
      .run()
  } catch (error) {
    if (
      isTripInventoryScheduleDateConflictD1(
        error
      )
    ) {
      throw new TripInventoryScheduleDateConflictError()
    }

    throw error
  }

  const created =
    await getTripInventoryJoinedByIdD1(
      db,
      id
    )

  if (!created) {
    throw new Error(
      "Trip inventory could not be loaded after creation."
    )
  }

  return created
}

export type UpdateTripInventoryD1Input = {
  scheduleId?: string
  travelDate?: string

  seatCapacity?: number

  adultPrice?: number
  childPrice?: number
  infantPrice?: number

  currency?: string
  salesStatus?: string

  isActive?: boolean

  notes?: string | null

  updatedBy: string | null
}

export class TripInventoryNotFoundError
  extends Error {
  constructor() {
    super(
      "Trip inventory could not be found."
    )

    this.name =
      "TripInventoryNotFoundError"
  }
}

export class TripInventoryExistingSeatDataInvalidError
  extends Error {
  constructor() {
    super(
      "Existing booked or held seat data is invalid."
    )

    this.name =
      "TripInventoryExistingSeatDataInvalidError"
  }
}

export class TripInventorySeatCapacityBelowConsumedError
  extends Error {
  constructor(
    consumedSeats: number
  ) {
    super(
      `Seat capacity cannot be lower than the ${consumedSeats} seats currently booked or held.`
    )

    this.name =
      "TripInventorySeatCapacityBelowConsumedError"
  }
}

export class TripInventoryUpdateOpenSeatRequiredError
  extends Error {
  constructor() {
    super(
      "Open inventory must have at least one seat."
    )

    this.name =
      "TripInventoryUpdateOpenSeatRequiredError"
  }
}

export async function updateTripInventoryD1(
  id: string,
  input: UpdateTripInventoryD1Input
): Promise<TripInventoryCompatRow> {
  const db = getD1()

  const existing =
    await getTripInventoryJoinedByIdD1(
      db,
      id
    )

  if (!existing) {
    throw new TripInventoryNotFoundError()
  }

  let effectiveScheduleId =
    existing.scheduleId

  let effectiveTravelDate =
    existing.travelDate

  let effectiveSeatCapacity =
    existing.seatCapacity

  let effectiveAdultPrice =
    existing.adultPrice

  let effectiveChildPrice =
    existing.childPrice

  let effectiveInfantPrice =
    existing.infantPrice

  let effectiveCurrency =
    existing.currency
      .trim()
      .toUpperCase()

  let effectiveSalesStatus =
    existing.salesStatus
      .trim()
      .toUpperCase()

  let effectiveIsActive =
    existing.isActive

  let effectiveNotes =
    existing.notes ?? null

  const bookedSeats =
    Number(existing.bookedSeats)

  const heldSeats =
    Number(existing.heldSeats)

  if (
    !Number.isInteger(bookedSeats) ||
    bookedSeats < 0 ||
    !Number.isInteger(heldSeats) ||
    heldSeats < 0
  ) {
    throw new TripInventoryExistingSeatDataInvalidError()
  }

  if (
    input.scheduleId !==
    undefined
  ) {
    effectiveScheduleId =
      input.scheduleId
  }

  if (
    input.travelDate !==
    undefined
  ) {
    effectiveTravelDate =
      input.travelDate
  }

  if (
    input.seatCapacity !==
    undefined
  ) {
    effectiveSeatCapacity =
      input.seatCapacity
  }

  if (
    input.adultPrice !==
    undefined
  ) {
    effectiveAdultPrice =
      input.adultPrice
  }

  if (
    input.childPrice !==
    undefined
  ) {
    effectiveChildPrice =
      input.childPrice
  }

  if (
    input.infantPrice !==
    undefined
  ) {
    effectiveInfantPrice =
      input.infantPrice
  }

  if (
    input.currency !==
    undefined
  ) {
    effectiveCurrency =
      input.currency
  }

  if (
    input.salesStatus !==
    undefined
  ) {
    effectiveSalesStatus =
      input.salesStatus
  }

  if (
    input.isActive !==
    undefined
  ) {
    effectiveIsActive =
      input.isActive
  }

  if (
    input.notes !==
    undefined
  ) {
    effectiveNotes =
      input.notes
  }

  const consumedSeats =
    bookedSeats +
    heldSeats

  if (
    effectiveSeatCapacity <
    consumedSeats
  ) {
    throw new TripInventorySeatCapacityBelowConsumedError(
      consumedSeats
    )
  }

  const relation =
    await getTripInventoryCreateRelationD1(
      db,
      effectiveScheduleId
    )

  if (!relation) {
    throw new TripInventoryScheduleNotFoundError()
  }

  if (!relation.operatorRowId) {
    throw new TripInventoryScheduleOperatorNotFoundError()
  }

  if (!relation.vesselRowId) {
    throw new TripInventoryScheduleVesselNotFoundError()
  }

  if (!relation.routeRowId) {
    throw new TripInventoryScheduleRouteNotFoundError()
  }

  if (
    relation.vesselOperatorId !==
    relation.operatorId
  ) {
    throw new TripInventoryScheduleVesselOperatorMismatchError()
  }

  const vesselActiveCapacity =
    Number(
      relation.vesselActiveCapacity
    )

  if (
    !Number.isInteger(
      vesselActiveCapacity
    ) ||
    vesselActiveCapacity < 0
  ) {
    throw new TripInventoryInvalidVesselActiveCapacityError()
  }

  if (
    effectiveSeatCapacity >
    vesselActiveCapacity
  ) {
    throw new TripInventorySeatCapacityExceedsVesselAllocationError(
      vesselActiveCapacity
    )
  }

  const operatingDays =
    String(
      relation.operatingDays ?? ""
    )
      .split(",")
      .map(
        (value) =>
          value.trim().toUpperCase()
      )
      .filter(Boolean)

  const travelDay =
    getTripInventoryWeekdayCodeD1(
      effectiveTravelDate
    )

  if (
    !operatingDays.includes(
      travelDay
    )
  ) {
    throw new TripInventoryScheduleOperatingDayError(
      travelDay
    )
  }

  const availableSeats =
    effectiveSeatCapacity -
    bookedSeats -
    heldSeats

  if (
    effectiveSalesStatus ===
      "SOLD_OUT" &&
    availableSeats > 0
  ) {
    effectiveSalesStatus =
      "OPEN"
  }

  if (
    effectiveSalesStatus ===
      "OPEN" &&
    availableSeats <= 0
  ) {
    effectiveSalesStatus =
      "SOLD_OUT"
  }

  const scheduleIsActive =
    toBoolean(
      relation.scheduleIsActive
    )

  const operatorIsActive =
    relation.operatorIsActive ===
    null
      ? false
      : toBoolean(
          relation.operatorIsActive
        )

  const vesselIsActive =
    relation.vesselIsActive ===
    null
      ? false
      : toBoolean(
          relation.vesselIsActive
        )

  const routeIsActive =
    relation.routeIsActive ===
    null
      ? false
      : toBoolean(
          relation.routeIsActive
        )

  if (
    effectiveIsActive &&
    effectiveSalesStatus ===
      "OPEN"
  ) {
    if (!scheduleIsActive) {
      throw new TripInventoryOpenActiveScheduleRequiredError()
    }

    if (!operatorIsActive) {
      throw new TripInventoryOpenActiveOperatorRequiredError()
    }

    if (!vesselIsActive) {
      throw new TripInventoryOpenActiveVesselRequiredError()
    }

    if (!routeIsActive) {
      throw new TripInventoryOpenActiveRouteRequiredError()
    }

    if (
      effectiveSeatCapacity <
      1
    ) {
      throw new TripInventoryUpdateOpenSeatRequiredError()
    }
  }

  const scheduleCode =
    relation.scheduleCode
      .trim()
      .toUpperCase()

  const inventoryCode =
    `${scheduleCode}-${effectiveTravelDate.replaceAll("-", "")}`

  try {
    await db
      .prepare(
        `UPDATE trip_inventory
        SET
          inventoryCode = ?,

          scheduleId = ?,
          operatorId = ?,
          vesselId = ?,
          routeId = ?,

          travelDate = ?,

          departureTime = ?,
          arrivalTime = ?,
          arrivalDayOffset = ?,

          seatCapacity = ?,

          adultPrice = ?,
          childPrice = ?,
          infantPrice = ?,

          currency = ?,
          salesStatus = ?,

          isActive = ?,

          notes = ?,

          updatedBy = ?

        WHERE id = ?`
      )
      .bind(
        inventoryCode,

        relation.scheduleId,
        relation.operatorId,
        relation.vesselId,
        relation.routeId,

        effectiveTravelDate,

        relation.departureTime,
        relation.arrivalTime,
        relation.arrivalDayOffset,

        effectiveSeatCapacity,

        effectiveAdultPrice,
        effectiveChildPrice,
        effectiveInfantPrice,

        effectiveCurrency,
        effectiveSalesStatus,

        effectiveIsActive ? 1 : 0,

        effectiveNotes,

        input.updatedBy,

        id
      )
      .run()
  } catch (error) {
    if (
      isTripInventoryScheduleDateConflictD1(
        error
      )
    ) {
      throw new TripInventoryScheduleDateConflictError()
    }

    throw error
  }

  const updated =
    await getTripInventoryJoinedByIdD1(
      db,
      id
    )

  if (!updated) {
    throw new TripInventoryNotFoundError()
  }

  return updated
}
