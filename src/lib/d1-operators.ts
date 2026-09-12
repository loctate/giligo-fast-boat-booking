import {
  type AppwriteCompatSystemFields,
  type D1SystemFields,
  toAppwriteCompatSystemFields,
} from "@/lib/d1-compat";
import { getD1 } from "@/lib/d1-server";

export type D1OperatorRow = D1SystemFields & {
  operatorCode: string;
  operatorName: string;
  contactPerson: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  isActive: number;
  notes: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

export type OperatorCompatRow =
  AppwriteCompatSystemFields & {
    operatorCode: string;
    operatorName: string;
    contactPerson: string | null;
    phone: string | null;
    whatsapp: string | null;
    email: string | null;
    address: string | null;
    logoUrl: string | null;
    isActive: boolean;
    notes: string | null;
    createdBy: string | null;
    updatedBy: string | null;
  };

function toBoolean(value: number): boolean {
  if (value !== 0 && value !== 1) {
    throw new Error(
      `Invalid SQLite boolean value: ${value}`
    );
  }

  return value === 1;
}

export function toOperatorCompatRow(
  row: D1OperatorRow
): OperatorCompatRow {
  return {
    ...toAppwriteCompatSystemFields(row),

    operatorCode: row.operatorCode,
    operatorName: row.operatorName,
    contactPerson: row.contactPerson,
    phone: row.phone,
    whatsapp: row.whatsapp,
    email: row.email,
    address: row.address,
    logoUrl: row.logoUrl,
    isActive: toBoolean(row.isActive),
    notes: row.notes,
    createdBy: row.createdBy,
    updatedBy: row.updatedBy,
  };
}

export type OperatorListResult = {
  rows: OperatorCompatRow[];
  total: number;
};

export async function listOperatorsD1(): Promise<OperatorListResult> {
  const db = getD1();

  const rowsResult = await db
    .prepare(
      `SELECT
        id,
        createdAt,
        updatedAt,
        operatorCode,
        operatorName,
        contactPerson,
        phone,
        whatsapp,
        email,
        address,
        logoUrl,
        isActive,
        notes,
        createdBy,
        updatedBy
      FROM operators
      LIMIT 200`
    )
    .all<D1OperatorRow>();

  const countRow = await db
    .prepare(
      `SELECT COUNT(*) AS total
      FROM operators`
    )
    .first<{ total: number }>();

  const rows = rowsResult.results
    .map(toOperatorCompatRow)
    .sort((firstOperator, secondOperator) =>
      firstOperator.operatorName.localeCompare(
        secondOperator.operatorName,
        "en",
        {
          sensitivity: "base",
        }
      )
    );

  return {
    rows,
    total: Number(countRow?.total ?? 0),
  };
}

export type CreateOperatorD1Input = {
  operatorCode: string;
  operatorName: string;
  contactPerson: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  logoUrl: string | null;
  isActive: boolean;
  notes: string | null;
  createdBy: string | null;
  updatedBy: string | null;
};

export class OperatorCodeConflictError extends Error {
  constructor() {
    super("Operator code already exists.");
    this.name = "OperatorCodeConflictError";
  }
}

function isOperatorCodeConflict(
  error: unknown
): boolean {
  const message =
    error instanceof Error
      ? error.message
      : String(error);

  return (
    message.includes(
      "UNIQUE constraint failed: operators.operatorCode"
    ) ||
    message.includes(
      "uq_operators_operatorCode"
    )
  );
}

export async function createOperatorD1(
  input: CreateOperatorD1Input
): Promise<OperatorCompatRow> {
  const db = getD1();
  const id = crypto.randomUUID();

  try {
    const result = await db
      .prepare(
        `INSERT INTO operators (
          id,
          operatorCode,
          operatorName,
          contactPerson,
          phone,
          whatsapp,
          email,
          address,
          logoUrl,
          isActive,
          notes,
          createdBy,
          updatedBy
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
        )`
      )
      .bind(
        id,
        input.operatorCode,
        input.operatorName,
        input.contactPerson,
        input.phone,
        input.whatsapp,
        input.email,
        input.address,
        input.logoUrl,
        input.isActive ? 1 : 0,
        input.notes,
        input.createdBy,
        input.updatedBy
      )
      .run();

    if (!result.success) {
      throw new Error(
        "Operator could not be created."
      );
    }
  } catch (error) {
    if (isOperatorCodeConflict(error)) {
      throw new OperatorCodeConflictError();
    }

    throw error;
  }

  const row = await db
    .prepare(
      `SELECT
        id,
        createdAt,
        updatedAt,
        operatorCode,
        operatorName,
        contactPerson,
        phone,
        whatsapp,
        email,
        address,
        logoUrl,
        isActive,
        notes,
        createdBy,
        updatedBy
      FROM operators
      WHERE id = ?
      LIMIT 1`
    )
    .bind(id)
    .first<D1OperatorRow>();

  if (!row) {
    throw new Error(
      "Created operator could not be loaded."
    );
  }

  return toOperatorCompatRow(row);
}
