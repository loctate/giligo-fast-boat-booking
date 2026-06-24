"use client"

import {
  FormEvent,
  useMemo,
  useState,
} from "react"

export type OperatorOption = {
  $id: string
  operatorCode: string
  operatorName: string
  isActive: boolean
}

export type VesselRow = {
  $id: string
  $createdAt: string
  $updatedAt?: string

  vesselCode: string
  operatorId: string
  operatorCode: string
  operatorName: string
  vesselName: string
  vesselType?: string | null
  registrationNumber?: string | null
  totalCapacity: number
  activeCapacity: number
  imageUrl?: string | null
  isActive: boolean
  notes?: string | null
  createdBy?: string | null
  updatedBy?: string | null
}

type VesselForm = {
  vesselCode: string
  operatorId: string
  vesselName: string
  vesselType: string
  registrationNumber: string
  totalCapacity: string
  activeCapacity: string
  imageUrl: string
  notes: string
  isActive: boolean
}

type ApiResponse = {
  success: boolean
  vessel?: VesselRow
  error?: string
}

type VesselsManagerProps = {
  initialVessels: VesselRow[]
  operators: OperatorOption[]
}

const emptyForm: VesselForm = {
  vesselCode: "",
  operatorId: "",
  vesselName: "",
  vesselType: "",
  registrationNumber: "",
  totalCapacity: "",
  activeCapacity: "",
  imageUrl: "",
  notes: "",
  isActive: true,
}

function vesselToForm(
  vessel: VesselRow
): VesselForm {
  return {
    vesselCode: vessel.vesselCode,
    operatorId: vessel.operatorId,
    vesselName: vessel.vesselName,
    vesselType: vessel.vesselType || "",
    registrationNumber:
      vessel.registrationNumber || "",
    totalCapacity: String(
      vessel.totalCapacity
    ),
    activeCapacity: String(
      vessel.activeCapacity
    ),
    imageUrl: vessel.imageUrl || "",
    notes: vessel.notes || "",
    isActive: vessel.isActive,
  }
}

function sortVessels(
  vessels: VesselRow[]
): VesselRow[] {
  return [...vessels].sort(
    (firstVessel, secondVessel) =>
      firstVessel.vesselName.localeCompare(
        secondVessel.vesselName,
        "en",
        {
          sensitivity: "base",
        }
      )
  )
}

export default function VesselsManager({
  initialVessels,
  operators,
}: VesselsManagerProps) {
  const [vessels, setVessels] = useState(
    initialVessels
  )

  const [form, setForm] =
    useState<VesselForm>(emptyForm)

  const [search, setSearch] = useState("")
  const [operatorFilter, setOperatorFilter] =
    useState("")

  const [editingId, setEditingId] = useState<
    string | null
  >(null)

  const [isSaving, setIsSaving] =
    useState(false)

  const [updatingId, setUpdatingId] =
    useState<string | null>(null)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const activeOperators = useMemo(
    () =>
      operators.filter(
        (operator) =>
          operator.isActive ||
          operator.$id === form.operatorId
      ),
    [operators, form.operatorId]
  )

  const filteredVessels = useMemo(() => {
    const keyword = search
      .trim()
      .toLowerCase()

    return vessels.filter((vessel) => {
      if (
        operatorFilter &&
        vessel.operatorId !== operatorFilter
      ) {
        return false
      }

      if (!keyword) {
        return true
      }

      const searchableText = [
        vessel.vesselCode,
        vessel.vesselName,
        vessel.vesselType,
        vessel.registrationNumber,
        vessel.operatorCode,
        vessel.operatorName,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(keyword)
    })
  }, [vessels, search, operatorFilter])

  const activeVesselCount = vessels.filter(
    (vessel) => vessel.isActive
  ).length

  const totalCapacity = vessels.reduce(
    (total, vessel) =>
      total + Number(vessel.totalCapacity || 0),
    0
  )

  const activeCapacity = vessels.reduce(
    (total, vessel) =>
      total + Number(vessel.activeCapacity || 0),
    0
  )

  function updateField<
    Key extends keyof VesselForm,
  >(key: Key, value: VesselForm[Key]) {
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

  function startEdit(vessel: VesselRow) {
    setEditingId(vessel.$id)
    setForm(vesselToForm(vessel))
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

    const totalCapacityValue = Number(
      form.totalCapacity
    )

    const activeCapacityValue = Number(
      form.activeCapacity
    )

    if (
      !Number.isInteger(totalCapacityValue) ||
      totalCapacityValue < 1
    ) {
      setError(
        "Total capacity must be a positive integer."
      )
      return
    }

    if (
      !Number.isInteger(activeCapacityValue) ||
      activeCapacityValue < 0
    ) {
      setError(
        "Active capacity must be zero or a positive integer."
      )
      return
    }

    if (
      activeCapacityValue >
      totalCapacityValue
    ) {
      setError(
        "Active capacity cannot exceed total capacity."
      )
      return
    }

    setIsSaving(true)

    try {
      const endpoint = editingId
        ? `/api/admin/vessels/${editingId}`
        : "/api/admin/vessels"

      const response = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          ...form,
          totalCapacity: totalCapacityValue,
          activeCapacity:
            activeCapacityValue,
        }),
      })

      const result =
        (await response.json()) as ApiResponse

      if (!response.ok || !result.vessel) {
        throw new Error(
          result.error ||
            "Vessel could not be saved."
        )
      }

      if (editingId) {
        setVessels((current) =>
          sortVessels(
            current.map((vessel) =>
              vessel.$id === editingId
                ? result.vessel!
                : vessel
            )
          )
        )

        setMessage(
          "Vessel updated successfully."
        )
      } else {
        setVessels((current) =>
          sortVessels([
            ...current,
            result.vessel!,
          ])
        )

        setMessage(
          "Vessel created successfully."
        )
      }

      resetForm()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Vessel could not be saved."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleStatus(
    vessel: VesselRow
  ) {
    setUpdatingId(vessel.$id)
    setMessage("")
    setError("")

    try {
      const response = await fetch(
        `/api/admin/vessels/${vessel.$id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            isActive: !vessel.isActive,
          }),
        }
      )

      const result =
        (await response.json()) as ApiResponse

      if (!response.ok || !result.vessel) {
        throw new Error(
          result.error ||
            "Vessel status could not be updated."
        )
      }

      setVessels((current) =>
        current.map((item) =>
          item.$id === vessel.$id
            ? result.vessel!
            : item
        )
      )

      setMessage(
        result.vessel.isActive
          ? "Vessel activated successfully."
          : "Vessel deactivated successfully."
      )
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Vessel status could not be updated."
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
            Total vessels
          </p>

          <p className="mt-2 text-3xl font-black">
            {vessels.length}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-emerald-700">
            Active vessels
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-900">
            {activeVesselCount}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            Total capacity
          </p>

          <p className="mt-2 text-3xl font-black">
            {totalCapacity}
          </p>
        </div>

        <div className="rounded-3xl border border-cyan-200 bg-cyan-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-cyan-700">
            Active allocation
          </p>

          <p className="mt-2 text-3xl font-black text-cyan-900">
            {activeCapacity}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
            {editingId
              ? "Edit vessel"
              : "New vessel"}
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {editingId
              ? "Update vessel information"
              : "Add fast boat vessel"}
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

        {activeOperators.length === 0 && (
          <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            No active operator is available.
            Create or activate an operator before
            adding a vessel.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="grid gap-5 md:grid-cols-2"
        >
          <label className="block">
            <span className="text-sm font-bold">
              Vessel code *
            </span>

            <input
              value={form.vesselCode}
              onChange={(event) =>
                updateField(
                  "vesselCode",
                  event.target.value.toUpperCase()
                )
              }
              required
              maxLength={30}
              placeholder="EKAJAYA-01"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Operator *
            </span>

            <select
              value={form.operatorId}
              onChange={(event) =>
                updateField(
                  "operatorId",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-cyan-600"
            >
              <option value="">
                Select operator
              </option>

              {activeOperators.map((operator) => (
                <option
                  key={operator.$id}
                  value={operator.$id}
                >
                  {operator.operatorName} (
                  {operator.operatorCode})
                  {!operator.isActive
                    ? " - Inactive"
                    : ""}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Vessel name *
            </span>

            <input
              value={form.vesselName}
              onChange={(event) =>
                updateField(
                  "vesselName",
                  event.target.value
                )
              }
              required
              maxLength={120}
              placeholder="Eka Jaya 25"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Vessel type
            </span>

            <input
              value={form.vesselType}
              onChange={(event) =>
                updateField(
                  "vesselType",
                  event.target.value
                )
              }
              maxLength={50}
              placeholder="Fast Boat"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Registration number
            </span>

            <input
              value={form.registrationNumber}
              onChange={(event) =>
                updateField(
                  "registrationNumber",
                  event.target.value
                )
              }
              maxLength={80}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <div className="hidden md:block" />

          <label className="block">
            <span className="text-sm font-bold">
              Total capacity *
            </span>

            <input
              type="number"
              min={1}
              max={1000}
              step={1}
              value={form.totalCapacity}
              onChange={(event) =>
                updateField(
                  "totalCapacity",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Active capacity *
            </span>

            <input
              type="number"
              min={0}
              max={1000}
              step={1}
              value={form.activeCapacity}
              onChange={(event) =>
                updateField(
                  "activeCapacity",
                  event.target.value
                )
              }
              required
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />

            <p className="mt-2 text-xs text-slate-500">
              Maximum seats allocated for
              GiliGo inventory.
            </p>
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Image URL
            </span>

            <input
              type="url"
              value={form.imageUrl}
              onChange={(event) =>
                updateField(
                  "imageUrl",
                  event.target.value
                )
              }
              maxLength={500}
              placeholder="https://..."
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
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
              Vessel is active
            </span>
          </label>

          <div className="flex flex-wrap gap-3 md:col-span-2">
            <button
              type="submit"
              disabled={
                isSaving ||
                activeOperators.length === 0
              }
              className="rounded-full bg-slate-950 px-7 py-3 text-sm font-black text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving
                ? "Saving..."
                : editingId
                  ? "Update Vessel"
                  : "Add Vessel"}
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
        <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
              Vessel directory
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Registered vessels
            </h2>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row xl:max-w-2xl">
            <select
              value={operatorFilter}
              onChange={(event) =>
                setOperatorFilter(
                  event.target.value
                )
              }
              className="rounded-full border border-slate-300 bg-white px-5 py-3 outline-none focus:border-cyan-600"
            >
              <option value="">
                All operators
              </option>

              {operators.map((operator) => (
                <option
                  key={operator.$id}
                  value={operator.$id}
                >
                  {operator.operatorName}
                </option>
              ))}
            </select>

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search vessel..."
              className="w-full rounded-full border border-slate-300 px-5 py-3 outline-none focus:border-cyan-600"
            />
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="px-4 py-2">
                  Vessel
                </th>

                <th className="px-4 py-2">
                  Operator
                </th>

                <th className="px-4 py-2">
                  Capacity
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
              {filteredVessels.map((vessel) => (
                <tr
                  key={vessel.$id}
                  className="bg-slate-50"
                >
                  <td className="rounded-l-2xl px-4 py-4">
                    <p className="font-black">
                      {vessel.vesselName}
                    </p>

                    <p className="mt-1 text-xs font-bold text-cyan-700">
                      {vessel.vesselCode}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {vessel.vesselType || "-"}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-bold">
                      {vessel.operatorName}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {vessel.operatorCode || "-"}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p className="font-black">
                      {vessel.activeCapacity}
                      {" / "}
                      {vessel.totalCapacity}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      Active / total
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={
                        vessel.isActive
                          ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700"
                          : "rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-600"
                      }
                    >
                      {vessel.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  <td className="rounded-r-2xl px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(vessel)
                        }
                        className="rounded-full border border-slate-300 px-4 py-2 text-xs font-black hover:bg-white"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={
                          updatingId === vessel.$id
                        }
                        onClick={() =>
                          toggleStatus(vessel)
                        }
                        className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-cyan-700 disabled:opacity-60"
                      >
                        {updatingId === vessel.$id
                          ? "Updating..."
                          : vessel.isActive
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredVessels.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              No vessels found.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
