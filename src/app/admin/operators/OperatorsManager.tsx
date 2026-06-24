"use client"

import {
  FormEvent,
  useMemo,
  useState,
} from "react"

export type OperatorRow = {
  $id: string
  $createdAt: string
  $updatedAt?: string

  operatorCode: string
  operatorName: string
  contactPerson?: string | null
  phone?: string | null
  whatsapp?: string | null
  email?: string | null
  address?: string | null
  logoUrl?: string | null
  isActive: boolean
  notes?: string | null
  createdBy?: string | null
  updatedBy?: string | null
}

type OperatorForm = {
  operatorCode: string
  operatorName: string
  contactPerson: string
  phone: string
  whatsapp: string
  email: string
  address: string
  logoUrl: string
  notes: string
  isActive: boolean
}

type ApiResponse = {
  success: boolean
  operator?: OperatorRow
  error?: string
}

type OperatorsManagerProps = {
  initialOperators: OperatorRow[]
}

const emptyForm: OperatorForm = {
  operatorCode: "",
  operatorName: "",
  contactPerson: "",
  phone: "",
  whatsapp: "",
  email: "",
  address: "",
  logoUrl: "",
  notes: "",
  isActive: true,
}

function toForm(operator: OperatorRow): OperatorForm {
  return {
    operatorCode: operator.operatorCode,
    operatorName: operator.operatorName,
    contactPerson: operator.contactPerson || "",
    phone: operator.phone || "",
    whatsapp: operator.whatsapp || "",
    email: operator.email || "",
    address: operator.address || "",
    logoUrl: operator.logoUrl || "",
    notes: operator.notes || "",
    isActive: operator.isActive,
  }
}

export default function OperatorsManager({
  initialOperators,
}: OperatorsManagerProps) {
  const [operators, setOperators] = useState(
    initialOperators
  )

  const [search, setSearch] = useState("")
  const [form, setForm] =
    useState<OperatorForm>(emptyForm)

  const [editingId, setEditingId] = useState<
    string | null
  >(null)

  const [isSaving, setIsSaving] =
    useState(false)

  const [updatingId, setUpdatingId] =
    useState<string | null>(null)

  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const filteredOperators = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    if (!keyword) {
      return operators
    }

    return operators.filter((operator) => {
      const searchableText = [
        operator.operatorCode,
        operator.operatorName,
        operator.contactPerson,
        operator.phone,
        operator.whatsapp,
        operator.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()

      return searchableText.includes(keyword)
    })
  }, [operators, search])

  const activeCount = operators.filter(
    (operator) => operator.isActive
  ).length

  function updateField<
    Key extends keyof OperatorForm,
  >(key: Key, value: OperatorForm[Key]) {
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

  function startEdit(operator: OperatorRow) {
    setEditingId(operator.$id)
    setForm(toForm(operator))
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

    setIsSaving(true)
    setMessage("")
    setError("")

    try {
      const endpoint = editingId
        ? `/api/admin/operators/${editingId}`
        : "/api/admin/operators"

      const response = await fetch(endpoint, {
        method: editingId ? "PATCH" : "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify(form),
      })

      const result =
        (await response.json()) as ApiResponse

      if (!response.ok || !result.operator) {
        throw new Error(
          result.error ||
            "Operator could not be saved."
        )
      }

      if (editingId) {
        setOperators((current) =>
          current
            .map((operator) =>
              operator.$id === editingId
                ? result.operator!
                : operator
            )
            .sort((a, b) =>
              a.operatorName.localeCompare(
                b.operatorName,
                "en",
                {
                  sensitivity: "base",
                }
              )
            )
        )

        setMessage(
          "Operator updated successfully."
        )
      } else {
        setOperators((current) =>
          [...current, result.operator!].sort(
            (a, b) =>
              a.operatorName.localeCompare(
                b.operatorName,
                "en",
                {
                  sensitivity: "base",
                }
              )
          )
        )

        setMessage(
          "Operator created successfully."
        )
      }

      resetForm()
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Operator could not be saved."
      )
    } finally {
      setIsSaving(false)
    }
  }

  async function toggleStatus(
    operator: OperatorRow
  ) {
    setUpdatingId(operator.$id)
    setMessage("")
    setError("")

    try {
      const response = await fetch(
        `/api/admin/operators/${operator.$id}`,
        {
          method: "PATCH",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            isActive: !operator.isActive,
          }),
        }
      )

      const result =
        (await response.json()) as ApiResponse

      if (!response.ok || !result.operator) {
        throw new Error(
          result.error ||
            "Operator status could not be updated."
        )
      }

      setOperators((current) =>
        current.map((item) =>
          item.$id === operator.$id
            ? result.operator!
            : item
        )
      )

      setMessage(
        result.operator.isActive
          ? "Operator activated successfully."
          : "Operator deactivated successfully."
      )
    } catch (statusError) {
      setError(
        statusError instanceof Error
          ? statusError.message
          : "Operator status could not be updated."
      )
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            Total operators
          </p>

          <p className="mt-2 text-3xl font-black">
            {operators.length}
          </p>
        </div>

        <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-6 shadow-sm">
          <p className="text-sm font-bold text-emerald-700">
            Active operators
          </p>

          <p className="mt-2 text-3xl font-black text-emerald-900">
            {activeCount}
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-bold text-slate-500">
            Inactive operators
          </p>

          <p className="mt-2 text-3xl font-black">
            {operators.length - activeCount}
          </p>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
        <div className="mb-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-cyan-700">
            {editingId
              ? "Edit operator"
              : "New operator"}
          </p>

          <h2 className="mt-2 text-2xl font-black">
            {editingId
              ? "Update operator information"
              : "Add fast boat operator"}
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
          <label className="block">
            <span className="text-sm font-bold">
              Operator code *
            </span>

            <input
              value={form.operatorCode}
              onChange={(event) =>
                updateField(
                  "operatorCode",
                  event.target.value.toUpperCase()
                )
              }
              required
              maxLength={30}
              placeholder="EKAJAYA"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Operator name *
            </span>

            <input
              value={form.operatorName}
              onChange={(event) =>
                updateField(
                  "operatorName",
                  event.target.value
                )
              }
              required
              maxLength={120}
              placeholder="Eka Jaya Fast Boat"
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-cyan-600 focus:ring-2 focus:ring-cyan-100"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Contact person
            </span>

            <input
              value={form.contactPerson}
              onChange={(event) =>
                updateField(
                  "contactPerson",
                  event.target.value
                )
              }
              maxLength={100}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Email
            </span>

            <input
              type="email"
              value={form.email}
              onChange={(event) =>
                updateField(
                  "email",
                  event.target.value
                )
              }
              maxLength={120}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              Phone
            </span>

            <input
              value={form.phone}
              onChange={(event) =>
                updateField(
                  "phone",
                  event.target.value
                )
              }
              maxLength={30}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block">
            <span className="text-sm font-bold">
              WhatsApp
            </span>

            <input
              value={form.whatsapp}
              onChange={(event) =>
                updateField(
                  "whatsapp",
                  event.target.value
                )
              }
              maxLength={30}
              placeholder="+62..."
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Address
            </span>

            <textarea
              value={form.address}
              onChange={(event) =>
                updateField(
                  "address",
                  event.target.value
                )
              }
              maxLength={500}
              rows={3}
              className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-cyan-600"
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-bold">
              Logo URL
            </span>

            <input
              type="url"
              value={form.logoUrl}
              onChange={(event) =>
                updateField(
                  "logoUrl",
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
              Operator is active
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
                  ? "Update Operator"
                  : "Add Operator"}
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
              Operator directory
            </p>

            <h2 className="mt-2 text-2xl font-black">
              Registered operators
            </h2>
          </div>

          <input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search operator..."
            className="w-full rounded-full border border-slate-300 px-5 py-3 outline-none focus:border-cyan-600 md:max-w-sm"
          />
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-3 text-left text-sm">
            <thead>
              <tr className="text-slate-500">
                <th className="px-4 py-2">
                  Operator
                </th>
                <th className="px-4 py-2">
                  Contact
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
              {filteredOperators.map((operator) => (
                <tr
                  key={operator.$id}
                  className="bg-slate-50"
                >
                  <td className="rounded-l-2xl px-4 py-4">
                    <p className="font-black">
                      {operator.operatorName}
                    </p>

                    <p className="mt-1 text-xs font-bold text-cyan-700">
                      {operator.operatorCode}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <p>
                      {operator.contactPerson || "-"}
                    </p>

                    <p className="mt-1 text-xs text-slate-500">
                      {operator.whatsapp ||
                        operator.phone ||
                        operator.email ||
                        "-"}
                    </p>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={
                        operator.isActive
                          ? "rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700"
                          : "rounded-full bg-slate-200 px-3 py-1 text-xs font-black text-slate-600"
                      }
                    >
                      {operator.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  <td className="rounded-r-2xl px-4 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          startEdit(operator)
                        }
                        className="rounded-full border border-slate-300 px-4 py-2 text-xs font-black hover:bg-white"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        disabled={
                          updatingId === operator.$id
                        }
                        onClick={() =>
                          toggleStatus(operator)
                        }
                        className="rounded-full bg-slate-900 px-4 py-2 text-xs font-black text-white hover:bg-cyan-700 disabled:opacity-60"
                      >
                        {updatingId === operator.$id
                          ? "Updating..."
                          : operator.isActive
                            ? "Deactivate"
                            : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOperators.length === 0 && (
            <div className="py-12 text-center text-sm text-slate-500">
              No operators found.
            </div>
          )}
        </div>
      </section>
    </div>
  )
}