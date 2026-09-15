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

type ManifestIndexProps = {
  searchParams:
    Promise<{
      date?:
        string | string[]
      q?:
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

function normalized(
  value: string
): string {
  return value
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()
}

export default async function ManifestIndexPage({
  searchParams,
}: ManifestIndexProps) {
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

  const query =
    param(
      params.q
    )

  const search =
    normalized(query)

  const departures =
    (
      await listD1AdminDeparturesByDate(
        selectedDate
      )
    ).filter(
      (departure) =>
        !search ||
        [
          departure.inventoryCode,
          departure.operatorName,
          departure.vesselName,
          departure.routeCode,
          departure.fromPort,
          departure.toPort,
          departure.departureTime,
        ].some(
          (value) =>
            normalized(
              value
            ).includes(
              search
            )
        )
    )

  return (
    <AdminShell
      adminEmail={admin.email}
    >
      <main className="min-h-screen bg-slate-100 text-slate-900">
        <section className="bg-gradient-to-r from-cyan-700 to-blue-900 py-10 text-white">
          <div className="mx-auto max-w-[1400px] px-5 lg:px-8">
            <h1 className="text-3xl font-black">
              Passenger Manifests
            </h1>

            <p className="mt-2 text-white/75">
              D1 operational departure index.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-[1400px] px-5 py-8 lg:px-8">
          <form
            method="GET"
            className="grid gap-3 rounded-2xl border border-slate-200 bg-white p-5 sm:grid-cols-[190px_1fr_auto]"
          >
            <input
              type="date"
              name="date"
              defaultValue={
                selectedDate
              }
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <input
              type="search"
              name="q"
              defaultValue={
                query
              }
              placeholder="Operator, vessel, route..."
              className="rounded-xl border border-slate-300 px-4 py-3"
            />

            <button
              type="submit"
              className="rounded-xl bg-cyan-700 px-5 py-3 font-black text-white"
            >
              Apply
            </button>
          </form>

          <div className="mt-6 grid gap-5 lg:grid-cols-2">
            {departures.map(
              (departure) => (
                <article
                  key={departure.id}
                  className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <p className="text-xs font-black uppercase text-cyan-700">
                    {departure.operatorName}
                  </p>

                  <h2 className="mt-2 text-xl font-black">
                    {departure.fromPort}
                    {" → "}
                    {departure.toPort}
                  </h2>

                  <p className="mt-2 text-sm text-slate-500">
                    {departure.vesselName}
                    {" · "}
                    {departure.departureTime}
                    {" · "}
                    {departure.inventoryCode}
                  </p>

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
