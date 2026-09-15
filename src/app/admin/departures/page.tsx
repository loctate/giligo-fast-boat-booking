import Link from "next/link"

import {
  requireAdmin,
} from "@/lib/admin-auth"

import {
  getCurrentBaliDate,
  isValidDateOnly,
} from "@/lib/bali-date"

import {
  listD1AdminDeparturesByDate,
} from "@/lib/d1-admin-operations"

import AdminShell from "../AdminShell"

export const dynamic =
  "force-dynamic"

type DeparturesPageProps = {
  searchParams:
    Promise<{
      date?:
        string | string[]
    }>
}

function param(
  value:
    | string
    | string[]
    | undefined
): string {
  return Array.isArray(value)
    ? value[0] ?? ""
    : value ?? ""
}

export default async function DeparturesPage({
  searchParams,
}: DeparturesPageProps) {
  const admin =
    await requireAdmin()

  const params =
    await searchParams

  const requestedDate =
    param(
      params.date
    )

  const selectedDate =
    isValidDateOnly(
      requestedDate
    )
      ? requestedDate
      : getCurrentBaliDate()

  const departures =
    await listD1AdminDeparturesByDate(
      selectedDate
    )

  return (
    <AdminShell
      adminEmail={admin.email}
    >
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-10 text-white">
          <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
            <h1 className="text-3xl font-black">
              Departure Operations
            </h1>

            <p className="mt-2 text-white/75">
              Operational inventory from D1.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1400px] px-5 py-8 lg:px-8">
          <form
            method="GET"
            className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-5"
          >
            <label>
              <span className="mb-2 block text-xs font-black uppercase text-slate-500">
                Travel date
              </span>

              <input
                type="date"
                name="date"
                defaultValue={
                  selectedDate
                }
                className="rounded-xl border border-slate-300 px-4 py-3"
              />
            </label>

            <button
              type="submit"
              className="rounded-xl bg-cyan-700 px-5 py-3 font-black text-white"
            >
              Load
            </button>

            <Link
              href={`/admin/manifests?date=${encodeURIComponent(
                selectedDate
              )}`}
              className="rounded-xl border border-slate-300 px-5 py-3 font-black"
            >
              Manifest Index
            </Link>
          </form>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {departures.map(
              (departure) => (
                <article
                  key={departure.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase text-cyan-700">
                        {departure.operatorName}
                      </p>

                      <h2 className="mt-2 text-xl font-black">
                        {departure.fromPort}
                        {" → "}
                        {departure.toPort}
                      </h2>

                      <p className="mt-1 text-sm text-slate-500">
                        {departure.vesselName}
                      </p>
                    </div>

                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black">
                      {departure.salesStatus}
                    </span>
                  </div>

                  <div className="mt-5 grid grid-cols-4 gap-2 text-center">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-500">
                        Time
                      </p>
                      <p className="font-black">
                        {departure.departureTime}
                      </p>
                    </div>

                    <div className="rounded-xl bg-emerald-50 p-3">
                      <p className="text-xs text-emerald-700">
                        Booked
                      </p>
                      <p className="font-black">
                        {departure.bookedSeats}
                      </p>
                    </div>

                    <div className="rounded-xl bg-amber-50 p-3">
                      <p className="text-xs text-amber-700">
                        Held
                      </p>
                      <p className="font-black">
                        {departure.heldSeats}
                      </p>
                    </div>

                    <div className="rounded-xl bg-cyan-50 p-3">
                      <p className="text-xs text-cyan-700">
                        Free
                      </p>
                      <p className="font-black">
                        {departure.availableSeats}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/admin/departures/${departure.id}/manifest`}
                    className="mt-5 inline-flex w-full justify-center rounded-xl bg-cyan-700 px-5 py-3 font-black text-white"
                  >
                    Open Manifest
                  </Link>
                </article>
              )
            )}
          </div>

          {departures.length === 0 && (
            <div className="mt-6 rounded-3xl border border-slate-200 bg-white py-12 text-center text-slate-500">
              No departures found.
            </div>
          )}
        </section>
      </main>
    </AdminShell>
  )
}
