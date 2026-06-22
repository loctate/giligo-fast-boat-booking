import Link from "next/link"
import { Query } from "node-appwrite"

import { requireAdmin } from "@/lib/admin-auth"
import {
  appwriteConfig,
  tablesDB,
} from "@/lib/appwrite-server"

import LogoutButton from "../LogoutButton"
import VesselsManager, {
  type OperatorOption,
  type VesselRow,
} from "./VesselsManager"

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

function toPlainOperator(
  row: Record<string, unknown>
): OperatorOption {
  return {
    $id: String(row.$id ?? ""),

    operatorCode: String(
      row.operatorCode ?? ""
    ),

    operatorName: String(
      row.operatorName ?? ""
    ),

    isActive:
      typeof row.isActive === "boolean"
        ? row.isActive
        : false,
  }
}

function toPlainVessel(
  row: Record<string, unknown>,
  operator?: OperatorOption
): VesselRow {
  return {
    $id: String(row.$id ?? ""),
    $createdAt: String(row.$createdAt ?? ""),

    $updatedAt: row.$updatedAt
      ? String(row.$updatedAt)
      : undefined,

    vesselCode: String(
      row.vesselCode ?? ""
    ),

    operatorId: String(
      row.operatorId ?? ""
    ),

    operatorCode:
      operator?.operatorCode ?? "",

    operatorName:
      operator?.operatorName ??
      "Unknown operator",

    vesselName: String(
      row.vesselName ?? ""
    ),

    vesselType: optionalString(
      row.vesselType
    ),

    registrationNumber: optionalString(
      row.registrationNumber
    ),

    totalCapacity: Number(
      row.totalCapacity ?? 0
    ),

    activeCapacity: Number(
      row.activeCapacity ?? 0
    ),

    imageUrl: optionalString(row.imageUrl),

    isActive:
      typeof row.isActive === "boolean"
        ? row.isActive
        : false,

    notes: optionalString(row.notes),
    createdBy: optionalString(row.createdBy),
    updatedBy: optionalString(row.updatedBy),
  }
}

async function getVesselData(): Promise<{
  vessels: VesselRow[]
  operators: OperatorOption[]
}> {
  const [
    vesselsResponse,
    operatorsResponse,
  ] = await Promise.all([
    tablesDB.listRows({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig.vesselsTableId,

      queries: [Query.limit(200)],
    }),

    tablesDB.listRows({
      databaseId:
        appwriteConfig.databaseId,

      tableId:
        appwriteConfig.operatorsTableId,

      queries: [Query.limit(200)],
    }),
  ])

  const operators =
    operatorsResponse.rows
      .map((row) =>
        toPlainOperator(
          row as unknown as Record<
            string,
            unknown
          >
        )
      )
      .sort((firstOperator, secondOperator) =>
        firstOperator.operatorName.localeCompare(
          secondOperator.operatorName,
          "en",
          {
            sensitivity: "base",
          }
        )
      )

  const operatorMap = new Map(
    operators.map((operator) => [
      operator.$id,
      operator,
    ])
  )

  const vessels =
    vesselsResponse.rows
      .map((row) => {
        const plainRow =
          row as unknown as Record<
            string,
            unknown
          >

        const operatorId = String(
          plainRow.operatorId ?? ""
        )

        return toPlainVessel(
          plainRow,
          operatorMap.get(operatorId)
        )
      })
      .sort((firstVessel, secondVessel) =>
        firstVessel.vesselName.localeCompare(
          secondVessel.vesselName,
          "en",
          {
            sensitivity: "base",
          }
        )
      )

  return {
    vessels,
    operators,
  }
}

export default async function VesselsPage() {
  const admin = await requireAdmin()

  let vessels: VesselRow[] = []
  let operators: OperatorOption[] = []
  let loadError = ""

  try {
    const result = await getVesselData()

    vessels = result.vessels
    operators = result.operators
  } catch (error) {
    console.error("Vessel page error:", error)

    loadError =
      error instanceof Error
        ? error.message
        : "Vessel data could not be loaded."
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <header className="border-b border-slate-800 bg-slate-950 text-white">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-5 px-5 py-5 lg:px-8">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-3xl font-black"
            >
              Gili{" "}
              <span className="text-cyan-300">
                Go
              </span>
            </Link>

            <span className="hidden h-7 w-px bg-slate-700 sm:block" />

            <div className="hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-cyan-300">
                Administration
              </p>

              <p className="text-sm text-slate-400">
                Vessel Management
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-sm text-slate-400 xl:block">
              {admin.email}
            </span>

            <Link
              href="/admin/operators"
              className="hidden rounded-full border border-cyan-400 px-5 py-2 text-sm font-bold text-cyan-200 transition hover:bg-cyan-400 hover:text-slate-950 sm:inline-flex"
            >
              Operators
            </Link>

            <Link
              href="/admin"
              className="rounded-full border border-white/25 px-5 py-2 text-sm font-bold transition hover:bg-white hover:text-slate-950"
            >
              Dashboard
            </Link>

            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-10 text-white">
        <div className="mx-auto max-w-[1500px] px-5 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-cyan-200">
            Inventory master data
          </p>

          <h1 className="mt-2 text-3xl font-black sm:text-4xl">
            Fast Boat Vessels
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
            Manage vessel identity, operator,
            capacity, registration details and
            operational status.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-10 lg:px-8">
        {loadError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-black">
              Vessel data could not be loaded
            </p>

            <p className="mt-1 text-sm">
              {loadError}
            </p>
          </div>
        )}

        <VesselsManager
          initialVessels={vessels}
          operators={operators}
        />
      </section>
    </main>
  )
}
