import {
  type AppwriteCompatSystemFields,
  type D1SystemFields,
  toAppwriteCompatSystemFields,
} from "@/lib/d1-compat"
import { getD1 } from "@/lib/d1-server"

export type D1VesselJoinedRow =
  D1SystemFields & {
    vesselCode: string
    operatorId: string

    operatorCode: string | null
    operatorName: string | null
    operatorIsActive: number | null

    vesselName: string
    vesselType: string | null
    registrationNumber: string | null

    totalCapacity: number
    activeCapacity: number

    imageUrl: string | null
    isActive: number
    notes: string | null

    createdBy: string | null
    updatedBy: string | null
  }

export type VesselCompatRow =
  AppwriteCompatSystemFields & {
    vesselCode: string
    operatorId: string

    operatorCode: string
    operatorName: string

    vesselName: string
    vesselType: string | null
    registrationNumber: string | null

    totalCapacity: number
    activeCapacity: number

    imageUrl: string | null
    isActive: boolean
    notes: string | null

    createdBy: string | null
    updatedBy: string | null
  }

export type VesselOperatorOption = {
  $id: string
  operatorCode: string
  operatorName: string
  isActive: boolean
}

export type D1VesselOperatorRow = {
  id: string
  operatorCode: string
  operatorName: string
  isActive: number
}

export type VesselListResult = {
  vessels: VesselCompatRow[]
  operators: VesselOperatorOption[]
  total: number
}

export type ListVesselsD1Options = {
  includeInactiveOperators?: boolean
}

function toBoolean(value: number): boolean {
  if (value !== 0 && value !== 1) {
    throw new Error(
      `Invalid SQLite boolean value: ${value}`
    )
  }

  return value === 1
}

export function toVesselCompatRow(
  row: D1VesselJoinedRow
): VesselCompatRow {
  return {
    ...toAppwriteCompatSystemFields(row),

    vesselCode: row.vesselCode,
    operatorId: row.operatorId,

    operatorCode: row.operatorCode ?? "",
    operatorName:
      row.operatorName ?? "Unknown operator",

    vesselName: row.vesselName,
    vesselType: row.vesselType,
    registrationNumber:
      row.registrationNumber,

    totalCapacity: row.totalCapacity,
    activeCapacity: row.activeCapacity,

    imageUrl: row.imageUrl,
    isActive: toBoolean(row.isActive),
    notes: row.notes,

    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  }
}

export function toVesselOperatorOption(
  row: D1VesselOperatorRow
): VesselOperatorOption {
  return {
    $id: row.id,
    operatorCode: row.operatorCode,
    operatorName: row.operatorName,
    isActive: toBoolean(row.isActive),
  }
}

export async function listVesselsD1(
  options: ListVesselsD1Options = {}
): Promise<VesselListResult> {
  const db = getD1()

  const operatorWhereClause =
    options.includeInactiveOperators
      ? ""
      : "WHERE isActive = 1"

  const [
    vesselsResult,
    operatorsResult,
    totalRow,
  ] = await Promise.all([
    db.prepare(
      `SELECT
        v.id,
        v.createdAt,
        v.updatedAt,

        v.vesselCode,
        v.operatorId,

        o.operatorCode AS operatorCode,
        o.operatorName AS operatorName,
        o.isActive AS operatorIsActive,

        v.vesselName,
        v.vesselType,
        v.registrationNumber,

        v.totalCapacity,
        v.activeCapacity,

        v.imageUrl,
        v.isActive,
        v.notes,

        v.createdBy,
        v.updatedBy
      FROM vessels AS v
      LEFT JOIN operators AS o
        ON o.id = v.operatorId
      LIMIT 200`
    ).all<D1VesselJoinedRow>(),

    db.prepare(
      `SELECT
        id,
        operatorCode,
        operatorName,
        isActive
      FROM operators
      ${operatorWhereClause}
      LIMIT 200`
    ).all<D1VesselOperatorRow>(),

    db.prepare(
      `SELECT COUNT(*) AS total
      FROM vessels`
    ).first<{ total: number }>(),
  ])

  const vessels =
    vesselsResult.results
      .map(toVesselCompatRow)
      .sort((firstVessel, secondVessel) =>
        firstVessel.vesselName.localeCompare(
          secondVessel.vesselName,
          "en",
          {
            sensitivity: "base",
          }
        )
      )

  const operators =
    operatorsResult.results
      .map(toVesselOperatorOption)
      .sort((firstOperator, secondOperator) =>
        firstOperator.operatorName.localeCompare(
          secondOperator.operatorName,
          "en",
          {
            sensitivity: "base",
          }
        )
      )

  return {
    vessels,
    operators,
    total: Number(totalRow?.total ?? 0),
  }
}

export type CreateVesselD1Input = {
  vesselCode: string
  operatorId: string
  vesselName: string
  vesselType: string | null
  registrationNumber: string | null
  totalCapacity: number
  activeCapacity: number
  imageUrl: string | null
  isActive: boolean
  notes: string | null
  createdBy: string | null
  updatedBy: string | null
}

export class VesselOperatorNotFoundError
  extends Error {
  constructor() {
    super(
      "Selected operator could not be found."
    )

    this.name =
      "VesselOperatorNotFoundError"
  }
}

export class VesselOperatorInactiveError
  extends Error {
  constructor() {
    super(
      "Selected operator is currently inactive."
    )

    this.name =
      "VesselOperatorInactiveError"
  }
}

export async function createVesselD1(
  input: CreateVesselD1Input
): Promise<VesselCompatRow> {
  const db = getD1()
  const id = crypto.randomUUID()

  const operatorRow = await db
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
    .bind(input.operatorId)
    .first<D1VesselOperatorRow>()

  if (!operatorRow) {
    throw new VesselOperatorNotFoundError()
  }

  if (!toBoolean(operatorRow.isActive)) {
    throw new VesselOperatorInactiveError()
  }

  const result = await db
    .prepare(
      `INSERT INTO vessels (
        id,
        vesselCode,
        operatorId,
        vesselName,
        vesselType,
        registrationNumber,
        totalCapacity,
        activeCapacity,
        imageUrl,
        isActive,
        notes,
        createdBy,
        updatedBy
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?
      )`
    )
    .bind(
      id,
      input.vesselCode,
      input.operatorId,
      input.vesselName,
      input.vesselType,
      input.registrationNumber,
      input.totalCapacity,
      input.activeCapacity,
      input.imageUrl,
      input.isActive ? 1 : 0,
      input.notes,
      input.createdBy,
      input.updatedBy
    )
    .run()

  if (!result.success) {
    throw new Error(
      "Vessel could not be created."
    )
  }

  const row = await db
    .prepare(
      `SELECT
        v.id,
        v.createdAt,
        v.updatedAt,

        v.vesselCode,
        v.operatorId,

        o.operatorCode AS operatorCode,
        o.operatorName AS operatorName,
        o.isActive AS operatorIsActive,

        v.vesselName,
        v.vesselType,
        v.registrationNumber,

        v.totalCapacity,
        v.activeCapacity,

        v.imageUrl,
        v.isActive,
        v.notes,

        v.createdBy,
        v.updatedBy
      FROM vessels AS v
      LEFT JOIN operators AS o
        ON o.id = v.operatorId
      WHERE v.id = ?
      LIMIT 1`
    )
    .bind(id)
    .first<D1VesselJoinedRow>()

  if (!row) {
    throw new Error(
      "Created vessel could not be loaded."
    )
  }

  return toVesselCompatRow(row)
}
