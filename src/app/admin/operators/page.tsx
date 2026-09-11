import { requireAdmin } from "@/lib/admin-auth"
import { listOperatorsD1 } from "@/lib/d1-operators"

import AdminShell from "../AdminShell"
import OperatorsManager, {
  type OperatorRow,
} from "./OperatorsManager"

export const dynamic = "force-dynamic"

async function getOperators(): Promise<OperatorRow[]> {
  const response = await listOperatorsD1()

  return response.rows
}

export default async function OperatorsPage() {
  const admin = await requireAdmin()

  let operators: OperatorRow[] = []
  let loadError = ""

  try {
    operators = await getOperators()
  } catch (error) {
    console.error("Operator page error:", error)

    loadError =
      error instanceof Error
        ? error.message
        : "Operator data could not be loaded."
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
            Fast Boat Operators
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75">
            Manage fast boat providers, business
            contacts, operational status and
            supporting information.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1500px] px-5 py-10 lg:px-8">
        {loadError && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-700">
            <p className="font-black">
              Operator data could not be loaded
            </p>

            <p className="mt-1 text-sm">
              {loadError}
            </p>
          </div>
        )}

        <OperatorsManager
          initialOperators={operators}
        />
      </section>
      </main>
    </AdminShell>
  )
}