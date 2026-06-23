"use client"

import {
  FormEvent,
  useMemo,
  useState,
} from "react"

export type RouteRow = {
  $id: string
  $createdAt: string
  $updatedAt?: string

  routeCode: string
  fromPort: string
  toPort: string
  fromIsland?: string | null
  toIsland?: string | null
  estimatedDurationMinutes: number
  isActive: boolean
  notes?: string | null
  createdBy?: string | null
  updatedBy?: string | null
}

type RouteForm = {
  routeCode: string
  fromPort: string
  toPort: string
  fromIsland: string
  toIsland: string
  estimatedDurationMinutes: string
  isActive: boolean
  notes: string
}

type ApiResponse = {
  success: boolean
  route?: RouteRow
  error?: string
}

type RoutesManagerProps = {
  initialRoutes: RouteRow[]
}

const emptyForm: RouteForm = {
  routeCode: "",
  fromPort: "",
  toPort: "",
  fromIsland: "",
  toIsland: "",
  estimatedDurationMinutes: "",
  isActive: true,
  notes: "",
}

function routeToForm(
  route: RouteRow
): RouteForm {
  return {
    routeCode: route.routeCode,
    fromPort: route.fromPort,
    toPort: route.toPort,
    fromIsland: route.fromIsland || "",
    toIsland: route.toIsland || "",
    estimatedDurationMinutes: String(
      route.estimatedDurationMinutes
    ),
    isActive: route.isActive,
    notes: route.notes || "",
  }
}

function sortRoutes(
  routes: RouteRow[]
): RouteRow[] {
  return [...routes].sort(
    (firstRoute, secondRoute) => {
      const originComparison =
        firstRoute.fromPort.localeCompare(
          secondRoute.fromPort,
          "en",
          {
            sensitivity: "base",
          }
        )

      if (originComparison !== 0) {
        return originComparison
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

function formatDuration(
  durationMinutes: number
): string {
  const hours = Math.floor(
    durationMinutes / 60
  )

  const minutes = durationMinutes % 60

  if (hours === 0) {
    return `${minutes} min`
  }

  if (minutes === 0) {
    return `${hours} hr`
  }

  return `${hours} hr ${minutes} min`
}

export default function RoutesManager({
  initialRoutes,
}: RoutesManagerProps) {
  const [routes, setRoutes] = useState(
    initialRoutes
  )

  const [form, setForm] =
    useState<RouteForm>(emptyForm)

  const [search, setSearch] = useState("")

  const [editingId, setEditingId] = useState<
    string | null
  >(null)

  const [isSaving, setIsSaving] =
    useState(false)

  const [updatingId, setUpdatingId] =
    useState<string | null>(null)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const filteredRoutes = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase()

    if (!keyword) {
      return routes
    }

    return routes.filter((route) => {
      const searchableText = [
        route.routeCode,
        route.fromPort,
        route.toPort,
        route.fromIsland,
        route.toIsland,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(keyword)
    })
  }, [routes, search])

  const activeRouteCount = routes.filter(
    (route) => route.isActive
  ).length

  const uniquePorts = new Set(
    routes.flatMap((route) => [
      route.fromPort.trim().toLowerCase(),
      route.toPort.trim().toLowerCase(),
    ])
  ).size

  function updateField<
    Key extends keyof RouteForm,
  >(key: Key, value: RouteForm[Key]) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }))
  }

  function resetForm() {
    setForm(emptyForm)
    setEditingId(null)
    setError("")
  }

  function startEdit(route: RouteRow) {
    setEditingId(route.$id)
    setForm(routeToForm(route))
    setMessage("")
    setError("")

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    })
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setMessage("")
    setError("")

    const estimatedDurationMinutes =
      Number(
        form.estimatedDurationMinutes
      )

    if (
      !Number.isInteger(
        estimatedDurationMinutes
      ) ||
      estimatedDurationMinutes < 1 ||
      estimatedDurationMinutes > 1440
    ) {
      setError(
        "Estimated duration must be an integer between 1 and 1440 minutes."
      )
      return
    }

    if (
      form.fromPort
        .trim()
        .localeCompare(
          form.toPort.trim(),
          "en",
          {
            sensitivity: "base",
          }
        ) === 0
    ) {
      setError(
        "Departure port and destination port cannot be the same."
      )
      return
    }

    setIsSaving(true)

    try {
      const endpoint = editingId
        ? `/api/admin/routes/${editingId}`
        : "/api/admin/routes"

      const response = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...form,
          estimatedDurationMinutes,
        }),
      })

      const result =
        (await response.json()) as ApiResponse

      if (!response.ok || !result.route) {
        throw new Error(
          result.error ||
            "Route could not be saved."
        )
      }

      if (editingId) {
        setRoutes((current) =>
          sortRoutes(
            current.map((route) =>
              route.$id === editingId
                ? result.route!
                : route
            )
          )
        )

        setMessage(
          "Route updated successfully."
        )
      } else {
        setRoutes((current) =>
          sortRoutes([
            ...current,
            result.route!,
          ])
        )

        setMessage(
          "Route created successfully."
        )
      }

      resetForm()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Route could not be saved."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleStatus(
    route: RouteRow
  ) {
    setUpdatingId(route.$id)
    setMessage("")
    setError("")

    try {
      const response = await fetch(
        `/api/admin/routes/${route.$id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            isActive: !route.isActive,
          }),
        }
      )

      const result =
        (await response.json()) as ApiResponse

      if (!response.ok || !result.route) {
        throw new Error(
          result.error ||
            "Route status could not be updated."
        )
      }

      setRoutes((current) =>
        current.map((item) =>
          item.$id === route.$id
            ? result.route!
            : item
        )
      )

      setMessage(
        result.route.isActive
          ? "Route activated successfully."
          : "Route deactivated successfully."
      )
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Route status could not be updated."
      )
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            Total routes
          </p>

          <p className="mt-2 text-3xl font-black">
            {routes.length}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-emerald-700">
            Active routes
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-900">
            {activeRouteCount}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            Inactive routes
          </p>

          <p className="mt-2 text-3xl font-black">
            {routes.length - activeRouteCount}
          </p>
        </div>

        <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-cyan-700">
            Registered ports
          </p>

          <p className="mt-2 text-3xl font-black text-cyan-900">
            {uniquePorts}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
            {editingId
              ? "Edit route"
              : "New route"}
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {editingId
              ? "Update route information"
              : "Add fast boat route"}
          </h2>
        </div>

        {message && (
          <div className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
            {error}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 md:grid-cols-2"
        >
          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Route code *
            </span>

            <input
              value={form.routeCode}
              onChange={(event) =>
                updateField(
                  "routeCode",
                  event.target.value.toUpperCase()
                )
              }
              required
              maxLength={50}
              placeholder="PADANGBAI-GILIT"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Departure port *
            </span>

            <input
              value={form.fromPort}
              onChange={(event) =>
                updateField(
                  "fromPort",
                  event.target.value
                )
              }
              required
              maxLength={120}
              placeholder="Padang Bai"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Destination port *
            </span>

            <input
              value={form.toPort}
              onChange={(event) =>
                updateField(
                  "toPort",
                  event.target.value
                )
              }
              required
              maxLength={120}
              placeholder="Gili Trawangan"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Departure island
            </span>

            <input
              value={form.fromIsland}
              onChange={(event) =>
                updateField(
                  "fromIsland",
                  event.target.value
                )
              }
              maxLength={80}
              placeholder="Bali"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Destination island
            </span>

            <input
              value={form.toIsland}
              onChange={(event) =>
                updateField(
                  "toIsland",
                  event.target.value
                )
              }
              maxLength={80}
              placeholder="Lombok"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Estimated duration (minutes) *
            </span>

            <input
              type="number"
              min={1}
              max={1440}
              step={1}
              value={
                form.estimatedDurationMinutes
              }
              onChange={(event) =>
                updateField(
                  "estimatedDurationMinutes",
                  event.target.value
                )
              }
              required
              placeholder="90"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />

            <p className="mt-2 text-xs text-slate-500">
              Example: 90 minutes equals 1 hour
              and 30 minutes.
            </p>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Notes
            </span>

            <textarea
              value={form.notes}
              onChange={(event) =>
                updateField(
                  "notes",
                  event.target.value
                )
              }
              maxLength={1000}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="flex items-center gap-3 md:col-span-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(event) =>
                updateField(
                  "isActive",
                  event.target.checked
                )
              }
              className="h-5 w-5 rounded"
            />

            <span className="text-sm font-bold">
              Route is active
            </span>
          </label>

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-full bg-slate-950 px-7 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : editingId
                  ? "Update Route"
                  : "Add Route"}
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                disabled={isSaving}
                className="rounded-full border border-slate-300 px-7 py-3 text-sm font-black transition hover:bg-slate-100"
              >
                Cancel Edit
              </button>
            )}
          </div>
        </form>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
              Route directory
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Registered routes
            </h2>
          </div>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search route..."
            className="w-full rounded-full border border-slate-300 px-5 py-3 outline-none focus:border-cyan-600 md:max-w-sm"
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="px-4 py-2">
                  Route
                </th>

                <th className="px-4 py-2">
                  Islands
                </th>

                <th className="px-4 py-2">
                  Duration
                </th>

                <th className="px-4 py-2">
                  Status
                </th>

                <th className="px-4 py-2 text-right">
                  Actions
                </th>
              </tr>
            </thead>

            <tbody>
              {filteredRoutes.map((route) => (
                <tr
                  key={route.$id}
                  className="bg-slate-50"
                >
                  <td className="rounded-l-2xl px-4 py-4">
                    <p className="font-black">
                      {route.fromPort}
                      {" → "}
                      {route.toPort}
                    </p>

                    <p className="mt-1 text-xs font-bold text-cyan-700">
                      {route.routeCode}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p>
                      {route.fromIsland || "-"}
                      {" → "}
                      {route.toIsland || "-"}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-black">
                      {formatDuration(
                        route.estimatedDurationMinutes
                      )}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {
                        route.estimatedDurationMinutes
                      }{" "}
                      minutes
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={
                        route.isActive
                          ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700"
                          : "rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-600"
                      }
                    >
                      {route.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  <td className="rounded-r-2xl px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(route)
                        }
                        className="rounded-full border border-slate-300 px-4 py-2 text-xs font-black hover:bg-white"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={
                          updatingId === route.$id
                        }
                        onClick={() =>
                          toggleStatus(route)
                        }
                        className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-cyan-700 disabled:opacity-60"
                      >
                        {updatingId === route.$id
                          ? "Updating..."
                          : route.isActive
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredRoutes.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              No routes found.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
