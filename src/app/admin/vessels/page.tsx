import { requireAdmin } from "@/lib/admin-auth"
import { listVesselsD1 } from "@/lib/d1-vessels"

import AdminShell from "../AdminShell"
import VesselsManager, {
  type OperatorOption,
  type VesselRow,
} from "./VesselsManager"

export const dynamic = "force-dynamic"

async function getVesselData(): Promise<{
  vessels: VesselRow[]
  operators: OperatorOption[]
}> {
  const result = await listVesselsD1({
    includeInactiveOperators: true,
  })

  return {
    vessels: result.vessels,
    operators: result.operators,
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
    <AdminShell adminEmail={admin.email}>
      <main className="min-h-screen bg-slate-100 text-slate-900">
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
    </AdminShell>
  )
}
